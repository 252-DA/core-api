import { CanvasSyncProcessor } from './canvas-sync.processor';
import {
  CANVAS_SYNC_COURSE,
  CANVAS_SYNC_SWEEP,
} from './canvas-sync-jobs.service';

describe('CanvasSyncProcessor', () => {
  function setup() {
    const sync = {
      syncCourse: jest.fn().mockResolvedValue({ created: ['one.pdf'] }),
    };
    const jobs = { sweep: jest.fn(), markSyncAttempt: jest.fn() };
    return {
      processor: new CanvasSyncProcessor(sync as never, jobs as never),
      sync,
      jobs,
    };
  }

  it('dispatches sweeps without treating them as document processing', async () => {
    const { processor, sync, jobs } = setup();
    await processor.process({ name: CANVAS_SYNC_SWEEP } as never);
    expect(jobs.sweep).toHaveBeenCalledTimes(1);
    expect(sync.syncCourse).not.toHaveBeenCalled();
  });

  it('sets the shared launch cooldown before and after syncing', async () => {
    const { processor, sync, jobs } = setup();
    await processor.process({
      name: CANVAS_SYNC_COURSE,
      data: { courseId: 'course-1', actor: { kind: 'system' } },
    } as never);
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
    await expect(
      processor.process({
        name: CANVAS_SYNC_COURSE,
        data: { courseId: 'course-1', actor: { kind: 'system' } },
      } as never),
    ).rejects.toThrow('Canvas unavailable');
    expect(jobs.markSyncAttempt).toHaveBeenCalledTimes(1);
  });
});
