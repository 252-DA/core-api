import { BadRequestException, Injectable } from '@nestjs/common';
import type { quiz_sets as QuizSetRow } from '@prisma/client';
import { STAFF_ROLES } from '../../common/constants/course-roles';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuthzService } from '../../auth/authz.service';
import type { BffClaims } from '../../auth/bff-claims';
import {
  answersRevealed,
  withCanvasSettings,
} from '../quiz/domain/quiz-set-exam';
import type { QuizSnapshotItem } from '../quiz/quiz.types';
import { CourseRosterRepository } from '../roster/course-roster.repository';
import { BKT_DEFAULTS, MASTERY_DEFAULTS } from './domain/bkt';
import { learnerLoStates, type LoState } from './domain/learner-state';
import { bktPolicy } from './domain/mastery-policy';
import {
  duplicateKey,
  normalizeAttempts,
  type AttemptEvidence,
  type NormalizedEvidence,
} from './domain/observations';
import { plan, type Decision, type PlannerLo } from './domain/planner';
import {
  dueLoIds,
  reviewQueue,
  type ReviewQueueEntry,
} from './domain/review-queue';
import { localDayStart, REVIEW_DEFAULTS } from './domain/review-schedule';

/** Trạng thái câu được dùng trong đề, cũng là trạng thái câu được vào kho luyện. */
const POOL_STATUSES = ['APPROVED', 'PUBLISHED'];

/**
 * LO có ít câu luyện hơn mức này bị cảnh báo trước khi bật Agent (§5.4). Đây là
 * ngưỡng vận hành đề xuất, không bảo đảm đủ câu cho mọi người học.
 */
export const MIN_PRACTICE_ITEMS = 6;

