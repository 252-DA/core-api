import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AGS_STATUS } from '../common/constants/ags-status';
import { COURSE_ROLES, STAFF_ROLES } from '../common/constants/course-roles';
import { isUuid } from '../common/utils/uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { CanvasApiClient } from '../canvas/canvas-api.client';
import { CanvasCourseService } from '../canvas/canvas-course.service';
import {
  loadCanvasQuizContext,
  loadQuizBuilderContext,
} from './quiz-set-context';
import { AgsPublisherService } from '../ags/ags-publisher.service';
import { CourseRosterRepository } from '../roster/course-roster.repository';
import type { QuizSnapshotItem } from './quiz.types';
import {
  groupSubmissions,
  learnerResults,
  reviewOf,
  staffResults,
} from './quiz-set-results';
import {
  answersRevealed,
  closesAt,
  itemOrder,
  parseSettings,
  sessionExpiry,
  settingsView,
  SUBMIT_GRACE_MS,
  windowState,
  withCanvasSettings,
  type CanvasLinkSettings,
  type ItemOrder,
} from './quiz-set-exam';
import { parseBlueprint } from './quiz-blueprint';
import { gradeAnswer } from '../question/question-types';
import {
  answerGradingEvent,
  GRADING_STATUS,
  gradingInput,
  rowAgsStatus,
  submissionScore,
  type GradingAnswer,
} from '../question/answer-grading';

