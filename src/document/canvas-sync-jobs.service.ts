import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import {
  CANVAS_SYNC_CONFIG,
  type CanvasSyncConfig,
} from './canvas-sync.config';

export const CANVAS_SYNC_QUEUE = 'canvas_sync';
export const CANVAS_SYNC_COURSE = 'sync_course';
export const CANVAS_SYNC_SWEEP = 'sweep_courses';
const SCHEDULER_ID = 'canvas-course-sweep';

export type SyncActor = { kind: 'system' } | { kind: 'user'; userId: string };
export type SyncCourseJob = {
  courseId: string;
  actor: SyncActor;
  trigger: 'manual' | 'launch' | 'schedule';
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

  async triggerLaunch(courseId: string, lmsType: string, courseRole: string) {
    if (
      !this.config.enabled ||
      lmsType !== 'canvas' ||
      !['instructor', 'ta'].includes(courseRole)
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
}
