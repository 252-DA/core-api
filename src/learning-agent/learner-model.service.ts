import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { quiz_sets as QuizSetRow } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { answersRevealed } from '../quiz/quiz-set-exam';
import type { QuizSnapshotItem } from '../quiz/quiz-set.service';
import { CourseRosterRepository } from '../roster/course-roster.repository';
import { BKT_DEFAULTS, MASTERY_DEFAULTS } from './bkt';
import { learnerLoStates, type LoState } from './learner-state';
import { bktPolicy } from './mastery-policy';
import { duplicateKey, normalizeAttempts, type AttemptEvidence } from './observations';

/** Trạng thái câu được dùng trong đề, cũng là trạng thái câu được vào kho luyện. */
const POOL_STATUSES = ['APPROVED', 'PUBLISHED'];

/**
 * LO có ít câu luyện hơn mức này bị cảnh báo trước khi bật Agent (§5.4). Đây là
 * ngưỡng vận hành đề xuất, không bảo đảm đủ câu cho mọi người học.
 */
export const MIN_PRACTICE_ITEMS = 6;

function uuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
  );
}

function snapshotItems(set: QuizSetRow): QuizSnapshotItem[] {
  return Array.isArray(set.items) ? (set.items as unknown as QuizSnapshotItem[]) : [];
}

