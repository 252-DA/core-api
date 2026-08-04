import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import {
  getOutboxQueueName,
  normalizeOutboxEventType,
  OUTBOX_QUEUE_NAMES,
  type OutboxQueueName,
} from './outbox-event.constants';

const OUTBOX_BATCH_SIZE = 10;
const MAX_RELAY_ATTEMPTS = 5;

interface ClaimedOutboxEvent {
  event_id: string;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Prisma.JsonValue;
  retry_count: number | null;
}

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private running = true;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(OUTBOX_QUEUE_NAMES.OUTBOX_RELAY)
    private readonly outboxRelayQueue: Queue,
    @InjectQueue(OUTBOX_QUEUE_NAMES.CONTENT_GENERATION)
    private readonly contentGenerationQueue: Queue,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit() {
    console.log('Outbox poller daemon starting...');
    void this.startPolling();
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }
    console.log('Outbox poller daemon stopped.');
  }

  private async startPolling() {
    if (!this.running) return;
    try {
      await this.pollAndRelay();
    } catch (err) {
      console.error('Outbox poller error during run:', err);
    }
    await this.refreshFailureGauges();
    this.pollTimeout = setTimeout(() => void this.startPolling(), 5000);
  }

  async pollAndRelay() {
    // Collect event types that became FAILED inside the transaction; the
    // counter is only incremented AFTER the transaction commits successfully,
    // so a rollback never produces a false alert.
    const failedEventTypes: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<ClaimedOutboxEvent[]>`
        SELECT event_id,
               event_type,
               aggregate_type,
               aggregate_id,
               payload,
               retry_count
        FROM outbox_events
        WHERE status = 'PENDING'
        ORDER BY occurred_at ASC NULLS FIRST, event_id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${OUTBOX_BATCH_SIZE};
      `;

      for (const event of events) {
        await this.relayEvent(tx, event, failedEventTypes);
      }
    });

    for (const eventType of failedEventTypes) {
      this.metrics.incrementOutboxEventFailed(eventType);
    }
  }

  /**
   * Refreshes failure gauges from persistent state (DB + Redis), so alerts
   * survive restarts and miss no failure that happened while Core was down.
   * Gauge-based alerting (gauge > 0) avoids the first-sample problem of
   * increase() on counters.
   */
  private async refreshFailureGauges(): Promise<void> {
    try {
      const rows = await this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM outbox_events
        WHERE status = 'FAILED';
      `;
      this.metrics.setOutboxFailedGauge(Number(rows[0]?.count ?? 0));
    } catch (err) {
      console.error('Outbox failed-gauge refresh error:', err);
    }

    for (const queueName of [
      OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
      OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
    ] as const) {
      try {
        const queue = this.queueFor(queueName);
        const failedCount = await queue.getFailedCount();
        this.metrics.setQueueFailedGauge(queueName, failedCount);
      } catch (err) {
        console.error(`Queue ${queueName} failed-gauge refresh error:`, err);
      }
    }
  }

  private queueFor(queueName: OutboxQueueName): Queue {
    switch (queueName) {
      case OUTBOX_QUEUE_NAMES.CONTENT_GENERATION:
        return this.contentGenerationQueue;
      case OUTBOX_QUEUE_NAMES.OUTBOX_RELAY:
        return this.outboxRelayQueue;
    }
  }

  private async relayEvent(
    tx: Prisma.TransactionClient,
    event: ClaimedOutboxEvent,
    failedEventTypes: string[],
  ): Promise<void> {
    try {
      const eventType = normalizeOutboxEventType(event.event_type);
      const queue = this.queueFor(getOutboxQueueName(eventType));
      const payload = {
        event_id: event.event_id,
        event_type: eventType,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        payload: event.payload,
      };

      await queue.add(eventType, payload, {
        jobId: event.event_id,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error: unknown) {
      const isFailed = await this.markRelayFailure(tx, event, error);
      if (isFailed) {
        failedEventTypes.push(event.event_type);
      }
      return;
    }

    // If this update fails, the transaction rolls back to PENDING. BullMQ
    // deduplicates the next relay attempt by the deterministic event jobId.
    await tx.outbox_events.update({
      where: { event_id: event.event_id },
      data: {
        status: 'PROCESSED',
        last_error: null,
        processed_at: new Date(),
      },
    });
  }

  /** Returns true when the event reached terminal FAILED state. */
  private async markRelayFailure(
    tx: Prisma.TransactionClient,
    event: ClaimedOutboxEvent,
    error: unknown,
  ): Promise<boolean> {
    const retryCount = (event.retry_count ?? 0) + 1;
    const message = error instanceof Error ? error.message : String(error);
    const isFailed = retryCount >= MAX_RELAY_ATTEMPTS;

    await tx.outbox_events.update({
      where: { event_id: event.event_id },
      data: {
        status: isFailed ? 'FAILED' : 'PENDING',
        retry_count: retryCount,
        last_error: message,
        processed_at: null,
      },
    });

    return isFailed;
  }
}
