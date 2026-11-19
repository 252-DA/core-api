import { createHash } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { STAFF_ROLES } from '../../../common/constants/course-roles';
import { errorNameAndMessage } from '../../../common/utils/errors';
import { safeFileName } from '../../../common/utils/file-name';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { BffClaims } from '../../../auth/bff-claims';
import { AuthzService } from '../../../auth/authz.service';
import { DocumentStorageService } from '../../../infra/storage/document-storage.service';
import {
  CanvasApiClient,
  type CanvasFile,
} from '../../../integrations/canvas/canvas-api.client';
import { CanvasCourseService } from '../../../integrations/canvas/canvas-course.service';
import { COURSE_CHUNK_LO_REMAP_REQUESTED } from '../../../messaging/event-types';
import { DOCUMENT_PROCESSING_QUEUE } from '../../../messaging/queues';
import { fileIdsInSyllabus, pickSyllabusFile } from '../domain/syllabus-file';
import {
  curriculumProblems,
  hasBlockingIssues,
  type NormalizedCurriculum,
} from '../handlers/curriculum-payload';
import { writeCurriculum } from './curriculum-writer';

/** Job xếp thẳng (không qua outbox) khi tạo một lần nạp đề cương. */
export const CURRICULUM_PREVIEW_JOB = 'curriculum_preview';

const MANAGE_ROLES = STAFF_ROLES;
// Worker trích xuất bằng luật, cùng file cho cùng kết quả: đồng bộ lại mà file
// không đổi thì dùng lại lần nạp trước, trừ khi lần đó lỗi.
const REUSABLE_STATUSES = [
  'QUEUED',
  'EXTRACTING',
  'READY',
  'BLOCKED',
  'APPLYING',
  'APPLIED',
];
// Trạng thái chờ kết quả xem trước của worker.
const AWAITING_PREVIEW_STATUSES = ['QUEUED', 'EXTRACTING'];
// Lần nạp chờ kết quả quá lâu thì coi như mất kết quả, không tái dùng nữa. Trích
// bản xem trước bằng luật xong trong giây lát (job tối đa 3 lần thử, backoff
// 5s/10s); 30 phút dư cho cả hàng đợi dài và PDF lớn, mà vẫn đủ ngắn để giảng
// viên bấm đồng bộ lại là có lần nạp mới. Nếu không, một lần nạp QUEUED mà kết
// quả mất hẳn (job bị xoá khỏi Redis, kết quả hỏng không gỡ được) bị tái dùng
// mãi và không còn cách nào nạp lại cùng file.
const STALE_AWAITING_MS = 30 * 60_000;
// Gửi kết quả lỗi (Redis) thì job xem trước fail và chạy lại; parse lại cho
// cùng kết quả, cùng result_id nên không sinh bản trùng.
const PREVIEW_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: 100,
  removeOnFail: 100,
};
// Ghi ~10 câu INSERT nhiều dòng; DB dev ở xa (Tailscale) nên nới hạn 5s mặc định.
const APPLY_TRANSACTION = { maxWait: 10_000, timeout: 30_000 };
const MAX_ERROR = 2000;

/**
 * Mọi cột trừ `curriculum` (bản đề cương đầy đủ, vài chục KB): danh sách lần
 * nạp và kết quả trả về web không cần nó.
 */
const IMPORT_SUMMARY = {
  import_id: true,
  course_id: true,
  source: true,
  source_ref: true,
  file_name: true,
  storage_key: true,
  mime_type: true,
  checksum: true,
  size_bytes: true,
  status: true,
  preview: true,
  error: true,
  requested_by: true,
  applied_by: true,
  created_at: true,
  updated_at: true,
  applied_at: true,
} satisfies Prisma.curriculum_importsSelect;

type ImportSummary = Prisma.curriculum_importsGetPayload<{
  select: typeof IMPORT_SUMMARY;
}>;

