import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { CONTRACTS_DIR } from '../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';
import {
  DocumentProcessingResultHandler,
  parseDocumentProcessingPayload,
  statusSequence,
} from './document-processing-result.handler';

const DOC = '019fdbaa-c096-78e5-a91a-982998d5b5b0';

const status = (over: Record<string, unknown> = {}) => ({
  value: 'CHUNKING',
  stage: 'processing',
  processing_generation: 3,
  attempt: 1,
  ...over,
});
const chapter = (over: Record<string, unknown> = {}) => ({
  chapter_code: '2',
  provenance: 'content',
  confidence: 0.83,
  reason: 'Khớp nội dung với chương 2',
  ...over,
});

function rejection(payload: Record<string, unknown>): Error {
  try {
    parseDocumentProcessingPayload(payload, 'r1');
  } catch (err) {
    return err as Error;
  }
  throw new Error('expected rejection');
}

describe('parseDocumentProcessingPayload', () => {
  it.each([
    ['a status', { document_id: DOC, status: status() }],
    [
      'an ERROR with its message',
      { document_id: DOC, status: status({ value: 'ERROR', error: 'boom' }) },
    ],
    [
      'the enrichment fallback',
      {
        document_id: DOC,
        status: status({ stage: 'enrichment', value: 'INDEXED' }),
      },
    ],
    ['a chapter', { document_id: DOC, chapter: chapter() }],
    ['both', { document_id: DOC, status: status(), chapter: chapter() }],
  ])('accepts %s', (_label, payload) => {
    expect(parseDocumentProcessingPayload(payload, 'r1')).toEqual(payload);
  });

  it.each([
    [
      'ERROR in enrichment',
      { status: status({ stage: 'enrichment', value: 'ERROR' }) },
    ],
    ['ENRICHING in processing', { status: status({ value: 'ENRICHING' }) }],
    ['a core-api status', { status: status({ value: 'QUEUED' }) }],
    ['an unknown stage', { status: status({ stage: 'upload' }) }],
    [
      'a negative generation',
      { status: status({ processing_generation: -1 }) },
    ],
    ['a fractional attempt', { status: status({ attempt: 1.5 }) }],
    ['attempt 0', { status: status({ attempt: 0 }) }],
    ['an empty error', { status: status({ error: '' }) }],
    ['an extra status field', { status: { ...status(), seq: 4 } }],
    ['a confirmed chapter', { chapter: chapter({ provenance: 'confirmed' }) }],
    ['confidence above 1', { chapter: chapter({ confidence: 1.2 }) }],
    [
      'a long chapter code',
      { chapter: chapter({ chapter_code: 'x'.repeat(21) }) },
    ],
    ['a long reason', { chapter: chapter({ reason: 'x'.repeat(256) }) }],
    ['neither status nor chapter', {}],
  ])('rejects %s without retry', (_label, rest) => {
    const err = rejection({ document_id: DOC, ...rest });
    expect(err).toBeInstanceOf(InvalidWorkerResultError);
    expect(err).toBeInstanceOf(UnrecoverableError);
  });

  it('rejects a document id that is not a UUID and unexpected fields', () => {
    const err = rejection({
      document_id: 'doc-1',
      status: status(),
      course_id: DOC,
    });
    expect(err.message).toMatch(
      /unexpected fields: course_id.*document_id must be a UUID/,
    );
  });
});

