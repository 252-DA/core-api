import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { STAFF_ROLES } from '../../common/constants/course-roles';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuthzService } from '../../auth/authz.service';
import type { BffClaims } from '../../auth/bff-claims';
import { CONTENT_GENERATION_REQUESTED } from '../../messaging/event-types';
import { isQuestionType } from '../question/question-types';

const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 100;
const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
];
const MAX_SOURCE_DOCUMENTS = 30;
const MAX_QUESTIONS_PER_REQUEST = 20;
const MAX_BATCH_SCOPES = 60;

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async listRequests(
    claims: BffClaims,
    courseId: string,
    limit?: number | string,
    type?: string,
  ) {
    await this.authz.assertCourseAccess(claims, courseId, STAFF_ROLES);

    if (
      type !== undefined &&
      ![
        'card',
        'quiz',
        'relations',
        'micro_outline',
        'video_script',
        'micro_quiz',
      ].includes(type)
    ) {
      throw new BadRequestException(
        'type must be one of: card, quiz, relations, micro_outline, video_script, micro_quiz',
      );
    }

    const parsedLimit =
      typeof limit === 'number' ? limit : Number.parseInt(limit ?? '', 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(MAX_RECENT_LIMIT, Math.max(1, Math.trunc(parsedLimit)))
      : DEFAULT_RECENT_LIMIT;

    return this.prisma.content_generation_requests.findMany({
      where: {
        course_id: courseId,
        ...(type ? { type } : {}),
      },
      orderBy: { created_at: 'desc' },
      take,
    });
  }

  async createRequest(
    claims: BffClaims,
    body: {
      courseId: string;
      type: 'card' | 'quiz' | 'relations';
      scope?: Record<string, unknown>;
      scopes?: Array<Record<string, unknown>>;
    },
  ) {
    await this.authz.assertCourseAccess(claims, body.courseId, STAFF_ROLES);

    if (Array.isArray(body.scopes)) {
      if (!body.scopes.length || body.scopes.length > MAX_BATCH_SCOPES) {
        throw new BadRequestException(
          `Mỗi đợt chỉ tạo từ 1 đến ${MAX_BATCH_SCOPES} yêu cầu.`,
        );
      }
      const normalizedScopes: Array<Record<string, unknown>> = [];
      for (const rawScope of body.scopes) {
        normalizedScopes.push(
          await this.normalizeScope(body.courseId, body.type, rawScope),
        );
      }
      return this.enqueueBatch(claims, {
        courseId: body.courseId,
        type: body.type,
        scopes: normalizedScopes,
      });
    }

    if (!body.scope || typeof body.scope !== 'object') {
      throw new BadRequestException('Thiếu phạm vi yêu cầu.');
    }

    const scope = await this.normalizeScope(
      body.courseId,
      body.type,
      body.scope,
    );
    return this.enqueue(claims, {
      courseId: body.courseId,
      type: body.type,
      scope,
    });
  }

  private async normalizeScope(
    courseId: string,
    type: 'card' | 'quiz' | 'relations',
    rawScope: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (type === 'relations') {
      // Dựng đồ thị quan hệ cho chatbot: không có LO/Bloom, chỉ có tài liệu nguồn.
      return this.relationsScope(courseId, rawScope);
    }

    let scope = { ...rawScope };
    if (type === 'quiz') {
      // Mỗi yêu cầu sinh một kiểu câu; thiếu thì là trắc nghiệm một đáp án như trước.
      const questionType = scope.question_type ?? 'MCQ_SINGLE';
      if (!isQuestionType(questionType))
        throw new BadRequestException('Kiểu câu hỏi không hợp lệ.');
      scope = { ...scope, question_type: questionType };
    }

    if (scope.chapter_id) {
      const chapter = await this.prisma.chapters.findFirst({
        where: {
          chapter_id: String(scope.chapter_id),
          course_id: courseId,
          deleted_at: null,
          chapter_los: { some: { lo_id: String(scope.target_code) } },
        },
      });
      if (!chapter || scope.target_kind !== 'lo')
        throw new BadRequestException('LO không thuộc chương đã chọn.');
      const documents = await this.prisma.documents.findMany({
        where: {
          course_id: courseId,
          chapter_code: chapter.code,
          role: 'lecture',
          deleted_at: null,
          chunks: { some: { deleted_at: null } },
        },
        select: { document_id: true },
      });
      if (!documents.length)
        throw new BadRequestException(
          'Chương chưa có slide đã xử lý. Hãy đồng bộ tài liệu Canvas và gắn đúng chương trước.',
        );
      scope = {
        ...scope,
        source_document_ids: documents.map((d) => d.document_id),
      };
    } else if (scope.source_document_ids !== undefined) {
      scope = await this.explicitSourceScope(courseId, type, scope);
    }

    return scope;
  }

  /** Ghi yêu cầu và sự kiện outbox trong một giao dịch; worker nhận qua hàng đợi content_generation. */
  private async enqueue(
    claims: BffClaims,
    body: {
      courseId: string;
      type: 'card' | 'quiz' | 'relations';
      scope: Record<string, unknown>;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.content_generation_requests.create({
        data: {
          course_id: body.courseId,
          requested_by: claims.sub,
          type: body.type,
          scope: body.scope as Prisma.InputJsonValue,
          status: 'QUEUED',
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: CONTENT_GENERATION_REQUESTED,
          aggregate_type: 'content_generation_request',
          aggregate_id: request.request_id,
          payload: {
            request_id: request.request_id,
            course_id: body.courseId,
            type: body.type,
            scope: body.scope,
          } as Prisma.InputJsonValue,
        },
      });

      return request;
    });
  }

  /** Ghi toàn bộ lô yêu cầu và sự kiện outbox trong một giao dịch nguyên tử duy nhất. */
  private async enqueueBatch(
    claims: BffClaims,
    body: {
      courseId: string;
      type: 'card' | 'quiz' | 'relations';
      scopes: Array<Record<string, unknown>>;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const created = [];
      for (const scope of body.scopes) {
        const request = await tx.content_generation_requests.create({
          data: {
            course_id: body.courseId,
            requested_by: claims.sub,
            type: body.type,
            scope: scope as Prisma.InputJsonValue,
            status: 'QUEUED',
          },
        });

        await tx.outbox_events.create({
          data: {
            event_type: CONTENT_GENERATION_REQUESTED,
            aggregate_type: 'content_generation_request',
            aggregate_id: request.request_id,
            payload: {
              request_id: request.request_id,
              course_id: body.courseId,
              type: body.type,
              scope,
            } as Prisma.InputJsonValue,
          },
        });

        created.push(request);
      }
      return created;
    });
  }

  /**
   * Phạm vi dựng đồ thị quan hệ: một chương (lấy mọi tài liệu đã xử lý của
   * chương) hoặc một danh sách tài liệu. Cả hai đều phải thuộc khóa học và đã
   * có chunk, vì quan hệ được trích từ chunk.
   */
  private async relationsScope(
    courseId: string,
    scope: Record<string, unknown>,
  ) {
    let documentIds: string[];
    let chapterId: string | undefined;
    if (scope.chapter_id) {
      const chapter = await this.prisma.chapters.findFirst({
        where: {
          chapter_id: String(scope.chapter_id),
          course_id: courseId,
          deleted_at: null,
        },
        select: { chapter_id: true, code: true },
      });
      if (!chapter)
        throw new BadRequestException('Chương không thuộc khóa học.');
      chapterId = chapter.chapter_id;
      const documents = await this.prisma.documents.findMany({
        where: {
          course_id: courseId,
          chapter_code: chapter.code,
          deleted_at: null,
          chunks: { some: { deleted_at: null } },
        },
        select: { document_id: true },
      });
      documentIds = documents.map((d) => d.document_id);
      if (!documentIds.length)
        throw new BadRequestException(
          'Chương chưa có tài liệu đã xử lý. Hãy đồng bộ tài liệu và gắn đúng chương trước.',
        );
    } else {
      const raw = scope.source_document_ids;
      const ids = Array.isArray(raw) ? [...new Set(raw)] : [];
      if (!ids.length || !ids.every(isUuid))
        throw new BadRequestException(
          'Chọn một chương hoặc ít nhất một tài liệu.',
        );
      const documents = await this.prisma.documents.findMany({
        where: {
          document_id: { in: ids },
          course_id: courseId,
          deleted_at: null,
          chunks: { some: { deleted_at: null } },
        },
        select: { document_id: true },
      });
      if (documents.length !== ids.length)
        throw new BadRequestException(
          'Có tài liệu chưa xử lý xong hoặc không thuộc khóa học.',
        );
      documentIds = ids as string[];
    }
    if (documentIds.length > MAX_SOURCE_DOCUMENTS)
      throw new BadRequestException(
        `Tối đa ${MAX_SOURCE_DOCUMENTS} tài liệu mỗi lần dựng.`,
      );
    return {
      ...(chapterId ? { chapter_id: chapterId } : {}),
      source_document_ids: documentIds,
    };
  }

  /**
   * Trang Soạn đề: giảng viên tự chọn tài liệu nguồn và từng ô LO × Bloom của
   * ma trận đề. Tài liệu phải thuộc khóa học và đã xử lý; phải có ít nhất một
   * slide bài giảng vì tài liệu tham khảo chỉ làm ngữ cảnh bổ sung.
   */
  private async explicitSourceScope(
    courseId: string,
    type: string,
    scope: Record<string, unknown>,
  ) {
    if (type !== 'quiz' || scope.target_kind !== 'lo')
      throw new BadRequestException(
        'Chọn tài liệu nguồn chỉ áp dụng khi sinh quiz theo LO.',
      );
    const raw = scope.source_document_ids;
    const ids = Array.isArray(raw) ? [...new Set(raw)] : [];
    if (!ids.length || ids.length > MAX_SOURCE_DOCUMENTS || !ids.every(isUuid))
      throw new BadRequestException(
        `Chọn 1–${MAX_SOURCE_DOCUMENTS} tài liệu nguồn.`,
      );
    const count = Number(scope.count);
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > MAX_QUESTIONS_PER_REQUEST
    )
      throw new BadRequestException(
        `Mỗi ô của ma trận đề có 1–${MAX_QUESTIONS_PER_REQUEST} câu.`,
      );
    if (!BLOOM_LEVELS.includes(String(scope.bloom_level)))
      throw new BadRequestException('Mức Bloom không hợp lệ.');
    const lo = await this.prisma.learning_outcomes.findFirst({
      where: {
        lo_id: String(scope.target_code),
        course_id: courseId,
        deleted_at: null,
      },
      select: { lo_id: true },
    });
    if (!lo) throw new BadRequestException('LO không thuộc khóa học.');
    const documents = await this.prisma.documents.findMany({
      where: {
        document_id: { in: ids },
        course_id: courseId,
        deleted_at: null,
        chunks: { some: { deleted_at: null } },
      },
      select: { document_id: true, role: true },
    });
    if (documents.length !== ids.length)
      throw new BadRequestException(
        'Có tài liệu chưa xử lý xong hoặc không thuộc khóa học.',
      );
    if (!documents.some((d) => d.role === 'lecture'))
      throw new BadRequestException(
        'Cần ít nhất một slide bài giảng; tài liệu tham khảo chỉ làm ngữ cảnh bổ sung.',
      );
    return { ...scope, count, source_document_ids: ids };
  }
}
