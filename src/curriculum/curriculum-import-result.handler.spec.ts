import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { InvalidWorkerResultError } from '../worker-results/worker-result-envelope';
import { CurriculumImportResultHandler } from './curriculum-import-result.handler';

const FIXTURES = join(
  __dirname,
  '..',
  '..',
  '..',
  'contracts',
  'fixtures',
  'v1',
);
const IMPORT_ID = '01900000-0000-7000-8000-0000000000aa';

/** Envelope READY của đề cương CO3011 thật, do worker sinh (fixture hợp đồng). */
function readyEnvelope() {
  return JSON.parse(
    readFileSync(
      join(FIXTURES, 'valid', 'curriculum-import-result.json'),
      'utf8',
    ),
  );
}

function failedEnvelope() {
  return JSON.parse(
    readFileSync(
      join(FIXTURES, 'valid', 'curriculum-import-result-failed.json'),
      'utf8',
    ),
  );
}

function setup(
  updated = 1,
  current: { status: string } | null = { status: 'READY' },
) {
  const prisma = {
    curriculum_imports: {
      updateMany: jest.fn().mockResolvedValue({ count: updated }),
      findUnique: jest.fn().mockResolvedValue(current),
    },
  };
  const handler = new CurriculumImportResultHandler(prisma as never);
  return { handler, prisma };
}

describe('CurriculumImportResultHandler', () => {
  it('stores the preview and the full curriculum while the import awaits its preview', async () => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();

    await expect(handler.handle(envelope)).resolves.toEqual({
      applied: true,
      status: 'READY',
    });

    const [args] = prisma.curriculum_imports.updateMany.mock.calls[0];
    expect(args.where).toEqual({
      import_id: IMPORT_ID,
      status: { in: ['QUEUED', 'EXTRACTING'] },
    });
    expect(args.data).toMatchObject({ status: 'READY', error: null });
    expect(args.data.preview).toEqual(envelope.payload.preview);
    expect(args.data.curriculum).toEqual(envelope.payload.curriculum);
    expect(args.data.curriculum.learning_outcomes).toHaveLength(9);
  });

  it('stores a blocked preview the same way', async () => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    envelope.payload.status = 'BLOCKED';
    envelope.payload.preview.blocking = true;
    envelope.payload.curriculum.issues.push({
      code: 'lo.none',
      severity: 'error',
      message: 'Không có LO',
      source_section: null,
      source_page: null,
      source_locator: null,
    });

    await handler.handle(envelope);

    expect(
      prisma.curriculum_imports.updateMany.mock.calls[0][0].data.status,
    ).toBe('BLOCKED');
  });

  it('records a failure without touching the stored preview, also for a legacy APPLYING import', async () => {
    const { handler, prisma } = setup();

    await handler.handle(failedEnvelope());

    const [args] = prisma.curriculum_imports.updateMany.mock.calls[0];
    expect(args.where.status).toEqual({
      in: ['QUEUED', 'EXTRACTING', 'APPLYING'],
    });
    expect(Object.keys(args.data).sort()).toEqual([
      'error',
      'status',
      'updated_at',
    ]);
    expect(args.data.status).toBe('FAILED');
  });

  it('accepts the failure of a legacy apply job under its own result id', async () => {
    const { handler } = setup();
    const envelope = failedEnvelope();
    envelope.result_id = `CURRICULUM_IMPORT_RESULT.${IMPORT_ID}.legacy-apply`;

    await expect(handler.handle(envelope)).resolves.toMatchObject({
      applied: true,
    });
  });

  it('ignores a result that arrives again after the import moved on (idempotent)', async () => {
    const { handler, prisma } = setup(0, { status: 'APPLIED' });

    await expect(handler.handle(readyEnvelope())).resolves.toEqual({
      applied: false,
      reason: 'not_awaiting',
      status: 'APPLIED',
    });
    expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledTimes(1);
  });

  it('ignores a result for an import that no longer exists', async () => {
    const { handler } = setup(0, null);

    await expect(handler.handle(readyEnvelope())).resolves.toEqual({
      applied: false,
      reason: 'import_missing',
    });
  });

  type Mutate = (env: ReturnType<typeof readyEnvelope>) => void;
  it.each<[string, Mutate]>([
    ['READY without curriculum', (e) => (e.payload.curriculum = null)],
    ['READY with an error', (e) => (e.payload.error = 'x')],
    ['an unknown status', (e) => (e.payload.status = 'APPLIED')],
    ['an extra payload field', (e) => (e.payload.course_id = 'x')],
    ['a non-UUID import_id', (e) => (e.payload.import_id = 'abc')],
    [
      'a Bloom level out of range',
      (e) => (e.payload.curriculum.learning_outcomes[0].bloom_level = 7),
    ],
    [
      'a missing chapter field',
      (e) => delete e.payload.curriculum.chapters[0].topics,
    ],
    [
      'an extra chapter field',
      (e) => (e.payload.curriculum.chapters[0].chapter_id = 'x'),
    ],
    [
      'an empty LO code',
      (e) => (e.payload.curriculum.learning_outcomes[0].code = ''),
    ],
    [
      'an unknown provenance',
      (e) => (e.payload.curriculum.chapter_lo_links[0].provenance = 'guess'),
    ],
    ['a non-array list', (e) => (e.payload.curriculum.goals = {})],
    [
      'preview.blocking that contradicts the status',
      (e) => (e.payload.preview.blocking = true),
    ],
    [
      'blocking issues behind a READY status',
      (e) => (e.payload.curriculum.issues[0].severity = 'error'),
    ],
    [
      'a result id of another import',
      (e) => (e.result_id = 'CURRICULUM_IMPORT_RESULT.other'),
    ],
  ])('rejects %s without retry and without writing', async (_label, mutate) => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    mutate(envelope);

    await expect(handler.handle(envelope)).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
    expect(prisma.curriculum_imports.updateMany).not.toHaveBeenCalled();
  });

  it.each<[string, (e: ReturnType<typeof failedEnvelope>) => void]>([
    ['without an error', (e) => (e.payload.error = null)],
    ['with an empty error', (e) => (e.payload.error = '')],
    ['with a preview', (e) => (e.payload.preview = { blocking: false })],
  ])('rejects a FAILED result %s', async (_label, mutate) => {
    const { handler } = setup();
    const envelope = failedEnvelope();
    mutate(envelope);

    await expect(handler.handle(envelope)).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
  });
});

