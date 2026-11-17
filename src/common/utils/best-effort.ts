import type { Logger } from '@nestjs/common';
import { errorMessage } from './errors';

/**
 * Chạy phần việc của hook `onFinalFailure` và nuốt mọi lỗi (chỉ ghi log): hook là
 * best-effort và không được che lỗi gốc của job (xem WorkerResultHandler).
 * Processor cũng bắt lỗi của hook, nhưng từng hook tự bắt để hợp đồng "không bao
 * giờ ném" đúng cả khi gọi hook ngoài processor.
 */
export async function runBestEffort(
  logger: Logger,
  what: string,
  work: () => Promise<void>,
): Promise<void> {
  try {
    await work();
  } catch (error) {
    logger.error(`${what}: ${errorMessage(error)}`);
  }
}
