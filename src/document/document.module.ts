import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentStorageService } from './document-storage.service';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import { AuthModule } from '../auth/auth.module';
import { CanvasModule } from '../canvas/canvas.module';
import { CANVAS_SYNC_QUEUE, CanvasSyncJobsService } from './canvas-sync-jobs.service';
import { CanvasSyncProcessor } from './canvas-sync.processor';
import { CANVAS_SYNC_CONFIG, canvasSyncConfig } from './canvas-sync.config';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'document_processing' },
      { name: 'document_enrichment' },
      { name: CANVAS_SYNC_QUEUE },
    ),
    AuthModule,
    CanvasModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentStorageService, CanvasDocumentSyncService,
    CanvasSyncJobsService, CanvasSyncProcessor,
    { provide: CANVAS_SYNC_CONFIG, useFactory: canvasSyncConfig }],
  exports: [DocumentService, CanvasDocumentSyncService, CanvasSyncJobsService],
})
export class DocumentModule {}
