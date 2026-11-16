import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import { CanvasSyncStatusService } from './canvas-sync-status.service';
import {
  SyncCanvasDocumentsDto,
  UpdateDocumentPlacementDto,
} from './dto/canvas-sync.dto';

@Controller('api/documents')
@UseGuards(BffJwtGuard)
export class CanvasSyncController {
  constructor(
    private readonly canvasDocuments: CanvasDocumentSyncService,
    private readonly canvasSyncStatus: CanvasSyncStatusService,
  ) {}

  @Post('sync-canvas')
  async syncFromCanvas(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: SyncCanvasDocumentsDto,
  ) {
    return this.canvasDocuments.syncFromCanvas(claims, body.courseId);
  }

  @Get('canvas-sync-status')
  async getCanvasSyncStatus(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.canvasSyncStatus.status(claims, courseId);
  }

  @Patch(':id/placement')
  async updatePlacement(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: UpdateDocumentPlacementDto,
  ) {
    return this.canvasDocuments.updatePlacement(claims, id, {
      role: body.role,
      chapterCode: body.chapterCode,
    });
  }
}
