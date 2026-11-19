import { BadGatewayException } from '@nestjs/common';
import { CanvasApiError } from '../../../integrations/canvas/canvas-errors';
import { CanvasSyncProcessor } from './canvas-sync.processor';
import {
  CANVAS_ROSTER_SYNC,
  CANVAS_SYNC_COURSE,
  CANVAS_SYNC_SWEEP,
} from './canvas-sync-jobs.service';
import { CANVAS_TOKEN_CHECK } from '../services/canvas-token-status.service';

describe('CanvasSyncProcessor', () => {
  function setup() {
    const sync = {
      syncCourse: jest.fn().mockResolvedValue({ created: ['one.pdf'] }),
    };
    const jobs = {
      sweep: jest.fn(),
      markSyncAttempt: jest.fn(),
      markRosterAttempt: jest.fn(),
    };
    const roster = {
      syncCourse: jest.fn().mockResolvedValue({ total: 3, created: 2 }),
    };
    const runs = {
      start: jest.fn().mockResolvedValue('run-1'),
      finish: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    };
    const tokenStatus = { check: jest.fn().mockResolvedValue({ ok: true }) };
    return {
      processor: new CanvasSyncProcessor(
        sync as never,
        jobs as never,
        runs as never,
        tokenStatus as never,
        roster as never,
      ),
      sync,
      jobs,
      runs,
      tokenStatus,
      roster,
    };
  }

  function courseJob(overrides: Record<string, unknown> = {}) {
    const job = {
      name: CANVAS_SYNC_COURSE,
      data: {
        courseId: 'course-1',
        actor: { kind: 'system' },
        trigger: 'launch',
      } as Record<string, unknown>,
      opts: { attempts: 3 },
      attemptsMade: 0,
      updateData: jest.fn().mockImplementation(async (data) => {
        job.data = data;
      }),
      ...overrides,
    };
    return job;
  }

  it('dispatches sweeps without treating them as document processing', async () => {
    const { processor, sync, jobs, runs } = setup();
    await processor.process({ name: CANVAS_SYNC_SWEEP } as never);
    expect(jobs.sweep).toHaveBeenCalledTimes(1);
    expect(sync.syncCourse).not.toHaveBeenCalled();
    expect(runs.start).not.toHaveBeenCalled();
  });

  it('runs the daily token check job', async () => {
    const { processor, tokenStatus, sync } = setup();
    await processor.process({ name: CANVAS_TOKEN_CHECK } as never);
    expect(tokenStatus.check).toHaveBeenCalledTimes(1);
    expect(sync.syncCourse).not.toHaveBeenCalled();
  });

  it('sets the shared launch cooldown before and after syncing', async () => {
    const { processor, sync, jobs } = setup();
    await processor.process(courseJob() as never);
    expect(sync.syncCourse).toHaveBeenCalledWith('course-1', {
      kind: 'system',
    });
    const attempts = jobs.markSyncAttempt.mock.invocationCallOrder;
    expect(attempts[0]).toBeLessThan(
      sync.syncCourse.mock.invocationCallOrder[0],
    );
    expect(attempts[1]).toBeGreaterThan(
      sync.syncCourse.mock.invocationCallOrder[0],
    );
  });

  it('propagates Canvas errors for BullMQ retry while throttling launch retries', async () => {
    const { processor, sync, jobs } = setup();
    sync.syncCourse.mockRejectedValue(new Error('Canvas unavailable'));
    await expect(processor.process(courseJob() as never)).rejects.toThrow(
      'Canvas unavailable',
    );
    expect(jobs.markSyncAttempt).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['manual', 'manual'],
    ['launch', 'launch'],
    ['schedule', 'sweep'],
  ])(
    'records a run for the %s trigger as %s and finishes it with the summary',
    async (trigger, stored) => {
      const { processor, runs } = setup();
      const job = courseJob({
        data: { courseId: 'course-1', actor: { kind: 'system' }, trigger },
      });
      await processor.process(job as never);
      expect(runs.start).toHaveBeenCalledWith('course-1', stored);
      expect(job.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ runId: 'run-1' }),
      );
      expect(runs.finish).toHaveBeenCalledWith('run-1', {
        created: ['one.pdf'],
      });
      expect(runs.fail).not.toHaveBeenCalled();
    },
  );

  it('opens the run before syncing so the UI can show it as running', async () => {
    const { processor, runs, sync } = setup();
    await processor.process(courseJob() as never);
    expect(runs.start.mock.invocationCallOrder[0]).toBeLessThan(
      sync.syncCourse.mock.invocationCallOrder[0],
    );
  });

  it('closes the run as an error only on the last attempt, with a Vietnamese message', async () => {
    const { processor, sync, runs } = setup();
    sync.syncCourse.mockRejectedValue(
      new CanvasApiError(
        'Canvas trả HTTP 401 khi đọc danh sách module: {}',
        401,
      ),
    );
    const retrying = courseJob({ attemptsMade: 1 });
    await expect(processor.process(retrying as never)).rejects.toThrow(
      'HTTP 401',
    );
    expect(runs.fail).not.toHaveBeenCalled();

    const last = courseJob({ attemptsMade: 2 });
    await expect(processor.process(last as never)).rejects.toThrow('HTTP 401');
    expect(runs.fail).toHaveBeenCalledWith(
      'run-1',
      'Token Canvas hết hạn hoặc không hợp lệ',
    );
  });

  it('reuses the run opened by an earlier attempt of the same job', async () => {
    const { processor, runs } = setup();
    const retry = courseJob({
      attemptsMade: 1,
      data: {
        courseId: 'course-1',
        actor: { kind: 'system' },
        trigger: 'manual',
        runId: 'run-0',
      },
    });
    await processor.process(retry as never);
    expect(runs.start).not.toHaveBeenCalled();
    expect(runs.finish).toHaveBeenCalledWith('run-0', expect.anything());
  });

  it('maps an unreachable Canvas and keeps other messages as they are', async () => {
    const { processor, sync, runs } = setup();
    sync.syncCourse.mockRejectedValueOnce(
      new BadGatewayException(
        'Không kết nối được Canvas khi đọc module: fetch failed',
      ),
    );
    await expect(
      processor.process(courseJob({ opts: { attempts: 1 } }) as never),
    ).rejects.toThrow();
    expect(runs.fail).toHaveBeenLastCalledWith(
      'run-1',
      'Không kết nối được Canvas',
    );

    sync.syncCourse.mockRejectedValueOnce(
      new Error('Course not linked to Canvas'),
    );
    await expect(
      processor.process(courseJob({ opts: { attempts: 1 } }) as never),
    ).rejects.toThrow();
    expect(runs.fail).toHaveBeenLastCalledWith(
      'run-1',
      'Course not linked to Canvas',
    );
  });

  it('still syncs when the run history cannot be written', async () => {
    const { processor, sync, runs } = setup();
    runs.start.mockRejectedValue(
      new Error('relation "canvas_sync_runs" does not exist'),
    );
    await expect(processor.process(courseJob() as never)).resolves.toEqual({
      created: ['one.pdf'],
    });
    expect(sync.syncCourse).toHaveBeenCalledTimes(1);
    expect(runs.finish).not.toHaveBeenCalled();

    runs.start.mockResolvedValue('run-2');
    runs.finish.mockRejectedValue(new Error('db down'));
    await expect(processor.process(courseJob() as never)).resolves.toEqual({
      created: ['one.pdf'],
    });
  });
  describe('roster job', () => {
    function rosterJob(overrides: Record<string, unknown> = {}) {
      return courseJob({ name: CANVAS_ROSTER_SYNC, ...overrides });
    }

    it('syncs the roster, not the documents, and records a roster run', async () => {
      const { processor, sync, roster, runs, jobs } = setup();
      const job = rosterJob({
        data: {
          courseId: 'course-1',
          actor: { kind: 'system' },
          trigger: 'schedule',
        },
      });
      await expect(processor.process(job as never)).resolves.toEqual({
        total: 3,
        created: 2,
      });
      expect(roster.syncCourse).toHaveBeenCalledWith('course-1');
      expect(sync.syncCourse).not.toHaveBeenCalled();
      expect(runs.start).toHaveBeenCalledWith('course-1', 'sweep', 'roster');
      expect(runs.finish).toHaveBeenCalledWith('run-1', {
        total: 3,
        created: 2,
      });
      expect(jobs.markRosterAttempt).toHaveBeenCalledTimes(2);
      expect(jobs.markSyncAttempt).not.toHaveBeenCalled();
    });

    it('closes the roster run as an error on the last attempt', async () => {
      const { processor, roster, runs } = setup();
      roster.syncCourse.mockRejectedValue(
        new Error('Canvas từ chối đọc danh sách lớp (401).'),
      );
      const retrying = rosterJob({ attemptsMade: 1 });
      await expect(processor.process(retrying as never)).rejects.toThrow('401');
      expect(runs.fail).not.toHaveBeenCalled();
      const last = rosterJob({ attemptsMade: 2 });
      await expect(processor.process(last as never)).rejects.toThrow('401');
      expect(runs.fail).toHaveBeenCalledWith(
        'run-1',
        'Canvas từ chối đọc danh sách lớp (401).',
      );
    });

    it('still syncs the roster when the run history cannot be written', async () => {
      const { processor, roster, runs } = setup();
      runs.start.mockRejectedValue(new Error('column "kind" does not exist'));
      await expect(processor.process(rosterJob() as never)).resolves.toEqual({
        total: 3,
        created: 2,
      });
      expect(roster.syncCourse).toHaveBeenCalledTimes(1);
    });
  });
});