@Injectable()
export class QuizSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    private readonly ags: AgsPublisherService,
    private readonly roster: CourseRosterRepository,
  ) {}

  // TODO(refactor): hỏi chủ repo có gộp vào isCourseStaff
  /** Giảng viên/trợ giảng của khóa học, hoặc token quản trị. */
  private async isStaff(claims: BffClaims, courseId: string) {
    if (claims.scope === 'admin') return true;
    return (
      (await this.prisma.course_memberships.count({
        where: {
          user_id: claims.sub,
          course_id: courseId,
          role: { in: STAFF_ROLES },
        },
      })) > 0
    );
  }

  async context(
    claims: BffClaims,
    body: { courseId: string; moduleId?: string | null; chapterId?: string },
  ) {
    await this.authz.assertSessionCourse(claims, body.courseId, STAFF_ROLES);
    return loadCanvasQuizContext(
      {
        prisma: this.prisma,
        canvas: this.canvas,
        canvasCourses: this.canvasCourses,
      },
      body,
    );
  }

  /**
   * Dữ liệu cho trang Soạn đề: chương kèm LO, tài liệu (đã xử lý hay chưa),
   * câu hỏi của các LO đang chọn và các đề đã lưu của khóa.
   */
  async builderContext(
    claims: BffClaims,
    body: { courseId: string; loIds?: string[] },
  ) {
    await this.authz.assertSessionCourse(claims, body.courseId, STAFF_ROLES);
    return loadQuizBuilderContext(this.prisma, body);
  }

  async create(
    claims: BffClaims,
    body: {
      courseId: string;
      /** Hộp thoại module Canvas: một chương. */
      chapterId?: string;
      /** Trang Soạn đề: một hoặc nhiều chương (đề giữa kỳ/cuối kỳ). */
      chapterIds?: string[];
      title: string;
      quizIds: string[];
      selectionId: string;
      settings?: unknown;
      blueprint?: unknown;
    },
  ) {
    await this.authz.assertSessionCourse(claims, body.courseId, STAFF_ROLES);
    const settings = parseSettings(body.settings);
    const chapterIds = [
      ...new Set(
        Array.isArray(body.chapterIds)
          ? body.chapterIds
          : body.chapterId
            ? [body.chapterId]
            : [],
      ),
    ];
    if (
      !chapterIds.length ||
      chapterIds.length > 30 ||
      !chapterIds.every(isUuid) ||
      !isUuid(body.selectionId) ||
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 255 ||
      !Array.isArray(body.quizIds) ||
      !body.quizIds.length ||
      body.quizIds.length > 100 ||
      !body.quizIds.every(isUuid) ||
      new Set(body.quizIds).size !== body.quizIds.length
    ) {
      throw new BadRequestException(
        'Tên quiz, chương hoặc danh sách câu hỏi không hợp lệ.',
      );
    }
    const chapters = await this.prisma.chapters.findMany({
      where: {
        chapter_id: { in: chapterIds },
        course_id: body.courseId,
        deleted_at: null,
      },
      include: { chapter_los: { select: { lo_id: true } } },
    });
    if (chapters.length !== chapterIds.length)
      throw new BadRequestException('Chương không thuộc khóa học.');
    const blueprint = parseBlueprint(
      body.blueprint,
      new Set(chapters.flatMap((c) => c.chapter_los.map((l) => l.lo_id))),
    );
    return this.prisma.$transaction(async (tx) => {
      // The selection ID is generated and retained on the server for one deep
      // linking launch, so retries never create a second snapshot.
      const existing = await tx.quiz_sets.findUnique({
        where: { quiz_set_id: body.selectionId },
      });
      if (existing) {
        if (
          existing.course_id !== body.courseId ||
          existing.created_by !== claims.sub
        )
          throw new ForbiddenException();
        return {
          quiz_set_id: existing.quiz_set_id,
          title: existing.title,
          questionCount: (existing.items as unknown as QuizSnapshotItem[])
            .length,
          settings: settingsView(existing),
        };
      }
      const quizzes = await tx.quiz_items.findMany({
        where: {
          quiz_id: { in: body.quizIds },
          course_id: body.courseId,
          deleted_at: null,
          status: { in: ['APPROVED', 'PUBLISHED'] },
          learning_outcomes: {
            deleted_at: null,
            chapter_los: { some: { chapter_id: { in: chapterIds } } },
          },
        },
      });
      if (quizzes.length !== body.quizIds.length)
        throw new BadRequestException(
          'Chỉ thêm các câu đã duyệt và thuộc LO của chương.',
        );
      const items: QuizSnapshotItem[] = body.quizIds.map((id) => {
        const q = quizzes.find((row) => row.quiz_id === id)!;
        return {
          quiz_id: q.quiz_id,
          question: q.question,
          type: q.type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          lo_id: q.lo_id,
          bloom_level: q.bloom_level,
          source_chunk_ids: q.source_chunk_ids,
        };
      });
      const set = await tx.quiz_sets.create({
        data: {
          quiz_set_id: body.selectionId,
          course_id: body.courseId,
          chapter_id: chapterIds.length === 1 ? chapterIds[0] : null,
          chapter_ids: chapterIds,
          ...(blueprint
            ? { blueprint: blueprint as unknown as Prisma.InputJsonValue }
            : {}),
          title: body.title.trim(),
          items: items as unknown as Prisma.InputJsonValue,
          created_by: claims.sub,
          ...settings,
        },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'PUBLISH_QUIZ_SET',
          entity_type: 'quiz_set',
          entity_id: set.quiz_set_id,
          performed_by: claims.sub,
          raw_changes: {
            quiz_ids: body.quizIds,
            chapter_ids: chapterIds,
            settings: settingsView(set),
          },
        },
      });
      return {
        quiz_set_id: set.quiz_set_id,
        title: set.title,
        questionCount: items.length,
        settings: settingsView(set),
      };
    });
  }

  private async snapshot(claims: BffClaims, id: string, roles?: string[]) {
    if (!isUuid(id)) throw new BadRequestException('Quiz không hợp lệ.');
    const set = await this.prisma.quiz_sets.findFirst({
      where: { quiz_set_id: id, deleted_at: null },
    });
    if (!set) throw new NotFoundException('Không tìm thấy quiz.');
    await this.authz.assertSessionCourse(claims, set.course_id, roles);
    return { ...set, items: set.items as unknown as QuizSnapshotItem[] };
  }

  /**
   * Cài đặt Canvas của đúng resource link người dùng đang mở. Link không khớp
   * quiz/khóa học (hoặc không gửi) thì bỏ qua, quay về cài đặt của quiz set.
   */
  private async linkSettings(
    set: { quiz_set_id: string; course_id: string },
    resourceLinkId: unknown,
  ): Promise<CanvasLinkSettings | null> {
    if (!isUuid(resourceLinkId)) return null;
    return this.prisma.lti_resource_links.findFirst({
      where: {
        resource_link_id: resourceLinkId,
        target_kind: 'quiz_set',
        target_id: set.quiz_set_id,
        deleted_at: null,
        lms_course_ref: { course_id: set.course_id, deleted_at: null },
      },
      include: { lti_line_items: true },
    });
  }

  async get(claims: BffClaims, id: string, resourceLinkId?: string) {
    const found = await this.snapshot(claims, id);
    const set = withCanvasSettings(
      found,
      await this.linkSettings(found, resourceLinkId),
    );
    // Never serialize answers or explanations before submission. Đề kiểm tra
    // chỉ trả về khi bắt đầu một lượt (start), để mở trang chưa xem được đề.
    return {
      quiz_set_id: set.quiz_set_id,
      title: set.title,
      chapter_id: set.chapter_id,
      settings: settingsView(set),
      questionCount: set.items.length,
      items:
        set.mode === 'exam'
          ? []
          : set.items.map(({ quiz_id, question, type, options }) => ({
              quiz_id,
              question,
              type,
              options,
            })),
    };
  }

  /** Resource link Canvas phải trỏ đúng quiz này và còn cột điểm. */
  private async quizLink(
    set: { quiz_set_id: string; course_id: string },
    resourceLinkId: string,
  ) {
    if (!isUuid(resourceLinkId))
      throw new BadRequestException('Mở quiz từ bài tập Canvas để nộp bài.');
    const link = await this.prisma.lti_resource_links.findFirst({
      where: {
        resource_link_id: resourceLinkId,
        target_kind: 'quiz_set',
        target_id: set.quiz_set_id,
        deleted_at: null,
        lms_course_ref: { course_id: set.course_id, deleted_at: null },
        lti_line_items: { is: { deleted_at: null } },
      },
      include: { lti_line_items: true },
    });
    if (!link)
      throw new ForbiddenException(
        'Bài tập Canvas không khớp quiz hoặc chưa có cột điểm.',
      );
    return link;
  }

  private sessionView(
    set: { items: QuizSnapshotItem[]; max_attempts: number | null },
    session: {
      session_id: string;
      item_order: Prisma.JsonValue;
      started_at: Date;
      expires_at: Date | null;
    },
    attemptNumber: number,
  ) {
    const order = session.item_order as unknown as ItemOrder;
    return {
      sessionId: session.session_id,
      startedAt: session.started_at.toISOString(),
      expiresAt: session.expires_at?.toISOString() ?? null,
      // Client tính giờ còn lại theo đồng hồ server, không theo máy sinh viên.
      serverNow: new Date().toISOString(),
      attemptNumber,
      maxAttempts: set.max_attempts,
      items: order.flatMap(({ quiz_id, options }) => {
        const item = set.items.find((i) => i.quiz_id === quiz_id);
        return item
          ? [{ quiz_id, question: item.question, type: item.type, options }]
          : [];
      }),
    };
  }

  /**
   * Bắt đầu (hoặc tiếp tục) một lượt làm bài kiểm tra. Bấm bắt đầu là đã dùng
   * một lượt; phiên hết giờ mà chưa nộp vẫn tính là đã dùng.
   */
  async start(
    claims: BffClaims,
    body: { quizSetId: string; resourceLinkId: string },
  ) {
    const found = await this.snapshot(claims, body.quizSetId, [COURSE_ROLES.LEARNER]);
    if (found.mode !== 'exam')
      throw new BadRequestException('Quiz luyện tập không cần bắt đầu lượt làm.');
    const link = await this.quizLink(found, body.resourceLinkId);
    // Hạn, giờ mở/đóng và số lần làm theo Assignment hiện tại của Canvas.
    const set = withCanvasSettings(found, link);
    const scope = {
      quiz_set_id: set.quiz_set_id,
      user_id: claims.sub,
      resource_link_id: link.resource_link_id,
    };
    const now = new Date();
    const open = await this.prisma.quiz_set_sessions.findFirst({
      where: { ...scope, ended_at: null },
    });
    if (open) {
      if (
        !open.expires_at ||
        now.getTime() <= open.expires_at.getTime() + SUBMIT_GRACE_MS
      ) {
        const used = await this.prisma.quiz_set_sessions.count({ where: scope });
        return this.sessionView(set, open, used);
      }
      await this.prisma.quiz_set_sessions.updateMany({
        where: { session_id: open.session_id, ended_at: null },
        data: { ended_at: open.expires_at },
      });
    }
    const state = windowState(set, now);
    if (state === 'not_open')
      throw new ForbiddenException('Bài kiểm tra chưa tới giờ mở.');
    if (state === 'closed') throw new ForbiddenException('Bài kiểm tra đã đóng.');
    const used = await this.prisma.quiz_set_sessions.count({ where: scope });
    if (set.max_attempts !== null && used >= set.max_attempts)
      throw new ForbiddenException('Bạn đã dùng hết số lần làm bài.');
    try {
      const session = await this.prisma.quiz_set_sessions.create({
        data: {
          ...scope,
          item_order: itemOrder(set.items, set.shuffle) as unknown as Prisma.InputJsonValue,
          started_at: now,
          expires_at: sessionExpiry(set, now),
        },
      });
      return this.sessionView(set, session, used + 1);
    } catch (err) {
      // Hai tab bấm bắt đầu cùng lúc: index "một phiên mở" chặn phiên thứ hai.
      if ((err as { code?: string }).code !== 'P2002') throw err;
      const current = await this.prisma.quiz_set_sessions.findFirst({
        where: { ...scope, ended_at: null },
      });
      if (!current) throw err;
      return this.sessionView(set, current, used + 1);
    }
  }

  /**
   * Kết quả quiz cho trang mở từ bài tập Canvas. Giảng viên/trợ giảng thấy toàn
   * bộ đáp án, thống kê theo câu/LO và trạng thái điểm Canvas của từng sinh
   * viên; người học chỉ thấy các lượt nộp của chính mình, không kèm đáp án.
   */
  async results(
    claims: BffClaims,
    body: { quizSetId: string; resourceLinkId?: string },
  ) {
    const found = await this.snapshot(claims, body.quizSetId);
    const staff = await this.isStaff(claims, found.course_id);
    const links = await this.prisma.lti_resource_links.findMany({
      where: {
        target_kind: 'quiz_set',
        target_id: found.quiz_set_id,
        deleted_at: null,
      },
      include: { lti_line_items: true },
    });
    // Cài đặt theo Assignment người dùng đang mở; chỉ có một Assignment dùng
    // quiz này thì cũng đủ rõ để dùng cài đặt của nó.
    const current =
      links.find((l) => l.resource_link_id === body.resourceLinkId) ??
      (links.length === 1 ? links[0] : null);
    const set = withCanvasSettings(found, current);
    const rows = links.length
      ? await this.prisma.quiz_attempts.findMany({
          where: {
            resource_link_id: { in: links.map((l) => l.resource_link_id) },
            quiz_id: { in: set.items.map((i) => i.quiz_id) },
            submission_id: { not: null },
            deleted_at: null,
            ...(staff ? {} : { user_id: claims.sub }),
          },
          select: {
            submission_id: true,
            user_id: true,
            quiz_id: true,
            is_correct: true,
            score: true,
            attempted_at: true,
            ags_status: true,
            resource_link_id: true,
            chosen_answer: true,
            grading_status: true,
            feedback: true,
          },
          orderBy: { attempted_at: 'asc' },
        })
      : [];
    const submissions = groupSubmissions(rows, (id) =>
      this.ags.isWaitingForPublish(id),
    );
    const settings = settingsView(set);
    if (!staff) {
      const base = { ...learnerResults(submissions), settings };
      if (set.mode !== 'exam') return base;
      const now = new Date();
      const sessions = await this.prisma.quiz_set_sessions.findMany({
        where: {
          quiz_set_id: set.quiz_set_id,
          user_id: claims.sub,
          resource_link_id: { in: links.map((l) => l.resource_link_id) },
        },
        orderBy: { started_at: 'asc' },
      });
      const open = sessions.find(
        (s) =>
          !s.ended_at &&
          (!s.expires_at ||
            now.getTime() <= s.expires_at.getTime() + SUBMIT_GRACE_MS),
      );
      const revealed = answersRevealed(set, now);
      const latest = submissions[submissions.length - 1];
      return {
        ...base,
        window: windowState(set, now),
        attemptsUsed: sessions.length,
        openSession: open
          ? {
              sessionId: open.session_id,
              expiresAt: open.expires_at?.toISOString() ?? null,
            }
          : null,
        revealed,
        revealAt: closesAt(set)?.toISOString() ?? null,
        // Đáp án chỉ mở sau khi bài đóng, cho lượt nộp gần nhất.
        review:
          revealed && latest
            ? reviewOf(set.items, rows, latest.submissionId)
            : null,
      };
    }

    const loIds = [
      ...new Set(set.items.flatMap((i) => (i.lo_id ? [i.lo_id] : []))),
    ];
    // Mẫu số "cả lớp": sinh viên đang học theo danh sách lớp Canvas, không chỉ
    // người đã làm bài.
    const classLearnerIds = await this.roster.activeLearnerIds(set.course_id);
    const [users, los] = await Promise.all([
      this.prisma.lms_user_mappings.findMany({
        where: {
          internal_user_id: {
            in: [...new Set([...classLearnerIds, ...submissions.map((s) => s.userId)])],
          },
        },
        select: { internal_user_id: true, display_name: true },
      }),
      this.prisma.learning_outcomes.findMany({
        where: { lo_id: { in: loIds } },
        select: { lo_id: true, code: true, statement_vi: true },
      }),
    ]);
    return {
      title: set.title,
      settings,
      ...staffResults({
        items: set.items,
        submissions,
        names: new Map(users.map((u) => [u.internal_user_id, u.display_name])),
        classLearnerIds,
        los: new Map(
          los.map((lo) => [lo.lo_id, { code: lo.code, statement: lo.statement_vi }]),
        ),
      }),
    };
  }

  /**
   * Bài làm của một lượt nộp, cho SpeedGrader: điểm gửi về Canvas mang URL của
   * trang này (AgsPublisherService, extension .../lti/submission) và Canvas mở
   * lại nó khi giảng viên chấm. Chỉ giảng viên/trợ giảng của khóa xem được; lượt
   * nộp phải thuộc quiz này và một Assignment của nó trong khóa.
   */
  async submissionDetail(
    claims: BffClaims,
    body: { quizSetId: string; submissionId: string },
  ) {
    if (!isUuid(body.submissionId))
      throw new BadRequestException('Bài làm không hợp lệ.');
    const found = await this.snapshot(claims, body.quizSetId, STAFF_ROLES);
    const links = await this.prisma.lti_resource_links.findMany({
      where: {
        target_kind: 'quiz_set',
        target_id: found.quiz_set_id,
        deleted_at: null,
        lms_course_ref: { course_id: found.course_id, deleted_at: null },
      },
      include: { lti_line_items: true },
    });
    const linkIds = links.map((l) => l.resource_link_id);
    const rows = linkIds.length
      ? await this.prisma.quiz_attempts.findMany({
          where: {
            submission_id: body.submissionId,
            resource_link_id: { in: linkIds },
            quiz_id: { in: found.items.map((i) => i.quiz_id) },
            deleted_at: null,
          },
          select: {
            submission_id: true,
            user_id: true,
            quiz_id: true,
            is_correct: true,
            score: true,
            attempted_at: true,
            ags_status: true,
            resource_link_id: true,
            chosen_answer: true,
            grading_status: true,
            feedback: true,
          },
        })
      : [];
    if (!rows.length) throw new NotFoundException('Không tìm thấy bài làm.');
    const [submission] = groupSubmissions(rows, (id) =>
      this.ags.isWaitingForPublish(id),
    );
    const userId = rows[0].user_id;
    const link = links.find((l) => l.resource_link_id === rows[0].resource_link_id);
    const set = withCanvasSettings(found, link);
    const [student, mine] = await Promise.all([
      this.prisma.lms_user_mappings.findUnique({
        where: { internal_user_id: userId },
        select: { display_name: true },
      }),
      this.prisma.quiz_attempts.groupBy({
        by: ['submission_id'],
        where: {
          user_id: userId,
          resource_link_id: { in: linkIds },
          submission_id: { not: null },
          deleted_at: null,
        },
        _min: { attempted_at: true },
      }),
    ]);
    const order = mine
      .map((row) => ({
        id: row.submission_id,
        at: row._min.attempted_at?.getTime() ?? 0,
      }))
      .sort((a, b) => a.at - b.at);
    const pointsPossible = Number(set.points_possible);
    return {
      quiz_set_id: set.quiz_set_id,
      title: set.title,
      mode: set.mode,
      submissionId: submission.submissionId,
      student: { userId, name: student?.display_name ?? 'Sinh viên' },
      attemptedAt: submission.attemptedAt,
      attemptNumber: order.findIndex((o) => o.id === submission.submissionId) + 1,
      attemptCount: order.length,
      score: submission.score,
      pointsPossible,
      scoreGiven: Math.round(submission.score * pointsPossible) / 100,
      sync: submission.sync,
      // Giảng viên xem đủ đáp án đúng và giải thích, kể cả khi bài chưa đóng.
      review: reviewOf(found.items, rows, submission.submissionId),
    };
  }

  async submit(
    claims: BffClaims,
    body: {
      quizSetId: string;
      resourceLinkId: string;
      answers: Array<{ quizId: string; chosenAnswer: Prisma.InputJsonValue }>;
      sessionId?: string;
    },
  ) {
    const found = await this.snapshot(claims, body.quizSetId, [COURSE_ROLES.LEARNER]);
    const link = await this.quizLink(found, body.resourceLinkId);
    const set = withCanvasSettings(found, link);
    const exam = set.mode === 'exam';
    // Bài kiểm tra cho nộp khi còn câu bỏ trống (hết giờ tự nộp); câu bỏ trống
    // tính sai. Luyện tập vẫn yêu cầu trả lời đủ.
    if (
      !Array.isArray(body.answers) ||
      (!exam && body.answers.length !== set.items.length) ||
      new Set(body.answers.map((a) => a?.quizId)).size !== body.answers.length ||
      body.answers.some(
        (a) =>
          !a ||
          !set.items.some((q) => q.quiz_id === a.quizId) ||
          a.chosenAnswer === undefined,
      )
    ) {
      throw new BadRequestException(
        exam
          ? 'Câu trả lời không hợp lệ.'
          : 'Phải trả lời đầy đủ mỗi câu đúng một lần.',
      );
    }
    const attemptedAt = new Date();
    let session: { session_id: string; expires_at: Date | null } | null = null;
    if (exam) {
      if (!isUuid(body.sessionId))
        throw new BadRequestException('Thiếu lượt làm bài. Bấm Bắt đầu trước.');
      session = await this.prisma.quiz_set_sessions.findFirst({
        where: {
          session_id: body.sessionId,
          quiz_set_id: set.quiz_set_id,
          user_id: claims.sub,
          resource_link_id: link.resource_link_id,
          ended_at: null,
        },
      });
      if (!session)
        throw new ForbiddenException('Lượt làm bài này đã nộp hoặc không hợp lệ.');
      if (
        session.expires_at &&
        attemptedAt.getTime() > session.expires_at.getTime() + SUBMIT_GRACE_MS
      ) {
        await this.prisma.quiz_set_sessions.updateMany({
          where: { session_id: session.session_id, ended_at: null },
          data: { ended_at: session.expires_at },
        });
        throw new ForbiddenException('Đã hết giờ làm bài, bài không được nhận.');
      }
    }
    const perItem = set.items.map((q) => {
      const answer = body.answers.find((a) => a.quizId === q.quiz_id);
      // Câu bỏ trống (bài kiểm tra hết giờ) tính sai, kể cả tự luận.
      const grade = answer
        ? gradeAnswer(q, answer.chosenAnswer)
        : { score: 0, isCorrect: false, pending: false };
      return {
        quizId: q.quiz_id,
        type: q.type,
        chosenAnswer: answer?.chosenAnswer,
        isCorrect: grade.isCorrect,
        score: grade.score,
        pending: grade.pending,
        feedback: q.explanation,
        correctAnswer: q.correct_answer,
      };
    });
    const submissionId = randomUUID();
    const pendingCount = perItem.filter((r) => r.pending).length;
    const agsStatus = rowAgsStatus(AGS_STATUS.pending, pendingCount > 0);
    const rows = perItem.map((result, index) => ({
      attempt_id: randomUUID(),
      submission_id: submissionId,
      user_id: claims.sub,
      quiz_id: result.quizId,
      course_id: set.course_id,
      resource_link_id: link.resource_link_id,
      score: result.score,
      chosen_answer: result.chosenAnswer ?? Prisma.JsonNull,
      is_correct: result.isCorrect,
      grading_status: result.pending ? GRADING_STATUS.pending : GRADING_STATUS.graded,
      // Tự luận chấm theo snapshot của đề, không theo quiz_items lúc worker chạy.
      ...(result.pending ? { grading_input: gradingInput(set.items[index]) } : {}),
      feedback: result.feedback,
      attempted_at: attemptedAt,
      ags_status: agsStatus,
    }));
    // Lệnh chấm tự chứa: đề lúc nộp và bài làm đi kèm, worker không đọc quiz_attempts.
    const essays: GradingAnswer[] = rows.flatMap((row, index) =>
      perItem[index].pending
        ? [
            {
              attemptId: row.attempt_id,
              gradingInput: gradingInput(set.items[index]),
              chosenAnswer: perItem[index].chosenAnswer ?? null,
            },
          ]
        : [],
    );
    const sessionId = session?.session_id;
    await this.prisma.$transaction(async (tx) => {
      if (sessionId) {
        // Khoá phiên trước khi ghi bài: hai lần bấm nộp chỉ một lần được nhận.
        const { count } = await tx.quiz_set_sessions.updateMany({
          where: { session_id: sessionId, ended_at: null },
          data: { ended_at: attemptedAt, submission_id: submissionId },
        });
        if (count !== 1)
          throw new ForbiddenException('Lượt làm bài này đã được nộp.');
      }
      await tx.quiz_attempts.createMany({ data: rows });
      if (essays.length) {
        await tx.outbox_events.create({
          data: answerGradingEvent({
            submissionId,
            courseId: set.course_id,
            attemptIds: rows.map((row) => row.attempt_id),
            answers: essays,
          }),
        });
      }
    });
    const totalCorrect = perItem.filter((r) => r.isCorrect).length;
    const score = submissionScore(perItem.map((r) => r.score));
    // AgsPublisherService gửi lượt nộp tốt nhất, không phải lượt cuối — báo
    // cho người học điểm sẽ nằm trong sổ điểm để làm lại không gây hoang mang.
    const previous = await this.prisma.quiz_attempts.groupBy({
      by: ['submission_id'],
      where: {
        user_id: claims.sub,
        resource_link_id: link.resource_link_id,
        submission_id: { not: null },
        deleted_at: null,
      },
      _avg: { score: true },
    });
    const bestScore = Math.max(
      score,
      ...previous.map((row) => Math.round(Number(row._avg?.score ?? 0))),
    );
    const revealed = answersRevealed(set, attemptedAt);
    return {
      score,
      bestScore,
      attemptCount: Math.max(previous.length, 1),
      totalCorrect,
      total: perItem.length,
      pendingCount,
      // Bài kiểm tra chưa đóng: chỉ báo điểm, không lộ câu nào đúng/sai.
      perItem: revealed
        ? perItem.map(({ chosenAnswer: _chosen, ...item }) => item)
        : [],
      revealed,
      revealAt: exam ? (closesAt(set)?.toISOString() ?? null) : null,
      agsPublished: false,
      agsStatus,
    };
  }
}
