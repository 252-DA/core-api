import { createHash } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { documents } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BffClaims } from '../auth/bff-claims';
import { AuthzService } from '../auth/authz.service';
import { CanvasApiClient, type CanvasModule } from '../canvas/canvas-api.client';
import { CanvasCourseService } from '../canvas/canvas-course.service';
import type { CanvasFile } from '../curriculum/syllabus-file';
import { DocumentService } from './document.service';
import { DocumentStorageService } from './document-storage.service';
import { CanvasSyncJobsService, type SyncActor } from './canvas-sync-jobs.service';
import {
  chapterRefFromFileName,
  classifyModule,
  describeRef,
  isSupportedDocument,
  resolveChapterCode,
  type DocumentRole,
  type ModuleClass,
  type SessionRow,
} from './canvas-placement';

const MANAGE_ROLES = ['instructor', 'ta'];
const ROLES: DocumentRole[] = ['lecture', 'reference', 'exercise'];
// Mỗi lần đồng bộ tải tối đa ngần này file mới/đã đổi; phần còn lại để lần sau.
const MAX_DOWNLOADS_PER_SYNC = 30;
const CONFIDENCE = { module: 0.8, file_name: 0.7, confirmed: 1 };
export const MAP_DOCUMENT_LOS_JOB = 'map_document_los';

type Entry = { fileId: string; moduleName: string; published: boolean; cls: ModuleClass };
type ChapterHint = { code: string; provenance: 'module' | 'file_name'; reason: string };

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160) || 'document';
}

/**
 * File trong các module theo thứ tự hiển thị. Một file nằm ở nhiều module chỉ
 * xử lý một lần; ưu tiên module cho biết chương.
 */
function collectEntries(modules: CanvasModule[]): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  for (const module of modules) {
    const cls = classifyModule(module.name);
    for (const item of module.items ?? []) {
      if (item.type !== 'File' || !item.content_id) continue;
      const fileId = String(item.content_id);
      const previous = entries.get(fileId);
      if (previous && (previous.cls.chapterRef || !cls.chapterRef)) continue;
      entries.set(fileId, {
        fileId,
        moduleName: module.name,
        published: module.published !== false && item.published !== false,
        cls,
      });
    }
  }
  return entries;
}

