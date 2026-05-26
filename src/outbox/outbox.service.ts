import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private running = true;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('outbox_relay') private readonly outboxRelayQueue: Queue,
  ) {}

  onModuleInit() {
    console.log('Outbox Poller daemon starting...');
    this.startPolling();
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }
    console.log('Outbox Poller daemon stopped.');
  }

  private async startPolling() {
    if (!this.running) return;

    try {
      await this.pollAndRelay();
    } catch (err) {
      console.error('Outbox Poller error during run:', err);
    }

    // Schedule next poll in 5 seconds
    this.pollTimeout = setTimeout(() => this.startPolling(), 5000);
  }

  async pollAndRelay() {
    // 1. Fetch pending outbox events (limit 10 per batch)
    // In production, we'd use SELECT FOR UPDATE SKIP LOCKED. With Prisma, we can do it in a transaction.
    const events = await this.prisma.$transaction(async (tx) => {
      const pendingEvents = await tx.outbox_events.findMany({
        where: { status: 'PENDING' },
        orderBy: { created_at: 'asc' },
        take: 10,
      });

      if (pendingEvents.length === 0) {
        return [];
      }

      // Mark them as PROCESSING to avoid double-processing
      const eventIds = pendingEvents.map(e => e.id);
      await tx.outbox_events.updateMany({
        where: { id: { in: eventIds } },
        data: {
          status: 'PROCESSING',
          updated_at: new Date(),
        },
      });

      return pendingEvents;
    });

    if (events.length === 0) {
      return;
    }

    console.log(`Outbox Poller: Found ${events.length} pending events to relay.`);

    // 2. Relay events to BullMQ
    for (const event of events) {
      try {
        const payload = {
          event_id: event.id,
          event_type: event.event_type,
          aggregate_id: event.aggregate_id,
          payload: event.payload_json,
        };

        // Enqueue job in BullMQ
        await this.outboxRelayQueue.add(event.event_type, payload, {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });

        // Update status to COMPLETED
        await this.prisma.outbox_events.update({
          where: { id: event.id },
          data: {
            status: 'COMPLETED',
            attempts: event.attempts + 1,
            updated_at: new Date(),
          },
        });

        console.log(`Outbox Poller: Successfully relayed event ${event.id} (${event.event_type})`);
      } catch (err: any) {
        console.error(`Outbox Poller: Failed to relay event ${event.id}:`, err);

        // Update status to FAILED and record error message
        await this.prisma.outbox_events.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            attempts: event.attempts + 1,
            error_msg: err.message || String(err),
            updated_at: new Date(),
          },
        });
      }
    }
  }
}
