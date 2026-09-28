import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { CanvasApiClient } from '../canvas/canvas-api.client';
import { CanvasCourseService } from '../canvas/canvas-course.service';
import {
  classifyModule,
  resolveChapterCode,
} from '../document/canvas-placement';
import { AGS_STATUS } from '../ags/ags-status';
import { AgsPublisherService } from '../ags/ags-publisher.service';
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
  type ItemOrder,
} from './quiz-set-exam';
import { parseBlueprint } from './quiz-blueprint';

export type QuizSnapshotItem = {
  quiz_id: string;
  question: string;
  type: string;
  options: Prisma.JsonValue;
  correct_answer: Prisma.JsonValue;
  explanation: string | null;
  lo_id: string | null;
  bloom_level: number | null;
  source_chunk_ids: string[];
};

function uuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
  );
}

@Injectable()
export class QuizSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    private readonly ags: AgsPublisherService,
  ) {}

  private async access(claims: BffClaims, courseId: string, roles?: string[]) {
    if (
      !uuid(courseId) ||
      (claims.scope !== 'admin' && claims.courseId !== courseId)
    ) {
      throw new ForbiddenException('Khóa học không khớp phiên Canvas.');
    }
    await this.authz.assertCourseAccess(claims, courseId, roles);
  }

  async context(
    claims: BffClaims,
    body: { courseId: string; moduleId: string; chapterId?: string },
  ) {
    await this.access(claims, body.courseId, ['instructor', 'ta']);
    if (!/^\d+$/.test(body.moduleId || ''))
      throw new BadRequestException('Thiếu module Canvas.');
    const [modules, chapters, sessions] = await Promise.all([
      this.canvas.listModules(
        await this.canvasCourses.contextId(body.courseId),
      ),
      this.prisma.chapters.findMany({
        where: { course_id: body.courseId, deleted_at: null },
        orderBy: { sort_order: 'asc' },
        include: { chapter_los: { include: { learning_outcomes: true } } },
      }),
      this.prisma.course_sessions.findMany({
        where: { course_id: body.courseId },
        include: { chapters: true },
      }),
    ]);
    const module = modules.find((item) => String(item.id) === body.moduleId);
    if (!module)
      throw new NotFoundException('Module không thuộc khóa Canvas hiện tại.');
    const ref = classifyModule(module.name).chapterRef;
    const code =
      ref &&
      resolveChapterCode(
        ref,
        sessions.map((s) => ({
          session_no: s.session_no,
          chapter_code: s.chapters?.code ?? null,
        })),
        new Set(chapters.map((c) => c.code)),
      );
    const chapter = body.chapterId
      ? chapters.find((c) => c.chapter_id === body.chapterId)
      : chapters.find((c) => c.code === code);
    if (body.chapterId && !chapter)
      throw new BadRequestException('Chương không thuộc khóa học.');
    const learningOutcomes = (chapter?.chapter_los ?? [])
      .map((l) => l.learning_outcomes)
      .filter((l) => !l.deleted_at)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }),
      );
    const [quizItems, documents] = chapter
      ? await Promise.all([
          this.prisma.quiz_items.findMany({
            where: {
              course_id: body.courseId,
              lo_id: { in: learningOutcomes.map((l) => l.lo_id) },
              deleted_at: null,
            },
            include: { learning_outcomes: { select: { code: true } } },
            orderBy: { created_at: 'desc' },
            take: 200,
          }),
          this.prisma.documents.findMany({
            where: {
              course_id: body.courseId,
              chapter_code: chapter.code,
              role: 'lecture',
              deleted_at: null,
            },
            select: { document_id: true, title: true, status: true },
          }),
        ])
      : [[], []];
    // Dùng lại được mọi đề của khóa: đề giữa kỳ nhiều chương thường được thêm
    // vào một module riêng, không khớp chương nào. Đề của chương đang mở lên đầu.
    const sets = await this.prisma.quiz_sets.findMany({
      where: { course_id: body.courseId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    const chapterCode = new Map(chapters.map((c) => [c.chapter_id, c.code]));
    const covers = (set: { chapter_ids: string[] }) =>
      Boolean(chapter && set.chapter_ids.includes(chapter.chapter_id));
    return {
      module: { id: String(module.id), name: module.name },
      chapters: chapters.map(({ chapter_id, code, title }) => ({
        chapter_id,
        code,
        title,
      })),
      chapter: chapter
        ? {
            chapter_id: chapter.chapter_id,
            code: chapter.code,
            title: chapter.title,
          }
        : null,
      learningOutcomes,
      quizItems,
      documents,
      quizSets: [...sets.filter(covers), ...sets.filter((s) => !covers(s))].map(
        (set) => ({
          quiz_set_id: set.quiz_set_id,
          title: set.title,
          created_at: set.created_at,
          questionCount: (set.items as unknown as QuizSnapshotItem[]).length,
          settings: settingsView(set),
          chapterCodes: set.chapter_ids.flatMap((id) => {
            const code = chapterCode.get(id);
            return code ? [code] : [];
          }),
        }),
      ),
    };
  }

  /**
   * Dữ liệu cho trang Soạn đề: chương kèm LO, tài liệu (đã xử lý hay chưa),
   * câu hỏi của các LO đang chọn và các đề đã lưu của khóa.
   */
  async builderContext(
    claims: BffClaims,
    body: { courseId: string; loIds?: string[] },
  ) {
    await this.access(claims, body.courseId, ['instructor', 'ta']);
    const loIds = Array.isArray(body.loIds) ? body.loIds.filter(uuid).slice(0, 200) : [];
    const [chapters, documents, sets, quizItems] = await Promise.all([
      this.prisma.chapters.findMany({
        where: { course_id: body.courseId, deleted_at: null },
        orderBy: { sort_order: 'asc' },
        include: { chapter_los: { include: { learning_outcomes: true } } },
      }),
      this.prisma.documents.findMany({
        where: { course_id: body.courseId, deleted_at: null },
        select: {
          document_id: true,
          title: true,
          role: true,
          chapter_code: true,
          status: true,
          _count: { select: { chunks: { where: { deleted_at: null } } } },
        },
        orderBy: [{ chapter_code: 'asc' }, { title: 'asc' }],
      }),
      this.prisma.quiz_sets.findMany({
        where: { course_id: body.courseId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      loIds.length
        ? this.prisma.quiz_items.findMany({
            where: { course_id: body.courseId, lo_id: { in: loIds }, deleted_at: null },
            include: { learning_outcomes: { select: { code: true } } },
            orderBy: { created_at: 'desc' },
            take: 500,
          })
        : Promise.resolve([]),
    ]);
    const chapterCode = new Map(chapters.map((c) => [c.chapter_id, c.code]));
    return {
      chapters: chapters.map((c) => ({
        chapter_id: c.chapter_id,
        code: c.code,
        title: c.title,
        learningOutcomes: c.chapter_los
          .map((l) => l.learning_outcomes)
          .filter((lo) => !lo.deleted_at)
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
          .map((lo) => ({
            lo_id: lo.lo_id,
            code: lo.code,
            statement_vi: lo.statement_vi,
            bloom_level: lo.bloom_level,
          })),
      })),
      documents: documents.map(({ _count, ...doc }) => ({
        ...doc,
        ready: _count.chunks > 0,
      })),
      quizItems,
      quizSets: sets.map((set) => ({
        quiz_set_id: set.quiz_set_id,
        title: set.title,
        created_at: set.created_at,
        questionCount: (set.items as unknown as QuizSnapshotItem[]).length,
        settings: settingsView(set),
        chapterCodes: set.chapter_ids.flatMap((id) => {
          const code = chapterCode.get(id);
          return code ? [code] : [];
        }),
      })),
    };
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
    await this.access(claims, body.courseId, ['instructor', 'ta']);
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
      !chapterIds.every(uuid) ||
      !uuid(body.selectionId) ||
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 255 ||
      !Array.isArray(body.quizIds) ||
      !body.quizIds.length ||
      body.quizIds.length > 100 ||
      !body.quizIds.every(uuid) ||
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
    if (!uuid(id)) throw new BadRequestException('Quiz không hợp lệ.');
    const set = await this.prisma.quiz_sets.findFirst({
      where: { quiz_set_id: id, deleted_at: null },
    });
    if (!set) throw new NotFoundException('Không tìm thấy quiz.');
    await this.access(claims, set.course_id, roles);
    return { ...set, items: set.items as unknown as QuizSnapshotItem[] };
  }

  async get(claims: BffClaims, id: string) {
    const set = await this.snapshot(claims, id);
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
    if (!uuid(resourceLinkId))
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
    const set = await this.snapshot(claims, body.quizSetId, ['learner']);
    if (set.mode !== 'exam')
      throw new BadRequestException('Quiz luyện tập không cần bắt đầu lượt làm.');
    const link = await this.quizLink(set, body.resourceLinkId);
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
  async results(claims: BffClaims, body: { quizSetId: string }) {
    const set = await this.snapshot(claims, body.quizSetId);
    const staff =
      claims.scope === 'admin' ||
      (await this.prisma.course_memberships.count({
        where: {
          user_id: claims.sub,
          course_id: set.course_id,
          role: { in: ['instructor', 'ta'] },
        },
      })) > 0;
    const links = await this.prisma.lti_resource_links.findMany({
      where: {
        target_kind: 'quiz_set',
        target_id: set.quiz_set_id,
        deleted_at: null,
      },
      select: { resource_link_id: true },
    });
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
    const [users, los] = await Promise.all([
      this.prisma.lms_user_mappings.findMany({
        where: {
          internal_user_id: { in: [...new Set(submissions.map((s) => s.userId))] },
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
        los: new Map(
          los.map((lo) => [lo.lo_id, { code: lo.code, statement: lo.statement_vi }]),
        ),
      }),
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
    const set = await this.snapshot(claims, body.quizSetId, ['learner']);
    const link = await this.quizLink(set, body.resourceLinkId);
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
      if (!uuid(body.sessionId))
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
      return {
        quizId: q.quiz_id,
        chosenAnswer: answer?.chosenAnswer,
        isCorrect:
          answer !== undefined &&
          JSON.stringify(answer.chosenAnswer) ===
            JSON.stringify(q.correct_answer),
        feedback: q.explanation,
        correctAnswer: q.correct_answer,
      };
    });
    const submissionId = randomUUID();
    const rows = perItem.map((result) => ({
      submission_id: submissionId,
      user_id: claims.sub,
      quiz_id: result.quizId,
      course_id: set.course_id,
      resource_link_id: link.resource_link_id,
      score: result.isCorrect ? 100 : 0,
      chosen_answer: result.chosenAnswer ?? Prisma.JsonNull,
      is_correct: result.isCorrect,
      feedback: result.feedback,
      attempted_at: attemptedAt,
      ags_status: AGS_STATUS.pending,
    }));
    if (session) {
      const sessionId = session.session_id;
      await this.prisma.$transaction(async (tx) => {
        // Khoá phiên trước khi ghi bài: hai lần bấm nộp chỉ một lần được nhận.
        const { count } = await tx.quiz_set_sessions.updateMany({
          where: { session_id: sessionId, ended_at: null },
          data: { ended_at: attemptedAt, submission_id: submissionId },
        });
        if (count !== 1)
          throw new ForbiddenException('Lượt làm bài này đã được nộp.');
        await tx.quiz_attempts.createMany({ data: rows });
      });
    } else {
      await this.prisma.quiz_attempts.createMany({ data: rows });
    }
    const totalCorrect = perItem.filter((r) => r.isCorrect).length;
    const score = Math.round((100 * totalCorrect) / perItem.length);
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
      // Bài kiểm tra chưa đóng: chỉ báo điểm, không lộ câu nào đúng/sai.
      perItem: revealed
        ? perItem.map(({ chosenAnswer: _chosen, ...item }) => item)
        : [],
      revealed,
      revealAt: exam ? (closesAt(set)?.toISOString() ?? null) : null,
      agsPublished: false,
      agsStatus: AGS_STATUS.pending,
    };
  }
}