@Injectable()
export class CurriculumImportService {
  private readonly logger = new Logger(CurriculumImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    private readonly storage: DocumentStorageService,
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly processingQueue: Queue,
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
      where: {
        course_id: courseId,
        source: 'canvas',
        source_ref: sourceRef,
        checksum,
      },
      orderBy: { created_at: 'desc' },
      select: IMPORT_SUMMARY,
    });
    if (previous && REUSABLE_STATUSES.includes(previous.status)) {
      if (!(await this.abandonIfStale(previous))) {
        return { ...previous, reused: true };
      }
      // Lần nạp quá hạn đã chuyển FAILED: tạo lần nạp mới bên dưới.
    }

    const [{ id: importId }] = await this.prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT uuidv7()::text AS id`;
    const fileName =
      file.display_name || file.filename || `canvas-file-${sourceRef}.pdf`;
    const mimeType = file['content-type'] || 'application/pdf';
    const storageKey = `curricula/${courseId}/${importId}/${safeFileName(fileName, 'syllabus.pdf')}`;
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
      select: IMPORT_SUMMARY,
    });

    await this.enqueuePreview(created);
    return { ...created, reused: false };
  }

  /**
   * Lần nạp còn chờ kết quả xem trước mà đã quá STALE_AWAITING_MS kể từ lần đổi
   * trạng thái cuối thì chuyển FAILED (UPDATE có điều kiện: kết quả vừa tới thì
   * không đè) để kết quả muộn của nó, nếu có, không sống lại sau khi đã có lần nạp
   * mới. Trả true khi lần nạp không còn dùng lại được.
   */
  private async abandonIfStale(previous: ImportSummary): Promise<boolean> {
    if (!AWAITING_PREVIEW_STATUSES.includes(previous.status)) return false;
    const idleSince = new Date(previous.updated_at).getTime();
    if (Number.isNaN(idleSince) || Date.now() - idleSince < STALE_AWAITING_MS) {
      return false;
    }
    const { count } = await this.prisma.curriculum_imports.updateMany({
      where: {
        import_id: previous.import_id,
        status: { in: AWAITING_PREVIEW_STATUSES },
        updated_at: { lt: new Date(Date.now() - STALE_AWAITING_MS) },
      },
      data: {
        status: 'FAILED',
        error: `Không nhận được kết quả trích xuất sau ${STALE_AWAITING_MS / 60_000} phút; đã tạo lần nạp mới.`,
        updated_at: new Date(),
      },
    });
    if (count === 0) {
      // Vừa có kết quả (hoặc đổi trạng thái) giữa lúc đọc và lúc ghi: dùng lại.
      return false;
    }
    this.logger.warn(
      `Lần nạp đề cương ${previous.import_id} chờ kết quả quá ${STALE_AWAITING_MS / 60_000} phút (${previous.status}): chuyển FAILED, nạp lại file`,
    );
    return true;
  }

  async listImports(claims: BffClaims, courseId: string, limit = 10) {
    await this.authz.assertCourseAccess(claims, courseId, MANAGE_ROLES);
    return this.prisma.curriculum_imports.findMany({
      where: { course_id: courseId },
      orderBy: { created_at: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
      select: IMPORT_SUMMARY,
    });
  }

  /**
   * Ghi bản đã duyệt vào đề cương đang dùng (chapters, learning_outcomes, ...)
   * trong MỘT transaction: chuyển lần nạp sang APPLIED, ghi 9 bảng từ đúng bản
   * đề cương worker đã gửi lúc xem trước (không parse lại), và phát lệnh outbox
   * cho worker map lại chunk → LO của học phần. Lỗi ở bất cứ bước nào thì
   * không có gì được ghi và lần nạp vẫn READY.
   */
  async applyImport(claims: BffClaims, importId: string) {
    const found = await this.prisma.curriculum_imports.findUnique({
      where: { import_id: importId },
      select: { ...IMPORT_SUMMARY, curriculum: true },
    });
    if (!found) {
      throw new NotFoundException(
        `Không tìm thấy lần nạp đề cương ${importId}.`,
      );
    }
    await this.authz.assertCourseAccess(claims, found.course_id, MANAGE_ROLES);

    if (found.status !== 'READY') {
      throw new BadRequestException(
        `Chỉ áp dụng được bản xem trước đã sẵn sàng (đang ở trạng thái ${found.status}).`,
      );
    }
    if (found.curriculum === null) {
      return this.reextractLegacyImport(found);
    }
    const problems = curriculumProblems(found.curriculum);
    if (problems.length) {
      // Handler đã kiểm lúc nhận; tới đây là dữ liệu trong DB bị sửa tay.
      throw new InternalServerErrorException(
        `Bản đề cương đã lưu của lần nạp ${importId} sai dạng: ${problems.slice(0, 5).join('; ')}`,
      );
    }
    const curriculum = found.curriculum as unknown as NormalizedCurriculum;
    if (hasBlockingIssues(curriculum)) {
      // Cổng duyệt cấu trúc (trước ở IngestCurriculumUseCase.execute).
      throw new BadRequestException(
        'Đề cương còn lỗi cấu trúc nên không áp dụng được.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Chuyển trạng thái trước tiên: khoá dòng, lần bấm thứ hai chờ rồi thấy
        // APPLIED và dừng, không ghi đề cương hai lần.
        const claimed = await tx.curriculum_imports.updateMany({
          where: { import_id: importId, status: 'READY' },
          data: {
            status: 'APPLIED',
            applied_by: claims.sub,
            applied_at: new Date(),
            error: null,
            updated_at: new Date(),
          },
        });
        if (claimed.count === 0) {
          throw new BadRequestException(
            'Lần nạp này vừa được áp dụng hoặc đổi trạng thái; hãy tải lại trang.',
          );
        }
        await writeCurriculum(tx, found.course_id, curriculum);
        await tx.outbox_events.create({
          data: {
            event_type: COURSE_CHUNK_LO_REMAP_REQUESTED,
            aggregate_type: 'course',
            aggregate_id: found.course_id,
            payload: { course_id: found.course_id, import_id: importId },
          },
        });
      }, APPLY_TRANSACTION);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw await this.applyFailed(importId, err);
    }
    return this.prisma.curriculum_imports.findUnique({
      where: { import_id: importId },
      select: IMPORT_SUMMARY,
    });
  }

  /**
   * Lần nạp tạo trước khi core-api tự ghi đề cương chỉ có bản xem trước, không
   * có bản đề cương đầy đủ. Không parse lại rồi ghi ngay (bản ghi có thể khác
   * bản đã duyệt): trích xuất lại để giảng viên duyệt bản mới rồi áp dụng.
   */
  private async reextractLegacyImport(found: ImportSummary): Promise<never> {
    const { count } = await this.prisma.curriculum_imports.updateMany({
      where: {
        import_id: found.import_id,
        status: 'READY',
        curriculum: { equals: Prisma.DbNull },
      },
      data: {
        status: 'QUEUED',
        preview: Prisma.DbNull,
        error: null,
        updated_at: new Date(),
      },
    });
    if (count === 1) await this.enqueuePreview(found);
    throw new BadRequestException(
      'Bản xem trước này được tạo trước khi đổi cách áp dụng đề cương nên chưa có đủ dữ liệu để ghi. ' +
        'Hệ thống đang trích xuất lại; hãy kiểm tra bản xem trước mới rồi áp dụng.',
    );
  }

  private async enqueuePreview(
    record: Pick<
      ImportSummary,
      'import_id' | 'course_id' | 'file_name' | 'storage_key'
    >,
  ) {
    // Job mang đủ dữ liệu để worker không phải đọc curriculum_imports.
    await this.processingQueue.add(
      CURRICULUM_PREVIEW_JOB,
      {
        import_id: record.import_id,
        course_id: record.course_id,
        file_name: record.file_name,
        storage_key: record.storage_key,
      },
      PREVIEW_JOB_OPTIONS,
    );
  }

  /** Ghi lỗi lên lần nạp (vẫn READY để bấm lại được) và trả lỗi cho người gọi. */
  private async applyFailed(importId: string, err: unknown): Promise<Error> {
    const raw = errorNameAndMessage(err);
    this.logger.error(`Áp dụng đề cương ${importId} thất bại: ${raw}`);
    const message = `Không ghi được đề cương: ${raw}`.slice(0, MAX_ERROR);
    try {
      await this.prisma.curriculum_imports.updateMany({
        where: { import_id: importId, status: 'READY' },
        data: { error: message, updated_at: new Date() },
      });
    } catch (recordErr) {
      this.logger.warn(
        `Không ghi được lỗi lên lần nạp ${importId}: ${errorNameAndMessage(recordErr)}`,
      );
    }
    return new InternalServerErrorException(message);
  }
}
