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
import { parseOptionalInt } from '../common/query-params';
import { CreateUploadSessionDto } from './dto/document.dto';

@Controller('api/documents')
@UseGuards(BffJwtGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

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

  @Delete(':id')
  async deleteDocument(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.documentService.deleteDocument(claims, id);
  }
}
