import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('document_processing') private readonly processingQueue: Queue,
    @InjectQueue('document_enrichment') private readonly enrichmentQueue: Queue,
  ) {}

  async listDocuments(courseId?: string, limit = 50, offset = 0) {
    const whereClause = courseId ? { course_id: courseId } : {};
    
    const docs = await this.prisma.documents_metadata.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    });

    return Promise.all(
      docs.map(async (doc) => {
        const chunks_count = await this.prisma.chunks_metadata.count({
          where: { document_id: doc.document_id },
        });

        return {
          document_id: doc.document_id,
          document_name: doc.document_name,
          doc_type: doc.doc_type,
          mime_type: doc.mime_type,
          size_bytes: Number(doc.size_bytes),
          storage_key: doc.storage_key,
          course_id: doc.course_id,
          owner_id: doc.owner_id,
          language: doc.language,
          status: doc.status,
          error_msg: doc.error_msg,
          metadata_json: doc.metadata_json,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          chunks_count,
        };
      }),
    );
  }

  async getDocument(documentId: string) {
    const doc = await this.prisma.documents_metadata.findUnique({
      where: { document_id: documentId },
    });

    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    const chunks_count = await this.prisma.chunks_metadata.count({
      where: { document_id: documentId },
    });

    return {
      document_id: doc.document_id,
      document_name: doc.document_name,
      doc_type: doc.doc_type,
      mime_type: doc.mime_type,
      size_bytes: Number(doc.size_bytes),
      storage_key: doc.storage_key,
      course_id: doc.course_id,
      owner_id: doc.owner_id,
      language: doc.language,
      status: doc.status,
      error_msg: doc.error_msg,
      metadata_json: doc.metadata_json,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      chunks_count,
    };
  }


  async getDocumentChunks(documentId: string) {
    await this.getDocument(documentId);
    
    return this.prisma.chunks_metadata.findMany({
      where: { document_id: documentId },
      orderBy: { chunk_index: 'asc' },
      include: {
        chunk_contents: true,
      },
    });
  }

  async registerAndProcess(data: {
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
  }) {
    const documentId = data.document_id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = data.metadata_json || {};
    if (data.course_id) metadata.course_id = data.course_id;
    if (data.owner_id) metadata.owner_id = data.owner_id;
    if (data.storage_key) metadata.storage_key = data.storage_key;
    if (data.language) metadata.language = data.language;

    // 1. Transactionally write row in postgres
    const doc = await this.prisma.documents_metadata.create({
      data: {
        document_id: documentId,
        document_name: data.document_name,
        doc_type: data.doc_type,
        mime_type: data.mime_type,
        size_bytes: BigInt(data.size_bytes),
        storage_key: data.storage_key,
        course_id: data.course_id,
        owner_id: data.owner_id,
        language: data.language || 'vi',
        status: 'QUEUED',
        metadata_json: metadata,
      },
    });

    // 2. Enqueue in BullMQ
    const payload = {
      document_id: documentId,
      storage_key: data.storage_key,
      file_name: data.document_name,
      language: data.language || 'vi',
      metadata: metadata,
    };

    const job = await this.processingQueue.add('process_document', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    return {
      document_id: documentId,
      status: 'QUEUED',
      job_id: job.id,
    };
  }

  async triggerEnrichment(documentId: string) {
    const doc = await this.getDocument(documentId);
    
    const job = await this.enrichmentQueue.add('enrich_document', {
      document_id: documentId,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    return {
      document_id: documentId,
      status: doc.status,
      enrichment_job_id: job.id,
    };
  }

  async deleteDocument(documentId: string) {
    const doc = await this.getDocument(documentId);

    // Delete row
    await this.prisma.documents_metadata.delete({
      where: { document_id: documentId },
    });

    // We can also create a document deleted outbox event to clear from Neo4j & Qdrant
    await this.prisma.outbox_events.create({
      data: {
        id: randomUUID(), // Valid UUID format
        event_type: 'document_deleted',
        aggregate_id: documentId,
        payload_json: {
          document_id: documentId,
        },
        status: 'PENDING',
      },
    });

    return {
      document_id: documentId,
      success: true,
      message: `Document ${documentId} deleted successfully and outbox event registered.`,
    };
  }
}