function optionCount(options: unknown): number | null {
  return Array.isArray(options) ? options.length : null;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function byCode(a: { code: string }, b: { code: string }) {
  return a.code.localeCompare(b.code, 'vi', { numeric: true });
}

function stateView(state: LoState) {
  return {
    mastery: round(state.mastery),
    observations: state.observations,
    correct: state.correct,
    consecutiveWrong: state.consecutiveWrong,
    status: state.status,
    firstMasteredAt: state.firstMasteredAt,
    lastObservedAt: state.lastObservedAt,
    pending: state.pending,
    repeats: state.repeats,
  };
}

/**
 * Mô hình người học theo LO (giai đoạn 1 của docs/bao-cao-learning-agent.md).
 *
 * Không lưu trạng thái: mỗi lần gọi dựng lại từ `quiz_attempts`, nên chấm lại
 * hay đổi tham số đều có hiệu lực ngay. Bảng đệm chỉ cần khi số lượt làm đủ lớn
 * để việc dựng lại thành chậm.
 */
@Injectable()
export class LearnerModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly roster: CourseRosterRepository,
  ) {}

  private async access(claims: BffClaims, courseId: string, roles?: string[]) {
    if (!uuid(courseId) || (claims.scope !== 'admin' && claims.courseId !== courseId)) {
      throw new ForbiddenException('Khóa học không khớp phiên Canvas.');
    }
    await this.authz.assertCourseAccess(claims, courseId, roles);
  }

  /**
   * Mức nắm theo LO của người học đang đăng nhập. Giảng viên/trợ giảng truyền
   * `userId` để xem của một sinh viên.
   */
  async summary(claims: BffClaims, body: { courseId: string; userId?: string }) {
    const self = !body.userId || body.userId === claims.sub;
    if (!self && !uuid(body.userId)) throw new BadRequestException('userId không hợp lệ.');
    await this.access(claims, body.courseId, self ? undefined : ['instructor', 'ta']);
    const userId = self ? claims.sub : body.userId!;

    const [los, sets] = await Promise.all([this.courseLos(body.courseId), this.courseSets(body.courseId)]);
    const evidence = await this.evidence(body.courseId, sets, [userId]);
    const states = learnerLoStates(
      los.map((lo) => lo.lo_id),
      normalizeAttempts(evidence.get(userId) ?? []),
    );
    return {
      courseId: body.courseId,
      userId,
      model: modelInfo(),
      los: los.map((lo, i) => ({ ...loView(lo), ...stateView(states[i]) })),
    };
  }

  /**
   * Bảng sinh viên × LO cho giảng viên, kèm thống kê kho luyện theo LO × loại câu.
   * Mẫu số là sinh viên đang học theo danh sách lớp (cùng truy vấn với trang kết
   * quả quiz), không phải chỉ người đã làm bài; người đã làm bài nhưng rời lớp
   * vẫn có mặt vì bằng chứng của họ còn đó.
   */
  async courseMastery(claims: BffClaims, body: { courseId: string }) {
    await this.access(claims, body.courseId, ['instructor', 'ta']);
    const [los, sets, learnerIds] = await Promise.all([
      this.courseLos(body.courseId),
      this.courseSets(body.courseId),
      this.roster.activeLearnerIds(body.courseId),
    ]);
    const [evidence, bank] = await Promise.all([
      this.evidence(body.courseId, sets),
      this.practiceBank(body.courseId, sets),
    ]);
    const userIds = [...new Set([...learnerIds, ...evidence.keys()])];
    const users = await this.prisma.lms_user_mappings.findMany({
      where: { internal_user_id: { in: userIds } },
      select: { internal_user_id: true, display_name: true },
    });
    const names = new Map(users.map((u) => [u.internal_user_id, u.display_name]));
    const loIds = los.map((lo) => lo.lo_id);

    const students = userIds
      .map((userId) => {
        const states = learnerLoStates(loIds, normalizeAttempts(evidence.get(userId) ?? []));
        return {
          userId,
          name: names.get(userId) ?? null,
          los: states.map((s) => ({ loId: s.loId, ...stateView(s) })),
        };
      })
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'vi'));

    return {
      courseId: body.courseId,
      model: modelInfo(),
      minPracticeItems: MIN_PRACTICE_ITEMS,
      los: los.map((lo) => {
        const stock = bank.get(lo.lo_id) ?? { practice: 0, byType: {}, inExam: 0 };
        return {
          ...loView(lo),
          bank: { ...stock, low: stock.practice < MIN_PRACTICE_ITEMS },
          mastered: students.filter((s) => s.los.find((x) => x.loId === lo.lo_id)?.status === 'mastered')
            .length,
        };
      }),
      students,
    };
  }

  private courseLos(courseId: string) {
    return this.prisma.learning_outcomes
      .findMany({
        where: { course_id: courseId, deleted_at: null, is_current: true },
        select: { lo_id: true, code: true, parent_code: true, statement_vi: true, bloom_level: true },
      })
      .then((rows) => rows.sort(byCode));
  }

  /** Mọi đề của khoá, kể cả đề đã xoá: lượt làm cũ vẫn là bằng chứng. */
  private courseSets(courseId: string) {
    return this.prisma.quiz_sets.findMany({ where: { course_id: courseId } });
  }

  /**
   * Lượt làm theo người học. Câu trong đề lấy theo snapshot của đề (đúng như
   * người học đã thấy), câu ngoài đề lấy theo ngân hàng.
   *
   * Bài kiểm tra chưa công bố đáp án bị ẩn với MỌI người xem, không chỉ người
   * học: nếu mô hình (và planner sau này) dùng ngay kết quả đó thì mức nắm hoặc
   * đề xuất kế tiếp sẽ để lộ câu nào đúng, câu nào sai.
   */
  private async evidence(courseId: string, sets: QuizSetRow[], userIds?: string[]) {
    const rows = await this.prisma.quiz_attempts.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
        ...(userIds ? { user_id: { in: userIds } } : {}),
      },
      select: {
        attempt_id: true,
        user_id: true,
        quiz_id: true,
        is_correct: true,
        grading_status: true,
        attempted_at: true,
        quiz_items: { select: { lo_id: true, type: true, question: true, options: true } },
        lti_resource_links: { select: { target_kind: true, target_id: true } },
      },
    });
    const setById = new Map(sets.map((s) => [s.quiz_set_id, s]));
    const now = new Date();
    const byUser = new Map<string, AttemptEvidence[]>();
    for (const row of rows) {
      const link = row.lti_resource_links;
      const set =
        link?.target_kind === 'quiz_set' && link.target_id ? setById.get(link.target_id) : undefined;
      const item = (set && snapshotItems(set).find((q) => q.quiz_id === row.quiz_id)) || row.quiz_items;
      const list = byUser.get(row.user_id) ?? [];
      list.push({
        attemptId: row.attempt_id,
        quizId: row.quiz_id,
        loId: item.lo_id,
        type: item.type,
        optionCount: optionCount(item.options),
        question: item.question,
        isCorrect: row.is_correct,
        gradingStatus: row.grading_status,
        attemptedAt: row.attempted_at,
        source: set ? (set.mode === 'exam' ? 'exam' : 'practice') : 'lesson',
        hidden: set ? !answersRevealed(set, now) : false,
      });
      byUser.set(row.user_id, list);
    }
    return byUser;
  }

  /**
   * Kho luyện theo LO: câu đã duyệt, không thuộc đề Kiểm tra nào còn hiệu lực,
   * đếm theo nhóm câu trùng văn bản (§5.4, §2.11).
   */
  private async practiceBank(courseId: string, sets: QuizSetRow[]) {
    const examIds = new Set(
      sets
        .filter((s) => s.mode === 'exam' && !s.deleted_at)
        .flatMap((s) => snapshotItems(s).map((q) => q.quiz_id)),
    );
    const items = await this.prisma.quiz_items.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
        status: { in: POOL_STATUSES },
        lo_id: { not: null },
      },
      select: { quiz_id: true, lo_id: true, type: true, question: true },
    });
    const bank = new Map<
      string,
      { practice: number; byType: Record<string, number>; inExam: number; keys: Set<string> }
    >();
    for (const item of items) {
      const entry = bank.get(item.lo_id!) ?? { practice: 0, byType: {}, inExam: 0, keys: new Set() };
      bank.set(item.lo_id!, entry);
      if (examIds.has(item.quiz_id)) {
        entry.inExam++;
        continue;
      }
      const key = duplicateKey(item.question);
      if (entry.keys.has(key)) continue;
      entry.keys.add(key);
      entry.practice++;
      entry.byType[item.type] = (entry.byType[item.type] ?? 0) + 1;
    }
    return new Map(
      [...bank].map(([loId, { keys: _keys, ...stock }]) => [loId, stock] as const),
    );
  }
}

function loView(lo: {
  lo_id: string;
  code: string;
  parent_code: string | null;
  statement_vi: string;
  bloom_level: number | null;
}) {
  return {
    loId: lo.lo_id,
    code: lo.code,
    parentCode: lo.parent_code,
    statement: lo.statement_vi,
    bloomLevel: lo.bloom_level,
  };
}

function modelInfo() {
  return {
    policy: bktPolicy().version,
    prior: BKT_DEFAULTS.prior,
    threshold: MASTERY_DEFAULTS.threshold,
    minObservations: MASTERY_DEFAULTS.minObservations,
  };
}
