import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentStorageService } from './document-storage.service';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import { AuthModule } from '../auth/auth.module';
import { CanvasModule } from '../canvas/canvas.module';
import { RosterModule } from '../roster/roster.module';
import { CANVAS_SYNC_QUEUE, CanvasSyncJobsService } from './canvas-sync-jobs.service';
import { CanvasSyncProcessor } from './canvas-sync.processor';
import { CanvasSyncRunsService } from './canvas-sync-runs.service';
import { CanvasSyncStatusService } from './canvas-sync-status.service';
import { CanvasTokenStatusService } from './canvas-token-status.service';
import { CANVAS_SYNC_CONFIG, canvasSyncConfig } from './canvas-sync.config';
import { DocumentProcessingResultHandler } from './document-processing-result.handler';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'document_processing' },
      { name: 'document_enrichment' },
      { name: CANVAS_SYNC_QUEUE },
    ),
    AuthModule,
    CanvasModule,
    RosterModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentStorageService, CanvasDocumentSyncService,
    CanvasSyncJobsService, CanvasSyncProcessor, DocumentProcessingResultHandler,
    CanvasSyncRunsService, CanvasTokenStatusService, CanvasSyncStatusService,
    { provide: CANVAS_SYNC_CONFIG, useFactory: canvasSyncConfig }],
  exports: [DocumentService, CanvasDocumentSyncService, CanvasSyncJobsService, DocumentStorageService, CanvasSyncStatusService],
})
export class DocumentModule {}
