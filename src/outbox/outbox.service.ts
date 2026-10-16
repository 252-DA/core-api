import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  ANSWER_GRADING_QUEUE,
  ANSWER_GRADING_REQUESTED,
} from '../quiz/answer-grading';
import {
  ESSAY_GRADING_QUEUE,
  ESSAY_GRADING_REQUESTED,
} from '../essay-processor/essay-grading';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private running = true;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('outbox_relay') private readonly outboxRelayQueue: Queue,
    @InjectQueue('content_generation')
    private readonly contentGenerationQueue: Queue,
    @InjectQueue(ANSWER_GRADING_QUEUE)
    private readonly answerGradingQueue: Queue,
    @InjectQueue(ESSAY_GRADING_QUEUE)
    private readonly essayGradingQueue: Queue,
  ) {}

  onModuleInit() {
    console.log('Outbox poller daemon starting...');
    this.startPolling();
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
    this.pollTimeout = setTimeout(() => this.startPolling(), 5000);
  }

  async pollAndRelay() {
    const events = await this.prisma.$transaction(async (tx) => {
      const pendingEvents = await tx.outbox_events.findMany({
        where: { status: 'PENDING' },
        orderBy: { occurred_at: 'asc' },
        take: 10,
      });

      if (pendingEvents.length === 0) {
        return [];
      }

      await tx.outbox_events.updateMany({
        where: { event_id: { in: pendingEvents.map((event) => event.event_id) } },
        data: { status: 'PROCESSING' },
      });

      return pendingEvents;
    });

    for (const event of events) {
      try {
        const payload = {
          event_id: event.event_id,
          event_type: event.event_type,
          aggregate_type: event.aggregate_type,
          aggregate_id: event.aggregate_id,
          payload: event.payload,
        };

        // Hàng đợi riêng cho chấm tự luận: sinh nội dung chạy lâu, người học
        // không phải chờ sau các yêu cầu sinh quiz của giảng viên.
        const queue =
          event.event_type === 'CONTENT_GENERATION_REQUESTED'
            ? this.contentGenerationQueue
            : event.event_type === ANSWER_GRADING_REQUESTED ||
              event.event_type === 'MICRO_CONTENT_GRADING_REQUESTED'
              ? this.answerGradingQueue
              : event.event_type === ESSAY_GRADING_REQUESTED
                ? this.essayGradingQueue
                : this.outboxRelayQueue;

        await queue.add(event.event_type, payload, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
        });

        await this.prisma.outbox_events.update({
          where: { event_id: event.event_id },
          data: {
            status: 'PROCESSED',
            retry_count: (event.retry_count || 0) + 1,
            processed_at: new Date(),
          },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await this.prisma.outbox_events.update({
          where: { event_id: event.event_id },
          data: {
            status: 'FAILED',
            retry_count: (event.retry_count || 0) + 1,
            last_error: message,
          },
        });
      }
    }
  }
}