describe('statusSequence', () => {
  const seq = (
    stage: 'processing' | 'enrichment',
    attempt: number,
    value: string,
  ) => statusSequence(stage, attempt, value);

  it('orders steps inside one attempt', () => {
    const order = ['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXED', 'ERROR'].map(
      (v) => seq('processing', 1, v),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('puts every step of a retry after the previous attempt', () => {
    expect(seq('processing', 2, 'PARSING')).toBeGreaterThan(
      seq('processing', 1, 'ERROR'),
    );
  });

  it('puts enrichment after any processing attempt', () => {
    expect(seq('enrichment', 1, 'ENRICHING')).toBeGreaterThan(
      seq('processing', 9999, 'ERROR'),
    );
    expect(seq('enrichment', 1, 'GENERATED_DRAFT')).toBeGreaterThan(
      seq('enrichment', 1, 'INDEXED'),
    );
    expect(seq('enrichment', 2, 'ENRICHING')).toBeGreaterThan(
      seq('enrichment', 1, 'GENERATED_DRAFT'),
    );
  });

  it('stays within INTEGER for any attempt', () => {
    expect(seq('enrichment', 2_000_000_000, 'GENERATED_DRAFT')).toBeLessThan(
      2 ** 31,
    );
  });
});

describe('DocumentProcessingResultHandler', () => {
  function setup(updated: number, doc: unknown, chapterCount = 1) {
    const tx = {
      documents: {
        updateMany: jest.fn().mockResolvedValue({ count: updated }),
        findUnique: jest.fn().mockResolvedValue(doc),
      },
      $executeRaw: jest.fn().mockResolvedValue(chapterCount),
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return {
      handler: new DocumentProcessingResultHandler(prisma as never),
      tx,
    };
  }
  const envelope = (payload: Record<string, unknown>) => ({
    result_id: 'DOCUMENT_PROCESSING_RESULT.x',
    kind: 'DOCUMENT_PROCESSING_RESULT' as const,
    source_event_id: null,
    occurred_at: '2026-11-07T10:00:00Z',
    payload,
  });

  it('updates only the current generation with an older sequence, in the UPDATE itself', async () => {
    const { handler, tx } = setup(1, null);

    await expect(
      handler.handle(
        envelope({ document_id: DOC, status: status({ attempt: 2 }) }),
      ),
    ).resolves.toEqual({ status: { applied: true, status: 'CHUNKING' } });

    const seq = statusSequence('processing', 2, 'CHUNKING');
    expect(tx.documents.updateMany).toHaveBeenCalledWith({
      where: {
        document_id: DOC,
        deleted_at: null,
        processing_generation: 3,
        processing_seq: { lt: seq },
      },
      data: { status: 'CHUNKING', processing_seq: seq },
    });
  });

  it.each([
    [null, 'document_missing'],
    [{ deleted_at: new Date(), processing_generation: 3 }, 'document_missing'],
    [{ deleted_at: null, processing_generation: 4 }, 'stale_generation'],
    [{ deleted_at: null, processing_generation: 3 }, 'out_of_order'],
  ])('explains why a status was not applied (%p)', async (doc, reason) => {
    const { handler } = setup(0, doc);
    await expect(
      handler.handle(envelope({ document_id: DOC, status: status() })),
    ).resolves.toEqual({ status: { applied: false, reason } });
  });

  it('keeps a chapter that the guarded UPDATE did not touch', async () => {
    const { handler } = setup(0, { deleted_at: null }, 0);
    await expect(
      handler.handle(envelope({ document_id: DOC, chapter: chapter() })),
    ).resolves.toEqual({ chapter: { applied: false, reason: 'chapter_kept' } });
  });

  it('lets database errors propagate so BullMQ retries', async () => {
    const { handler, tx } = setup(1, null);
    tx.documents.updateMany.mockRejectedValue(new Error('connection reset'));
    await expect(
      handler.handle(envelope({ document_id: DOC, status: status() })),
    ).rejects.toThrow('connection reset');
  });
});

describe('DocumentProcessingResultHandler.onFinalFailure', () => {
  function setup(count = 1) {
    const prisma = {
      documents: { updateMany: jest.fn().mockResolvedValue({ count }) },
    };
    return {
      prisma,
      handler: new DocumentProcessingResultHandler(prisma as never),
    };
  }
  const envelope = (payload: Record<string, unknown>) => ({
    result_id: 'DOCUMENT_PROCESSING_RESULT.x',
    kind: 'DOCUMENT_PROCESSING_RESULT' as const,
    source_event_id: null,
    occurred_at: '2026-11-07T10:00:00Z',
    payload,
  });
  afterEach(() => jest.restoreAllMocks());

  it('processing: still-running document of this generation → ERROR at the position of the failed report', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope({ document_id: DOC, status: status({ attempt: 2 }) }),
      new InvalidWorkerResultError('x'),
    );

    // Cùng cơ chế handle(): đúng lượt, thứ tự lớn hơn processing_seq; chỉ đổi
    // tài liệu còn đang xử lý. Thứ tự là của báo cáo hỏng (CHUNKING lần 2), không
    // phải của ERROR, để báo cáo mới hơn của cùng lần chạy vẫn đè được.
    const seq = statusSequence('processing', 2, 'CHUNKING');
    expect(prisma.documents.updateMany).toHaveBeenCalledWith({
      where: {
        document_id: DOC,
        deleted_at: null,
        processing_generation: 3,
        processing_seq: { lt: seq },
        status: { in: ['QUEUED', 'PENDING', 'PARSING', 'CHUNKING', 'EMBEDDING'] },
      },
      data: { status: 'ERROR', processing_seq: seq },
    });
  });

  it('never targets a finished document: INDEXED, GENERATED_DRAFT, ERROR are not in the allow-list', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope({ document_id: DOC, status: status() }),
      new Error('x'),
    );

    const where = prisma.documents.updateMany.mock.calls[0][0].where as {
      status: { in: string[] };
    };
    for (const finished of ['INDEXED', 'GENERATED_DRAFT', 'ERROR', 'ENRICHING', 'UPLOADING']) {
      expect(where.status.in).not.toContain(finished);
    }
  });

  it('enrichment: a document stuck in ENRICHING goes back to INDEXED, never to ERROR', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope({
        document_id: DOC,
        status: status({ stage: 'enrichment', value: 'GENERATED_DRAFT', attempt: 1 }),
      }),
      new Error('x'),
    );

    const seq = statusSequence('enrichment', 1, 'GENERATED_DRAFT');
    expect(prisma.documents.updateMany).toHaveBeenCalledWith({
      where: {
        document_id: DOC,
        deleted_at: null,
        processing_generation: 3,
        processing_seq: { lt: seq },
        status: { in: ['ENRICHING'] },
      },
      data: { status: 'INDEXED', processing_seq: seq },
    });
  });

  it.each([
    ['payload không phải object', 'rác'],
    ['không có status', { document_id: DOC, chapter: chapter() }],
    ['status không phải object', { document_id: DOC, status: 'ERROR' }],
    ['document_id không phải uuid', { document_id: 'doc-1', status: status() }],
    ['giai đoạn lạ', { document_id: DOC, status: status({ stage: 'upload' }) }],
    ['bước không thuộc giai đoạn', { document_id: DOC, status: status({ value: 'ENRICHING' }) }],
    ['bước không phải chuỗi', { document_id: DOC, status: status({ value: 4 }) }],
    ['lượt âm', { document_id: DOC, status: status({ processing_generation: -1 }) }],
    ['lượt không nguyên', { document_id: DOC, status: status({ processing_generation: 1.5 }) }],
    ['lần chạy 0', { document_id: DOC, status: status({ attempt: 0 }) }],
    ['lần chạy là chuỗi', { document_id: DOC, status: status({ attempt: '1' }) }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope(payload as Record<string, unknown>),
      new Error('x'),
    );

    expect(prisma.documents.updateMany).not.toHaveBeenCalled();
  });

  it('is a no-op for a document already past the failed report (the update matches no row)', async () => {
    const { handler, prisma } = setup(0);

    await expect(
      handler.onFinalFailure(envelope({ document_id: DOC, status: status() }), new Error('x')),
    ).resolves.toBeUndefined();

    expect(prisma.documents.updateMany).toHaveBeenCalledTimes(1);
  });

  it('never throws when the database is down', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handler, prisma } = setup();
    prisma.documents.updateMany.mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(envelope({ document_id: DOC, status: status() }), new Error('x')),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('document-processing-result: độ dài tính theo code point', () => {
  const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16
  const parse = (payload: Record<string, unknown>) =>
    parseDocumentProcessingPayload(payload, 'r1');

  it('accepts status.error of exactly 1000 non-BMP characters and rejects 1001', () => {
    const withError = (error: string) => ({
      document_id: DOC,
      status: status({ value: 'ERROR', error }),
    });
    expect(() => parse(withError(MATH.repeat(1000)))).not.toThrow();
    expect(() => parse(withError(MATH.repeat(1001)))).toThrow(/status.error/);
  });

  it('accepts chapter reason 255 and chapter_code 20 non-BMP characters, rejects one more', () => {
    const withChapter = (over: Record<string, unknown>) => ({
      document_id: DOC,
      chapter: chapter(over),
    });
    expect(() =>
      parse(withChapter({ reason: MATH.repeat(255), chapter_code: MATH.repeat(20) })),
    ).not.toThrow();
    expect(() => parse(withChapter({ reason: MATH.repeat(256) }))).toThrow(/chapter.reason/);
    expect(() => parse(withChapter({ chapter_code: MATH.repeat(21) }))).toThrow(
      /chapter.chapter_code/,
    );
  });
});

