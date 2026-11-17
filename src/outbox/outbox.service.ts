import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { hostname } from 'node:os';
import { errorMessage } from '../common/utils/errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  ANSWER_GRADING_QUEUE,
  ANSWER_GRADING_REQUESTED,
} from '../question/answer-grading';
import {
  ESSAY_GRADING_QUEUE,
  ESSAY_GRADING_REQUESTED,
} from '../essay-processor/essay-grading';
import {
  COURSE_CHUNK_LO_REMAP_REQUESTED,
  DOCUMENT_PROCESSING_QUEUE,
} from '../curriculum/curriculum-events';
import { MICRO_CONTENT_GRADING_REQUESTED } from '../micro-content/micro-content-attempt.service';
import {
  createPgListenClient,
  OutboxListener,
  type ListenClientFactory,
} from './outbox-listener';

/** Trigger `outbox_events_notify_insert` (migration 20261107120000) bắn kênh này. */
export const OUTBOX_CHANNEL = 'outbox_channel';
/** Token tuỳ chọn để test thay client LISTEN; không đăng ký thì dùng pg thật. */
export const OUTBOX_LISTEN_CLIENT_FACTORY = 'OUTBOX_LISTEN_CLIENT_FACTORY';

const CLAIM_BATCH = 10;
/** Dòng PROCESSING giữ khoá quá lâu coi như tiến trình giữ nó đã chết. */
const STALE_LOCK_INTERVAL = '10 minutes';
/** Lần relay lỗi thứ 10 thì DEAD_LETTER; tổng thời gian chờ trước đó ~17 phút. */
export const MAX_RELAY_FAILURES = 10;
/** Poll dự phòng khi LISTEN mất kết nối hoặc notify bị lỡ. */
const FALLBACK_POLL_MS = 15_000;
/** Gom các notify đến dồn dập (một lô INSERT của worker) thành một lượt poll. */
const NOTIFY_DEBOUNCE_MS = 50;
/** queue.add treo (Redis không trả lời) không được chặn mãi vòng relay. */
const RELAY_TIMEOUT_MS = 10_000;
const SHUTDOWN_WAIT_MS = 5_000;

type ClaimedEvent = {
  event_id: string;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: unknown;
  retry_count: number | null;
  next_retry_at: Date;
  occurred_at: Date | null;
};

export type RelayFailureOutcome = {
  status: 'PENDING' | 'DEAD_LETTER';
  /** retry_count mới = số lần relay lỗi, tính cả lần này. */
  retryCount: number;
  /** Chờ bao lâu trước lần thử sau; 0 với DEAD_LETTER. */
  delaySeconds: number;
};

/** Lần lỗi thứ n chờ 2^n giây; tới lần thứ MAX_RELAY_FAILURES thì DEAD_LETTER. */
export function relayFailureOutcome(
  previousFailures: number | null | undefined,
): RelayFailureOutcome {
  const retryCount = (previousFailures ?? 0) + 1;
  if (retryCount >= MAX_RELAY_FAILURES) {
    return { status: 'DEAD_LETTER', retryCount, delaySeconds: 0 };
  }
  return { status: 'PENDING', retryCount, delaySeconds: 2 ** retryCount };
}

/**
 * Relay `outbox_events` sang BullMQ.
 *
 * Giành sự kiện bằng một câu UPDATE … FOR UPDATE SKIP LOCKED, ghi locked_at /
 * locked_by: nhiều replica chạy song song không nhặt trùng, và dòng PROCESSING
 * chỉ bị giành lại khi khoá đã quá 10 phút (tính từ lúc nhặt, không phải lúc
 * tạo sự kiện). Mọi câu SQL đều raw để không phụ thuộc Prisma client đã
 * generate lại cột mới hay chưa.
 */