@Injectable()
export class CanvasDocumentSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    private readonly storage: DocumentStorageService,
    private readonly documents: DocumentService,
    @InjectQueue('document_processing') private readonly processingQueue: Queue,
    private readonly syncJobs: CanvasSyncJobsService,
  ) {}

  /**
   * Đồng bộ file trong Module của khoá Canvas vào tài liệu của khoá DA:
   * file mới được tải và đưa vào pipeline, file đổi phiên bản được nạp lại,
   * file bị gỡ khỏi module thì ẩn. Vai trò và chương giảng viên đã chọn giữ nguyên.
   */
  async syncFromCanvas(claims: BffClaims, courseId: string) {
    await this.authz.assertCourseAccess(claims, courseId, MANAGE_ROLES);
    // Validate the course before accepting the manual request. No downloads in
    // the request path; all three triggers share the same per-course job.
    await this.canvasCourses.contextId(courseId);
    return this.syncJobs.enqueue(courseId, { kind: 'user', userId: claims.sub }, 'manual');
  }

  /** Internal worker entry point. System imports deliberately have no user owner. */
  async syncCourse(courseId: string, actor: SyncActor) {
    const ltiContextId = await this.canvasCourses.contextId(courseId);
    const [modules, files] = await Promise.all([
      this.canvas.listModules(ltiContextId),
      this.canvas.listCourseFiles(ltiContextId),
    ]);
    const filesById = new Map(files.map((file) => [String(file.id), file]));

    const [sessionRows, chapterRows, existing] = await Promise.all([
      this.prisma.course_sessions.findMany({
        where: { course_id: courseId },
        include: { chapters: { select: { code: true } } },
      }),
      this.prisma.chapters.findMany({
        where: { course_id: courseId, deleted_at: null },
        select: { code: true },
      }),
      this.prisma.documents.findMany({
        where: { course_id: courseId, source: 'canvas', deleted_at: null },
      }),
    ]);
    const sessions: SessionRow[] = sessionRows.map((s) => ({
      session_no: s.session_no,
      chapter_code: s.chapters?.code ?? null,
    }));
    const chapterCodes = new Set(chapterRows.map((c) => c.code));
    const existingByFile = new Map(existing.map((d) => [d.lms_file_id, d]));
    const entries = collectEntries(modules);

    const summary = {
      modules: modules.length,
      files: entries.size,
      created: [] as string[],
      updated: [] as string[],
      retried: [] as string[],
      unchanged: 0,
      removed: [] as string[],
      skipped: [] as Array<{ name: string; reason: string }>,
    };

    let downloads = 0;
    for (const entry of entries.values()) {
      const file = filesById.get(entry.fileId);
      if (!file) {
        summary.skipped.push({ name: `file ${entry.fileId}`, reason: 'File không có trong danh sách file của khoá Canvas.' });
        continue;
      }
      const name = file.display_name || file.filename || `canvas-file-${entry.fileId}`;
      if (!isSupportedDocument(name, file['content-type'])) {
        summary.skipped.push({ name, reason: 'Định dạng chưa hỗ trợ (chỉ PDF, DOCX, PPTX, Markdown).' });
        continue;
      }

      const hint = this.chapterHint(entry, name, sessions, chapterCodes);
      const current = existingByFile.get(entry.fileId);
      const sameVersion =
        current?.lms_updated_at && file.updated_at &&
        current.lms_updated_at.getTime() === new Date(file.updated_at).getTime();

      if (current && sameVersion) {
        const changed = await this.refreshPlacement(current, entry, hint);
        if (current.status === 'ERROR') {
          // Lần trước xử lý lỗi (parser, dịch vụ tạm hỏng): xử lý lại từ file đã lưu.
          await this.prisma.documents.update({
            where: { document_id: current.document_id },
            data: { status: 'QUEUED' },
          });
          await this.enqueueProcessingOrMarkError(current);
          summary.retried.push(name);
        } else if (changed) summary.updated.push(name);
        else summary.unchanged += 1;
        continue;
      }

      if (downloads >= MAX_DOWNLOADS_PER_SYNC) {
        summary.skipped.push({ name, reason: 'Vượt giới hạn mỗi lần đồng bộ; sẽ tải ở lần sau.' });
        continue;
      }
      downloads += 1;
      try {
        await this.importFile(actor, courseId, entry, file, name, hint, current);
        (current ? summary.updated : summary.created).push(name);
      } catch (error: unknown) {
        summary.skipped.push({ name, reason: (error as Error).message });
      }
    }

    for (const doc of existing) {
      if (doc.lms_file_id && !entries.has(doc.lms_file_id)) {
        await this.documents.deleteCanvasDocument(courseId, doc.document_id);
        summary.removed.push(doc.title);
      }
    }
    return summary;
  }

  /** Giảng viên chọn vai trò/chương; chapterCode rỗng = để hệ thống tự xác định. */
  async updatePlacement(
    claims: BffClaims,
    documentId: string,
    body: { role?: string; chapterCode?: string | null },
  ) {
    const doc = await this.prisma.documents.findFirst({
      where: { document_id: documentId, deleted_at: null },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    await this.authz.assertCourseAccess(claims, doc.course_id, MANAGE_ROLES);

    const data: Record<string, unknown> = {};
    if (body.role !== undefined && body.role !== doc.role) {
      if (!ROLES.includes(body.role as DocumentRole)) {
        throw new BadRequestException(`Vai trò không hợp lệ: ${body.role}`);
      }
      data.role = body.role;
      data.role_provenance = 'confirmed';
    }
    if (body.chapterCode !== undefined) {
      if (!body.chapterCode) {
        Object.assign(data, {
          chapter_code: null,
          chapter_provenance: null,
          chapter_confidence: null,
          chapter_reason: null,
        });
      } else if (body.chapterCode !== doc.chapter_code || doc.chapter_provenance !== 'confirmed') {
        const chapter = await this.prisma.chapters.findFirst({
          where: { course_id: doc.course_id, code: body.chapterCode, deleted_at: null },
        });
        if (!chapter) {
          throw new BadRequestException(`Đề cương không có chương ${body.chapterCode}.`);
        }
        Object.assign(data, {
          chapter_code: body.chapterCode,
          chapter_provenance: 'confirmed',
          chapter_confidence: CONFIDENCE.confirmed,
          chapter_reason: 'Giảng viên chọn',
        });
      }
    }
    if (Object.keys(data).length === 0) {
      return this.documents.getDocument(claims, documentId);
    }

    await this.prisma.documents.update({ where: { document_id: documentId }, data });
    await this.enqueueRemap(doc);
    return this.documents.getDocument(claims, documentId);
  }

  private chapterHint(
    entry: Entry,
    fileName: string,
    sessions: SessionRow[],
    chapterCodes: Set<string>,
  ): ChapterHint | null {
    // Tài liệu tham khảo trải nhiều chương; worker gắn theo từng phần.
    if (entry.cls.role === 'reference') return null;
    if (entry.cls.chapterRef) {
      const code = resolveChapterCode(entry.cls.chapterRef, sessions, chapterCodes);
      if (code) {
        return {
          code,
          provenance: 'module',
          reason: `Module "${entry.moduleName}" ghi ${describeRef(entry.cls.chapterRef)}`,
        };
      }
    }
    const fileRef = chapterRefFromFileName(fileName);
    const code = fileRef && resolveChapterCode(fileRef, sessions, chapterCodes);
    if (fileRef && code) {
      return { code, provenance: 'file_name', reason: `Tên file ghi ${describeRef(fileRef)}` };
    }
    return null;
  }

  private placementData(entry: Entry, hint: ChapterHint | null, previous?: documents) {
    const roleConfirmed = previous?.role_provenance === 'confirmed';
    const chapterConfirmed = previous?.chapter_provenance === 'confirmed';
    return {
      role: roleConfirmed ? previous!.role : entry.cls.role,
      role_provenance: roleConfirmed ? 'confirmed' : 'inferred',
      ...(chapterConfirmed
        ? {
            chapter_code: previous!.chapter_code,
            chapter_provenance: 'confirmed',
            chapter_confidence: previous!.chapter_confidence,
            chapter_reason: previous!.chapter_reason,
          }
        : {
            chapter_code: hint?.code ?? null,
            chapter_provenance: hint?.provenance ?? null,
            chapter_confidence: hint ? CONFIDENCE[hint.provenance] : null,
            chapter_reason: hint?.reason ?? null,
          }),
    };
  }

  /** File không đổi: cập nhật module/vai trò/chương; đổi thì map lại LO. */
  private async refreshPlacement(doc: documents, entry: Entry, hint: ChapterHint | null) {
    const data: Record<string, unknown> = {};
    if (doc.lms_module !== entry.moduleName) data.lms_module = entry.moduleName;
    if (doc.lms_published !== entry.published) data.lms_published = entry.published;

    let remap = false;
    if (doc.role_provenance !== 'confirmed' && doc.role !== entry.cls.role) {
      data.role = entry.cls.role;
      remap = true;
    }
    if (doc.chapter_provenance !== 'confirmed') {
      const next = this.placementData(entry, hint, doc);
      const fromName = doc.chapter_provenance === 'module' || doc.chapter_provenance === 'file_name';
      // Chương khớp theo nội dung chỉ bị thay khi tên module/file nay ghi chương.
      if (hint ? next.chapter_code !== doc.chapter_code || next.chapter_provenance !== doc.chapter_provenance
               : fromName) {
        Object.assign(data, {
          chapter_code: next.chapter_code,
          chapter_provenance: next.chapter_provenance,
          chapter_confidence: next.chapter_confidence,
          chapter_reason: next.chapter_reason,
        });
        remap = true;
      }
    }

    if (Object.keys(data).length === 0) return false;
    await this.prisma.documents.update({ where: { document_id: doc.document_id }, data });
    if (remap) await this.enqueueRemap(doc);
    return true;
  }

  private async importFile(
    actor: SyncActor,
    courseId: string,
    entry: Entry,
    file: CanvasFile,
    name: string,
    hint: ChapterHint | null,
    previous?: documents,
  ) {
    const content = await this.canvas.downloadFile(file);
    const [{ id: documentId }] = await this.prisma.$queryRaw<Array<{ id: string }>>`SELECT uuidv7()::text AS id`;
    const storageKey = `documents/${courseId}/${documentId}/${safeFileName(name)}`;
    const mimeType = file['content-type'] || 'application/octet-stream';
    await this.storage.putObject(storageKey, content, mimeType);

    // Store the replacement before hiding the old version, so a storage outage
    // leaves the existing document available. The unique live-file index still
    // requires hiding it before creating the replacement database record.
    if (previous) {
      await this.documents.deleteCanvasDocument(courseId, previous.document_id);
    }

    const doc = await this.prisma.documents.create({
      data: {
        document_id: documentId,
        course_id: courseId,
        title: name.slice(0, 255),
        file_path: storageKey,
        mime_type: mimeType,
        checksum: createHash('sha256').update(content).digest('hex'),
        status: 'QUEUED',
        created_by: actor.kind === 'user' ? actor.userId : null,
        source: 'canvas',
        lms_file_id: entry.fileId,
        lms_module: entry.moduleName,
        lms_published: entry.published,
        lms_updated_at: file.updated_at ? new Date(file.updated_at) : null,
        ...this.placementData(entry, hint, previous),
      },
    });

    await this.enqueueProcessingOrMarkError(doc);
  }

  private async enqueueProcessingOrMarkError(doc: Pick<documents, 'document_id' | 'course_id' | 'created_by' | 'file_path'>) {
    try {
      await this.enqueueProcessing(doc);
    } catch (error) {
      // A later sync retries ERROR documents; QUEUED without a job would stick.
      await this.prisma.documents.update({ where: { document_id: doc.document_id }, data: { status: 'ERROR' } });
      throw error;
    }
  }

  private async enqueueProcessing(doc: Pick<documents, 'document_id' | 'course_id' | 'created_by' | 'file_path'>) {
    await this.processingQueue.add(
      'process_document',
      {
        document_id: doc.document_id,
        storage_key: doc.file_path,
        file_name: doc.file_path.split('/').pop(),
        language: 'vi',
        metadata: {
          course_id: doc.course_id,
          owner_id: doc.created_by,
          storage_key: doc.file_path,
        },
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }

  private async enqueueRemap(doc: documents) {
    await this.processingQueue.add(
      MAP_DOCUMENT_LOS_JOB,
      { document_id: doc.document_id, course_id: doc.course_id },
      { attempts: 1, removeOnComplete: 100, removeOnFail: 100 },
    );
  }
}
