import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AGS_CONFIG, type AgsConfig } from './ags.config';
import { AGS_STATUS } from './ags-status';
import { AgsClientService } from './ags-client.service';

interface ClaimedAttempt {
  submission_id?: string | null;
  attempt_id: string;
  user_id: string;
  resource_link_id: string | null;
  score: unknown;
  attempted_at: Date | null;
}

interface ScoreTally {
  /** Tổng phần trăm đúng của từng câu (mỗi câu 0 hoặc 100 — xem QuizService.submit). */
  percentTotal: number;
  scoredCount: number;
}

interface AttemptGroup {
  key: string;
  userId: string;
  resourceLinkId: string;
  attemptIds: string[];
  /**
   * Quiz set: mỗi lượt nộp (submission_id) một tally. Quiz của lesson không có
   * submission_id nên dồn chung một tally dưới khoá rỗng như trước.
   */
  tallies: Map<string, ScoreTally>;
  quizSet: boolean;
  latestAt: Date;
}

interface BackoffState {
  failures: number;
  nextAttemptAt: number;
  /** Đang chờ giảng viên publish bài tập trên Canvas — không tính là thất bại. */
  waitingForPublish?: boolean;
}

/**
 * Poller đẩy điểm quiz về sổ điểm LMS.
 *
 * Vì sao là poller chứ không phải gọi thẳng trong QuizService.submit: một lượt
 * nộp bài không được phụ thuộc vào việc LMS có sống hay không, và điểm đã chấm
 * thì không được mất khi Canvas 5xx. `quiz_attempts.ags_status` chính là hàng
 * đợi bền vững — nó có sẵn trong schema từ đầu nhưng chưa ai tiêu thụ.
 *
 * Không đi qua `outbox_events`: outbox relay đẩy sang BullMQ cho worker Python,
 * mà worker đó không giữ LTI private key và projector sẽ Err trên event lạ.
 */
