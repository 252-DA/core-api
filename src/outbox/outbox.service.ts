import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
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
    this.pollTimeout = setTimeout(() => void this.startPolling(), 5000);
  }

  async pollAndRelay() {
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
        await this.relayEvent(tx, event);
      }
    });
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
      await this.markRelayFailure(tx, event, error);
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

  private async markRelayFailure(
    tx: Prisma.TransactionClient,
    event: ClaimedOutboxEvent,
    error: unknown,
  ): Promise<void> {
    const retryCount = (event.retry_count ?? 0) + 1;
    const message = error instanceof Error ? error.message : String(error);

    await tx.outbox_events.update({
      where: { event_id: event.event_id },
      data: {
        status: retryCount >= MAX_RELAY_ATTEMPTS ? 'FAILED' : 'PENDING',
        retry_count: retryCount,
        last_error: message,
        processed_at: null,
      },
    });
  }
}