describe('CurriculumImportResultHandler.onFinalFailure', () => {
  afterEach(() => jest.restoreAllMocks());

  it('moves an import that still awaits its preview to FAILED with a reason the instructor can read', async () => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    envelope.payload.preview.blocking = 'yes'; // payload sai dạng, handle() từ chối
    const error = await handler.handle(envelope).catch((e: Error) => e);
    expect(error).toBeInstanceOf(InvalidWorkerResultError);
    prisma.curriculum_imports.updateMany.mockClear();

    await handler.onFinalFailure(envelope, error as Error);

    const [args] = prisma.curriculum_imports.updateMany.mock.calls[0];
    // Chỉ chờ xem trước: READY/BLOCKED/APPLIED/FAILED và APPLYING không bị đụng.
    expect(args.where).toEqual({
      import_id: IMPORT_ID,
      status: { in: ['QUEUED', 'EXTRACTING'] },
    });
    expect(args.data).toMatchObject({
      status: 'FAILED',
      error: expect.stringContaining('Không áp dụng được kết quả trích xuất đề cương'),
    });
    expect(Object.keys(args.data).sort()).toEqual(['error', 'status', 'updated_at']);
  });

  it('keeps the stored technical reason short and by code point', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(readyEnvelope(), new Error('𝑓'.repeat(5000)));

    const { error } = prisma.curriculum_imports.updateMany.mock.calls[0][0]
      .data as { error: string };
    expect(Array.from(error).length).toBeLessThan(400);
    expect(Buffer.from(error, 'utf8').toString('utf8')).toBe(error);
  });

  it('does not touch an import whose result_id names another import', async () => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    envelope.result_id = 'CURRICULUM_IMPORT_RESULT.01900000-0000-7000-8000-0000000000bb';

    await handler.onFinalFailure(envelope, new Error('x'));

    expect(prisma.curriculum_imports.updateMany).not.toHaveBeenCalled();
  });

  it('accepts the result id of a retry of the same import', async () => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    envelope.result_id = `CURRICULUM_IMPORT_RESULT.${IMPORT_ID}.2`;

    await handler.onFinalFailure(envelope, new Error('x'));

    expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['payload không phải object', 'rác'],
    ['không có import_id', {}],
    ['import_id không phải uuid', { import_id: 'abc' }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const { handler, prisma } = setup();
    const envelope = readyEnvelope();
    envelope.payload = payload;

    await handler.onFinalFailure(envelope, new Error('x'));

    expect(prisma.curriculum_imports.updateMany).not.toHaveBeenCalled();
  });

  it('is a no-op for an import that already finished (the update matches no row)', async () => {
    const { handler, prisma } = setup(0);

    await expect(
      handler.onFinalFailure(readyEnvelope(), new Error('x')),
    ).resolves.toBeUndefined();

    expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledTimes(1);
  });

  it('never throws when the database is down', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handler, prisma } = setup();
    prisma.curriculum_imports.updateMany.mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(readyEnvelope(), new Error('x')),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('curriculum-import-result: độ dài tính theo code point', () => {
  const failed = (error: string) => {
    const envelope = failedEnvelope();
    envelope.payload.error = error;
    return envelope;
  };

  it('accepts a FAILED error of exactly 2000 non-BMP characters and rejects 2001', async () => {
    const { handler } = setup();
    const atLimit = '𝑓'.repeat(2000);
    expect(atLimit.length).toBe(4000);

    await expect(handler.handle(failed(atLimit))).resolves.toMatchObject({
      applied: true,
    });
    await expect(handler.handle(failed(`${atLimit}x`))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
  });
});
