import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';

const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 100;
const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
const MAX_SOURCE_DOCUMENTS = 30;
const MAX_QUESTIONS_PER_REQUEST = 20;

function uuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
  );
}

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
    await this.authz.assertCourseAccess(claims, courseId, ['instructor', 'ta']);

    if (type !== undefined && type !== 'card' && type !== 'quiz') {
      throw new BadRequestException('type must be one of: card, quiz');
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
      type: 'card' | 'quiz';
      scope: Record<string, unknown>;
    },
  ) {
    await this.authz.assertCourseAccess(claims, body.courseId, [
      'instructor',
      'ta',
    ]);

    if (body.scope.chapter_id) {
      const chapter = await this.prisma.chapters.findFirst({
        where: { chapter_id: String(body.scope.chapter_id), course_id: body.courseId, deleted_at: null,
          chapter_los: { some: { lo_id: String(body.scope.target_code) } } },
      });
      if (!chapter || body.scope.target_kind !== 'lo') throw new BadRequestException('LO không thuộc chương đã chọn.');
      const documents = await this.prisma.documents.findMany({
        where: { course_id: body.courseId, chapter_code: chapter.code, role: 'lecture', deleted_at: null,
          chunks: { some: { deleted_at: null } } },
        select: { document_id: true },
      });
      if (!documents.length) throw new BadRequestException('Chương chưa có slide đã xử lý. Hãy đồng bộ tài liệu Canvas và gắn đúng chương trước.');
      body = { ...body, scope: { ...body.scope, source_document_ids: documents.map((d) => d.document_id) } };
    } else if (body.scope.source_document_ids !== undefined) {
      body = { ...body, scope: await this.explicitSourceScope(body.courseId, body.type, body.scope) };
    }

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
          event_type: 'CONTENT_GENERATION_REQUESTED',
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
      throw new BadRequestException('Chọn tài liệu nguồn chỉ áp dụng khi sinh quiz theo LO.');
    const raw = scope.source_document_ids;
    const ids = Array.isArray(raw) ? [...new Set(raw)] : [];
    if (!ids.length || ids.length > MAX_SOURCE_DOCUMENTS || !ids.every(uuid))
      throw new BadRequestException(`Chọn 1–${MAX_SOURCE_DOCUMENTS} tài liệu nguồn.`);
    const count = Number(scope.count);
    if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS_PER_REQUEST)
      throw new BadRequestException(`Mỗi ô của ma trận đề có 1–${MAX_QUESTIONS_PER_REQUEST} câu.`);
    if (!BLOOM_LEVELS.includes(String(scope.bloom_level)))
      throw new BadRequestException('Mức Bloom không hợp lệ.');
    const lo = await this.prisma.learning_outcomes.findFirst({
      where: { lo_id: String(scope.target_code), course_id: courseId, deleted_at: null },
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
      throw new BadRequestException('Có tài liệu chưa xử lý xong hoặc không thuộc khóa học.');
    if (!documents.some((d) => d.role === 'lecture'))
      throw new BadRequestException(
        'Cần ít nhất một slide bài giảng; tài liệu tham khảo chỉ làm ngữ cảnh bổ sung.',
      );
    return { ...scope, count, source_document_ids: ids };
  }
}
