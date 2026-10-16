import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AGS_CONFIG, type AgsConfig } from '../ags/ags.config';
import { DocumentStorageService } from '../document/document-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  assetExtension,
  ESSAY_STATUS,
  essayGradingEvent,
  type EssayAsset,
  type EssayResult,
  failedReport,
  gradedReport,
  processingReport,
} from './essay-grading';
import { LtiServiceError, LtiServicesClient } from './lti-services.client';

const BATCH = 5;
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 60 * 60_000;

type Row = Prisma.essay_submissionsGetPayload<{ include: { essay_processors: true } }>;

/**
 * Các bước của một bài nộp nằm ngoài worker vì cần token LTI của tool:
 *
 *   RECEIVED → gửi báo cáo "Processing", tải file về MinIO, phát
 *              ESSAY_GRADING_REQUESTED cho worker → QUEUED
 *   GRADED   → gửi báo cáo điểm gợi ý về SpeedGrader → REPORTED
 *   FAILED   → gửi báo cáo lỗi (một lần) để giảng viên biết phải chấm tay
 *
 * Worker chỉ đọc file từ MinIO và ghi kết quả vào DB, không biết gì về LMS.
 * Mỗi thành viên dùng chung DB có tool LTI riêng, nên chỉ nhặt dòng có
 * lti_client_id của chính core-api này.
 */
