import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CanvasModule } from '../../integrations/canvas/canvas.module';
import { DocumentModule } from '../document/document.module';
import { RosterModule } from '../roster/roster.module';
import { StorageModule } from '../../infra/storage/storage.module';
import {
  CANVAS_SYNC_CONFIG,
  canvasSyncConfig,
} from '../../config/canvas-sync.config';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import { CanvasSyncJobsService } from './canvas-sync-jobs.service';
import { CanvasSyncRunsService } from './canvas-sync-runs.service';
import { CanvasSyncStatusService } from './canvas-sync-status.service';
import { CanvasSyncController } from './canvas-sync.controller';
import { CanvasSyncProcessor } from './canvas-sync.processor';
import { CanvasTokenStatusService } from './canvas-token-status.service';

@Module({
  imports: [
    AuthModule,
    CanvasModule,
    RosterModule,
    StorageModule,
    DocumentModule,
  ],
  controllers: [CanvasSyncController],
  providers: [
    CanvasDocumentSyncService,
    CanvasSyncJobsService,
    CanvasSyncProcessor,
    CanvasSyncRunsService,
    CanvasTokenStatusService,
    CanvasSyncStatusService,
    { provide: CANVAS_SYNC_CONFIG, useFactory: canvasSyncConfig },
  ],
  exports: [CanvasSyncJobsService],
})
export class CanvasSyncModule {}
