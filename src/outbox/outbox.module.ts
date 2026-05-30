import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OutboxService } from './outbox.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'outbox_relay',
    }),
    BullModule.registerQueue({
      name: 'document_enrichment',
    }),
  ],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