function snapshotItems(set: QuizSetRow): QuizSnapshotItem[] {
  return Array.isArray(set.items)
    ? (set.items as unknown as QuizSnapshotItem[])
    : [];
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

  /**
   * Mức nắm theo LO của người học đang đăng nhập, kèm lịch ôn dẫn xuất và đề
   * xuất tiếp theo của planner. Giảng viên/trợ giảng truyền `userId` để xem
   * của một sinh viên.
   */
  async summary(
    claims: BffClaims,
    body: { courseId: string; userId?: string },
  ) {
    const self = !body.userId || body.userId === claims.sub;
    if (!self && !isUuid(body.userId))
      throw new BadRequestException('userId không hợp lệ.');
    await this.authz.assertSessionCourse(
      claims,
      body.courseId,
      self ? undefined : STAFF_ROLES,
    );
    const userId = self ? claims.sub : body.userId!;

    const [los, sets] = await Promise.all([
      this.courseLos(body.courseId),
      this.courseSets(body.courseId),
    ]);
    const loIds = los.map((lo) => lo.lo_id);
    const [evidence, bank, sources] = await Promise.all([
      this.evidence(body.courseId, sets, [userId]),
      this.practiceBank(body.courseId, sets),
      this.sourceLoIds(loIds),
    ]);
    const rows = evidence.get(userId) ?? [];
    const normalized = normalizeAttempts(rows);
    const states = learnerLoStates(loIds, normalized);
    const now = new Date();
    const reviews = reviewQueue(states, normalized, now);
    return {
      courseId: body.courseId,
      userId,
      model: modelInfo(),
      plan: this.buildPlan({
        states,
        normalized,
        rows,
        reviews,
        bank,
        sources,
        now,
      }),
      los: los.map((lo, i) => ({
        ...loView(lo),
        ...stateView(states[i]),
        review: reviews.get(lo.lo_id) ?? null,
      })),
    };
  }

  /**
   * Bảng sinh viên × LO cho giảng viên, kèm thống kê kho luyện theo LO × loại câu.
   * Mẫu số là sinh viên đang học theo danh sách lớp (cùng truy vấn với trang kết
   * quả quiz), không phải chỉ người đã làm bài; người đã làm bài nhưng rời lớp
   * vẫn có mặt vì bằng chứng của họ còn đó.
   */
  async courseMastery(claims: BffClaims, body: { courseId: string }) {
    await this.authz.assertSessionCourse(claims, body.courseId, STAFF_ROLES);
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
    const names = new Map(
      users.map((u) => [u.internal_user_id, u.display_name]),
    );
    const loIds = los.map((lo) => lo.lo_id);

    const students = userIds
      .map((userId) => {
        const states = learnerLoStates(
          loIds,
          normalizeAttempts(evidence.get(userId) ?? []),
        );
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
        const stock = bank.get(lo.lo_id) ?? {
          practice: 0,
          byType: {},
          inExam: 0,
        };
        return {
          ...loView(lo),
          bank: {
            practice: stock.practice,
            byType: stock.byType,
            inExam: stock.inExam,
            low: stock.practice < MIN_PRACTICE_ITEMS,
          },
          mastered: students.filter(
            (s) =>
              s.los.find((x) => x.loId === lo.lo_id)?.status === 'mastered',
          ).length,
        };
      }),
      students,
    };
  }

  private courseLos(courseId: string) {
    return this.prisma.learning_outcomes
      .findMany({
        where: { course_id: courseId, deleted_at: null, is_current: true },
        select: {
          lo_id: true,
          code: true,
          parent_code: true,
          statement_vi: true,
          bloom_level: true,
        },
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
   * học: nếu mô hình và planner dùng ngay kết quả đó thì mức nắm hoặc đề xuất
   * kế tiếp sẽ để lộ câu nào đúng, câu nào sai.
   */
  private async evidence(
    courseId: string,
    sets: QuizSetRow[],
    userIds?: string[],
  ) {
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
        quiz_items: {
          select: { lo_id: true, type: true, question: true, options: true },
        },
        // Cột Canvas của link để lấy hạn/giờ đóng hiệu lực, cùng một truy vấn.
        lti_resource_links: {
          select: {
            target_kind: true,
            target_id: true,
            assignment_synced_at: true,
            assignment_due_at: true,
            assignment_unlock_at: true,
            assignment_lock_at: true,
            assignment_allowed_attempts: true,
          },
        },
      },
    });
    const setById = new Map(sets.map((s) => [s.quiz_set_id, s]));
    const now = new Date();
    const byUser = new Map<string, AttemptEvidence[]>();
    for (const row of rows) {
      const link = row.lti_resource_links;
      const set =
        link?.target_kind === 'quiz_set' && link.target_id
          ? setById.get(link.target_id)
          : undefined;
      const item =
        (set && snapshotItems(set).find((q) => q.quiz_id === row.quiz_id)) ||
        row.quiz_items;
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
        // Hạn và giờ đóng theo Assignment Canvas, như lúc sinh viên làm bài.
        hidden: set
          ? !answersRevealed(withCanvasSettings(set, link), now)
          : false,
      });
      byUser.set(row.user_id, list);
    }

    if (this.prisma.micro_content_answers?.findMany) {
      const microRows = await this.prisma.micro_content_answers.findMany({
        where: {
          question: { deleted_at: null },
          attempt: {
            ...(userIds ? { user_id: { in: userIds } } : {}),
            micro_contents: {
              course_id: courseId,
              lo_id: { not: null },
              deleted_at: null,
            },
          },
        },
        select: {
          answer_id: true,
          question_id: true,
          is_correct: true,
          grading_status: true,
          created_at: true,
          attempt: {
            select: {
              user_id: true,
              submitted_at: true,
              micro_contents: {
                select: { lo_id: true },
              },
            },
          },
          question: {
            select: {
              type: true,
              options: true,
              question: true,
            },
          },
        },
        orderBy: [{ created_at: 'asc' }, { answer_id: 'asc' }],
      });

      for (const row of microRows) {
        const loId = row.attempt.micro_contents.lo_id;
        if (!loId) continue;
        const list = byUser.get(row.attempt.user_id) ?? [];
        list.push({
          attemptId: row.answer_id,
          quizId: row.question_id,
          loId,
          type: row.question.type,
          optionCount: optionCount(row.question.options),
          question: row.question.question,
          isCorrect: row.is_correct,
          gradingStatus: row.grading_status,
          attemptedAt: row.attempt.submitted_at ?? row.created_at ?? new Date(),
          source: 'lesson',
          hidden: false,
        });
        byUser.set(row.attempt.user_id, list);
      }

      if (microRows.length > 0) {
        for (const list of byUser.values()) {
          list.sort(
            (a, b) =>
              (a.attemptedAt?.getTime() ?? 0) - (b.attemptedAt?.getTime() ?? 0),
          );
        }
      }
    }

    return byUser;
  }

  /**
   * Kho luyện theo LO: câu đã duyệt, không thuộc đề Kiểm tra nào còn hiệu lực,
   * đếm theo nhóm câu trùng văn bản (§5.4, §2.11). `keys` phục vụ planner
   * (phân biệt câu người học đã gặp); bảng giảng viên chỉ lấy phần đếm.
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
    const bank = new Map<string, BankStock>();
    for (const item of items) {
      const entry = bank.get(item.lo_id!) ?? {
        practice: 0,
        byType: {},
        inExam: 0,
        keys: new Set(),
      };
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
    return bank;
  }

  /**
   * LO có tài nguyên để A3 trỏ về: thẻ bài học đã duyệt hoặc đoạn tài liệu
   * đã gắn LO (bao-cao-learning-agent §7). Truy vấn tùy chọn để spec không
   * cần dựng thêm mock.
   */
  private async sourceLoIds(loIds: string[]): Promise<Set<string>> {
    const out = new Set<string>();
    if (!loIds.length) return out;
    const chunkRows = this.prisma.chunk_lo_mappings?.findMany
      ? await this.prisma.chunk_lo_mappings.findMany({
          where: { lo_id: { in: loIds } },
          select: { lo_id: true },
          distinct: ['lo_id'],
        })
      : [];
    const cardRows = this.prisma.lesson_cards?.findMany
      ? await this.prisma.lesson_cards.findMany({
          where: {
            lo_id: { in: loIds },
            deleted_at: null,
            status: { in: POOL_STATUSES },
          },
          select: { lo_id: true },
          distinct: ['lo_id'],
        })
      : [];
    for (const row of [...chunkRows, ...cardRows]) {
      if (row.lo_id) out.add(row.lo_id);
    }
    return out;
  }

  /**
   * Dựng đầu vào cho planner từ dữ liệu đã dựng lại (§7). Hai chỗ chưa đủ hạ
   * tầng sự kiện nên nhận giá trị trung lập: `sourceViews` (chưa ghi nhận xem
   * nguồn) và `paused` (chưa lưu tạm dừng; R2 trả A6 dạng tư vấn). Cũng chưa
   * có khái niệm "đợt luyện" được lưu: `episodeObservations` tạm là toàn bộ
   * quan sát của LO.
   */
  private buildPlan(args: {
    states: LoState[];
    normalized: NormalizedEvidence;
    rows: AttemptEvidence[];
    reviews: Map<string, ReviewQueueEntry>;
    bank: Map<string, BankStock>;
    sources: Set<string>;
    now: Date;
  }): Decision {
    const { states, normalized, rows, reviews, bank, sources, now } = args;
    const dayStart = localDayStart(now, 0, REVIEW_DEFAULTS);
    const masteredAt = new Map(
      states
        .filter((s) => s.firstMasteredAt)
        .map((s) => [s.loId, s.firstMasteredAt!.getTime()]),
    );

    const seenKeys = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!row.loId) continue;
      const keys = seenKeys.get(row.loId) ?? new Set<string>();
      keys.add(duplicateKey(row.question));
      seenKeys.set(row.loId, keys);
    }

    const scope: PlannerLo[] = states.map((state) => {
      const stock = bank.get(state.loId);
      const seen = seenKeys.get(state.loId);
      const hasNewItem = stock
        ? [...stock.keys].some((key) => !seen?.has(key))
        : false;
      return {
        loId: state.loId,
        mastered: state.status === 'mastered',
        episodeObservations: state.observations,
        wrongSinceSource: state.consecutiveWrong,
        sourceViews: 0,
        paused: false,
        awaitingGrade: state.pending.grading + state.pending.review > 0,
        hasNewItem,
        hasReviewItem: (stock?.keys.size ?? 0) > 0,
        hasSource: sources.has(state.loId),
      };
    });

    const lastObservation =
      normalized.observations[normalized.observations.length - 1];
    const answered = rows.filter(
      (row) =>
        row.attemptedAt && row.attemptedAt.getTime() >= dayStart.getTime(),
    ).length;
    const reviewsAnswered = normalized.observations.filter((obs) => {
      const mastered = masteredAt.get(obs.loId);
      return (
        obs.at.getTime() >= dayStart.getTime() &&
        mastered !== undefined &&
        obs.at.getTime() > mastered
      );
    }).length;

    return plan({
      scope,
      currentLoId: lastObservation?.loId ?? null,
      dueLoIds: dueLoIds(reviews),
      today: { answered, reviewsAnswered },
    });
  }
}

interface BankStock {
  practice: number;
  byType: Record<string, number>;
  inExam: number;
  keys: Set<string>;
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
