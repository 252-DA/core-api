import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AGS_CONFIG, type AgsConfig } from '../ags/ags.config';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { PrismaService } from '../prisma/prisma.service';
import { ESSAY_STATUS, type EssayAsset, normalizeProcessorInput } from './essay-grading';
import { asGatewayError, LtiServicesClient } from './lti-services.client';

/** Web gọi ReceiveAssetNotices bằng danh tính hệ thống này: thông báo không có phiên người dùng. */
export const NOTICE_SUBJECT = 'lti-notice';

/** Thông báo bài nộp web đã xác minh chữ ký (web/src/app/api/lti/notices/route.ts). */
export type VerifiedNotice = {
  noticeId: string;
  processorId: string;
  submissionId: string;
  userSub: string;
  reportUrl: string;
  assets: Array<{
    asset_id: string;
    url: string;
    title?: string | null;
    content_type?: string | null;
    size?: number | null;
    sha256_checksum?: string | null;
  }>;
};

const TEACHER_ROLES = ['instructor', 'ta'];

@Injectable()
export class EssayProcessorService {
  private readonly logger = new Logger(EssayProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly lti: LtiServicesClient,
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
  ) {}

  /**
   * Giảng viên gắn công cụ vào một Assignment. Phải đăng ký địa chỉ nhận
   * thông báo trước khi trả content item về Canvas: Canvas không gửi lại
   * thông báo đã lỡ.
   */
  async createProcessor(claims: BffClaims, body: Record<string, unknown>) {
    const courseId = typeof body.courseId === 'string' ? body.courseId : '';
    await this.authz.assertCourseAccess(claims, courseId, TEACHER_ROLES);
    const input = normalizeProcessorInput(body);
    const pnsUrl = typeof body.pnsUrl === 'string' ? body.pnsUrl : '';
    const handlerUrl = typeof body.handlerUrl === 'string' ? body.handlerUrl : '';
    if (!this.lti.isPlatformUrl(pnsUrl)) {
      throw new BadRequestException('Canvas không gửi địa chỉ Platform Notification Service hợp lệ.');
    }
    if (!/^https:\/\//.test(handlerUrl)) {
      throw new BadRequestException('Địa chỉ nhận thông báo phải là HTTPS công khai.');
    }
    if (!this.config.clientId) {
      throw new BadRequestException('core-api chưa cấu hình LTI_CLIENT_ID.');
    }

    try {
      await this.lti.registerNoticeHandler(pnsUrl, handlerUrl);
    } catch (error) {
      throw asGatewayError(error, 'đăng ký nhận bài nộp với Canvas được');
    }

    const processor = await this.prisma.essay_processors.create({
      data: {
        course_id: courseId,
        lti_client_id: this.config.clientId,
        lms_activity_id: typeof body.activityId === 'string' ? body.activityId.slice(0, 255) : null,
        title: input.title,
        instructions: input.instructions,
        rubric: input.rubric as Prisma.InputJsonValue,
        max_score: input.maxScore,
        visible_to_owner: input.visibleToOwner,
        created_by: claims.sub,
      },
    });
    return this.view(processor);
  }

  async updateProcessor(claims: BffClaims, body: Record<string, unknown>) {
    const processor = await this.processorFor(claims, body.processorId);
    const input = normalizeProcessorInput(body);
    const updated = await this.prisma.essay_processors.update({
      where: { processor_id: processor.processor_id },
      data: {
        title: input.title,
        instructions: input.instructions,
        rubric: input.rubric as Prisma.InputJsonValue,
        max_score: input.maxScore,
        visible_to_owner: input.visibleToOwner,
        updated_at: new Date(),
      },
    });
    return this.view(updated);
  }

  async getProcessor(claims: BffClaims, processorId: unknown) {
    return this.view(await this.processorFor(claims, processorId));
  }

