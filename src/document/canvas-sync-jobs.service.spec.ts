import { Logger } from '@nestjs/common';
import {
  CanvasSyncJobsService,
  CANVAS_SYNC_COURSE,
  CANVAS_SYNC_SWEEP,
} from './canvas-sync-jobs.service';

describe('CanvasSyncJobsService', () => {
  function setup(enabled = true) {
    const redis = {
      get: jest.fn().mockResolvedValue(0),
      set: jest.fn().mockResolvedValue('OK'),
    };
    const queue = {
      client: Promise.resolve(redis),
      toKey: (value: string) => `bull:canvas_sync:${value}`,
      add: jest.fn().mockResolvedValue({}),
      upsertJobScheduler: jest.fn(),
      removeJobScheduler: jest.fn(),
    };
    const prisma = {
      courses: {
        findMany: jest.fn().mockResolvedValue([{ course_id: 'course-1' }]),
      },
    };
    const service = new CanvasSyncJobsService(queue as never, prisma as never, {
      enabled,
      intervalMs: 900_000,
      launchCooldownMs: 120_000,
    });
    return { service, queue, redis, prisma };
  }

  it('upserts one 15-minute sweep scheduler, leaving per-course IDs to the fanout', async () => {
    const { service, queue } = setup();
    await service.onModuleInit();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'canvas-course-sweep',
      { every: 900_000 },
      expect.objectContaining({ name: CANVAS_SYNC_SWEEP }),
    );
  });

  it('removes the scheduler and suppresses automatic triggers when disabled', async () => {
    const { service, queue, prisma } = setup(false);
    await service.onModuleInit();
    await service.sweep();
    await service.triggerLaunch('course-1', 'canvas', 'instructor');
    expect(queue.removeJobScheduler).toHaveBeenCalledWith(
      'canvas-course-sweep',
    );
    expect(prisma.courses.findMany).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
    await service.enqueue(
      'course-1',
      { kind: 'user', userId: 'teacher' },
      'manual',
    );
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it.each(['instructor', 'ta'])(
    'triggers a Canvas launch for %s',
    async (role) => {
      const { service, queue } = setup();
      await service.triggerLaunch('course-1', 'canvas', role);
      expect(queue.add).toHaveBeenCalledWith(
        CANVAS_SYNC_COURSE,
        { courseId: 'course-1', actor: { kind: 'system' }, trigger: 'launch' },
        expect.objectContaining({ jobId: 'canvas-sync-course-1' }),
      );
    },
  );

  it.each([
    ['canvas', 'learner'],
    ['canvas', 'observer'],
    ['moodle', 'instructor'],
    ['openedx', 'ta'],
  ])('does not trigger for %s / %s', async (lms, role) => {
    const { service, queue, redis } = setup();
    await service.triggerLaunch('course-1', lms, role);
    expect(queue.add).not.toHaveBeenCalled();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('uses a shared Redis cooldown, while manual sync bypasses it', async () => {
    const { service, queue, redis } = setup();
    redis.get.mockResolvedValue(1);
    await service.triggerLaunch('course-1', 'canvas', 'instructor');
    expect(queue.add).not.toHaveBeenCalled();
    await service.markSyncAttempt('course-1');
    expect(redis.set).toHaveBeenCalledWith(
      'bull:canvas_sync:launch-cooldown:course-1',
      expect.any(String),
      { PX: 120_000 },
    );
    await service.enqueue('course-1', { kind: 'system' }, 'manual');
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('reuses the same valid job ID for all triggers and permits future runs after success/failure', async () => {
    const { service, queue } = setup();
    for (const trigger of ['manual', 'launch', 'schedule'] as const) {
      await service.enqueue('course-1', { kind: 'system' }, trigger);
    }
    for (const [, , opts] of queue.add.mock.calls) {
      expect(opts).toMatchObject({
        jobId: 'canvas-sync-course-1',
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
      });
    }
  });

  it('sweeps only live linked Canvas courses and paginates the fanout', async () => {
    const { service, queue, prisma } = setup();
    prisma.courses.findMany
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, i) => ({ course_id: `course-${i}` })),
      )
      .mockResolvedValueOnce([{ course_id: 'course-100' }]);
    await expect(service.sweep()).resolves.toEqual({ courses: 101 });
    expect(prisma.courses.findMany.mock.calls[0][0].where).toEqual({
      deleted_at: null,
      lms_id: { startsWith: 'canvas:' },
      lms_course_ref: { some: { deleted_at: null } },
    });
    expect(prisma.courses.findMany.mock.calls[1][0]).toMatchObject({
      cursor: { course_id: 'course-99' },
      skip: 1,
    });
    expect(queue.add).toHaveBeenCalledTimes(101);
  });

  it('does not reject the LTI trigger when Redis fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      const { service, redis } = setup();
      redis.get.mockRejectedValue(new Error('offline'));
      await expect(
        service.triggerLaunch('course-1', 'canvas', 'instructor'),
      ).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('offline'));
    } finally {
      warn.mockRestore();
    }
  });
});