@Injectable()
export class EssayReportPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EssayReportPublisherService.name);
  private running = false;
  private warnedMissingTable = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = Number(process.env.ESSAY_POLL_INTERVAL_MS) || 10_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly lti: LtiServicesClient,
    private readonly storage: DocumentStorageService,
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
  ) {}

  onModuleInit() {
    if (!this.config.enabled || !this.config.clientId) {
      this.logger.warn('Chấm bài luận (Asset Processor) đang TẮT: thiếu danh tính LTI hoặc AGS_ENABLED=false.');
      return;
    }
    this.running = true;
    void this.loop();
  }

  onModuleDestroy() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private async loop() {
    if (!this.running) return;
    let delay = this.intervalMs;
    try {
      await this.tick();
      this.warnedMissingTable = false;
    } catch (error) {
      // P2021: bảng chưa có vì migration chưa chạy — báo một lần rồi chờ lâu hơn.
      if ((error as { code?: string }).code === 'P2021') {
        if (!this.warnedMissingTable) {
          this.logger.warn('Chưa có bảng essay_submissions: chạy prisma migrate deploy để bật chấm bài luận.');
          this.warnedMissingTable = true;
        }
        delay = 60_000;
      } else {
        this.logger.error('Vòng xử lý bài luận lỗi', error as Error);
      }
    }
    if (this.running) this.timer = setTimeout(() => void this.loop(), delay);
  }

  async tick() {
    for (const row of await this.due(ESSAY_STATUS.received)) await this.fetchAndQueue(row);
    for (const row of await this.due(ESSAY_STATUS.graded)) await this.reportGraded(row);
    for (const row of await this.due(ESSAY_STATUS.failed, { reported_at: null })) await this.reportFailure(row);
  }

  private due(status: string, extra: Prisma.essay_submissionsWhereInput = {}) {
    return this.prisma.essay_submissions.findMany({
      where: {
        status,
        essay_processors: { lti_client_id: this.config.clientId },
        OR: [{ next_attempt_at: null }, { next_attempt_at: { lte: new Date() } }],
        ...extra,
      },
      include: { essay_processors: true },
      orderBy: { received_at: 'asc' },
      take: BATCH,
    });
  }

  async fetchAndQueue(row: Row) {
    const assets = row.assets as unknown as EssayAsset[];
    // Báo cho giảng viên biết bài đang được chấm; lỗi ở bước này không chặn việc chấm.
    for (const asset of assets) {
      await this.lti
        .postReport(row.report_url, processingReport({ assetId: asset.asset_id, timestamp: new Date().toISOString() }))
        .catch((error: unknown) => this.logger.warn(`Báo cáo Processing lỗi (${row.essay_submission_id}): ${message(error)}`));
    }

    try {
      const stored: EssayAsset[] = [];
      for (const asset of assets) {
        const { content, contentType } = await this.lti.downloadAsset(asset.url);
        const withType = { ...asset, content_type: asset.content_type || contentType };
        const key = `essay-submissions/${row.essay_submission_id}/${asset.asset_id}${assetExtension(withType)}`;
        await this.storage.putObject(key, content, withType.content_type || 'application/octet-stream');
        stored.push({ ...withType, size: content.length, storage_key: key });
      }
      await this.prisma.$transaction(async (tx) => {
        await tx.essay_submissions.update({
          where: { essay_submission_id: row.essay_submission_id },
          data: {
            status: ESSAY_STATUS.queued,
            assets: stored as unknown as Prisma.InputJsonValue,
            attempts: 0,
            next_attempt_at: null,
            error: null,
            updated_at: new Date(),
          },
        });
        await tx.outbox_events.create({
          data: essayGradingEvent(row.essay_submission_id, row.essay_processors.course_id),
        });
      });
      this.logger.log(`Đã tải ${stored.length} file của bài nộp ${row.lms_submission_id}, giao worker chấm`);
    } catch (error) {
      const tooLarge = error instanceof LtiServiceError && error.status === 413;
      await this.retryOrFail(row, error, tooLarge ? 'ASSET_TOO_LARGE' : 'DOWNLOAD_FAILED', tooLarge);
    }
  }

  async reportGraded(row: Row) {
    const assets = row.assets as unknown as EssayAsset[];
    const result = row.result as unknown as EssayResult;
    try {
      for (const asset of assets) {
        await this.lti.postReport(
          row.report_url,
          gradedReport({ assetId: asset.asset_id, timestamp: new Date().toISOString() }, result, {
            visibleToOwner: row.essay_processors.visible_to_owner,
            assetCount: assets.length,
          }),
        );
      }
      await this.mark(row, { status: ESSAY_STATUS.reported, reported_at: new Date(), attempts: 0, next_attempt_at: null });
      this.logger.log(`Đã gửi điểm gợi ý ${result.score}/${result.max_score} cho bài nộp ${row.lms_submission_id}`);
    } catch (error) {
      // Kết quả vẫn nằm trong DB: thử lại mãi với nhịp thưa dần, không bỏ.
      await this.mark(row, {
        attempts: row.attempts + 1,
        next_attempt_at: new Date(Date.now() + backoff(row.attempts)),
        error: `Gửi báo cáo lỗi: ${message(error)}`.slice(0, 2000),
      });
    }
  }

  async reportFailure(row: Row) {
    const assets = row.assets as unknown as EssayAsset[];
    const comment = `AI chưa chấm được bài này${row.error ? ` (${row.error.slice(0, 300)})` : ''}. Giảng viên chấm tay trong SpeedGrader.`;
    try {
      for (const asset of assets) {
        await this.lti.postReport(
          row.report_url,
          failedReport({ assetId: asset.asset_id, timestamp: new Date().toISOString() }, row.error_code || 'PROCESSING_FAILED', comment),
        );
      }
      await this.mark(row, { reported_at: new Date(), next_attempt_at: null });
    } catch (error) {
      await this.mark(row, {
        attempts: row.attempts + 1,
        next_attempt_at: new Date(Date.now() + backoff(row.attempts)),
      });
      this.logger.warn(`Gửi báo cáo lỗi về Canvas thất bại (${row.essay_submission_id}): ${message(error)}`);
    }
  }

  private async retryOrFail(row: Row, error: unknown, errorCode: string, permanent = false) {
    const attempts = row.attempts + 1;
    const giveUp = permanent || attempts >= MAX_ATTEMPTS;
    this.logger.warn(
      `Tải bài nộp ${row.lms_submission_id} lỗi (lần ${attempts}${giveUp ? ', dừng' : ''}): ${message(error)}`,
    );
    await this.mark(row, {
      attempts: giveUp ? 0 : attempts,
      next_attempt_at: giveUp ? null : new Date(Date.now() + backoff(row.attempts)),
      error: message(error).slice(0, 2000),
      ...(giveUp ? { status: ESSAY_STATUS.failed, error_code: errorCode } : {}),
    });
  }

  private mark(row: Row, data: Prisma.essay_submissionsUpdateInput) {
    return this.prisma.essay_submissions.update({
      where: { essay_submission_id: row.essay_submission_id },
      data: { ...data, updated_at: new Date() },
    });
  }
}

function backoff(attempts: number) {
  return Math.min(BACKOFF_BASE_MS * 2 ** attempts, BACKOFF_MAX_MS);
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
