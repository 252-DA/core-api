import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import { CanvasSyncStatusService } from './canvas-sync-status.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';
import { parseOptionalInt } from '../common/query-params';
import {
  CreateUploadSessionDto,
  SyncCanvasDocumentsDto,
  UpdateDocumentPlacementDto,
} from './dto/document.dto';

@Controller('api/documents')
@UseGuards(BffJwtGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly canvasDocuments: CanvasDocumentSyncService,
    private readonly canvasSyncStatus: CanvasSyncStatusService,
  ) {}

  @Get()
  async listDocuments(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.documentService.listDocuments(
      claims,
      courseId,
      parseOptionalInt(limit, 'limit'),
      parseOptionalInt(offset, 'offset'),
    );
  }

  @Post('upload-session')
  async createUploadSession(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateUploadSessionDto,
  ) {
    return this.documentService.createUploadSession(claims, body);
  }

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

  @Get(':id')
  async getDocument(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.getDocument(claims, id);
  }

  @Get(':id/chunks')
  async getDocumentChunks(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.documentService.getDocumentChunks(
      claims,
      id,
      parseOptionalInt(page, 'page'),
    );
  }

  @Get(':id/file-url')
  async getDocumentFileUrl(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.getDocumentFileUrl(claims, id);
  }

  @Post(':id/confirm-upload')
  async confirmUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.confirmUpload(claims, id);
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

  @Delete(':id')
  async deleteDocument(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.deleteDocument(claims, id);
  }
}
