import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentStorageService } from '../document/document-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EssayProcessorService } from './essay-processor.service';
import { EssayReportPublisherService } from './essay-report.publisher';
import { EssayGradingResultHandler } from './essay-grading-result.handler';
import { LtiServicesClient } from './lti-services.client';
import { EssayProcessorController } from './essay-processor.controller';

@Module({
  imports: [AgsModule, AuthModule, PrismaModule],
  controllers: [EssayProcessorController],
  providers: [
    EssayProcessorService,
    EssayReportPublisherService,
    LtiServicesClient,
    DocumentStorageService,
    EssayGradingResultHandler,
  ],
  exports: [EssayProcessorService],
})
export class EssayProcessorModule {}