@Injectable()
export class AgsPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgsPublisherService.name);
  private readonly backoff = new Map<string, BackoffState>();
  private running = false;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: AgsClientService,
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
  ) {}

  onModuleInit() {
    if (!this.config.enabled) {
      this.logger.warn(
        'AGS writeback đang TẮT (AGS_ENABLED=false, hoặc thiếu LTI_CLIENT_ID/LTI_PRIVATE_KEY_PATH). ' +
          'Điểm quiz sẽ nằm PENDING và không về sổ điểm LMS.',
      );
      return;
    }
    this.running = true;
    this.logger.log(
      `AGS publisher khởi động (poll ${this.config.pollIntervalMs}ms, batch ${this.config.batchSize})`,
    );
    void this.recoverStuckClaims().then(() => this.startPolling());
  }

  /**
   * Tiến trình chết giữa lúc đang đẩy sẽ để lại các dòng kẹt ở POSTING mà
   * không ai nhặt nữa. Khởi động lại là thời điểm an toàn để thả chúng về hàng đợi.
   */
  private async recoverStuckClaims() {
    try {
      const { count } = await this.prisma.quiz_attempts.updateMany({
        where: { ags_status: AGS_STATUS.posting, deleted_at: null },
        data: { ags_status: AGS_STATUS.pending },
      });
      if (count > 0) {
        this.logger.warn(`Thả ${count} attempt kẹt ở POSTING về PENDING`);
      }
    } catch (err) {
      this.logger.error(
        'Không thể thu hồi attempt kẹt ở POSTING',
        err as Error,
      );
    }
  }

  onModuleDestroy() {
    this.running = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  private async startPolling() {
    if (!this.running) {
      return;
    }
    try {
      await this.publishPending();
    } catch (err) {
      this.logger.error('AGS publisher lỗi trong một vòng poll', err as Error);
    }
    if (this.running) {
      this.pollTimeout = setTimeout(
        () => void this.startPolling(),
        this.config.pollIntervalMs,
      );
    }
  }

  /**
   * Canvas đang từ chối điểm của resource link này vì bài tập chưa publish.
   * Chỉ tiến trình này biết (DB vẫn ghi PENDING) — dùng để báo cho giảng viên.
   */
  isWaitingForPublish(resourceLinkId: string): boolean {
    return Boolean(this.backoff.get(resourceLinkId)?.waitingForPublish);
  }

  /** Một vòng: nhận batch, gom nhóm, đẩy điểm. Trả về số nhóm đã đẩy thành công. */
  async publishPending(): Promise<number> {
    const claimed = await this.claimBatch();
    if (claimed.length === 0) {
      return 0;
    }

    const groups = groupAttempts(claimed);
    const [users, lineItems] = await Promise.all([
      this.prisma.lms_user_mappings.findMany({
        where: {
          internal_user_id: { in: unique(groups.map((g) => g.userId)) },
        },
        select: { internal_user_id: true, lms_sub: true },
      }),
      this.prisma.lti_line_items.findMany({
        where: {
          resource_link_id: { in: unique(groups.map((g) => g.resourceLinkId)) },
          deleted_at: null,
        },
      }),
    ]);

    const subByUser = new Map(
      users.map((u) => [u.internal_user_id, u.lms_sub]),
    );
    const lineItemByLink = new Map(
      lineItems.map((item) => [item.resource_link_id, item]),
    );

    let published = 0;
    for (const group of groups) {
      const lineItem = lineItemByLink.get(group.resourceLinkId);
      if (!lineItem) {
        // Launch không kèm AGS endpoint — không có sổ điểm để ghi vào.
        await this.mark(group.attemptIds, AGS_STATUS.notRequired);
        continue;
      }

      const lmsSub = subByUser.get(group.userId);
      if (!lmsSub) {
        this.logger.error(
          `Không tìm thấy lms_sub cho user ${group.userId}; bỏ qua ${group.attemptIds.length} attempt`,
        );
        await this.mark(group.attemptIds, AGS_STATUS.failed);
        continue;
      }

      const scoreMaximum = Number(lineItem.score_maximum);
      const fraction = group.quizSet
        ? Math.max(bestFraction(group), await this.bestRecordedFraction(group))
        : bestFraction(group);
      const scoreGiven = round2(fraction * scoreMaximum);

      const result = await this.client.postScore(lineItem.lms_line_item_url, {
        // AGS định danh người học bằng `sub` của platform, không phải id nội bộ.
        userId: lmsSub,
        scoreGiven,
        scoreMaximum,
        timestamp: group.latestAt.toISOString(),
      });

      if (result.ok) {
        const waited = this.backoff.get(group.resourceLinkId)?.waitingForPublish;
        this.backoff.delete(group.resourceLinkId);
        await this.mark(group.attemptIds, AGS_STATUS.posted, new Date());
        published += 1;
        this.logger.log(
          `Đã đẩy điểm ${scoreGiven}/${scoreMaximum} cho user ${lmsSub} ` +
            `(${group.attemptIds.length} câu, resource link ${group.resourceLinkId})` +
            (waited ? ' sau khi bài tập được publish' : ''),
        );
        continue;
      }

      if (result.waitingForPublish) {
        // Canvas giữ bài tập Deep Linking ở unpublished cho tới khi giảng viên
        // bấm publish. Điểm vẫn đúng, chỉ chưa có chỗ ghi — chờ, không bỏ cuộc.
        const first = !this.backoff.get(group.resourceLinkId)?.waitingForPublish;
        this.backoff.set(group.resourceLinkId, {
          failures: 0,
          nextAttemptAt: Date.now() + this.config.unpublishedRetryMs,
          waitingForPublish: true,
        });
        await this.mark(group.attemptIds, AGS_STATUS.pending);
        if (first) {
          this.logger.warn(
            `Bài tập của resource link ${group.resourceLinkId} chưa publish trên Canvas; ` +
              `giữ điểm chờ và thử lại mỗi ${Math.round(this.config.unpublishedRetryMs / 1000)}s`,
          );
        }
        continue;
      }

      if (!result.retryable) {
        this.backoff.delete(group.resourceLinkId);
        await this.mark(group.attemptIds, AGS_STATUS.failed);
        this.logger.error(
          `Đẩy điểm thất bại vĩnh viễn (resource link ${group.resourceLinkId}): ${result.error}`,
        );
        continue;
      }

      const state = this.recordFailure(group.resourceLinkId);
      if (state.failures > this.config.maxRetries) {
        this.backoff.delete(group.resourceLinkId);
        await this.mark(group.attemptIds, AGS_STATUS.failed);
        this.logger.error(
          `Bỏ cuộc sau ${state.failures} lần thử (resource link ${group.resourceLinkId}): ${result.error}`,
        );
        continue;
      }

      // Trả về PENDING để vòng poll sau thử lại, sau khi hết backoff.
      await this.mark(group.attemptIds, AGS_STATUS.pending);
      this.logger.warn(
        `Đẩy điểm lỗi tạm thời lần ${state.failures} (resource link ${group.resourceLinkId}): ${result.error}`,
      );
    }

    return published;
  }

  /**
   * Giành lấy một batch: đánh dấu POSTING ngay trong transaction để hai
   * instance core-api không cùng đẩy một điểm hai lần.
   */
  private async claimBatch(): Promise<ClaimedAttempt[]> {
    const now = Date.now();
    const cooling = [...this.backoff.entries()]
      .filter(([, state]) => state.nextAttemptAt > now)
      .map(([resourceLinkId]) => resourceLinkId);

    return this.prisma.$transaction(async (tx) => {
      let attempts = await tx.quiz_attempts.findMany({
        where: {
          ags_status: AGS_STATUS.pending,
          deleted_at: null,
          resource_link_id: {
            not: null,
            ...(cooling.length ? { notIn: cooling } : {}),
          },
        },
        orderBy: { attempted_at: 'asc' },
        take: this.config.batchSize,
        select: {
          attempt_id: true,
          user_id: true,
          resource_link_id: true,
          score: true,
          attempted_at: true,
          submission_id: true,
        },
      });

      if (attempts.length === 0) {
        return [];
      }

      // A batch boundary must not publish a score for half of a quiz.
      const submissionIds = unique(attempts.flatMap((a) => a.submission_id ? [a.submission_id] : []));
      if (submissionIds.length) {
        const complete = await tx.quiz_attempts.findMany({
          where: { submission_id: { in: submissionIds }, ags_status: AGS_STATUS.pending, deleted_at: null },
          select: { attempt_id: true, user_id: true, resource_link_id: true, score: true, attempted_at: true, submission_id: true },
        });
        attempts = [...new Map([...attempts, ...complete].map((a) => [a.attempt_id, a])).values()];
      }

      await tx.quiz_attempts.updateMany({
        where: { attempt_id: { in: attempts.map((a) => a.attempt_id) } },
        data: { ags_status: AGS_STATUS.posting },
      });

      return attempts;
    });
  }

  /**
   * Làm lại quiz set không được kéo điểm đã có xuống: sổ điểm LMS chỉ giữ điểm
   * gửi sau cùng, nên luôn gửi lượt nộp tốt nhất của người học trên bài tập
   * này, kể cả các lượt đã đẩy hoặc bị từ chối trước đó.
   */
  private async bestRecordedFraction(group: AttemptGroup): Promise<number> {
    const submissions = await this.prisma.quiz_attempts.groupBy({
      by: ['submission_id'],
      where: {
        user_id: group.userId,
        resource_link_id: group.resourceLinkId,
        submission_id: { not: null },
        deleted_at: null,
      },
      _avg: { score: true },
    });
    return Math.max(
      0,
      ...submissions.map((row) => Number(row._avg.score ?? 0) / 100),
    );
  }

  private async mark(attemptIds: string[], status: string, postedAt?: Date) {
    await this.prisma.quiz_attempts.updateMany({
      where: { attempt_id: { in: attemptIds } },
      data: {
        ags_status: status,
        ...(postedAt ? { ags_posted_at: postedAt } : {}),
      },
    });
  }

  private recordFailure(resourceLinkId: string): BackoffState {
    const previous = this.backoff.get(resourceLinkId);
    const failures = (previous?.failures ?? 0) + 1;
    const delay = Math.min(
      this.config.backoffBaseMs * 2 ** (failures - 1),
      this.config.backoffMaxMs,
    );
    const state = { failures, nextAttemptAt: Date.now() + delay };
    this.backoff.set(resourceLinkId, state);
    return state;
  }
}

