import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { Counter, Gauge, register } from 'prom-client';
import {
  OUTBOX_QUEUE_NAMES,
  type OutboxQueueName,
} from '../outbox/outbox-event.constants';

// Mirror of the connection parsing in src/app.module.ts (BullModule.forRoot).
// QueueEvents needs its own dedicated Redis connection for the events stream.
const getRedisConnection = (): { host: string; port: number } => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    };
  } catch (err) {
    // Fallback if URL is invalid or in a different format
    return {
      host: 'localhost',
      port: 6379,
    };
  }
};

const MONITORED_QUEUES: readonly OutboxQueueName[] = [
  OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
  OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
];

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly queueEvents = new Map<string, QueueEvents>();

  private readonly outboxEventsFailed = new Counter({
    name: 'core_outbox_events_failed_total',
    help: 'Total number of outbox events that reached FAILED status after exhausting relay attempts.',
    labelNames: ['event_type'] as const,
  });

  private readonly queueFailedJobs = new Counter({
    name: 'core_queue_failed_jobs_total',
    help: 'Total number of BullMQ jobs that failed (rate info only — alerting uses the gauge).',
    labelNames: ['queue'] as const,
  });

  // Gauges là nguồn alert: phản ánh state hiện tại (COUNT(*) / getFailedCount),
  // không bị reset khi restart và không có first-sample problem như increase().
  private readonly outboxEventsFailedGauge = new Gauge({
    name: 'core_outbox_events_failed',
    help: 'Current number of outbox events with status FAILED (COUNT(*) based).',
  });

  private readonly queueFailedJobsGauge = new Gauge({
    name: 'core_queue_failed_jobs',
    help: 'Current number of failed jobs retained in the BullMQ queue.',
    labelNames: ['queue'] as const,
  });

  constructor(
    @InjectQueue(OUTBOX_QUEUE_NAMES.OUTBOX_RELAY)
    private readonly outboxRelayQueue: Queue,
    @InjectQueue(OUTBOX_QUEUE_NAMES.CONTENT_GENERATION)
    private readonly contentGenerationQueue: Queue,
  ) {}

  onModuleInit(): void {
    for (const queueName of MONITORED_QUEUES) {
      // NOTE: with bullmq v5 the Queue class itself does not emit a 'failed'
      // event (only waiting/paused/resumed/removed/progress/cleaned); failed
      // jobs are observed through QueueEvents, so the counter listener is
      // registered there. It never blocks or retries jobs — metrics only.
      const events = new QueueEvents(queueName, {
        connection: getRedisConnection(),
      });
      // Without an 'error' listener, an EventEmitter 'error' event (e.g. Redis
      // unreachable at boot) would crash the whole process.
      events.on('error', (err) => {
        this.logger.warn(`QueueEvents error for queue ${queueName}: ${String(err)}`);
      });
      events.on('failed', () => {
        this.queueFailedJobs.inc({ queue: queueName });
      });
      this.queueEvents.set(queueName, events);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [queueName, events] of this.queueEvents) {
      events.removeAllListeners('failed');
      try {
        await events.close();
      } catch (err) {
        this.logger.warn(
          `Failed to close QueueEvents for queue ${queueName}: ${String(err)}`,
        );
      }
    }
    this.queueEvents.clear();
  }

  /** Increments the outbox failure counter (call only after the DB transaction committed). */
  incrementOutboxEventFailed(eventType: string): void {
    this.outboxEventsFailed.inc({ event_type: eventType });
  }

  /** Sets the outbox FAILED gauge from COUNT(*) WHERE status='FAILED'. */
  setOutboxFailedGauge(count: number): void {
    this.outboxEventsFailedGauge.set(count);
  }

  /** Sets the per-queue failed-jobs gauge from Queue.getFailedCount(). */
  setQueueFailedGauge(queueName: string, count: number): void {
    this.queueFailedJobsGauge.set({ queue: queueName }, count);
  }

  /** Prometheus text exposition of the default registry. */
  getMetrics(): Promise<string> {
    return register.metrics();
  }
}
