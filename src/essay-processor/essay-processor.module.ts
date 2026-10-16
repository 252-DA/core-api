import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentStorageService } from '../document/document-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EssayProcessorService } from './essay-processor.service';
import { EssayReportPublisherService } from './essay-report.publisher';
import { LtiServicesClient } from './lti-services.client';

@Module({
  imports: [AgsModule, AuthModule, PrismaModule],
  providers: [EssayProcessorService, EssayReportPublisherService, LtiServicesClient, DocumentStorageService],
  exports: [EssayProcessorService],
})
export class EssayProcessorModule {}
