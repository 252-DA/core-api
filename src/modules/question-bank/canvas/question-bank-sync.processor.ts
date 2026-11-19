import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QUESTION_BANK_SYNC_QUEUE } from '../../../messaging/queues';
import {
  QuestionBankSyncService,
  type QuestionBankSyncJobData,
} from './question-bank-sync.service';

// Một job một lúc: mỗi lần xuất là một content migration trên Canvas, chạy
// song song chỉ làm hàng đợi delayed job của Canvas dài thêm.
@Processor(QUESTION_BANK_SYNC_QUEUE, { concurrency: 1 })
export class QuestionBankSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionBankSyncProcessor.name);

  constructor(private readonly sync: QuestionBankSyncService) {
    super();
  }

  async process(job: Job<QuestionBankSyncJobData>) {
    await this.sync.run(job.data.jobId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Question bank sync ${job?.id ?? 'unknown'} failed: ${error.message}`,
    );
  }
}
