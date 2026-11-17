import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { describeCanvasError } from '../../../integrations/canvas/canvas-errors';
import { CANVAS_SYNC_QUEUE } from '../../../messaging/queues';
import { RosterSyncService } from '../../roster/roster-sync.service';
import { CanvasDocumentSyncService } from '../services/canvas-document-sync.service';
import {
  CANVAS_SYNC_COURSE,
  CANVAS_SYNC_SWEEP,
  CANVAS_ROSTER_SYNC,
  CanvasSyncJobsService,
  type SyncCourseJob,
} from './canvas-sync-jobs.service';
import {
  CanvasSyncRunsService,
  type SyncRunKind,
  type SyncRunTrigger,
} from '../services/canvas-sync-runs.service';
import {
  CANVAS_TOKEN_CHECK,
  CanvasTokenStatusService,
} from '../services/canvas-token-status.service';

const RUN_TRIGGER: Record<SyncCourseJob['trigger'], SyncRunTrigger> = {
  manual: 'manual',
  launch: 'launch',
  schedule: 'sweep',
};

// Separate from document_processing: that queue is consumed by the Python worker.
@Processor(CANVAS_SYNC_QUEUE, { concurrency: 2 })
export class CanvasSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CanvasSyncProcessor.name);

  constructor(
    private readonly sync: CanvasDocumentSyncService,
    private readonly jobs: CanvasSyncJobsService,
    private readonly runs: CanvasSyncRunsService,
    private readonly tokenStatus: CanvasTokenStatusService,
    private readonly roster: RosterSyncService,
  ) {
    super();
  }

  async process(job: Job<SyncCourseJob>) {
    if (job.name === CANVAS_SYNC_SWEEP) return this.jobs.sweep();
    if (job.name === CANVAS_TOKEN_CHECK) return this.tokenStatus.check();
    if (job.name === CANVAS_ROSTER_SYNC) return this.processRoster(job);
    if (job.name !== CANVAS_SYNC_COURSE)
      throw new UnrecoverableError(`Unknown Canvas sync job: ${job.name}`);
    const { courseId, actor } = job.data;
    const runId = await this.beginRun(job);
    await this.jobs.markSyncAttempt(courseId);
    let summary: Awaited<ReturnType<CanvasDocumentSyncService['syncCourse']>>;
    try {
      summary = await this.sync.syncCourse(courseId, actor);
    } catch (error: unknown) {
      await this.failRun(job, runId, error);
      throw error;
    }
    await this.jobs.markSyncAttempt(courseId);
    await this.finishRun(runId, summary);
    this.logger.log(`Canvas sync ${courseId}: ${JSON.stringify(summary)}`);
    return summary;
  }

  /** Đồng bộ danh sách lớp: một dòng lịch sử kind = 'roster' cho mỗi job. */
  private async processRoster(job: Job<SyncCourseJob>) {
    const { courseId } = job.data;
    const runId = await this.beginRun(job, 'roster');
    await this.jobs.markRosterAttempt(courseId);
    let summary: Awaited<ReturnType<RosterSyncService['syncCourse']>>;
    try {
      summary = await this.roster.syncCourse(courseId);
    } catch (error: unknown) {
      await this.failRun(job, runId, error);
      throw error;
    }
    await this.jobs.markRosterAttempt(courseId);
    await this.finishRun(runId, summary);
    this.logger.log(`Canvas roster ${courseId}: ${JSON.stringify(summary)}`);
    return summary;
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Canvas sync ${job?.id ?? 'unknown'} failed: ${error.message}`,
    );
  }

  // Ghi lịch sử không được làm hỏng việc đồng bộ: lỗi DB chỉ ghi log.
  private async beginRun(
    job: Job<SyncCourseJob>,
    kind: SyncRunKind = 'documents',
  ): Promise<string | undefined> {
    if (job.data.runId) return job.data.runId;
    try {
      const trigger = RUN_TRIGGER[job.data.trigger] ?? 'manual';
      const runId =
        kind === 'documents'
          ? await this.runs.start(job.data.courseId, trigger)
          : await this.runs.start(job.data.courseId, trigger, kind);
      // Lần thử lại của BullMQ thấy runId này và không mở thêm dòng mới.
      await job.updateData({ ...job.data, runId });
      return runId;
    } catch (error: unknown) {
      this.logger.warn(`Không ghi được lần đồng bộ Canvas: ${String(error)}`);
      return undefined;
    }
  }

  private async finishRun(runId: string | undefined, summary: unknown) {
    if (!runId) return;
    try {
      await this.runs.finish(runId, summary);
    } catch (error: unknown) {
      this.logger.warn(
        `Không ghi được kết quả đồng bộ Canvas ${runId}: ${String(error)}`,
      );
    }
  }

  /** Dòng chỉ chuyển sang lỗi ở lần thử cuối; các lần trước vẫn là "đang chạy". */
  private async failRun(
    job: Job<SyncCourseJob>,
    runId: string | undefined,
    error: unknown,
  ) {
    if (!runId) return;
    const attempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade + 1 < attempts) return;
    try {
      await this.runs.fail(runId, describeCanvasError(error));
    } catch (dbError: unknown) {
      this.logger.warn(
        `Không ghi được lỗi đồng bộ Canvas ${runId}: ${String(dbError)}`,
      );
    }
  }
}
