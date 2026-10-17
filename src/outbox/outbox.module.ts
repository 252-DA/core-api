import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OutboxService } from './outbox.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'outbox_relay',
    }),
    BullModule.registerQueue({
      name: 'content_generation',
    }),
    BullModule.registerQueue({
      name: 'answer_grading',
    }),
    BullModule.registerQueue({
      name: 'essay_grading',
    }),
    BullModule.registerQueue({
      name: 'micro_content_video',
    }),
  ],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