// Cùng fixture packages-ai/tests/unit/test_contract_fixtures.py kiểm bằng JSON Schema.
const FIXTURES = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
const describeContract = existsSync(FIXTURES) ? describe : describe.skip;

describeContract('DOCUMENT_PROCESSING_RESULT contract fixtures', () => {
  const fixtures = (dir: 'valid' | 'invalid') =>
    readdirSync(join(FIXTURES, dir))
      .filter((name) => name.startsWith('document-processing-result'))
      .map(
        (name) =>
          [
            name,
            JSON.parse(readFileSync(join(FIXTURES, dir, name), 'utf8')),
          ] as [string, { payload: Record<string, unknown> }],
      );

  it('accepts every valid fixture', () => {
    const valid = fixtures('valid');
    expect(valid.length).toBeGreaterThan(0);
    for (const [name, data] of valid) {
      expect(() =>
        parseDocumentProcessingPayload(data.payload, name),
      ).not.toThrow();
    }
  });

  it('rejects every invalid fixture', () => {
    const invalid = fixtures('invalid');
    expect(invalid.length).toBeGreaterThan(0);
    for (const [name, data] of invalid) {
      expect(() => parseDocumentProcessingPayload(data.payload, name)).toThrow(
        InvalidWorkerResultError,
      );
    }
  });
});
