import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../worker-results/worker-result-handler';
import { runBestEffort } from '../worker-results/best-effort';
import {
  MAX_ERROR_CHARS,
  parseContentGenerationResult,
  type ContentGenerationResult,
  type RejectedDraft,
} from './content-generation-result.payload';
import {
  ensureLessonForLo,
  findCurrentLearningOutcome,
  isPlainObject,
  isUuid,
  upsertGeneratedLessonCards,
  upsertGeneratedQuizItems,
  type UpsertCount,
  type VerificationStatus,
} from './generated-content';
import {
  clipCodePoints,
  isWithinCodePoints,
} from '../worker-results/text-length';

/** Request còn chờ: chỉ những dòng này nhận kết quả. */
const ACTIVE_STATUSES = ['QUEUED', 'RUNNING'];
const MAX_SUMMARY_REASONS = 5;

// Interactive transaction mặc định 5s; DB dev nằm sau Tailscale nên một mẻ 20
// câu (mỗi câu một câu lệnh) có thể vượt. 30s vẫn đủ ngắn để không giữ khoá lâu.
const TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 };

type Outcome = {
  applied: boolean;
  request_id: string;
  status?: string;
  reason?: string;
  written?: number;
  skipped?: number;
};

type LockedRequest = {
  request_id: string;
  course_id: string;
  type: string;
  status: string;
};

/**
 * Áp dụng CONTENT_GENERATION_RESULT (vòng đời một yêu cầu sinh học liệu):
 * content_generation_requests, và với SUCCEEDED thì lessons + quiz_items hoặc
 * lesson_cards. Thay cho việc worker tự ghi (update_content_generation_request,
 * persist_curriculum_quiz_items, persist_curriculum_lesson_cards).
 *
 * Mỗi kết quả một transaction, khoá dòng request trước. Chỉ áp dụng khi
 * request còn QUEUED/RUNNING: kết quả đến muộn cho request đã SUCCEEDED/
 * FAILED/CANCELLED bị bỏ qua, nên nhận cùng kết quả hai lần không đổi gì.
 */
