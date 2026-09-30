import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { documents } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BffClaims } from '../auth/bff-claims';
import { AuthzService } from '../auth/authz.service';
import { DocumentStorageService } from './document-storage.service';

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160) || 'document';
}

function fileNameFromStorageKey(storageKey: string, fallback: string) {
  return storageKey.split('/').filter(Boolean).pop() || fallback;
}

/** Nguồn, vai trò và chương của tài liệu — cho màn hình tài liệu của giảng viên. */
function placementFields(doc: documents) {
  return {
    source: doc.source,
    lms_module: doc.lms_module,
    lms_published: doc.lms_published,
    role: doc.role,
    role_provenance: doc.role_provenance,
    chapter_code: doc.chapter_code,
    chapter_provenance: doc.chapter_provenance,
    chapter_confidence: doc.chapter_confidence === null ? null : Number(doc.chapter_confidence),
    chapter_reason: doc.chapter_reason,
  };
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    @InjectQueue('document_processing') private readonly processingQueue: Queue,
    private readonly storage: DocumentStorageService,
  ) {}

  async listDocuments(
    claims: BffClaims,
    courseId: string,
    limit = 50,
    offset = 0,
  ) {
    await this.authz.assertCourseAccess(claims, courseId, [
      'instructor',
      'ta',
      'observer',
    ]);

    const docs = await this.prisma.documents.findMany({
      where: { course_id: courseId, deleted_at: null },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });

    return docs.map((doc) => ({
      document_id: doc.document_id,
      title: doc.title,
      file_path: doc.file_path,
      mime_type: doc.mime_type,
      checksum: doc.checksum,
      course_id: doc.course_id,
      status: doc.status,
      created_by: doc.created_by,
      created_at: doc.created_at,
      chunks_count: doc._count.chunks,
      ...placementFields(doc),
    }));
  }

  async getDocument(claims: BffClaims, documentId: string) {
    const doc = await this.prisma.documents.findFirst({
      where: { document_id: documentId, deleted_at: null },
      include: { _count: { select: { chunks: true } } },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    await this.authz.assertCourseAccess(claims, doc.course_id);
    return {
      document_id: doc.document_id,
      title: doc.title,
      file_path: doc.file_path,
      mime_type: doc.mime_type,
      checksum: doc.checksum,
      course_id: doc.course_id,
      status: doc.status,
      created_by: doc.created_by,
      created_at: doc.created_at,
      chunks_count: doc._count.chunks,
      ...placementFields(doc),
    };
  }

  /**
   * Chunk của một tài liệu, theo thứ tự đọc. `page` giới hạn về đúng một trang
   * — "giải thích trang này" là một phép tra cứu chính xác theo
   * (document_id, page_number), không phải similarity search.
   */
  async getDocumentChunks(claims: BffClaims, documentId: string, page?: number) {
    await this.getDocument(claims, documentId);
    if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
      throw new BadRequestException('page phải là số nguyên >= 1.');
    }
    return this.prisma.chunks.findMany({
      where: {
        document_id: documentId,
        deleted_at: null,
        ...(page === undefined ? {} : { page_number: page }),
      },
      orderBy: { sort_order: 'asc' },
      select: {
        chunk_id: true,
        document_id: true,
        course_id: true,
        content: true,
        heading_path: true,
        page_number: true,
        sort_order: true,
        language: true,
        created_at: true,
      },
    });
  }

  /**
   * URL đọc file của tài liệu, hạn ngắn, chỉ dành cho phía server của web gọi
   * lại. Trả kèm mime_type để route biết đặt Content-Type nào cho trình duyệt.
   */
  async getDocumentFileUrl(claims: BffClaims, documentId: string) {
    const doc = await this.getDocument(claims, documentId);
    if (doc.status === 'UPLOADING') {
      throw new BadRequestException('Tài liệu chưa upload xong.');
    }
    const expiresInSeconds = 5 * 60;
    const url = await this.storage.createPresignedDownloadUrl(
      doc.file_path,
      expiresInSeconds,
    );
    return {
      document_id: doc.document_id,
      url,
      mime_type: doc.mime_type || 'application/octet-stream',
      file_name: fileNameFromStorageKey(doc.file_path, doc.title),
      expires_in: expiresInSeconds,
    };
  }

  async createUploadSession(
    claims: BffClaims,
    data: {
      courseId: string;
      title: string;
      fileName: string;
      mimeType?: string;
      checksum?: string;
    },
  ) {
    await this.authz.assertCourseAccess(claims, data.courseId, [
      'instructor',
      'ta',
    ]);

    const [{ id: documentId }] = await this.prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT uuidv7()::text AS id`;
    const cleanName = safeFileName(data.fileName);
    const filePath = `documents/${data.courseId}/${documentId}/${cleanName}`;
    const uploadUrl = await this.storage.createPresignedUploadUrl(filePath);

    const doc = await this.prisma.documents.create({
      data: {
        document_id: documentId,
        course_id: data.courseId,
        title: data.title || cleanName,
        file_path: filePath,
        mime_type: data.mimeType || 'application/octet-stream',
        checksum: data.checksum,
        status: 'UPLOADING',
        created_by: claims.sub,
      },
    });

    return {
      document_id: doc.document_id,
      upload_url: uploadUrl,
      file_path: filePath,
      status: doc.status,
    };
  }

  async confirmUpload(claims: BffClaims, documentId: string) {
    const doc = await this.prisma.documents.findFirst({
      where: { document_id: documentId, deleted_at: null },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    await this.authz.assertCourseAccess(claims, doc.course_id, [
      'instructor',
      'ta',
    ]);
    if (doc.status !== 'UPLOADING' && doc.status !== 'UPLOADED') {
      throw new BadRequestException(
        `Document in status ${doc.status} cannot be confirmed`,
      );
    }

    const updated = await this.prisma.documents.update({
      where: { document_id: documentId },
      data: { status: 'QUEUED' },
    });

    const job = await this.processingQueue.add(
      'process_document',
      {
        document_id: updated.document_id,
        storage_key: updated.file_path,
        file_name: fileNameFromStorageKey(updated.file_path, updated.title),
        language: 'vi',
        metadata: {
          course_id: updated.course_id,
          owner_id: updated.created_by,
          storage_key: updated.file_path,
        },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      document_id: updated.document_id,
      status: updated.status,
      job_id: job.id,
    };
  }

  async registerAndProcess(
    claims: BffClaims,
    data: {
      title: string;
      file_path: string;
      mime_type?: string;
      checksum?: string;
      course_id: string;
    },
  ) {
    await this.authz.assertCourseAccess(claims, data.course_id, [
      'instructor',
      'ta',
    ]);

    const doc = await this.prisma.documents.create({
      data: {
        course_id: data.course_id,
        title: data.title,
        file_path: data.file_path,
        mime_type: data.mime_type,
        checksum: data.checksum,
        status: 'QUEUED',
        created_by: claims.sub,
      },
    });

    const job = await this.processingQueue.add('process_document', {
      document_id: doc.document_id,
      storage_key: doc.file_path,
      file_name: fileNameFromStorageKey(doc.file_path, doc.title),
      metadata: {
        course_id: doc.course_id,
        owner_id: doc.created_by,
        storage_key: doc.file_path,
      },
    });

    return {
      document_id: doc.document_id,
      status: doc.status,
      job_id: job.id,
    };
  }

  async deleteDocument(claims: BffClaims, documentId: string) {
    const doc = await this.prisma.documents.findFirst({
      where: { document_id: documentId, deleted_at: null },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    await this.authz.assertCourseAccess(claims, doc.course_id, [
      'instructor',
      'ta',
    ]);

    return this.softDelete(doc);
  }

  /** Internal sync operation; restricted to a Canvas document in this course. */
  async deleteCanvasDocument(courseId: string, documentId: string) {
    const doc = await this.prisma.documents.findFirst({
      where: { document_id: documentId, course_id: courseId, source: 'canvas', deleted_at: null },
    });
    if (!doc) throw new NotFoundException(`Canvas document not found: ${documentId}`);
    return this.softDelete(doc);
  }

  private async softDelete(doc: documents) {
    const documentId = doc.document_id;
    await this.prisma.$transaction(async (tx) => {
      await tx.outbox_events.deleteMany({
        where: {
          aggregate_id: documentId,
          status: 'PENDING',
        },
      });
      await tx.outbox_events.create({
        data: {
          event_type: 'DOCUMENT_DELETED',
          aggregate_type: 'document',
          aggregate_id: documentId,
          payload: { document_id: documentId, course_id: doc.course_id },
        },
      });
      await tx.documents.update({
        where: { document_id: documentId },
        data: { deleted_at: new Date() },
      });
    });

    return { document_id: documentId, success: true };
  }
}
