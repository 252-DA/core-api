import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma } from '@prisma/client';
import type { Queue } from 'bullmq';
import { AuthzService } from '../../../auth/authz.service';
import type { BffClaims } from '../../../auth/bff-claims';
import { STAFF_ROLES } from '../../../common/constants/course-roles';
import { errorMessage } from '../../../common/utils/errors';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CanvasApiClient } from '../../../integrations/canvas/canvas-api.client';
import { describeCanvasError } from '../../../integrations/canvas/canvas-errors';
import { CanvasCourseService } from '../../../integrations/canvas/canvas-course.service';
import { QUESTION_BANK_SYNC_QUEUE } from '../../../messaging/queues';
import { BankAccessService } from '../bank-access.service';
import { USABLE_STATUSES } from '../question-bank.service';
import {
  buildQtiPackage,
  NO_LO_LABEL,
  qtiIdentifier,
  quizIdFromQuestionName,
  type QtiItem,
} from './qti';

export const QUESTION_BANK_EXPORT_JOB = 'export';
export type QuestionBankSyncJobData = { jobId: string };

/** Trạng thái job đang chạy: chưa xong thì không tạo job mới cho cùng ngân hàng. */
const ACTIVE_STATUSES = ['QUEUED', 'RUNNING', 'WAITING_LMS'];
// Job "đang chạy" mà quá lâu không cập nhật coi như chết (core-api restart giữa chừng).
const STALE_JOB_MS = 15 * 60_000;
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60_000;
const CANVAS_BANK_TITLE_MAX = 255;
const REPORT_MAX = 200;

type ExportTarget = { course_id: string };
type ReportEntry = { quiz_id?: string; reason: string };
type CanvasHit = {
  ext_question_id: string;
  ext_bank_id: string;
  ext_bank_title: string;
};

