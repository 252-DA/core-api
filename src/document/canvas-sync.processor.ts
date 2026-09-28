import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { CanvasDocumentSyncService } from './canvas-document-sync.service';
import {
  CANVAS_SYNC_QUEUE,
  CANVAS_SYNC_COURSE,
  CANVAS_SYNC_SWEEP,
  CanvasSyncJobsService,
  type SyncCourseJob,
} from './canvas-sync-jobs.service';

// Separate from document_processing: that queue is consumed by the Python worker.
@Processor(CANVAS_SYNC_QUEUE, { concurrency: 2 })
export class CanvasSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CanvasSyncProcessor.name);

  constructor(
    private readonly sync: CanvasDocumentSyncService,
    private readonly jobs: CanvasSyncJobsService,
  ) {
    super();
  }

  async process(job: Job<SyncCourseJob>) {
    if (job.name === CANVAS_SYNC_SWEEP) return this.jobs.sweep();
    if (job.name !== CANVAS_SYNC_COURSE)
      throw new UnrecoverableError(`Unknown Canvas sync job: ${job.name}`);
    const { courseId, actor } = job.data;
    await this.jobs.markSyncAttempt(courseId);
    const summary = await this.sync.syncCourse(courseId, actor);
    await this.jobs.markSyncAttempt(courseId);
    this.logger.log(`Canvas sync ${courseId}: ${JSON.stringify(summary)}`);
    return summary;
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Canvas sync ${job?.id ?? 'unknown'} failed: ${error.message}`,
    );
  }
}