@Injectable()
@WorkerResultHandler('CONTENT_GENERATION_RESULT')
export class ContentGenerationResultHandler implements WorkerResultHandler {
  private readonly logger = new Logger(ContentGenerationResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(envelope: WorkerResultEnvelope): Promise<Outcome> {
    const result = parseContentGenerationResult(
      envelope.payload,
      envelope.result_id,
    );
    const outcome = await this.prisma.$transaction(
      (tx) => this.apply(tx, result),
      TX_OPTIONS,
    );
    if (!outcome.applied) {
      this.logger.log(
        `Bỏ qua ${envelope.result_id} (request ${result.request_id}): ${outcome.reason}`,
      );
    }
    return outcome;
  }

  private async apply(
    tx: Prisma.TransactionClient,
    result: ContentGenerationResult,
  ): Promise<Outcome> {
    const requestId = result.request_id;
    const request = await lockRequest(tx, requestId);
    if (!request) {
      // Lệnh được ghi cùng transaction với request, nên thiếu dòng là đã bị
      // xoá: không còn gì để ghi, retry cũng vậy.
      return {
        applied: false,
        request_id: requestId,
        reason: 'request not found',
      };
    }
    if (result.course_id !== null && result.course_id !== request.course_id) {
      throw new InvalidWorkerResultError(
        `request ${requestId} belongs to course ${request.course_id}, result says ${result.course_id}`,
      );
    }
    if (result.content_type !== null && result.content_type !== request.type) {
      throw new InvalidWorkerResultError(
        `request ${requestId} is type ${request.type}, result says ${result.content_type}`,
      );
    }
    if (!ACTIVE_STATUSES.includes(request.status)) {
      return {
        applied: false,
        request_id: requestId,
        reason: `request already ${request.status}`,
      };
    }

    switch (result.status) {
      case 'RUNNING':
        if (request.status === 'RUNNING') {
          return {
            applied: false,
            request_id: requestId,
            reason: 'request already RUNNING',
          };
        }
        await updateRequest(tx, requestId, {
          status: 'RUNNING',
          last_error: null,
        });
        return { applied: true, request_id: requestId, status: 'RUNNING' };

      case 'FAILED':
        // generated_count giữ nguyên, như COALESCE của câu SQL cũ.
        await updateRequest(tx, requestId, {
          status: 'FAILED',
          last_error: clip(result.error),
        });
        return { applied: true, request_id: requestId, status: 'FAILED' };

      case 'SUCCEEDED':
        return this.applySucceeded(tx, request, result);
    }
  }

  private async applySucceeded(
    tx: Prisma.TransactionClient,
    request: LockedRequest,
    result: Extract<ContentGenerationResult, { status: 'SUCCEEDED' }>,
  ): Promise<Outcome> {
    const requestId = request.request_id;
    if (result.content_type === 'relations') {
      await updateRequest(tx, requestId, {
        status: 'SUCCEEDED',
        generated_count: result.generated_count,
        last_error: null,
      });
      return { applied: true, request_id: requestId, status: 'SUCCEEDED' };
    }

    const lo = await findCurrentLearningOutcome(tx, result.lo_id);
    if (!lo) {
      // SQL cũ: quiz thì lặng lẽ không ghi câu nào mà request vẫn SUCCEEDED,
      // card thì lỗi. Nay cả hai báo FAILED có tên, không ghi gì.
      await updateRequest(tx, requestId, {
        status: 'FAILED',
        last_error: `Learning outcome ${result.lo_id} is missing or not current; generated content was not saved`,
      });
      return {
        applied: true,
        request_id: requestId,
        status: 'FAILED',
        reason: 'learning outcome not current',
      };
    }
    if (lo.course_id !== request.course_id) {
      throw new InvalidWorkerResultError(
        `learning outcome ${lo.lo_id} belongs to course ${lo.course_id}, not ${request.course_id}`,
      );
    }

    const lesson = await ensureLessonForLo(tx, lo);
    let count: UpsertCount;
    let statuses: VerificationStatus[];
    if (result.content_type === 'quiz') {
      count = await upsertGeneratedQuizItems(tx, lesson, result.quiz_items);
      statuses = result.quiz_items.map((i) => i.verification_status);
    } else {
      count = await upsertGeneratedLessonCards(tx, lesson, result.lesson_cards);
      statuses = result.lesson_cards.map((c) => c.verification_status);
    }
    await updateRequest(tx, requestId, {
      status: 'SUCCEEDED',
      generated_count: result.generated_count,
      last_error: null,
      verification_summary: verificationSummary(statuses, result.rejected),
    });
    return {
      applied: true,
      request_id: requestId,
      status: 'SUCCEEDED',
      ...count,
    };
  }

  /**
   * Kết quả không bao giờ áp dụng được nữa — payload sai dạng, lệch course/type/LO
   * với request (InvalidWorkerResultError ném cả trong transaction), hay lỗi DB
   * hết lượt thử: request mà để QUEUED/RUNNING thì FE chặn mọi yêu cầu sinh mới
   * của khoá học, nên đánh dấu FAILED kèm lý do để giảng viên bấm sinh lại. Chạy ở
   * cuối mọi đường thất bại vĩnh viễn nên một nơi lo hết, và chạy SAU khi
   * transaction của handle() đã rollback (lúc đó không còn ghi dở dang nào).
   *
   * Payload chưa kiểm: chỉ đọc request_id hợp lệ; câu UPDATE có điều kiện nên
   * request đã SUCCEEDED/FAILED/CANCELLED không bị đụng.
   */
  async onFinalFailure(envelope: WorkerResultEnvelope, error: Error) {
    const payload = envelope.payload as unknown;
    const requestId = isPlainObject(payload) ? payload.request_id : undefined;
    if (!isUuid(requestId)) return;
    await runBestEffort(
      this.logger,
      `Không đánh dấu FAILED được request ${requestId} sau kết quả ${envelope.result_id}`,
      async () => {
        const reason =
          error instanceof InvalidWorkerResultError
            ? `Invalid worker result: ${error.message}`
            : `Worker result could not be applied: ${error.message}`;
        const { count } = await this.prisma.content_generation_requests.updateMany({
          where: { request_id: requestId, status: { in: ACTIVE_STATUSES } },
          data: {
            status: 'FAILED',
            last_error: clip(reason),
            updated_at: new Date(),
          },
        });
        if (count) {
          this.logger.warn(
            `Request ${requestId} → FAILED vì kết quả ${envelope.result_id} thất bại vĩnh viễn: ${error.message}`,
          );
        }
      },
    );
  }
}

async function lockRequest(
  tx: Prisma.TransactionClient,
  requestId: string,
): Promise<LockedRequest | undefined> {
  // FOR UPDATE: nhiều bản core-api có thể nhận hai kết quả của cùng request
  // cùng lúc; khoá để chúng áp dụng lần lượt trên trạng thái mới nhất.
  const rows = await tx.$queryRaw<LockedRequest[]>`
    SELECT request_id::text AS request_id, course_id::text AS course_id, type, status
      FROM content_generation_requests
     WHERE request_id = ${requestId}::uuid
       FOR UPDATE`;
  return rows[0];
}

function updateRequest(
  tx: Prisma.TransactionClient,
  requestId: string,
  data: {
    status: string;
    last_error: string | null;
    generated_count?: number;
    verification_summary?: Prisma.InputJsonValue;
  },
) {
  return tx.content_generation_requests.update({
    where: { request_id: requestId },
    data: { ...data, updated_at: new Date() },
  });
}

/** Cắt theo code point (không cắt đôi cặp surrogate, Postgres không nhận surrogate lẻ). */
function clip(text: string) {
  return isWithinCodePoints(text, MAX_ERROR_CHARS)
    ? text
    : `${clipCodePoints(text, MAX_ERROR_CHARS - 1)}…`;
}

/**
 * Đếm theo kết luận của judge, kể cả phần tử bị loại (không thành dòng nào).
 * Judge chỉ kiểm bám nguồn; không có đánh giá mức Bloom ở đây.
 */
export function verificationSummary(
  statuses: VerificationStatus[],
  rejected: RejectedDraft[],
): Prisma.InputJsonValue {
  const count = (status: VerificationStatus) =>
    statuses.filter((s) => s === status).length;
  return {
    criterion: 'source_grounding',
    verified: count('VERIFIED'),
    inconclusive: count('INCONCLUSIVE'),
    flagged: count('FLAGGED'),
    unverified: count('UNVERIFIED'),
    rejected: rejected.length,
    rejected_reasons: rejected
      .slice(0, MAX_SUMMARY_REASONS)
      .map((r) => r.reason),
  };
}
