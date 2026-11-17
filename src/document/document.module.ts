import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentProcessingResultHandler } from './document-processing-result.handler';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'document_processing' },
      { name: 'document_enrichment' },
    ),
    AuthModule,
    StorageModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentProcessingResultHandler],
  exports: [DocumentService],
})
export class DocumentModule {}
