import { ForbiddenException } from '@nestjs/common';
import {
  CanvasSyncStatusService,
  summaryCounts,
} from './canvas-sync-status.service';

describe('CanvasSyncStatusService', () => {
  const now = new Date('2026-11-12T08:00:00Z').getTime();
  const claims = {
    sub: 'user-1',
    roles: ['instructor'],
    scope: 'course',
  } as never;

  function setup() {
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const runs = {
      latest: jest.fn().mockResolvedValue(null),
      lastSuccessAt: jest.fn().mockResolvedValue(null),
    };
    const tokenStatus = { read: jest.fn().mockResolvedValue(null) };
    const roster = { countActiveLearners: jest.fn().mockResolvedValue(0) };
    return {
      service: new CanvasSyncStatusService(
        authz as never,
        runs as never,
        tokenStatus as never,
        roster as never,
      ),
      authz,
      runs,
      tokenStatus,
      roster,
    };
  }

  it('requires an instructor or TA of the course, like the manual sync', async () => {
    const { service, authz, runs } = setup();
    authz.assertCourseAccess.mockRejectedValue(
      new ForbiddenException('No membership for this course'),
    );
    await expect(service.status(claims, 'course-1', now)).rejects.toThrow(
      ForbiddenException,
    );
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, 'course-1', [
      'instructor',
      'ta',
    ]);
    expect(runs.latest).not.toHaveBeenCalled();
  });

  it('is empty before the first run', async () => {
    const { service } = setup();
    await expect(service.status(claims, 'course-1', now)).resolves.toEqual({
      last_run: null,
      last_success_at: null,
      token: null,
      roster: { last_run: null, last_success_at: null, learners: 0 },
    });
  });

  it('keeps document runs and roster runs apart', async () => {
    const { service, runs } = setup();
    await service.status(claims, 'course-1', now);
    expect(runs.latest).toHaveBeenCalledWith('course-1');
    expect(runs.latest).toHaveBeenCalledWith('course-1', 'roster');
    expect(runs.lastSuccessAt).toHaveBeenCalledWith('course-1');
    expect(runs.lastSuccessAt).toHaveBeenCalledWith('course-1', 'roster');
  });

  it('reports the roster run, the last roster success and the active learner count', async () => {
    const { service, runs, roster } = setup();
    runs.latest.mockImplementation(async (_course: string, kind?: string) =>
      kind === 'roster'
        ? {
            run_id: 'roster-1',
            trigger: 'sweep',
            status: 'error',
            started_at: new Date('2026-11-12T07:45:00Z'),
            finished_at: new Date('2026-11-12T07:45:02Z'),
            summary: null,
            error: 'Canvas từ chối đọc danh sách lớp (401).',
          }
        : null,
    );
    runs.lastSuccessAt.mockImplementation(async (_course: string, kind?: string) =>
      kind === 'roster' ? new Date('2026-11-12T07:30:00Z') : null,
    );
    roster.countActiveLearners.mockResolvedValue(37);
    const result = await service.status(claims, 'course-1', now);
    expect(result.last_run).toBeNull();
    expect(result.roster).toMatchObject({
      last_run: {
        run_id: 'roster-1',
        status: 'error',
        error: 'Canvas từ chối đọc danh sách lớp (401).',
      },
      last_success_at: '2026-11-12T07:30:00.000Z',
      learners: 37,
    });
  });

  it('drops only the roster line when its columns are missing', async () => {
    const { service, roster } = setup();
    roster.countActiveLearners.mockRejectedValue(new Error('boom'));
    await expect(service.status(claims, 'course-1', now)).resolves.toMatchObject({
      last_run: null,
      roster: null,
    });
  });

  it('reports the last run with counts, the last success and the token check', async () => {
    const { service, runs, tokenStatus } = setup();
    const documentsRun = {
      run_id: 'run-1',
      trigger: 'manual',
      status: 'success',
      started_at: new Date('2026-11-12T07:29:50Z'),
      finished_at: new Date('2026-11-12T07:30:00Z'),
      summary: {
        modules: 4,
        files: 9,
        created: ['a.pdf', 'b.pdf'],
        updated: ['c.pdf'],
        unchanged: 6,
        skipped: [],
      },
      error: null,
    };
    runs.latest.mockImplementation(async (_course: string, kind?: string) =>
      kind === 'roster' ? null : documentsRun,
    );
    runs.lastSuccessAt.mockImplementation(async (_course: string, kind?: string) =>
      kind === 'roster' ? null : new Date('2026-11-12T07:30:00Z'),
    );
    const token = {
      checked_at: '2026-11-12T07:00:00.000Z',
      ok: true,
      http_status: 200,
      message: 'Token hợp lệ',
    };
    tokenStatus.read.mockResolvedValue(token);
    await expect(service.status(claims, 'course-1', now)).resolves.toEqual({
      last_run: {
        run_id: 'run-1',
        status: 'success',
        trigger: 'manual',
        started_at: '2026-11-12T07:29:50.000Z',
        finished_at: '2026-11-12T07:30:00.000Z',
        counts: {
          modules: 4,
          files: 9,
          created: 2,
          updated: 1,
          unchanged: 6,
          skipped: 0,
        },
        error: null,
      },
      last_success_at: '2026-11-12T07:30:00.000Z',
      token,
      roster: { last_run: null, last_success_at: null, learners: 0 },
    });
  });

  it('passes a failed run and its message through', async () => {
    const { service, runs } = setup();
    runs.latest.mockResolvedValue({
      run_id: 'run-2',
      trigger: 'sweep',
      status: 'error',
      started_at: new Date('2026-11-12T07:45:00Z'),
      finished_at: new Date('2026-11-12T07:45:01Z'),
      summary: null,
      error: 'Không kết nối được Canvas',
    });
    const result = await service.status(claims, 'course-1', now);
    expect(result.last_run).toMatchObject({
      status: 'error',
      error: 'Không kết nối được Canvas',
      counts: {},
    });
  });

  it('reports a run stuck in "running" for over 30 minutes as interrupted', async () => {
    const { service, runs } = setup();
    const row = {
      run_id: 'run-3',
      trigger: 'launch',
      status: 'running',
      started_at: new Date(now - 31 * 60_000),
      finished_at: null,
      summary: null,
      error: null,
    };
    runs.latest.mockResolvedValue(row);
    expect(
      (await service.status(claims, 'course-1', now)).last_run,
    ).toMatchObject({
      status: 'error',
      error: 'Lần đồng bộ bị gián đoạn',
    });
    runs.latest.mockResolvedValue({
      ...row,
      started_at: new Date(now - 60_000),
    });
    expect(
      (await service.status(claims, 'course-1', now)).last_run,
    ).toMatchObject({
      status: 'running',
      error: null,
    });
  });

  it('drops the token line instead of failing when Redis is down', async () => {
    const { service, tokenStatus } = setup();
    tokenStatus.read.mockRejectedValue(new Error('redis offline'));
    await expect(
      service.status(claims, 'course-1', now),
    ).resolves.toMatchObject({ token: null });
  });
});

describe('summaryCounts', () => {
  it('counts list entries and keeps numbers', () => {
    expect(
      summaryCounts({ created: ['a'], removed: [], files: 3, note: 'x' }),
    ).toEqual({
      created: 1,
      removed: 0,
      files: 3,
    });
    expect(summaryCounts(null)).toEqual({});
  });
});
