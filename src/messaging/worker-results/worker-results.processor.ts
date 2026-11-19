import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { errorMessage } from '../../common/utils/errors';
import { isPlainObject } from '../../common/utils/type-guards';
import { WORKER_RESULTS_QUEUE } from '../queues';
import { isWorkerResultKind } from './worker-results.constants';
import {
  parseWorkerResultEnvelope,
  type WorkerResultEnvelope,
} from './worker-result-envelope';
import { WorkerResultHandlerRegistry } from './worker-result-handler.registry';
import type {
  WorkerResultContext,
  WorkerResultHandler,
} from './worker-result-handler';

/**
 * Lần chạy này của job có phải lần cuối không, tức BullMQ sẽ không thử lại sau
 * khi nó lỗi. Khớp Job.shouldRetryJob của BullMQ 5: thử lại khi
 * `attemptsMade + 1 < opts.attempts` và lỗi không phải UnrecoverableError (và
 * job chưa `discard()`, mà processor này không dùng). Trong `process()`,
 * `attemptsMade` là số lần đã lỗi TRƯỚC lần này (BullMQ chỉ tăng nó khi chuyển
 * job sang failed/delayed). `attempts` không đặt thì mặc định 1: lỗi lần đầu
 * là dừng.
 */
export function isFinalFailure(job: Job, error: unknown): boolean {
  return (
    error instanceof UnrecoverableError ||
    (error instanceof Error && error.name === 'UnrecoverableError') ||
    job.attemptsMade + 1 >= (job.opts?.attempts ?? 1)
  );
}

/**
 * Envelope sai dạng (vd thiếu occurred_at) thì không qua được
 * parseWorkerResultEnvelope, nhưng nếu còn đọc ra kind khớp tên job và payload
 * là object thì handler của kind vẫn gỡ được dòng đang chờ. Chỉ dùng cho hook
 * onFinalFailure, nơi payload vốn được coi là chưa kiểm: không bao giờ dùng để
 * áp dụng kết quả.
 */
function salvageEnvelope(job: Job): WorkerResultEnvelope | undefined {
  const data: unknown = job.data;
  if (!isPlainObject(data)) return undefined;
  const { kind, payload } = data;
  if (!isWorkerResultKind(kind) || kind !== job.name) return undefined;
  if (!isPlainObject(payload)) return undefined;
  return {
    result_id:
      typeof data.result_id === 'string'
        ? data.result_id
        : String(job.id ?? ''),
    kind,
    source_event_id:
      typeof data.source_event_id === 'string' ? data.source_event_id : null,
    occurred_at: typeof data.occurred_at === 'string' ? data.occurred_at : '',
    payload,
  };
}

/**
 * Consumer duy nhất của `worker_results`: kiểm envelope rồi chuyển cho handler
 * của kind (đăng ký bằng @WorkerResultHandler trong module domain).
 *
 * concurrency 1: kết quả nhỏ và ít, áp dụng lần lượt thì hai kết quả cùng một
 * lượt nộp/tài liệu không giành nhau dòng và handler viết đơn giản được. Thứ tự
 * này chỉ trong một process: chạy nhiều bản core-api thì vẫn song song, nên
 * handler phải idempotent và chỉ áp dụng khi dòng còn ở trạng thái chờ.
 *
 * Kết quả thất bại vĩnh viễn: handler có thể khai báo `onFinalFailure` để gỡ
 * dòng đang chờ (xem WorkerResultHandler). Processor gọi nó TRONG process(),
 * trước khi ném lỗi cho BullMQ, chứ không ở sự kiện `failed`: lúc đó job còn
 * active và còn khoá, nên nếu core-api chết giữa chừng thì BullMQ coi job stalled
 * và chạy lại cả job lẫn hook; ở sự kiện `failed` job đã nằm ở failed và hook mất
 * hẳn. Job bị đánh dấu stalled quá số lần cho phép (BullMQ đóng job mà không qua
 * process()) thì không có hook.
 */
@Processor(WORKER_RESULTS_QUEUE, { concurrency: 1 })
export class WorkerResultsProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkerResultsProcessor.name);

  constructor(private readonly handlers: WorkerResultHandlerRegistry) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    // Sai hợp đồng → UnrecoverableError: không retry, job nằm lại ở failed.
    let envelope: WorkerResultEnvelope;
    try {
      envelope = parseWorkerResultEnvelope(job.data, job.name);
    } catch (error) {
      const salvaged = salvageEnvelope(job);
      if (salvaged) {
        await this.runFinalFailureHook(job, salvaged, error);
      }
      throw error;
    }
    if (job.id !== undefined && job.id !== envelope.result_id) {
      this.logger.warn(
        `Job ${job.id} có result_id ${envelope.result_id}: producer không đặt jobId = result_id nên BullMQ không chặn trùng`,
      );
    }
    const handler = this.handlers.get(envelope.kind);
    if (!handler) {
      throw new UnrecoverableError(
        `No worker result handler registered for ${envelope.kind} (result ${envelope.result_id})`,
      );
    }
    // Lỗi của handler để nguyên cho BullMQ: lỗi thường thì retry,
    // InvalidWorkerResultError (payload sai) thì dừng.
    try {
      return await handler.handle(envelope, {
        jobId: job.id,
        attemptsMade: job.attemptsMade,
      });
    } catch (error) {
      if (isFinalFailure(job, error)) {
        await this.runFinalFailureHook(job, envelope, error, handler);
      }
      throw error;
    }
  }

  /**
   * Best-effort: hook ném lỗi hay không có thì chỉ ghi log, lỗi gốc của job vẫn
   * được ném lại cho BullMQ.
   */
  private async runFinalFailureHook(
    job: Job,
    envelope: WorkerResultEnvelope,
    cause: unknown,
    handler: WorkerResultHandler | undefined = this.handlers.get(envelope.kind),
  ) {
    if (typeof handler?.onFinalFailure !== 'function') return;
    const context: WorkerResultContext = {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
    };
    try {
      await handler.onFinalFailure(
        envelope,
        cause instanceof Error ? cause : new Error(String(cause)),
        context,
      );
    } catch (hookError) {
      this.logger.error(
        `Gỡ dòng chờ của kết quả ${envelope.result_id} (${envelope.kind}) lỗi: ${errorMessage(hookError)}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    const final =
      !job ||
      error instanceof UnrecoverableError ||
      job.attemptsMade >= (job.opts.attempts ?? 1);
    this.logger.error(
      `Kết quả worker ${job?.id ?? 'unknown'} (${job?.name ?? '?'}) lỗi lần ${job?.attemptsMade ?? '?'}` +
        `${final ? ', dừng: job nằm lại ở failed' : ', sẽ thử lại'}: ${error.message}`,
    );
  }
}
