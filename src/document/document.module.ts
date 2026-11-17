import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../infra/storage/storage.module';
import { DocumentProcessingResultHandler } from './document-processing-result.handler';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentProcessingResultHandler],
  exports: [DocumentService],
})
export class DocumentModule {}
