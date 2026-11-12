import { CanvasSyncRunsService } from './canvas-sync-runs.service';

describe('CanvasSyncRunsService', () => {
  function setup() {
    const prisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    return { service: new CanvasSyncRunsService(prisma as never), prisma };
  }

  const sql = (call: unknown[]) =>
    (call[0] as string[]).join('?').replace(/\s+/g, ' ').trim();

  it('inserts a running row and returns its id', async () => {
    const { service, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([{ run_id: 'run-1' }]);
    await expect(service.start('course-1', 'manual')).resolves.toBe('run-1');
    const call = prisma.$queryRaw.mock.calls[0];
    expect(sql(call)).toContain('INSERT INTO canvas_sync_runs');
    expect(sql(call)).toContain("'running'");
    expect(call.slice(1)).toEqual(['course-1', 'manual', 'documents']);
  });

  it('records the kind of run, so roster runs stay apart from document runs', async () => {
    const { service, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([{ run_id: 'run-2' }]);
    await service.start('course-1', 'sweep', 'roster');
    expect(prisma.$queryRaw.mock.calls[0].slice(1)).toEqual([
      'course-1',
      'sweep',
      'roster',
    ]);
  });

  it('filters the latest run and the last success by kind, documents by default', async () => {
    const { service, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([]);
    await service.latest('course-1');
    await service.latest('course-1', 'roster');
    await service.lastSuccessAt('course-1');
    await service.lastSuccessAt('course-1', 'roster');
    const calls = prisma.$queryRaw.mock.calls;
    for (const call of calls) expect(sql(call)).toContain('kind = ?');
    expect(calls.map((c) => c.slice(1))).toEqual([
      ['course-1', 'documents'],
      ['course-1', 'roster'],
      ['course-1', 'documents'],
      ['course-1', 'roster'],
    ]);
  });

  it('finishes a run with the JSON summary and clears the error', async () => {
    const { service, prisma } = setup();
    await service.finish('run-1', { created: ['a.pdf'], unchanged: 2 });
    const call = prisma.$executeRaw.mock.calls[0];
    expect(sql(call)).toContain("status = 'success'");
    expect(sql(call)).toContain('error = NULL');
    expect(call.slice(1)).toEqual([
      JSON.stringify({ created: ['a.pdf'], unchanged: 2 }),
      'run-1',
    ]);
  });

  it('fails a run with the message', async () => {
    const { service, prisma } = setup();
    await service.fail('run-1', 'Không kết nối được Canvas');
    const call = prisma.$executeRaw.mock.calls[0];
    expect(sql(call)).toContain("status = 'error'");
    expect(call.slice(1)).toEqual(['Không kết nối được Canvas', 'run-1']);
  });

  it('reads the latest run and the last success per course', async () => {
    const { service, prisma } = setup();
    const finished = new Date('2026-11-12T07:30:00Z');
    prisma.$queryRaw.mockResolvedValueOnce([
      { run_id: 'run-9', status: 'error' },
    ]);
    prisma.$queryRaw.mockResolvedValueOnce([{ finished_at: finished }]);
    await expect(service.latest('course-1')).resolves.toMatchObject({
      run_id: 'run-9',
    });
    await expect(service.lastSuccessAt('course-1')).resolves.toBe(finished);
    expect(sql(prisma.$queryRaw.mock.calls[0])).toContain(
      'ORDER BY started_at DESC LIMIT 1',
    );
    expect(sql(prisma.$queryRaw.mock.calls[1])).toContain("status = 'success'");
  });

  it('returns null when the course has no runs', async () => {
    const { service, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(service.latest('course-1')).resolves.toBeNull();
    await expect(service.lastSuccessAt('course-1')).resolves.toBeNull();
  });
});
