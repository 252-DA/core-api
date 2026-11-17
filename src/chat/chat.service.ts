import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { STAFF_ROLES } from '../common/constants/course-roles';
import { PrismaService } from '../infra/prisma/prisma.service';

/**
 * Ba chế độ truy xuất của chatbot (docs/chatbot-ba-che-do-ke-hoach.md):
 *   vector  một lần tìm vector rồi trả lời
 *   tools   mô hình tự gọi công cụ nhiều bước
 *   graph   như tools, thêm công cụ tra quan hệ giữa các ý
 */
export const CHAT_MODES = ['vector', 'tools', 'graph'] as const;
export type ChatMode = (typeof CHAT_MODES)[number];
export const DEFAULT_CHAT_MODE: ChatMode = 'vector';
const MODE_KEY = 'retrieval_mode';
const RECENT_RUNS = 20;
const ANSWER_PREVIEW_CHARS = 600;
const MAX_TEXT_CHARS = 20_000;
const MAX_CONVERSATIONS = 30;
const MAX_CONVERSATION_TURNS = 100;
/** TutorRequest.history ở ai-tutor nhận tối đa 10 tin nhắn; giữ 3 cặp (6 tin nhắn) như BFF. */
const MAX_HISTORY_RUNS = 3;
const TITLE_CHARS = 80;
const MAX_CATALOG_HEADINGS = 30;

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && (CHAT_MODES as readonly string[]).includes(value);
}

