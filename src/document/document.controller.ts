import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/documents')
@UseGuards(BffJwtGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async listDocuments(
    @CurrentBffClaims() claims: BffClaims,
    @Query('course_id') courseId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 50;
    const off = offset ? parseInt(offset, 10) : 0;
    return this.documentService.listDocuments(claims, courseId, lim, off);
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
  ) {
    return this.documentService.getDocumentChunks(claims, id);
  }

  @Post('upload-session')
  async createUploadSession(
    @CurrentBffClaims() claims: BffClaims,
    @Body()
    body: {
      courseId: string;
      title: string;
      fileName: string;
      mimeType?: string;
      checksum?: string;
    },
  ) {
    return this.documentService.createUploadSession(claims, body);
  }

  @Post(':id/confirm-upload')
  async confirmUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.confirmUpload(claims, id);
  }

  @Post()
  async registerAndProcess(
    @CurrentBffClaims() claims: BffClaims,
    @Body()
    body: {
      title: string;
      file_path: string;
      mime_type?: string;
      checksum?: string;
      course_id: string;
    },
  ) {
    return this.documentService.registerAndProcess(claims, body);
  }

  @Delete(':id')
  async deleteDocument(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.deleteDocument(claims, id);
  }
}
