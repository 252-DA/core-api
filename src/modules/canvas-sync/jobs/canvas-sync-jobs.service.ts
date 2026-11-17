import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LMS_ADMIN_ROLE, STAFF_ROLES } from '../../../common/constants/course-roles';
import {
  CANVAS_SYNC_CONFIG,
  type CanvasSyncConfig,
} from '../../../config/canvas-sync.config';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CANVAS_SYNC_QUEUE } from '../../../messaging/queues';

export const CANVAS_SYNC_COURSE = 'sync_course';
export const CANVAS_SYNC_SWEEP = 'sweep_courses';
/** Đồng bộ danh sách lớp (NRPS) của một khóa; cùng hàng đợi, khác job với sync_course. */
export const CANVAS_ROSTER_SYNC = 'sync_roster';
const SCHEDULER_ID = 'canvas-course-sweep';

export type SyncActor = { kind: 'system' } | { kind: 'user'; userId: string };
export type SyncCourseJob = {
  courseId: string;
  actor: SyncActor;
  trigger: 'manual' | 'launch' | 'schedule';
  /** Dòng canvas_sync_runs của job này; các lần BullMQ thử lại dùng chung một dòng. */
  runId?: string;
};

@Injectable()
export class CanvasSyncJobsService implements OnModuleInit {
  private readonly logger = new Logger(CanvasSyncJobsService.name);

  constructor(
    @InjectQueue(CANVAS_SYNC_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
    @Inject(CANVAS_SYNC_CONFIG) private readonly config: CanvasSyncConfig,
  ) {}

  async onModuleInit() {
    if (!this.config.enabled) {
      await this.queue.removeJobScheduler(SCHEDULER_ID);
      return;
    }
    // Scheduler jobs have BullMQ-generated IDs; they fan out into the same
    // per-course jobs used by manual sync and LTI launches.
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { every: this.config.intervalMs },
      {
        name: CANVAS_SYNC_SWEEP,
        data: {},
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
    );
    this.logger.log(
      `Canvas auto sync enabled (every ${this.config.intervalMs}ms)`,
    );
  }

  async enqueue(
    courseId: string,
    actor: SyncActor,
    trigger: SyncCourseJob['trigger'],
  ) {
    // BullMQ disallows ':' in custom IDs. Keep this job until all retries finish,
    // then remove it so later manual/automatic syncs can reuse the same ID.
    const jobId = `canvas-sync-${courseId}`;
    await this.queue.add(
      CANVAS_SYNC_COURSE,
      { courseId, actor, trigger } satisfies SyncCourseJob,
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    return { job_id: jobId, status: 'QUEUED' as const };
  }

  /** Job danh sách lớp: id riêng nên không chặn và không bị chặn bởi job tài liệu. */
  async enqueueRoster(
    courseId: string,
    actor: SyncActor,
    trigger: SyncCourseJob['trigger'],
  ) {
    const jobId = `canvas-roster-${courseId}`;
    await this.queue.add(
      CANVAS_ROSTER_SYNC,
      { courseId, actor, trigger } satisfies SyncCourseJob,
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    return { job_id: jobId, status: 'QUEUED' as const };
  }

  async triggerLaunch(courseId: string, lmsType: string, courseRole: string) {
    if (
      !this.config.enabled ||
      lmsType !== 'canvas' ||
      !STAFF_ROLES.includes(courseRole)
    )
      return;
    try {
      const redis = await this.queue.client;
      if (await redis.get(this.cooldownKey(courseId))) return;
      await this.enqueue(courseId, { kind: 'system' }, 'launch');
    } catch (error) {
      // A queue outage must not prevent login; the periodic sweep catches up.
      this.logger.warn(
        `Could not enqueue Canvas launch sync for ${courseId}: ${String(error)}`,
      );
    }
  }

  /**
   * Giảng viên, trợ giảng hoặc admin mở DA thì đọc lại danh sách lớp. Cooldown
   * riêng (khóa Redis khác) để việc này không bị chặn bởi đồng bộ tài liệu đang
   * chạy lâu, và ngược lại.
   */
  async triggerRosterLaunch(
    courseId: string,
    lmsType: string,
    courseRole: string,
    platformRole?: string,
  ) {
    if (
      !this.config.enabled ||
      lmsType !== 'canvas' ||
      !(
        STAFF_ROLES.includes(courseRole) ||
        platformRole === LMS_ADMIN_ROLE
      )
    )
      return;
    try {
      const redis = await this.queue.client;
      if (await redis.get(this.rosterCooldownKey(courseId))) return;
      await this.enqueueRoster(courseId, { kind: 'system' }, 'launch');
    } catch (error) {
      this.logger.warn(
        `Could not enqueue Canvas roster sync for ${courseId}: ${String(error)}`,
      );
    }
  }

  async markRosterAttempt(courseId: string) {
    const redis = await this.queue.client;
    await redis.set(this.rosterCooldownKey(courseId), String(Date.now()), {
      PX: this.config.launchCooldownMs,
    });
  }

  async markSyncAttempt(courseId: string) {
    const redis = await this.queue.client;
    // Set at start and finish: throttle launches even after a failed attempt,
    // and for the full cooldown after a successful long-running sync.
    await redis.set(this.cooldownKey(courseId), String(Date.now()), {
      PX: this.config.launchCooldownMs,
    });
  }

  async sweep() {
    if (!this.config.enabled) return;
    let cursor: string | undefined;
    let count = 0;
    for (;;) {
      const courses = await this.prisma.courses.findMany({
        where: {
          deleted_at: null,
          lms_id: { startsWith: 'canvas:' },
          lms_course_ref: { some: { deleted_at: null } },
        },
        select: { course_id: true },
        orderBy: { course_id: 'asc' },
        take: 100,
        ...(cursor ? { cursor: { course_id: cursor }, skip: 1 } : {}),
      });
      for (const course of courses) {
        // Danh sách lớp nhanh nên vào hàng trước; đồng bộ tài liệu có thể chạy lâu.
        await this.enqueueRoster(course.course_id, { kind: 'system' }, 'schedule');
        await this.enqueue(course.course_id, { kind: 'system' }, 'schedule');
        count++;
      }
      if (courses.length < 100) break;
      cursor = courses[courses.length - 1].course_id;
    }
    return { courses: count };
  }

  private cooldownKey(courseId: string) {
    return this.queue.toKey(`launch-cooldown:${courseId}`);
  }

  private rosterCooldownKey(courseId: string) {
    return this.queue.toKey(`roster-cooldown:${courseId}`);
  }
}
