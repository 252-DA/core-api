import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  ANSWER_GRADING_QUEUE,
  CANVAS_SYNC_QUEUE,
  CONTENT_GENERATION_QUEUE,
  DOCUMENT_ENRICHMENT_QUEUE,
  DOCUMENT_PROCESSING_QUEUE,
  ESSAY_GRADING_QUEUE,
  MICRO_CONTENT_VIDEO_QUEUE,
  OUTBOX_RELAY_QUEUE,
  WORKER_RESULTS_QUEUE,
} from './queues';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: WORKER_RESULTS_QUEUE },
      { name: DOCUMENT_PROCESSING_QUEUE },
      { name: DOCUMENT_ENRICHMENT_QUEUE },
      { name: CONTENT_GENERATION_QUEUE },
      { name: ANSWER_GRADING_QUEUE },
      { name: ESSAY_GRADING_QUEUE },
      { name: CANVAS_SYNC_QUEUE },
      { name: MICRO_CONTENT_VIDEO_QUEUE },
      { name: OUTBOX_RELAY_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
