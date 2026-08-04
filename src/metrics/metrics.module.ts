import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { OUTBOX_QUEUE_NAMES } from '../outbox/outbox-event.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
    }),
    BullModule.registerQueue({
      name: OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
    }),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
