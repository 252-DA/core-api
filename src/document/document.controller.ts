import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async listDocuments(
    @Query('course_id') courseId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 50;
    const off = offset ? parseInt(offset, 10) : 0;
    return this.documentService.listDocuments(courseId, lim, off);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentService.getDocument(id);
  }

  @Get(':id/chunks')
  async getDocumentChunks(@Param('id') id: string) {
    return this.documentService.getDocumentChunks(id);
  }

  @Post()
  async registerAndProcess(
    @Body()
    body: {
      document_id?: string;
      document_name: string;
      doc_type: string;
      mime_type: string;
      size_bytes: number;
      storage_key: string;
      course_id?: string;
      owner_id?: string;
      language?: string;
      metadata_json?: any;
    },
  ) {
    return this.documentService.registerAndProcess(body);
  }

  @Post(':id/enrich')
  async triggerEnrichment(@Param('id') id: string) {
    return this.documentService.triggerEnrichment(id);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return this.documentService.deleteDocument(id);
  }
}
