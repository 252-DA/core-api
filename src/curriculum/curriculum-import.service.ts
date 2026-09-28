import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import type { BffClaims } from '../auth/bff-claims';
import { AuthzService } from '../auth/authz.service';
import { DocumentStorageService } from '../document/document-storage.service';
import { CanvasApiClient } from '../canvas/canvas-api.client';
import { CanvasCourseService } from '../canvas/canvas-course.service';
import { fileIdsInSyllabus, pickSyllabusFile, type CanvasFile } from './syllabus-file';

const MANAGE_ROLES = ['instructor', 'ta'];
// Worker trích xuất bằng luật, cùng file cho cùng kết quả: đồng bộ lại mà file
// không đổi thì dùng lại lần nạp trước, trừ khi lần đó lỗi.
const REUSABLE_STATUSES = ['QUEUED', 'EXTRACTING', 'READY', 'BLOCKED', 'APPLYING', 'APPLIED'];

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 160) || 'syllabus.pdf';
}

@Injectable()
export class CurriculumImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    private readonly storage: DocumentStorageService,
    @InjectQueue('document_processing') private readonly processingQueue: Queue,
  ) {}

  /**
   * Lấy file đề cương đính kèm trong trang Chương trình học của khoá Canvas
   * tương ứng, lưu vào object storage và giao worker trích bản xem trước.
   * Chưa ghi gì vào đề cương đang dùng cho tới khi giảng viên áp dụng.
   */
  async syncFromCanvas(claims: BffClaims, courseId: string) {
    await this.authz.assertCourseAccess(claims, courseId, MANAGE_ROLES);
    const ltiContextId = await this.canvasCourses.contextId(courseId);

    const canvasCourse = await this.canvas.getCourseByLtiContext(ltiContextId);
    const fileIds = fileIdsInSyllabus(canvasCourse.syllabus_body);
    if (fileIds.length === 0) {
      throw new BadRequestException(
        'Trang Chương trình học trên Canvas chưa đính kèm file đề cương (PDF).',
      );
    }

    const files: CanvasFile[] = [];
    for (const fileId of fileIds) {
      files.push(await this.canvas.getFile(fileId));
    }
    const file = pickSyllabusFile(files);
    if (!file) {
      throw new BadRequestException(
        'Trang Chương trình học có đính kèm file nhưng không có file PDF nào. Hiện chỉ đọc được đề cương dạng PDF.',
      );
    }

    const content = await this.canvas.downloadFile(file);
    const checksum = createHash('sha256').update(content).digest('hex');
    const sourceRef = String(file.id);

    const previous = await this.prisma.curriculum_imports.findFirst({
      where: { course_id: courseId, source: 'canvas', source_ref: sourceRef, checksum },
      orderBy: { created_at: 'desc' },
    });
    if (previous && REUSABLE_STATUSES.includes(previous.status)) {
      return { ...previous, reused: true };
    }

    const [{ id: importId }] = await this.prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT uuidv7()::text AS id`;
    const fileName = file.display_name || file.filename || `canvas-file-${sourceRef}.pdf`;
    const mimeType = file['content-type'] || 'application/pdf';
    const storageKey = `curricula/${courseId}/${importId}/${safeFileName(fileName)}`;
    await this.storage.putObject(storageKey, content, mimeType);

    const created = await this.prisma.curriculum_imports.create({
      data: {
        import_id: importId,
        course_id: courseId,
        source: 'canvas',
        source_ref: sourceRef,
        file_name: fileName.slice(0, 255),
        storage_key: storageKey,
        mime_type: mimeType,
        checksum,
        size_bytes: content.length,
        status: 'QUEUED',
        requested_by: claims.sub,
      },
    });

    await this.processingQueue.add(
      'curriculum_preview',
      { import_id: created.import_id },
      { attempts: 1, removeOnComplete: 100, removeOnFail: 100 },
    );
    return { ...created, reused: false };
  }

  async listImports(claims: BffClaims, courseId: string, limit = 10) {
    await this.authz.assertCourseAccess(claims, courseId, MANAGE_ROLES);
    return this.prisma.curriculum_imports.findMany({
      where: { course_id: courseId },
      orderBy: { created_at: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
    });
  }

  /** Ghi bản đã duyệt vào đề cương đang dùng (chapters, learning_outcomes, ...). */
  async applyImport(claims: BffClaims, importId: string) {
    const found = await this.prisma.curriculum_imports.findUnique({
      where: { import_id: importId },
    });
    if (!found) {
      throw new NotFoundException(`Không tìm thấy lần nạp đề cương ${importId}.`);
    }
    await this.authz.assertCourseAccess(claims, found.course_id, MANAGE_ROLES);

    // Chuyển trạng thái có điều kiện để hai lần bấm không xếp hai job.
    const { count } = await this.prisma.curriculum_imports.updateMany({
      where: { import_id: importId, status: 'READY' },
      data: { status: 'APPLYING', applied_by: claims.sub, error: null, updated_at: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException(
        `Chỉ áp dụng được bản xem trước đã sẵn sàng (đang ở trạng thái ${found.status}).`,
      );
    }

    await this.processingQueue.add(
      'curriculum_apply',
      { import_id: importId },
      { attempts: 1, removeOnComplete: 100, removeOnFail: 100 },
    );
    return this.prisma.curriculum_imports.findUnique({ where: { import_id: importId } });
  }
}