/** review_audit_logs.entity_id là UUID: lấy UUID cố định (kiểu v5) theo tên cài đặt. */
export function settingEntityId(key: string) {
  const bytes = createHash('sha1').update(`chat_setting:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const asInt = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
const asText = (value: unknown, max = MAX_TEXT_CHARS): string | null =>
  typeof value === 'string' && value.length ? value.slice(0, max) : null;
const asJsonArray = (value: unknown): Prisma.InputJsonValue =>
  (Array.isArray(value) ? value : []) as Prisma.InputJsonValue;

function conversationTitle(question: string): string {
  const clean = question.replace(/\s+/g, ' ').trim();
  return clean.length > TITLE_CHARS ? `${clean.slice(0, TITLE_CHARS)}…` : clean || 'Cuộc trò chuyện';
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  /** Chế độ đang bật. BFF đọc để truyền cho tutor; ai đã đăng nhập cũng đọc được. */
  async getSettings(_claims: BffClaims) {
    const row = await this.prisma.chat_settings.findUnique({
      where: { key: MODE_KEY },
      include: { lms_user_mappings: { select: { display_name: true } } },
    });
    return {
      mode: isChatMode(row?.value) ? row.value : DEFAULT_CHAT_MODE,
      modes: CHAT_MODES,
      updated_at: row?.updated_at ?? null,
      updated_by: row?.lms_user_mappings.display_name ?? null,
    };
  }

  async setMode(claims: BffClaims, body: { mode?: unknown }) {
    await this.authz.assertPlatformAdmin(claims);
    if (!isChatMode(body.mode)) {
      throw new BadRequestException(`Chế độ không hợp lệ: ${String(body.mode ?? '(trống)')}`);
    }
    const mode = body.mode;
    await this.prisma.$transaction(async (tx) => {
      const before = await tx.chat_settings.findUnique({ where: { key: MODE_KEY } });
      const from = before?.value ?? null;
      if (from === mode) return;
      await tx.chat_settings.upsert({
        where: { key: MODE_KEY },
        create: { key: MODE_KEY, value: mode, updated_by: claims.sub },
        update: { value: mode, updated_by: claims.sub, updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'SET_CHAT_MODE',
          entity_type: 'chat_setting',
          entity_id: settingEntityId(MODE_KEY),
          performed_by: claims.sub,
          raw_changes: { from, to: mode },
        },
      });
    });
    return this.getSettings(claims);
  }

  private async assertOwnConversation(claims: BffClaims, courseId: string, conversationId: string) {
    const conv = await this.prisma.chat_conversations.findUnique({
      where: { conversation_id: conversationId },
      select: {
        conversation_id: true,
        course_id: true,
        user_id: true,
        title: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });
    if (!conv || conv.deleted_at !== null) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }
    if (conv.user_id !== claims.sub || conv.course_id !== courseId) {
      throw new ForbiddenException('Không có quyền truy cập cuộc trò chuyện này.');
    }
    return conv;
  }

  /** BFF ghi một dòng sau mỗi lượt hỏi đáp (kể cả lượt lỗi), để so sánh ba chế độ bằng số đo. */
  async recordRun(claims: BffClaims, body: Record<string, unknown>) {
    const courseId = asText(body.courseId, 64);
    if (!courseId) throw new BadRequestException('Thiếu courseId.');
    await this.authz.assertCourseAccess(claims, courseId);
    if (!isChatMode(body.mode)) throw new BadRequestException('Chế độ không hợp lệ.');
    const question = asText(body.question);
    if (!question) throw new BadRequestException('Thiếu câu hỏi.');

    let conversationId = asText(body.conversationId, 64);
    if (conversationId) {
      await this.assertOwnConversation(claims, courseId, conversationId);
      await this.prisma.chat_conversations.update({
        where: { conversation_id: conversationId },
        data: { updated_at: new Date() },
      });
    } else {
      const created = await this.prisma.chat_conversations.create({
        data: {
          course_id: courseId,
          user_id: claims.sub,
          title: conversationTitle(question),
        },
        select: { conversation_id: true },
      });
      conversationId = created.conversation_id;
    }

    const run = await this.prisma.chat_runs.create({
      data: {
        conversation_id: conversationId,
        course_id: courseId,
        user_id: claims.sub,
        mode: body.mode,
        source: 'web',
        question,
        answer: asText(body.answer),
        citations: asJsonArray(body.citations),
        tool_calls: asJsonArray(body.toolCalls),
        model: asText(body.model, 100),
        steps: asInt(body.steps) ?? 0,
        input_tokens: asInt(body.inputTokens),
        output_tokens: asInt(body.outputTokens),
        latency_ms: asInt(body.latencyMs),
        status: body.status === 'ERROR' ? 'ERROR' : 'OK',
        error: asText(body.error, 2000),
      },
      select: { run_id: true },
    });
    return { run_id: run.run_id, conversation_id: conversationId };
  }

  /** Danh sách hội thoại gần nhất của chính người học trong một khóa học. */
  async listConversations(claims: BffClaims, body: { courseId?: unknown }) {
    const courseId = asText(body.courseId, 64);
    if (!courseId) throw new BadRequestException('Thiếu courseId.');
    await this.authz.assertCourseAccess(claims, courseId);

    const conversations = await this.prisma.chat_conversations.findMany({
      where: { course_id: courseId, user_id: claims.sub, deleted_at: null },
      orderBy: { updated_at: 'desc' },
      take: MAX_CONVERSATIONS,
      select: {
        conversation_id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
    });
    return { conversations };
  }

  /**
   * Đọc một hội thoại cụ thể (nếu truyền conversationId) hoặc hội thoại gần nhất
   * của chính người học trong khóa học, kèm lịch sử tối đa 3 cặp hỏi/đáp gần nhất.
   */
  async getConversation(
    claims: BffClaims,
    body: { courseId?: unknown; conversationId?: unknown },
  ) {
    const courseId = asText(body.courseId, 64);
    if (!courseId) throw new BadRequestException('Thiếu courseId.');
    await this.authz.assertCourseAccess(claims, courseId);

    const requestedId = asText(body.conversationId, 64);
    const conv = requestedId
      ? await this.assertOwnConversation(claims, courseId, requestedId)
      : await this.prisma.chat_conversations.findFirst({
          where: { course_id: courseId, user_id: claims.sub, deleted_at: null },
          orderBy: { updated_at: 'desc' },
          select: {
            conversation_id: true,
            course_id: true,
            user_id: true,
            title: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        });

    if (!conv) {
      return { conversation: null, turns: [], history: [] };
    }

    const runs = await this.prisma.chat_runs.findMany({
      where: {
        conversation_id: conv.conversation_id,
        user_id: claims.sub,
        course_id: courseId,
      },
      orderBy: { created_at: 'asc' },
      take: MAX_CONVERSATION_TURNS,
      select: {
        run_id: true,
        created_at: true,
        mode: true,
        question: true,
        answer: true,
        citations: true,
        tool_calls: true,
        steps: true,
        latency_ms: true,
        status: true,
        error: true,
        rating: true,
      },
    });

    const history = runs
      .filter((r) => r.status === 'OK' && typeof r.answer === 'string' && r.answer.trim().length > 0)
      .slice(-MAX_HISTORY_RUNS)
      .flatMap((r) => [
        { role: 'user' as const, content: r.question },
        { role: 'assistant' as const, content: r.answer as string },
      ]);

    return {
      conversation: {
        conversation_id: conv.conversation_id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      },
      turns: runs,
      history,
    };
  }

  /** Xóa mềm hội thoại của chính người học; giữ nguyên các dòng chat_runs cho thống kê. */
  async deleteConversation(
    claims: BffClaims,
    body: { courseId?: unknown; conversationId?: unknown },
  ) {
    const courseId = asText(body.courseId, 64);
    if (!courseId) throw new BadRequestException('Thiếu courseId.');
    const conversationId = asText(body.conversationId, 64);
    if (!conversationId) throw new BadRequestException('Thiếu conversationId.');
    await this.authz.assertCourseAccess(claims, courseId);
    await this.assertOwnConversation(claims, courseId, conversationId);

    await this.prisma.chat_conversations.update({
      where: { conversation_id: conversationId },
      data: { deleted_at: new Date() },
    });
    return { conversation_id: conversationId, deleted: true };
  }

  /**
   * Phạm vi tài liệu của trợ giảng AI trong một khóa: tài liệu đã có chunk và tiêu
   * đề mục theo thứ tự đọc, để màn hình chat gợi ý câu hỏi trả lời được từ tài liệu.
   * Thành viên nào của khóa cũng đọc được: tên tài liệu vốn đã hiện trong trích dẫn.
   * Tài liệu bị ẩn trên LMS (lms_published = false) không được liệt kê.
   */
  async catalog(claims: BffClaims, body: { courseId?: unknown }) {
    const courseId = asText(body.courseId, 64);
    if (!courseId) throw new BadRequestException('Thiếu courseId.');
    await this.authz.assertCourseAccess(claims, courseId);

    const documents = await this.prisma.documents.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
        OR: [{ lms_published: null }, { lms_published: true }],
      },
      orderBy: { created_at: 'asc' },
      select: { document_id: true, title: true, mime_type: true },
    });
    const ids = documents.map((d) => d.document_id);
    const chunks = ids.length
      ? await this.prisma.chunks.findMany({
          where: { document_id: { in: ids }, deleted_at: null },
          orderBy: [{ document_id: 'asc' }, { sort_order: 'asc' }],
          select: { document_id: true, heading_path: true },
        })
      : [];

    const headings = new Map<string, string[]>();
    for (const chunk of chunks) {
      const list = headings.get(chunk.document_id) ?? [];
      const title = chunk.heading_path[chunk.heading_path.length - 1]?.trim();
      if (title && !list.includes(title) && list.length < MAX_CATALOG_HEADINGS) list.push(title);
      headings.set(chunk.document_id, list);
    }
    return {
      documents: documents
        .filter((d) => headings.has(d.document_id))
        .map((d) => ({ ...d, headings: headings.get(d.document_id) ?? [] })),
    };
  }

  /** Người dùng chấm 👍 (1) / 👎 (-1) cho câu trả lời của chính mình; 0 để bỏ chấm. */
  async rateRun(claims: BffClaims, body: { runId?: unknown; rating?: unknown }) {
    const rating = Number(body.rating);
    if (![-1, 0, 1].includes(rating)) throw new BadRequestException('rating phải là -1, 0 hoặc 1.');
    const runId = typeof body.runId === 'string' ? body.runId : '';
    const run = await this.prisma.chat_runs.findUnique({
      where: { run_id: runId },
      select: { user_id: true },
    });
    if (!run) throw new NotFoundException('Không tìm thấy lượt hỏi đáp.');
    if (run.user_id !== claims.sub) throw new ForbiddenException('Chỉ người hỏi được chấm câu trả lời.');
    await this.prisma.chat_runs.update({
      where: { run_id: runId },
      data: { rating: rating === 0 ? null : rating },
    });
    return { run_id: runId, rating: rating === 0 ? null : rating };
  }

  /**
   * Số liệu cho trang admin: chế độ hiện tại, thống kê theo chế độ, các lượt gần
   * nhất, và tình trạng đồ thị quan hệ của khóa học. Giảng viên/TA xem được của
   * khóa mình; admin xem được tất cả khi không chỉ định khóa học.
   */
  async stats(claims: BffClaims, body: { courseId?: unknown; source?: unknown }) {
    const courseId = asText(body.courseId, 64);
    if (courseId) {
      await this.authz.assertCourseAccess(claims, courseId, STAFF_ROLES);
    } else {
      await this.authz.assertPlatformAdmin(claims);
    }
    const source = body.source === 'eval' || body.source === 'web' ? body.source : undefined;
    const where: Prisma.chat_runsWhereInput = {
      ...(courseId ? { course_id: courseId } : {}),
      ...(source ? { source } : {}),
    };

    const [settings, byMode, byStatus, byRating, recent, graph] = await Promise.all([
      this.getSettings(claims),
      this.prisma.chat_runs.groupBy({
        by: ['mode'],
        where,
        _count: { _all: true },
        _avg: { latency_ms: true, steps: true, input_tokens: true, output_tokens: true },
      }),
      this.prisma.chat_runs.groupBy({ by: ['mode', 'status'], where, _count: { _all: true } }),
      this.prisma.chat_runs.groupBy({
        by: ['mode', 'rating'],
        where: { ...where, rating: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.chat_runs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: RECENT_RUNS,
        select: {
          run_id: true, created_at: true, mode: true, source: true, question_type: true,
          question: true, answer: true, citations: true, tool_calls: true, model: true,
          steps: true, latency_ms: true, status: true, error: true, rating: true,
        },
      }),
      courseId ? this.graphStatus(courseId) : Promise.resolve(null),
    ]);

    const count = (rows: { mode: string; _count: { _all: number } }[], mode: string) =>
      rows.filter((r) => r.mode === mode).reduce((sum, r) => sum + r._count._all, 0);
    const modes = CHAT_MODES.map((mode) => {
      const row = byMode.find((r) => r.mode === mode);
      const errors = count(byStatus.filter((r) => r.status === 'ERROR'), mode);
      const up = count(byRating.filter((r) => r.rating === 1), mode);
      const down = count(byRating.filter((r) => r.rating === -1), mode);
      const round = (n: number | null | undefined) => (n == null ? null : Math.round(n));
      return {
        mode,
        runs: row?._count._all ?? 0,
        errors,
        avg_latency_ms: round(row?._avg.latency_ms),
        avg_steps: row?._avg.steps == null ? null : Math.round(row._avg.steps * 10) / 10,
        avg_input_tokens: round(row?._avg.input_tokens),
        avg_output_tokens: round(row?._avg.output_tokens),
        rated_up: up,
        rated_down: down,
      };
    });

    return {
      settings,
      modes,
      recent: recent.map((r) => ({
        ...r,
        answer: r.answer && r.answer.length > ANSWER_PREVIEW_CHARS
          ? `${r.answer.slice(0, ANSWER_PREVIEW_CHARS)}…`
          : r.answer,
      })),
      graph,
    };
  }

  /** Số quan hệ theo tài liệu và các yêu cầu dựng gần đây của một khóa học. */
  private async graphStatus(courseId: string) {
    const [documents, chapters, relationCounts, requests] = await Promise.all([
      this.prisma.documents.findMany({
        where: { course_id: courseId, deleted_at: null, chunks: { some: { deleted_at: null } } },
        select: { document_id: true, title: true, role: true, chapter_code: true },
        orderBy: [{ chapter_code: 'asc' }, { title: 'asc' }],
      }),
      this.prisma.chapters.findMany({
        where: { course_id: courseId, deleted_at: null },
        select: { chapter_id: true, code: true, title: true },
        orderBy: { sort_order: 'asc' },
      }),
      // Nối chunks để không đếm quan hệ của chunk đã bị xóa mềm khi lập chỉ mục lại.
      this.prisma.$queryRaw<{ document_id: string; n: number }[]>`
        SELECT kr.document_id::text AS document_id, COUNT(*)::int AS n
        FROM knowledge_relations kr
        JOIN chunks c ON c.chunk_id = kr.chunk_id AND c.deleted_at IS NULL
        WHERE kr.course_id = ${courseId}::uuid
        GROUP BY kr.document_id`,
      this.prisma.content_generation_requests.findMany({
        where: { course_id: courseId, type: 'relations' },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { request_id: true, status: true, generated_count: true, last_error: true, created_at: true, scope: true },
      }),
    ]);
    const perDocument = new Map(relationCounts.map((r) => [r.document_id, r.n]));
    return {
      documents: documents.map((d) => ({ ...d, relations: perDocument.get(d.document_id) ?? 0 })),
      chapters,
      total_relations: relationCounts.reduce((sum, r) => sum + r.n, 0),
      requests,
    };
  }
}
