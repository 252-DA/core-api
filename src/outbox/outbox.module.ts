import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OutboxService } from './outbox.service';
import { OUTBOX_QUEUE_NAMES } from './outbox-event.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
    }),
    BullModule.registerQueue({
      name: OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
    }),
  ],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
