import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { isQuestionType, normalizeAnswerKey } from '../quiz/question-types';

const DEFAULT_VOICE = 'vi-VN-HoaiMyNeural';
const DEFAULT_MICRO_QUIZ_COUNT = 3;
const DEFAULT_MICRO_QUIZ_TYPES = ['MCQ_SINGLE', 'TRUE_FALSE'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QuestionInput = {
  id?: string;
  position: number;
  type: string;
  question: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string;
};

export type CreateMicroContentInput = {
  courseId: string;
  title: string;
  description?: string;
  videoSource?: 'UPLOAD' | 'AI';
  passingScore?: number;
  requiredWatchPercent?: number;
  sourceDocumentId?: string | null;
  sourcePageFrom?: number | null;
  sourcePageTo?: number | null;
  loId?: string | null;
  position?: number | null;
};

export type UpdateMicroContentInput = {
  microContentId: string;
  title?: string;
  description?: string;
  passingScore?: number;
  requiredWatchPercent?: number;
  aiPrompt?: string;
  aiOptions?: unknown;
  sourceDocumentId?: string | null;
  sourcePageFrom?: number | null;
  sourcePageTo?: number | null;
  loId?: string | null;
  position?: number | null;
};

function countFlaggedScenes(script: unknown): number {
  if (!script || typeof script !== 'object' || Array.isArray(script)) return 0;
  const scenes = (script as { scenes?: unknown }).scenes;
  if (!Array.isArray(scenes)) return 0;
  return scenes.filter((sc) => {
    if (!sc || typeof sc !== 'object') return false;
    const check = (sc as { check?: { status?: unknown } }).check;
    return check?.status === 'FLAGGED';
  }).length;
}

@Injectable()
export class MicroContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  private async validateSourceAndLo(
    courseId: string,
    input: {
      sourceDocumentId?: string | null;
      sourcePageFrom?: number | null;
      sourcePageTo?: number | null;
      loId?: string | null;
    },
    existing?: {
      source_page_from: number | null;
      source_page_to: number | null;
    },
  ) {
    if (input.sourceDocumentId) {
      if (!UUID_RE.test(input.sourceDocumentId)) {
        throw new BadRequestException('sourceDocumentId không hợp lệ.');
      }
      const doc = await this.prisma.documents.findFirst({
        where: { document_id: input.sourceDocumentId, course_id: courseId, deleted_at: null },
        select: { document_id: true },
      });
      if (!doc) {
        throw new BadRequestException('Tài liệu nguồn không thuộc khoá học.');
      }
    }

    if (input.loId) {
      if (!UUID_RE.test(input.loId)) {
        throw new BadRequestException('loId không hợp lệ.');
      }
      const lo = await this.prisma.learning_outcomes.findFirst({
        where: { lo_id: input.loId, course_id: courseId, is_current: true, deleted_at: null },
        select: { lo_id: true },
      });
      if (!lo) {
        throw new BadRequestException('LO không thuộc khoá học.');
      }
    }

    const effectiveFrom =
      input.sourcePageFrom !== undefined ? input.sourcePageFrom : (existing?.source_page_from ?? null);
    const effectiveTo =
      input.sourcePageTo !== undefined ? input.sourcePageTo : (existing?.source_page_to ?? null);

    if (effectiveFrom !== null && (!Number.isInteger(effectiveFrom) || effectiveFrom < 1)) {
      throw new BadRequestException('Trang bắt đầu phải là số nguyên >= 1.');
    }
    if (effectiveTo !== null && (!Number.isInteger(effectiveTo) || effectiveTo < 1)) {
      throw new BadRequestException('Trang kết thúc phải là số nguyên >= 1.');
    }
    if (effectiveFrom !== null && effectiveTo !== null && effectiveTo < effectiveFrom) {
      throw new BadRequestException('Trang kết thúc phải lớn hơn hoặc bằng trang bắt đầu.');
    }
  }

  /**
   * Danh sách Micro Content theo khoá học cho giảng viên / TA.
   */
  async list(claims: BffClaims, courseId: string) {
    await this.authz.assertCourseAccess(claims, courseId, ['instructor', 'ta', 'admin']);

    const items = await this.prisma.micro_contents.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        source_document: {
          select: { document_id: true, title: true },
        },
        learning_outcome: {
          select: { lo_id: true, code: true, statement_vi: true },
        },
        _count: {
          select: {
            questions: {
              where: { deleted_at: null },
            },
            attempts: true,
          },
        },
      },
    });

    const mapped = items.map((item) => ({
      id: item.micro_content_id,
      courseId: item.course_id,
      title: item.title,
      description: item.description,
      videoAssetId: item.video_asset_id,
      videoSource: item.video_source,
      videoStatus: item.video_status,
      videoDurationMs: item.video_duration_ms,
      videoError: item.video_error,
      passingScore: item.passing_score,
      requiredWatchPercent: item.required_watch_percent,
      status: item.status,
      sourceDocumentId: item.source_document_id,
      sourceDocumentTitle: item.source_document?.title ?? null,
      sourcePageFrom: item.source_page_from,
      sourcePageTo: item.source_page_to,
      loId: item.lo_id,
      loCode: item.learning_outcome?.code ?? null,
      loStatementVi: item.learning_outcome?.statement_vi ?? null,
      position: item.position,
      scriptStatus: item.script_status,
      scriptRequestId: item.script_request_id,
      hasScript: Boolean(item.ai_script),
      flaggedSceneCount: countFlaggedScenes(item.ai_script),
      questionCount: item._count.questions,
      attemptCount: item._count.attempts,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    // Giữ thứ tự đề xuất theo position khi các bài cùng một bộ slide nguồn.
    mapped.sort((a, b) => {
      if (a.sourceDocumentId && a.sourceDocumentId === b.sourceDocumentId) {
        return (a.position ?? 9999) - (b.position ?? 9999);
      }
      return 0;
    });

    return mapped;
  }

  /**
   * Lấy chi tiết Micro Content kèm câu hỏi.
   * QUAN TRỌNG: Với learner, KHÔNG trả về correct_answer và explanation.
   */
  async get(claims: BffClaims, microContentId: string) {
    const item = await this.prisma.micro_contents.findFirst({
      where: {
        micro_content_id: microContentId,
        deleted_at: null,
      },
      include: {
        source_document: {
          select: { document_id: true, title: true },
        },
        learning_outcome: {
          select: { lo_id: true, code: true, statement_vi: true },
        },
        video_asset: {
          select: {
            vtt_subtitles_key: true,
            transcript_text: true,
            scene_timeline: true,
          },
        },
        questions: {
          where: { deleted_at: null },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Micro content not found');
    }

    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => ['instructor', 'ta', 'admin', 'teacher'].includes(r));

    const hasSubtitles = Boolean(item.video_asset?.vtt_subtitles_key);
    const sceneTimeline = Array.isArray(item.video_asset?.scene_timeline)
      ? item.video_asset.scene_timeline
      : [];
    const transcriptText = item.video_asset?.transcript_text ?? null;

    if (!isStaff) {
      // Learner chỉ được xem nếu nội dung đã PUBLISHED
      if (item.status !== 'PUBLISHED') {
        throw new NotFoundException('Micro content not found');
      }
      await this.authz.assertCourseAccess(claims, item.course_id, ['learner']);

      // Ẩn đáp án đúng và giải thích đối với học viên
      const sanitizedQuestions = item.questions.map((q) => ({
        id: q.question_id,
        position: q.position,
        type: q.type,
        question: q.question,
        options: q.options,
      }));

      return {
        id: item.micro_content_id,
        courseId: item.course_id,
        title: item.title,
        description: item.description,
        videoAssetId: item.video_asset_id,
        videoSource: item.video_source,
        videoStatus: item.video_status,
        videoDurationMs: item.video_duration_ms,
        passingScore: item.passing_score,
        requiredWatchPercent: item.required_watch_percent,
        status: item.status,
        sourceDocumentId: item.source_document_id,
        sourceDocumentTitle: item.source_document?.title ?? null,
        sourcePageFrom: item.source_page_from,
        sourcePageTo: item.source_page_to,
        loId: item.lo_id,
        loCode: item.learning_outcome?.code ?? null,
        loStatementVi: item.learning_outcome?.statement_vi ?? null,
        hasSubtitles,
        sceneTimeline,
        transcriptText,
        questions: sanitizedQuestions,
      };
    }

    // Giảng viên / TA / Admin xem được toàn bộ
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    let sourceDocumentTotalPages: number | null = null;
    if (item.source_document_id && this.prisma.chunks?.aggregate) {
      const agg = await this.prisma.chunks.aggregate({
        where: { document_id: item.source_document_id, deleted_at: null },
        _max: { page_number: true },
      });
      sourceDocumentTotalPages = agg._max.page_number ?? null;
    }

    let scriptError: string | null = null;
    if (
      item.script_status === 'FAILED' &&
      item.script_request_id &&
      this.prisma.content_generation_requests?.findUnique
    ) {
      const reqRow = await this.prisma.content_generation_requests.findUnique({
        where: { request_id: item.script_request_id },
        select: { last_error: true },
      });
      scriptError = reqRow?.last_error ?? null;
    }

    return {
      id: item.micro_content_id,
      courseId: item.course_id,
      title: item.title,
      description: item.description,
      videoAssetId: item.video_asset_id,
      videoSource: item.video_source,
      videoStatus: item.video_status,
      videoDurationMs: item.video_duration_ms,
      videoError: item.video_error,
      aiPrompt: item.ai_prompt,
      aiOptions: item.ai_options,
      aiScript: item.ai_script,
      sourceDocumentId: item.source_document_id,
      sourceDocumentTitle: item.source_document?.title ?? null,
      sourceDocumentTotalPages,
      sourcePageFrom: item.source_page_from,
      sourcePageTo: item.source_page_to,
      loId: item.lo_id,
      loCode: item.learning_outcome?.code ?? null,
      loStatementVi: item.learning_outcome?.statement_vi ?? null,
      position: item.position,
      scriptStatus: item.script_status,
      scriptRequestId: item.script_request_id,
      scriptError,
      flaggedSceneCount: countFlaggedScenes(item.ai_script),
      hasSubtitles,
      sceneTimeline,
      transcriptText,
      passingScore: item.passing_score,
      requiredWatchPercent: item.required_watch_percent,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      questions: item.questions.map((q) => ({
        id: q.question_id,
        position: q.position,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      })),
    };
  }

  /**
   * Tạo Micro Content mới (mặc định DRAFT).
   */
  async create(claims: BffClaims, input: CreateMicroContentInput) {
    await this.authz.assertCourseAccess(claims, input.courseId, ['instructor', 'ta', 'admin']);

    if (!input.title?.trim()) {
      throw new BadRequestException('Tiêu đề không được để trống.');
    }

    await this.validateSourceAndLo(input.courseId, input);

    const created = await this.prisma.micro_contents.create({
      data: {
        course_id: input.courseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        video_source: input.videoSource || 'UPLOAD',
        video_status: 'NONE',
        passing_score: input.passingScore ?? 70,
        required_watch_percent: input.requiredWatchPercent ?? 90,
        ...(input.sourceDocumentId !== undefined
          ? { source_document_id: input.sourceDocumentId }
          : {}),
        ...(input.sourcePageFrom !== undefined ? { source_page_from: input.sourcePageFrom } : {}),
        ...(input.sourcePageTo !== undefined ? { source_page_to: input.sourcePageTo } : {}),
        ...(input.loId !== undefined ? { lo_id: input.loId } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        status: 'DRAFT',
        created_by: claims.sub,
      },
    });

    return {
      id: created.micro_content_id,
      courseId: created.course_id,
      title: created.title,
      status: created.status,
    };
  }

  /**
   * Cập nhật thông tin Micro Content.
   */
  async update(claims: BffClaims, input: UpdateMicroContentInput) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    await this.validateSourceAndLo(item.course_id, input, {
      source_page_from: item.source_page_from,
      source_page_to: item.source_page_to,
    });

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: input.microContentId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
        ...(input.passingScore !== undefined ? { passing_score: input.passingScore } : {}),
        ...(input.requiredWatchPercent !== undefined
          ? { required_watch_percent: input.requiredWatchPercent }
          : {}),
        ...(input.aiPrompt !== undefined ? { ai_prompt: input.aiPrompt } : {}),
        ...(input.aiOptions !== undefined ? { ai_options: input.aiOptions as any } : {}),
        ...(input.sourceDocumentId !== undefined
          ? { source_document_id: input.sourceDocumentId }
          : {}),
        ...(input.sourcePageFrom !== undefined ? { source_page_from: input.sourcePageFrom } : {}),
        ...(input.sourcePageTo !== undefined ? { source_page_to: input.sourcePageTo } : {}),
        ...(input.loId !== undefined ? { lo_id: input.loId } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
        updated_at: new Date(),
      },
    });

    return {
      id: updated.micro_content_id,
      title: updated.title,
      description: updated.description,
      passingScore: updated.passing_score,
      requiredWatchPercent: updated.required_watch_percent,
      sourceDocumentId: updated.source_document_id,
      sourcePageFrom: updated.source_page_from,
      sourcePageTo: updated.source_page_to,
      loId: updated.lo_id,
      position: updated.position,
    };
  }

  /**
   * Xoá mềm Micro Content.
   */
  async delete(claims: BffClaims, microContentId: string) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    await this.prisma.micro_contents.update({
      where: { micro_content_id: microContentId },
      data: { deleted_at: new Date() },
    });

    return { success: true };
  }

  /**
   * Xuất bản hoặc thu hồi xuất bản.
   * Chỉ được xuất bản khi video_status = READY và có ít nhất 1 câu hỏi.
   */
  async publish(claims: BffClaims, microContentId: string, targetStatus?: 'DRAFT' | 'PUBLISHED') {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: microContentId, deleted_at: null },
      include: {
        _count: {
          select: {
            questions: { where: { deleted_at: null } },
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    const newStatus = targetStatus ?? (item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED');

    if (newStatus === 'PUBLISHED') {
      if (item.video_status !== 'READY') {
        throw new BadRequestException('Chỉ có thể xuất bản khi video đã sẵn sàng (READY).');
      }
      if (item._count.questions === 0) {
        throw new BadRequestException('Phải có ít nhất 1 câu hỏi để xuất bản.');
      }
    }

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: microContentId },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    return {
      id: updated.micro_content_id,
      status: updated.status,
    };
  }

  /**
   * Lưu toàn bộ danh sách câu hỏi trong một transaction.
   * Bắt buộc kiểm tra và chuẩn hoá từng câu qua `normalizeAnswerKey`.
   */
  async saveQuestions(
    claims: BffClaims,
    input: { microContentId: string; questions: QuestionInput[] },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    // 1. Kiểm tra và chuẩn hoá từng câu hỏi trước khi mở transaction
    const normalizedList = input.questions.map((q, idx) => {
      const position = q.position ?? idx + 1;
      const questionText = q.question?.trim();
      if (!questionText) {
        throw new BadRequestException(`Câu hỏi ở vị trí ${position} không được để trống nội dung.`);
      }
      if (!isQuestionType(q.type)) {
        throw new BadRequestException(`Kiểu câu hỏi '${q.type}' không hợp lệ.`);
      }

      const normalized = normalizeAnswerKey(q.type, questionText, {
        options: q.options,
        correct_answer: q.correctAnswer,
      });

      return {
        id: q.id,
        position,
        type: q.type,
        question: questionText,
        options: normalized.options as any,
        correctAnswer: normalized.correct_answer as any,
        explanation: q.explanation?.trim() || null,
      };
    });

    // 2. Ghi đè câu hỏi trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Đánh dấu deleted_at cho các câu hỏi cũ không còn trong danh sách hoặc xoá mềm toàn bộ
      await tx.micro_content_questions.updateMany({
        where: {
          micro_content_id: input.microContentId,
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      // Tạo mới toàn bộ danh sách đã chuẩn hoá
      for (const q of normalizedList) {
        await tx.micro_content_questions.create({
          data: {
            micro_content_id: input.microContentId,
            position: q.position,
            type: q.type,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
          },
        });
      }

      await tx.micro_contents.update({
        where: { micro_content_id: input.microContentId },
        data: { updated_at: new Date() },
      });
    });

    return {
      success: true,
      savedCount: normalizedList.length,
    };
  }

  // Placeholder methods for upcoming milestones (M2-M5)
  async createUpload(claims: BffClaims, _body: { microContentId: string; filename: string }) {
    return { uploadUrl: '', objectKey: '' };
  }

  async confirmUpload(claims: BffClaims, _body: { microContentId: string }) {
    return { success: true };
  }

  async getVideoUrl(claims: BffClaims, _body: { microContentId: string }) {
    return { url: '' };
  }

  async requestOutline(
    claims: BffClaims,
    input: { courseId: string; documentId: string },
  ) {
    await this.authz.assertCourseAccess(claims, input.courseId, ['instructor', 'ta', 'admin']);

    if (!input.documentId || !UUID_RE.test(input.documentId)) {
      throw new BadRequestException('documentId không hợp lệ.');
    }

    const doc = await this.prisma.documents.findFirst({
      where: {
        document_id: input.documentId,
        course_id: input.courseId,
        deleted_at: null,
      },
      select: {
        document_id: true,
        title: true,
        role: true,
        chapter_code: true,
      },
    });
    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu nguồn.');
    }
    if (doc.role !== 'lecture') {
      throw new BadRequestException('Chỉ đề xuất nội dung từ bộ slide bài giảng (role = lecture).');
    }

    if (this.prisma.chunks?.count) {
      const chunkCount = await this.prisma.chunks.count({
        where: { document_id: doc.document_id, deleted_at: null },
      });
      if (chunkCount === 0) {
        throw new BadRequestException('Bộ slide chưa được lập chỉ mục nội dung.');
      }
    }

    // Tránh gửi trùng lệnh khi bộ slide này đang có yêu cầu tách nội dung chạy.
    if (this.prisma.content_generation_requests?.findMany) {
      const activeRequests = await this.prisma.content_generation_requests.findMany({
        where: {
          course_id: input.courseId,
          type: 'micro_outline',
          status: { in: ['QUEUED', 'PROCESSING'] },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });
      const existing = activeRequests.find((req) => {
        const s = req.scope as Record<string, unknown> | null;
        return Boolean(
          s && (s.document_id === doc.document_id || s.documentId === doc.document_id),
        );
      });
      if (existing) {
        return {
          requestId: existing.request_id,
          status: existing.status,
          deduplicated: true,
        };
      }
    }

    const actorId = UUID_RE.test(claims.sub) ? claims.sub : null;
    const scope: Record<string, unknown> = {
      document_id: doc.document_id,
      document_title: doc.title,
      ...(doc.chapter_code ? { chapter_code: doc.chapter_code } : {}),
    };

    const created = await this.prisma.$transaction(async (tx) => {
      const req = await tx.content_generation_requests.create({
        data: {
          course_id: input.courseId,
          requested_by: actorId,
          type: 'micro_outline',
          scope: scope as Prisma.InputJsonValue,
          status: 'QUEUED',
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: 'CONTENT_GENERATION_REQUESTED',
          aggregate_type: 'content_generation_request',
          aggregate_id: req.request_id,
          payload: {
            request_id: req.request_id,
            course_id: input.courseId,
            type: 'micro_outline',
            scope: scope as Prisma.InputJsonValue,
          },
        },
      });

      return req;
    });

    return {
      requestId: created.request_id,
      status: created.status,
      deduplicated: false,
    };
  }

  async requestScript(
    claims: BffClaims,
    input: { microContentId: string; prompt?: string; options?: any },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
      include: {
        learning_outcome: {
          select: {
            lo_id: true,
            code: true,
            statement_vi: true,
            statement_en: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    if (!item.source_document_id) {
      throw new BadRequestException(
        'Micro content chưa gắn bộ slide nguồn. Hãy chọn bộ slide và dải trang trước khi sinh kịch bản.',
      );
    }

    const pageFrom = item.source_page_from ?? 1;
    const pageTo = Math.max(pageFrom, item.source_page_to ?? pageFrom);
    const promptText = input.prompt?.trim() || item.ai_prompt || item.title;
    const voice =
      input.options &&
      typeof input.options.voice === 'string' &&
      input.options.voice.trim()
        ? input.options.voice.trim()
        : DEFAULT_VOICE;

    let neighborTopics: string[] = [];
    if (this.prisma.micro_contents.findMany) {
      const siblings = await this.prisma.micro_contents.findMany({
        where: {
          course_id: item.course_id,
          source_document_id: item.source_document_id,
          deleted_at: null,
          micro_content_id: { not: item.micro_content_id },
        },
        select: { title: true },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
        take: 8,
      });
      neighborTopics = siblings
        .map((s) => s.title?.trim())
        .filter((t): t is string => Boolean(t));
    }

    const scope: Record<string, unknown> = {
      micro_content_id: item.micro_content_id,
      document_id: item.source_document_id,
      page_from: pageFrom,
      page_to: pageTo,
      topic_title: item.title,
      ...(item.description ? { topic_summary: item.description } : {}),
      ...(item.learning_outcome?.lo_id || item.lo_id
        ? { lo_id: item.learning_outcome?.lo_id ?? item.lo_id }
        : {}),
      ...(item.learning_outcome?.code ? { lo_code: item.learning_outcome.code } : {}),
      ...(item.learning_outcome?.statement_vi
        ? { lo_statement_vi: item.learning_outcome.statement_vi }
        : {}),
      ...(item.learning_outcome?.statement_en
        ? { lo_statement_en: item.learning_outcome.statement_en }
        : {}),
      voice,
      ...(neighborTopics.length > 0 ? { neighbor_topics: neighborTopics } : {}),
    };

    const actorId = UUID_RE.test(claims.sub) ? claims.sub : null;

    const req = await this.prisma.$transaction(async (tx) => {
      const created = await tx.content_generation_requests.create({
        data: {
          course_id: item.course_id,
          requested_by: actorId,
          type: 'video_script',
          scope: scope as Prisma.InputJsonValue,
          status: 'QUEUED',
        },
      });

      await tx.micro_contents.update({
        where: { micro_content_id: item.micro_content_id },
        data: {
          video_source: 'AI',
          ai_prompt: promptText,
          ai_options:
            input.options !== undefined
              ? ((input.options as Prisma.InputJsonValue) ?? Prisma.DbNull)
              : undefined,
          script_status: 'GENERATING',
          script_request_id: created.request_id,
          updated_at: new Date(),
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: 'CONTENT_GENERATION_REQUESTED',
          aggregate_type: 'content_generation_request',
          aggregate_id: created.request_id,
          payload: {
            request_id: created.request_id,
            course_id: item.course_id,
            type: 'video_script',
            scope: scope as Prisma.InputJsonValue,
          },
        },
      });

      return created;
    });

    return {
      success: true,
      requestId: req.request_id,
      scriptStatus: 'GENERATING',
    };
  }

  async requestQuiz(
    claims: BffClaims,
    input: { microContentId: string; count?: number; questionTypes?: string[] },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
      include: {
        learning_outcome: {
          select: {
            lo_id: true,
            code: true,
            statement_vi: true,
            statement_en: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    if (!item.source_document_id && !item.ai_script) {
      throw new BadRequestException(
        'Cần gắn bộ slide nguồn hoặc có kịch bản trước khi sinh câu hỏi củng cố.',
      );
    }

    const rawCount =
      typeof input.count === 'number' && Number.isFinite(input.count)
        ? Math.trunc(input.count)
        : DEFAULT_MICRO_QUIZ_COUNT;
    const count = Math.max(1, Math.min(6, rawCount));

    const requestedTypes = Array.isArray(input.questionTypes)
      ? input.questionTypes.filter((t): t is string => typeof t === 'string' && isQuestionType(t))
      : [];
    const questionTypes =
      requestedTypes.length > 0 ? requestedTypes : DEFAULT_MICRO_QUIZ_TYPES;

    const scope: Record<string, unknown> = {
      micro_content_id: item.micro_content_id,
      topic_title: item.title,
      count,
      question_types: questionTypes,
      ...(item.source_document_id
        ? {
            document_id: item.source_document_id,
            page_from: item.source_page_from ?? 1,
            page_to: Math.max(
              item.source_page_from ?? 1,
              item.source_page_to ?? item.source_page_from ?? 1,
            ),
          }
        : {}),
      ...(item.learning_outcome?.lo_id || item.lo_id
        ? { lo_id: item.learning_outcome?.lo_id ?? item.lo_id }
        : {}),
      ...(item.learning_outcome?.code ? { lo_code: item.learning_outcome.code } : {}),
      ...(item.learning_outcome?.statement_vi
        ? { lo_statement_vi: item.learning_outcome.statement_vi }
        : {}),
      ...(item.learning_outcome?.statement_en
        ? { lo_statement_en: item.learning_outcome.statement_en }
        : {}),
      ...(item.ai_script ? { script: item.ai_script } : {}),
    };

    const actorId = UUID_RE.test(claims.sub) ? claims.sub : null;

    const req = await this.prisma.$transaction(async (tx) => {
      const created = await tx.content_generation_requests.create({
        data: {
          course_id: item.course_id,
          requested_by: actorId,
          type: 'micro_quiz',
          scope: scope as Prisma.InputJsonValue,
          status: 'QUEUED',
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: 'CONTENT_GENERATION_REQUESTED',
          aggregate_type: 'content_generation_request',
          aggregate_id: created.request_id,
          payload: {
            request_id: created.request_id,
            course_id: item.course_id,
            type: 'micro_quiz',
            scope: scope as Prisma.InputJsonValue,
          },
        },
      });

      return created;
    });

    return {
      success: true,
      requestId: req.request_id,
      status: req.status,
    };
  }

  async saveScript(
    claims: BffClaims,
    input: { microContentId: string; script: any },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    if (!input.script || !Array.isArray(input.script.scenes) || input.script.scenes.length === 0) {
      throw new BadRequestException('Kịch bản phải chứa ít nhất 1 cảnh.');
    }

    if (input.script.scenes.length > 12) {
      throw new BadRequestException('Kịch bản tối đa 12 cảnh.');
    }

    await this.prisma.micro_contents.update({
      where: { micro_content_id: item.micro_content_id },
      data: {
        ai_script: input.script as any,
        script_status: 'READY',
        updated_at: new Date(),
      },
    });

    return { success: true };
  }

  async requestRender(
    claims: BffClaims,
    input: { microContentId: string; allowFlagged?: boolean },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    if (!item.ai_script) {
      throw new BadRequestException('Chưa có kịch bản để render video.');
    }

    const flaggedCount = countFlaggedScenes(item.ai_script);
    if (flaggedCount > 0 && !input.allowFlagged) {
      throw new BadRequestException(
        `Kịch bản còn ${flaggedCount} cảnh chưa kiểm chứng được nguồn. Vui lòng kiểm tra/sửa lại hoặc xác nhận vẫn dựng video.`,
      );
    }

    // Mỗi lần bấm render là một lần render mới: kết quả của worker mang lại id
    // này, MicroContentVideoResultHandler bỏ kết quả của lần render cũ hơn.
    const renderId = randomUUID();

    await this.prisma.$transaction(async (tx) => {
      let assetId = item.video_asset_id;
      if (assetId) {
        const existing = await tx.video_assets.findUnique({
          where: { asset_id: assetId },
        });
        if (existing && existing.source_type === 'AI_STUDIO') {
          await tx.video_assets.update({
            where: { asset_id: assetId },
            data: {
              title: item.title,
              status: 'PROCESSING',
              error_message: null,
              vtt_subtitles_key: null,
              transcript_text: null,
              transcript_status: 'PENDING',
              scene_timeline: Prisma.DbNull,
              ai_prompt: item.ai_prompt,
              ai_script: item.ai_script as any,
              ai_render_id: renderId,
              updated_at: new Date(),
            },
          });
        } else {
          assetId = null;
        }
      }

      if (!assetId) {
        const createdAsset = await tx.video_assets.create({
          data: {
            title: item.title,
            description: item.description,
            course_id: item.course_id,
            owner_id: claims.sub,
            visibility: 'COURSE',
            source_type: 'AI_STUDIO',
            status: 'PROCESSING',
            transcript_status: 'PENDING',
            ai_prompt: item.ai_prompt,
            ai_script: item.ai_script as any,
            ai_render_id: renderId,
            usage_count: 1,
          },
        });
        assetId = createdAsset.asset_id;
      }

      await tx.micro_contents.update({
        where: { micro_content_id: item.micro_content_id },
        data: {
          video_asset_id: assetId,
          video_source: 'AI',
          video_status: 'PROCESSING',
          video_error: null,
          updated_at: new Date(),
        },
      });

      // Lệnh mang id chuẩn từ DB (chữ thường, có gạch), không phải chuỗi client gửi:
      // Postgres vẫn nhận uuid viết hoa hay bỏ gạch/ngoặc nên findFirst ở trên không
      // bắt được, còn worker kiểm uuid dạng chuẩn và từ chối lệnh.
      await tx.outbox_events.create({
        data: {
          event_type: 'MICRO_CONTENT_RENDER_REQUESTED',
          aggregate_type: 'micro_content',
          aggregate_id: item.micro_content_id,
          payload: {
            micro_content_id: item.micro_content_id,
            course_id: item.course_id,
            asset_id: assetId,
            render_id: renderId,
            script: item.ai_script,
          },
        },
      });
    });

    return {
      success: true,
      videoStatus: 'PROCESSING',
    };
  }

  async reportProgress(claims: BffClaims, _body: unknown) {
    return { watchedPercent: 0, unlocked: false };
  }

  async submit(claims: BffClaims, _body: unknown) {
    return { attemptId: '', score: 0, passed: false };
  }

  async getResult(claims: BffClaims, _body: { attemptId: string }) {
    return { attemptId: '', score: 0, passed: false };
  }

  async listAttempts(claims: BffClaims, _body: { microContentId: string }) {
    return { attempts: [] };
  }
}
