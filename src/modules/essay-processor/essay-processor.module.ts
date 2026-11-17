import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { StorageModule } from '../../infra/storage/storage.module';
import { LtiPlatformModule } from '../../integrations/lti-platform/lti-platform.module';
import { EssayProcessorService } from './essay-processor.service';
import { EssayReportPublisherService } from './essay-report.publisher';
import { EssayGradingResultHandler } from './essay-grading-result.handler';
import { LtiServicesClient } from './lti-services.client';
import { EssayProcessorController } from './essay-processor.controller';

@Module({
  imports: [LtiPlatformModule, AuthModule, PrismaModule, StorageModule],
  controllers: [EssayProcessorController],
  providers: [
    EssayProcessorService,
    EssayReportPublisherService,
    LtiServicesClient,
    EssayGradingResultHandler,
  ],
  exports: [EssayProcessorService],
})
export class EssayProcessorModule {}