  /**
   * Ghi thông báo bài nộp; tải file và giao chấm là việc của
   * EssayReportPublisherService, để web trả lời Canvas ngay (Canvas không
   * gửi lại thông báo khi handler chậm hay lỗi).
   */
  async receiveNotices(claims: BffClaims, body: { notices?: VerifiedNotice[] }) {
    if (claims.scope !== 'admin' || claims.sub !== NOTICE_SUBJECT) {
      throw new ForbiddenException('Chỉ web được chuyển thông báo của Canvas.');
    }
    const notices = Array.isArray(body.notices) ? body.notices : [];
    const processorIds = [...new Set(notices.map((n) => n.processorId).filter(isUuid))];
    const processors = await this.prisma.essay_processors.findMany({
      where: { processor_id: { in: processorIds } },
      select: { processor_id: true },
    });
    const known = new Set(processors.map((p) => p.processor_id));
    const subs = [...new Set(notices.map((n) => n.userSub))];
    const users = await this.prisma.lms_user_mappings.findMany({
      where: { lms_sub: { in: subs }, deleted_at: null },
      select: { internal_user_id: true, lms_sub: true },
    });
    const userBySub = new Map(users.map((u) => [u.lms_sub, u.internal_user_id]));

    const rows: Prisma.essay_submissionsCreateManyInput[] = [];
    for (const notice of notices) {
      if (!known.has(notice.processorId)) {
        this.logger.warn(`Bỏ thông báo ${notice.noticeId}: processor ${notice.processorId} không tồn tại`);
        continue;
      }
      const assets = (notice.assets ?? []).filter((a) => a.asset_id && this.lti.isPlatformUrl(a.url));
      if (!this.lti.isPlatformUrl(notice.reportUrl) || assets.length === 0) {
        this.logger.warn(`Bỏ thông báo ${notice.noticeId}: thiếu file hoặc địa chỉ báo cáo hợp lệ`);
        continue;
      }
      rows.push({
        processor_id: notice.processorId,
        notice_id: notice.noticeId.slice(0, 255),
        lms_submission_id: notice.submissionId.slice(0, 255),
        lms_user_sub: notice.userSub.slice(0, 255),
        user_id: userBySub.get(notice.userSub) ?? null,
        report_url: notice.reportUrl,
        assets: assets.map(
          (a): EssayAsset => ({
            asset_id: a.asset_id,
            url: a.url,
            title: a.title ?? null,
            content_type: a.content_type ?? null,
            size: typeof a.size === 'number' ? a.size : null,
            sha256: a.sha256_checksum ?? null,
          }),
        ) as Prisma.InputJsonValue,
        status: ESSAY_STATUS.received,
      });
    }
    const { count } = rows.length
      ? await this.prisma.essay_submissions.createMany({ data: rows, skipDuplicates: true })
      : { count: 0 };
    return { received: notices.length, accepted: count };
  }

  /**
   * Chi tiết chấm cho trang "View report" (LtiReportReviewRequest): giảng viên
   * của khoá, hoặc chính sinh viên nộp bài khi processor cho phép xem.
   */
  async getReport(claims: BffClaims, body: { submissionId?: unknown; userSub?: unknown }) {
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
    const rows = await this.prisma.essay_submissions.findMany({
      where: { lms_submission_id: submissionId },
      include: { essay_processors: true },
      orderBy: { received_at: 'desc' },
    });
    if (!rows.length) throw new NotFoundException('Chưa có kết quả chấm cho lần nộp này.');

    const courseId = rows[0].essay_processors.course_id;
    const isTeacher = await this.authz
      .assertCourseAccess(claims, courseId, TEACHER_ROLES)
      .then(() => true)
      .catch(() => false);
    const visible = rows.filter(
      (row) =>
        isTeacher ||
        (row.essay_processors.visible_to_owner &&
          typeof body.userSub === 'string' &&
          row.lms_user_sub === body.userSub &&
          (row.user_id === null || row.user_id === claims.sub)),
    );
    if (!visible.length) throw new ForbiddenException('Bạn không xem được báo cáo này.');

    return visible.map((row) => ({
      title: row.essay_processors.title,
      max_score: Number(row.essay_processors.max_score),
      rubric: row.essay_processors.rubric,
      status: row.status,
      result: row.result,
      error: isTeacher ? row.error : null,
      received_at: row.received_at,
      is_teacher: isTeacher,
    }));
  }

  private async processorFor(claims: BffClaims, processorId: unknown) {
    if (!isUuid(processorId)) throw new BadRequestException('Thiếu mã bộ chấm.');
    const processor = await this.prisma.essay_processors.findUnique({
      where: { processor_id: processorId },
    });
    if (!processor) throw new NotFoundException('Không tìm thấy bộ chấm.');
    await this.authz.assertCourseAccess(claims, processor.course_id, TEACHER_ROLES);
    return processor;
  }

  private view(p: {
    processor_id: string;
    course_id: string;
    title: string;
    instructions: string;
    rubric: Prisma.JsonValue;
    max_score: Prisma.Decimal | number;
    visible_to_owner: boolean;
  }) {
    return {
      processor_id: p.processor_id,
      course_id: p.course_id,
      title: p.title,
      instructions: p.instructions,
      rubric: p.rubric,
      max_score: Number(p.max_score),
      visible_to_owner: p.visible_to_owner,
    };
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}