function groupAttempts(attempts: ClaimedAttempt[]): AttemptGroup[] {
  const groups = new Map<string, AttemptGroup>();

  for (const attempt of attempts) {
    if (!attempt.resource_link_id) {
      continue;
    }
    const key = `${attempt.user_id}|${attempt.resource_link_id}`;
    const attemptedAt = attempt.attempted_at ?? new Date();
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        userId: attempt.user_id,
        resourceLinkId: attempt.resource_link_id,
        attemptIds: [],
        tallies: new Map(),
        quizSet: false,
        latestAt: attemptedAt,
      };
      groups.set(key, group);
    }

    group.attemptIds.push(attempt.attempt_id);
    // Tally theo lượt nộp để hai lượt nộp cùng thời điểm không trộn câu của nhau.
    const tallyKey = attempt.submission_id ?? '';
    const tally = group.tallies.get(tallyKey) ?? {
      percentTotal: 0,
      scoredCount: 0,
    };
    tally.percentTotal += Number(attempt.score);
    tally.scoredCount += 1;
    group.tallies.set(tallyKey, tally);
    group.quizSet ||= Boolean(attempt.submission_id);
    if (attemptedAt > group.latestAt) {
      group.latestAt = attemptedAt;
    }
  }

  return [...groups.values()];
}

/** Lượt nộp tốt nhất trong batch; lesson quiz chỉ có một tally nên là trung bình như cũ. */
function bestFraction(group: AttemptGroup): number {
  return Math.max(
    0,
    ...[...group.tallies.values()].map(
      (t) => t.percentTotal / (100 * t.scoredCount),
    ),
  );
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
