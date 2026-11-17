import { DiscoveryService } from '@nestjs/core';
import type { WorkerResultEnvelope } from './worker-result-envelope';
import type { WorkerResultKind } from './worker-results.constants';

/** Metadata cho DiscoveryService; registry tìm handler qua khoá này. */
export const workerResultHandlerMetadata =
  DiscoveryService.createDecorator<WorkerResultKind>();

/**
 * Đánh dấu provider áp dụng kết quả của một kind. Provider nằm trong module
 * domain sở hữu bảng (khai báo ở `providers` của module đó); processor tự tìm
 * lúc khởi động, thêm luồng không phải sửa processor. Mỗi kind đúng một
 * handler, nếu không app không khởi động.
 *
 *   @WorkerResultHandler('QUIZ_GRADING_RESULT')
 *   export class QuizGradingResultHandler implements WorkerResultHandler<QuizGradingPayload> {
 *     constructor(private readonly prisma: PrismaService) {}
 *     async handle(envelope: WorkerResultEnvelope<QuizGradingPayload>) { ... }
 *   }
 */
export function WorkerResultHandler(kind: WorkerResultKind): ClassDecorator {
  return workerResultHandlerMetadata(kind);
}

export interface WorkerResultContext {
  /** id job BullMQ (= result_id khi producer theo đúng quy ước). */
  jobId: string | undefined;
  /** Số lần đã thất bại trước lần này. */
  attemptsMade: number;
}

/**
 * Hợp đồng của handler:
 * - kiểm `payload` trước khi dùng; sai dạng → ném InvalidWorkerResultError
 *   (không retry);
 * - idempotent: chỉ áp dụng khi dòng còn ở trạng thái chờ, không bao giờ ghi
 *   đè trạng thái kết thúc — cùng một kết quả có thể tới hai lần;
 * - lỗi tạm thời (DB, mạng) cứ ném ra: BullMQ retry theo tuỳ chọn của job;
 * - `onFinalFailure` (tuỳ chọn): gỡ dòng đang chờ kết quả này khi kết quả
 *   không bao giờ áp dụng được nữa.
 * Giá trị trả về được BullMQ lưu làm returnvalue của job (nên nhỏ).
 */
export interface WorkerResultHandler<
  P extends object = Record<string, unknown>,
> {
  handle(
    envelope: WorkerResultEnvelope<P>,
    context: WorkerResultContext,
  ): Promise<unknown>;

  /**
   * Processor gọi khi kết quả thất bại VĨNH VIỄN — handler/envelope ném
   * UnrecoverableError (kể cả InvalidWorkerResultError), hoặc lỗi thường ở lần
   * thử cuối của job — ngay trước khi ném lỗi cho BullMQ. Không có hook này thì
   * dòng nghiệp vụ đang chờ kết quả (câu PENDING, request QUEUED, tài liệu đang
   * xử lý...) kẹt ở trạng thái chờ mãi vì không còn kết quả nào tới và UI không
   * có nút gỡ.
   *
   * Hợp đồng của hook:
   * - best-effort: không bao giờ được ném lỗi (processor vẫn bắt và chỉ ghi
   *   log, để không che lỗi gốc của job);
   * - `envelope.payload` chưa được kiểm, có thể là rác hay thiếu trường (chính
   *   vì sai dạng mà job thất bại): tự đọc từng trường cần dùng, kiểm uuid,
   *   đối chiếu dòng trong DB; không đủ để xác định đúng dòng thì không làm gì;
   * - chỉ chạm dòng còn ở trạng thái chờ (UPDATE có điều kiện), không bao giờ
   *   ghi đè trạng thái kết thúc;
   * - idempotent: có thể chạy lại (core-api chết giữa chừng thì BullMQ chạy lại
   *   job và hook).
   */
  onFinalFailure?(
    envelope: WorkerResultEnvelope<P>,
    error: Error,
    context: WorkerResultContext,
  ): Promise<void>;
}

/**
 * Stub của đợt 0. Lỗi thường (có retry) chứ không phải UnrecoverableError: job
 * nằm lại trong Redis, và nếu handler thật lên kịp trong lúc còn retry thì kết
 * quả vẫn được áp dụng.
 */
export class WorkerResultNotImplementedError extends Error {
  constructor(kind: WorkerResultKind) {
    super(`${kind}: worker result handler is not implemented yet`);
    this.name = 'WorkerResultNotImplementedError';
  }
}