export type ExportCounts = {
  /** Câu lần đầu sang Canvas. */
  exported: number;
  /** Câu đã có bên Canvas, được ghi đè bằng bản hiện tại. */
  updated: number;
  /** Câu không đóng gói được (sai dạng đáp án, kiểu chưa hỗ trợ). */
  unsupported: number;
  /** Đã đóng gói nhưng không tìm thấy bên Canvas sau khi import. */
  failed: number;
  /** Câu đã ngừng dùng/xoá nhưng vẫn còn bên Canvas (phải xoá tay). */
  retired_on_canvas: number;
  canvas_issues: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tên ngân hàng bên Canvas: "<mã môn> · <mã LO> · <tên ngân hàng>" (thiết kế §8.2). */
export function canvasBankName(
  subjectCode: string | null,
  loCode: string | null,
  bankTitle: string,
): string {
  return [subjectCode, loCode ?? NO_LO_LABEL, bankTitle]
    .filter(Boolean)
    .join(' · ')
    .slice(0, CANVAS_BANK_TITLE_MAX);
}

/**
 * Xuất câu đã duyệt của một ngân hàng sang ngân hàng Classic của Canvas
 * (docs/question-bank-design.md §8; docs/ke-hoach-trien-khai-question-bank.md P4).
 * Chạy nền trong hàng đợi `question_bank_sync`; trạng thái ở `question_bank_sync_jobs`.
 */
@Injectable()
export class QuestionBankSyncService {
  private readonly logger = new Logger(QuestionBankSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly access: BankAccessService,
    private readonly canvas: CanvasApiClient,
    private readonly canvasCourses: CanvasCourseService,
    @InjectQueue(QUESTION_BANK_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Yêu cầu xuất: cần EDIT trên ngân hàng và là giảng viên/trợ giảng của khoá
   * đích (mặc định là khoá gốc của ngân hàng). Đang có job chưa xong thì trả
   * lại job đó thay vì tạo thêm.
   */
  async requestExport(
    claims: BffClaims,
    bankId: string,
    body: { courseId?: string },
  ) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    const courseId = body.courseId ?? bank.home_course_id;
    if (!isUuid(courseId)) {
      throw new BadRequestException('Khoá học đích không hợp lệ.');
    }
    await this.authz.assertCourseAccess(claims, courseId, STAFF_ROLES);
    // Ném 400 nếu khoá không mở từ Canvas: báo ngay, khỏi chờ job thất bại.
    await this.canvasCourses.contextId(courseId);
    const usable = await this.prisma.quiz_items.count({
      where: {
        bank_id: bank.bank_id,
        deleted_at: null,
        status: { in: USABLE_STATUSES },
      },
    });
    if (!usable) {
      throw new BadRequestException(
        'Ngân hàng chưa có câu đã duyệt để xuất sang Canvas.',
      );
    }
    const active = await this.prisma.question_bank_sync_jobs.findFirst({
      where: {
        bank_id: bank.bank_id,
        direction: 'EXPORT',
        status: { in: ACTIVE_STATUSES },
        updated_at: { gt: new Date(Date.now() - STALE_JOB_MS) },
      },
      orderBy: { created_at: 'desc' },
    });
    if (active) return active;

    const job = await this.prisma.question_bank_sync_jobs.create({
      data: {
        bank_id: bank.bank_id,
        direction: 'EXPORT',
        requested_by: claims.sub,
        target: { course_id: courseId } satisfies ExportTarget,
      },
    });
    await this.queue.add(
      QUESTION_BANK_EXPORT_JOB,
      { jobId: job.job_id } satisfies QuestionBankSyncJobData,
      // BullMQ không nhận ':' trong jobId tự đặt.
      {
        jobId: `qb-${job.job_id}`,
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    return job;
  }

  async getJob(claims: BffClaims, jobId: string) {
    if (!isUuid(jobId)) throw new NotFoundException('Không tìm thấy job.');
    const job = await this.prisma.question_bank_sync_jobs.findUnique({
      where: { job_id: jobId },
    });
    if (!job) throw new NotFoundException('Không tìm thấy job.');
    await this.access.assertRole(claims, job.bank_id, 'VIEW');
    return job;
  }

  async listJobs(claims: BffClaims, bankId: string) {
    const { bank } = await this.access.assertRole(claims, bankId, 'VIEW');
    return this.prisma.question_bank_sync_jobs.findMany({
      where: { bank_id: bank.bank_id },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
  }

  /** Ngân hàng Classic hiện có trong khoá Canvas của một khoá DA (để xem/nhập). */
  async listCanvasBanks(claims: BffClaims, courseId: string | undefined) {
    if (!isUuid(courseId)) {
      throw new BadRequestException('Khoá học không hợp lệ.');
    }
    await this.authz.assertCourseAccess(claims, courseId, STAFF_ROLES);
    const canvasCourseId = await this.canvasCourseId(courseId);
    const banks = await this.canvas.listQuestionBanks(canvasCourseId);
    return banks.map((b) => ({
      id: b.id,
      title: b.title,
      question_count: b.assessment_question_count ?? null,
    }));
  }

  /** Chạy một job (processor gọi). Lỗi ghi vào job, không ném lại, để BullMQ không thử lại. */
  async run(jobId: string) {
    const job = await this.prisma.question_bank_sync_jobs.findUnique({
      where: { job_id: jobId },
    });
    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') return;
    await this.update(jobId, { status: 'RUNNING', last_error: null });
    try {
      if (job.direction !== 'EXPORT') {
        throw new Error(`Chưa hỗ trợ job ${job.direction}.`);
      }
      await this.runExport(
        jobId,
        job.bank_id,
        job.target as unknown as ExportTarget,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Question bank sync ${jobId} failed: ${errorMessage(error)}`,
      );
      await this.update(jobId, {
        status: 'FAILED',
        last_error: describeCanvasError(error).slice(0, 2000),
      });
    }
  }

  private async runExport(jobId: string, bankId: string, target: ExportTarget) {
    const bank = await this.prisma.question_banks.findUniqueOrThrow({
      where: { bank_id: bankId },
      include: { courses: { select: { subject_code: true } } },
    });
    const items = await this.prisma.quiz_items.findMany({
      where: {
        bank_id: bankId,
        deleted_at: null,
        status: { in: USABLE_STATUSES },
      },
      select: {
        quiz_id: true,
        type: true,
        question: true,
        options: true,
        correct_answer: true,
        explanation: true,
        current_version_id: true,
        learning_outcomes: { select: { code: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    if (!items.length) {
      throw new Error('Ngân hàng chưa có câu đã duyệt để xuất sang Canvas.');
    }
    const subject = bank.subject_code ?? bank.courses.subject_code ?? null;
    const qtiItems: QtiItem[] = items.map((item) => {
      const loCode = item.learning_outcomes?.code ?? null;
      return {
        quiz_id: item.quiz_id,
        type: item.type,
        question: item.question,
        options: item.options,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        lo_code: loCode,
        bank_name: canvasBankName(subject, loCode, bank.title),
      };
    });
    const pkg = buildQtiPackage(`da-bank-${bankId}`, qtiItems);
    const report: ReportEntry[] = pkg.skipped.map((s) => ({
      quiz_id: s.quiz_id,
      reason: s.reason,
    }));
    if (!pkg.data) {
      throw new Error(
        `Không câu nào đóng gói được (${pkg.skipped.length} câu sai dạng hoặc chưa hỗ trợ).`,
      );
    }

    const canvasCourseId = await this.canvasCourseId(target.course_id);
    const { migrationId, progressUrl } = await this.canvas.startQtiImport(
      canvasCourseId,
      `da-bank-${bankId}.zip`,
      pkg.data,
    );
    await this.update(jobId, {
      status: 'WAITING_LMS',
      lms_migration_ids: [migrationId],
    });
    const progress = await this.waitForCanvas(progressUrl);
    const issues = await this.canvas
      .listMigrationIssues(canvasCourseId, migrationId)
      .catch(() => []);
    if (progress.workflow_state !== 'completed') {
      const detail =
        progress.message ??
        issues[0]?.description ??
        issues[0]?.error_message ??
        progress.workflow_state;
      throw new Error(`Canvas không import được gói QTI: ${detail}`);
    }

    // Khớp lại câu bên Canvas bằng `#<quiz_id>` trong question_name.
    const names = new Set(pkg.included.map((i) => i.bank_name));
    const canvasBanks = (
      await this.canvas.listQuestionBanks(canvasCourseId)
    ).filter((b) => names.has(b.title));
    const found = new Map<string, CanvasHit>();
    for (const cb of canvasBanks) {
      for (const q of await this.canvas.listBankQuestions(cb.id)) {
        const quizId = quizIdFromQuestionName(q.question_name);
        if (quizId && !found.has(quizId)) {
          found.set(quizId, {
            ext_question_id: String(q.id),
            ext_bank_id: String(cb.id),
            ext_bank_title: cb.title,
          });
        }
      }
    }

    const lmsBaseUrl = this.canvas.lmsBaseUrl();
    const context = {
      direction: 'EXPORT',
      lms_base_url: lmsBaseUrl,
      lms_context_type: 'course',
      lms_context_id: String(canvasCourseId),
    };
    const previous = new Set(
      (
        await this.prisma.question_lms_links.findMany({
          where: {
            ...context,
            quiz_id: { in: pkg.included.map((i) => i.quiz_id) },
          },
          select: { quiz_id: true },
        })
      ).map((l) => l.quiz_id),
    );
    const versionOf = new Map(
      items.map((i) => [i.quiz_id, i.current_version_id] as const),
    );
    const counts: ExportCounts = {
      exported: 0,
      updated: 0,
      unsupported: pkg.skipped.length,
      failed: 0,
      retired_on_canvas: 0,
      canvas_issues: issues.length,
    };
    for (const item of pkg.included) {
      const hit = found.get(item.quiz_id);
      const versionId = versionOf.get(item.quiz_id);
      if (!hit || !versionId) {
        counts.failed += 1;
        report.push({
          quiz_id: item.quiz_id,
          reason: 'Không tìm thấy câu bên Canvas sau khi import.',
        });
        continue;
      }
      await this.prisma.question_lms_links.upsert({
        where: {
          uq_question_lms_link: { quiz_id: item.quiz_id, ...context },
        },
        create: {
          quiz_id: item.quiz_id,
          version_id: versionId,
          ...context,
          migration_id: qtiIdentifier(item.quiz_id),
          ...hit,
        },
        update: { version_id: versionId, synced_at: new Date(), ...hit },
      });
      if (previous.has(item.quiz_id)) counts.updated += 1;
      else counts.exported += 1;
    }

    // Câu đã đẩy trước đây nhưng giờ ngừng dùng/xoá: Canvas không tự xoá
    // (importer chỉ xoá câu thừa khi import từ Blueprint), giảng viên xoá tay.
    const leftovers = await this.prisma.question_lms_links.findMany({
      where: {
        ...context,
        quiz_items: {
          bank_id: bankId,
          OR: [{ deleted_at: { not: null } }, { status: 'RETIRED' }],
        },
      },
      select: { quiz_id: true, ext_bank_title: true },
    });
    counts.retired_on_canvas = leftovers.length;
    for (const l of leftovers) {
      report.push({
        quiz_id: l.quiz_id,
        reason: `Câu đã ngừng dùng nhưng vẫn còn trong ngân hàng Canvas "${l.ext_bank_title ?? ''}"; xoá tay bên Canvas nếu cần.`,
      });
    }
    for (const issue of issues) {
      report.push({
        reason: `Canvas: ${issue.description ?? issue.error_message ?? issue.issue_type ?? 'lỗi không rõ'}`,
      });
    }

    await this.update(jobId, {
      status: 'COMPLETED',
      counts,
      report: report.slice(0, REPORT_MAX),
    });
    this.logger.log(
      `Question bank ${bankId} exported to Canvas course ${canvasCourseId}: ${JSON.stringify(counts)}`,
    );
  }

  private async waitForCanvas(progressUrl: string) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      const progress = await this.canvas.getProgress(progressUrl);
      if (
        progress.workflow_state === 'completed' ||
        progress.workflow_state === 'failed'
      ) {
        return progress;
      }
      if (Date.now() > deadline) {
        throw new Error(
          'Canvas import quá 10 phút chưa xong; kiểm tra container jobs của Canvas.',
        );
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }

  private async canvasCourseId(courseId: string) {
    const context = await this.canvasCourses.contextId(courseId);
    return (await this.canvas.getCourseByLtiContext(context)).id;
  }

  private update(
    jobId: string,
    data: Prisma.question_bank_sync_jobsUpdateInput,
  ) {
    return this.prisma.question_bank_sync_jobs.update({
      where: { job_id: jobId },
      data: { ...data, updated_at: new Date() },
    });
  }
}