@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  /** Ghi vào locked_by; VARCHAR(64). */
  private readonly workerId = `${hostname()}:${process.pid}`.slice(0, 64);
  private running = true;
  private inFlight: Promise<void> | null = null;
  private rerun = false;
  private fallbackTimer: NodeJS.Timeout | null = null;
  private notifyTimer: NodeJS.Timeout | null = null;
  private listener: OutboxListener | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('outbox_relay') private readonly outboxRelayQueue: Queue,
    @InjectQueue('content_generation')
    private readonly contentGenerationQueue: Queue,
    @InjectQueue(ANSWER_GRADING_QUEUE)
    private readonly answerGradingQueue: Queue,
    @InjectQueue(ESSAY_GRADING_QUEUE)
    private readonly essayGradingQueue: Queue,
    @InjectQueue('micro_content_video')
    private readonly microContentVideoQueue?: Queue,
    @Optional()
    @Inject(OUTBOX_LISTEN_CLIENT_FACTORY)
    private readonly listenClientFactory?: ListenClientFactory,
    // Cuối danh sách: test dựng OutboxService theo vị trí không phải đổi.
    @Optional()
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly documentProcessingQueue?: Queue,
  ) {}

  onModuleInit() {
    this.running = true;
    this.logger.log(`Outbox relay khởi động (${this.workerId})`);
    this.listener = new OutboxListener(
      OUTBOX_CHANNEL,
      this.listenClientFactory ?? (() => createPgListenClient()),
      () => this.requestPoll(),
      () => this.requestPoll(),
    );
    void this.listener.start();
    void this.pollSafely();
    this.scheduleFallback();
  }

  async onModuleDestroy() {
    this.running = false;
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    if (this.notifyTimer) clearTimeout(this.notifyTimer);
    this.fallbackTimer = null;
    this.notifyTimer = null;
    await this.listener?.stop();
    this.listener = null;
    // Chờ lô đang đẩy dở xong để không để lại dòng PROCESSING phải đợi 10 phút.
    if (this.inFlight) {
      await Promise.race([
        this.inFlight.catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, SHUTDOWN_WAIT_MS).unref()),
      ]);
    }
    this.logger.log('Outbox relay đã dừng.');
  }

  /**
   * Một lượt relay: giành và đẩy từng lô cho tới khi hết sự kiện đến hạn.
   * Gọi chồng lúc đang chạy (notify, poll dự phòng) thì không chạy song song
   * mà gộp lại: lượt đang chạy làm thêm đúng một vòng nữa rồi mới xong.
   */
  pollAndRelay(): Promise<void> {
    if (this.inFlight) {
      this.rerun = true;
      return this.inFlight;
    }
    this.inFlight = this.drain();
    return this.inFlight;
  }

  private async drain() {
    try {
      do {
        this.rerun = false;
        let claimed: number;
        do {
          claimed = await this.relayBatch();
        } while (claimed === CLAIM_BATCH && this.running);
      } while (this.rerun && this.running);
    } finally {
      // Gán ngay trong lượt kiểm tra điều kiện cuối, không qua microtask, để
      // một lời gọi chen giữa không bị gộp vào một lượt đã kết thúc.
      this.inFlight = null;
    }
  }

  private pollSafely(): Promise<void> {
    return this.pollAndRelay().catch((err: unknown) => {
      this.logger.error(`Outbox poll lỗi: ${errorMessage(err)}`);
    });
  }

  private requestPoll() {
    if (!this.running || this.notifyTimer) return;
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null;
      void this.pollSafely();
    }, NOTIFY_DEBOUNCE_MS);
    this.notifyTimer.unref?.();
  }

  private scheduleFallback() {
    if (!this.running) return;
    this.fallbackTimer = setTimeout(() => {
      this.fallbackTimer = null;
      void this.pollSafely().finally(() => this.scheduleFallback());
    }, FALLBACK_POLL_MS);
    this.fallbackTimer.unref?.();
  }

  private async relayBatch(): Promise<number> {
    const events = await this.claim();
    for (const event of events) {
      try {
        await this.relay(event);
      } catch (err) {
        // Lỗi ghi sổ một dòng (DB chập chờn) không bỏ dở cả lô; dòng đó giữ
        // PROCESSING và được giành lại khi khoá hết hạn.
        this.logger.error(
          `Không cập nhật được outbox ${event.event_id}: ${errorMessage(err)}`,
        );
      }
    }
    return events.length;
  }

  private async claim(): Promise<ClaimedEvent[]> {
    // COALESCE(locked_at, occurred_at): dòng PROCESSING do code cũ ghi (không
    // có locked_at) vẫn được giành lại như trước, thay vì kẹt mãi.
    const rows = await this.prisma.$queryRaw<ClaimedEvent[]>`
      WITH due AS (
        SELECT event_id
          FROM outbox_events
         WHERE (status = 'PENDING' AND next_retry_at <= now())
            OR (status = 'PROCESSING'
                AND COALESCE(locked_at, occurred_at) < now() - ${STALE_LOCK_INTERVAL}::interval)
         ORDER BY next_retry_at, occurred_at
         LIMIT ${CLAIM_BATCH}
         FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events o
         SET status = 'PROCESSING', locked_at = now(), locked_by = ${this.workerId}
        FROM due
       WHERE o.event_id = due.event_id
      RETURNING o.event_id, o.event_type, o.aggregate_type, o.aggregate_id,
                o.payload, o.retry_count, o.next_retry_at, o.occurred_at
    `;
    // RETURNING không giữ thứ tự của ORDER BY trong CTE.
    return rows.sort(
      (a, b) =>
        time(a.next_retry_at) - time(b.next_retry_at) ||
        time(a.occurred_at) - time(b.occurred_at),
    );
  }

  private async relay(event: ClaimedEvent) {
    try {
      await withTimeout(
        this.queueFor(event.event_type).add(
          event.event_type,
          {
            event_id: event.event_id,
            event_type: event.event_type,
            aggregate_type: event.aggregate_type,
            aggregate_id: event.aggregate_id,
            payload: event.payload,
          },
          {
            // jobId = event_id: đẩy lại sau timeout hay sau khi giành lại khoá
            // không sinh job trùng.
            jobId: event.event_id,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
          },
        ),
        RELAY_TIMEOUT_MS,
      );
    } catch (err) {
      await this.recordFailure(event, err);
      return;
    }
    await this.markProcessed(event);
  }

  private async markProcessed(event: ClaimedEvent) {
    // retry_count giữ nguyên: nó đếm số lần lỗi, không đếm lần thành công.
    const count = await this.prisma.$executeRaw`
      UPDATE outbox_events
         SET status = 'PROCESSED', processed_at = now(),
             locked_at = NULL, locked_by = NULL
       WHERE event_id = ${event.event_id}::uuid
         AND status = 'PROCESSING' AND locked_by = ${this.workerId}
    `;
    if (count === 0) this.warnLockLost(event, 'PROCESSED');
  }

  private async recordFailure(event: ClaimedEvent, err: unknown) {
    const outcome = relayFailureOutcome(event.retry_count);
    const message = errorMessage(err).slice(0, 2000);
    const count = await this.prisma.$executeRaw`
      UPDATE outbox_events
         SET status = ${outcome.status},
             retry_count = ${outcome.retryCount},
             last_error = ${message},
             next_retry_at = now() + make_interval(secs => ${outcome.delaySeconds}),
             locked_at = NULL, locked_by = NULL
       WHERE event_id = ${event.event_id}::uuid
         AND status = 'PROCESSING' AND locked_by = ${this.workerId}
    `;
    if (count === 0) {
      this.warnLockLost(event, outcome.status);
    } else if (outcome.status === 'DEAD_LETTER') {
      this.logger.error(
        `Outbox ${event.event_id} (${event.event_type}) → DEAD_LETTER sau ${outcome.retryCount} lần lỗi: ${message}`,
      );
    } else {
      this.logger.warn(
        `Outbox ${event.event_id} (${event.event_type}) lỗi lần ${outcome.retryCount}, thử lại sau ${outcome.delaySeconds}s: ${message}`,
      );
    }
  }

  private warnLockLost(event: ClaimedEvent, target: string) {
    // Tiến trình khác đã giành lại dòng (khoá quá 10 phút); để nó xử lý.
    this.logger.warn(
      `Outbox ${event.event_id}: mất khoá trước khi ghi ${target}, bỏ qua`,
    );
  }

  private queueFor(eventType: string): Queue {
    // Hàng đợi riêng cho chấm tự luận: sinh nội dung chạy lâu, người học
    // không phải chờ sau các yêu cầu sinh quiz của giảng viên.
    if (eventType === 'CONTENT_GENERATION_REQUESTED')
      return this.contentGenerationQueue;
    if (
      eventType === ANSWER_GRADING_REQUESTED ||
      eventType === MICRO_CONTENT_GRADING_REQUESTED
    ) {
      return this.answerGradingQueue;
    }
    if (eventType === ESSAY_GRADING_REQUESTED) return this.essayGradingQueue;
    // Map lại chunk → LO cần embedder + MapChunksToLos của document worker.
    // Thiếu hàng đợi thì báo lỗi (relay thử lại) chứ không rơi về outbox_relay:
    // outbox worker không biết lệnh này và sẽ bỏ nó.
    if (eventType === COURSE_CHUNK_LO_REMAP_REQUESTED) {
      if (!this.documentProcessingQueue) {
        throw new Error(`${DOCUMENT_PROCESSING_QUEUE} queue is not registered`);
      }
      return this.documentProcessingQueue;
    }
    if (
      (eventType === 'MICRO_CONTENT_SCRIPT_REQUESTED' ||
        eventType === 'MICRO_CONTENT_RENDER_REQUESTED') &&
      this.microContentVideoQueue
    ) {
      return this.microContentVideoQueue;
    }
    return this.outboxRelayQueue;
  }
}

function time(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`queue.add không trả lời sau ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
