import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { CONTRACTS_DIR } from '../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';
import {
  EnrichmentContentResultHandler,
  parseEnrichmentContentPayload,
} from './enrichment-content-result.handler';

const DOC = '019fdbaa-c096-78e5-a91a-982998d5b5b0';
const C1 = '019fdbab-0000-7000-8000-000000000001';

const card = (over: Record<string, unknown> = {}) => ({
  card_id: '6f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f',
  primary_chunk_id: C1,
  source_chunk_ids: [C1],
  heading_path: ['Giải tích'],
  title: 'Đạo hàm',
  bullets: ['a'],
  key_insight: 'k',
  card_index: 0,
  ...over,
});
const quiz = (over: Record<string, unknown> = {}) => ({
  quiz_id: '7a1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f',
  primary_chunk_id: C1,
  source_chunk_ids: [C1],
  question: 'q?',
  choices: ['A', 'B', 'C', 'D'],
  correct_index: 1,
  explanation: 'vì B',
  ...over,
});
const payload = (over: Record<string, unknown> = {}) => ({
  document_id: DOC,
  processing_generation: 2,
  model_id: 'gemini',
  lesson_cards: [card()],
  quiz_items: [quiz()],
  ...over,
});

function rejection(p: Record<string, unknown>): Error {
  try {
    parseEnrichmentContentPayload(p, 'r1');
  } catch (err) {
    return err as Error;
  }
  throw new Error('expected rejection');
}

describe('parseEnrichmentContentPayload', () => {
  it('accepts a full and an empty result', () => {
    expect(parseEnrichmentContentPayload(payload(), 'r1')).toEqual(payload());
    const empty = payload({ model_id: null, lesson_cards: [], quiz_items: [] });
    expect(parseEnrichmentContentPayload(empty, 'r1')).toEqual(empty);
  });

  it.each([
    ['a missing generation', { processing_generation: undefined }],
    ['a missing model_id', { model_id: undefined }],
    [
      'a non-UUID chunk',
      { lesson_cards: [card({ source_chunk_ids: ['chunk-1'] })] },
    ],
    ['a card without bullets', { lesson_cards: [card({ bullets: [] })] }],
    [
      'a title over 255 chars',
      { lesson_cards: [card({ title: 'x'.repeat(256) })] },
    ],
    [
      'a correct index outside the choices',
      { quiz_items: [quiz({ choices: ['A', 'B'], correct_index: 2 })] },
    ],
    [
      'a single choice',
      { quiz_items: [quiz({ choices: ['A'], correct_index: 0 })] },
    ],
    ['duplicate card ids', { lesson_cards: [card(), card({ title: 'khác' })] }],
    [
      'an extra card field',
      { lesson_cards: [{ ...card(), status: 'APPROVED' }] },
    ],
    ['an extra top-level field', { course_id: DOC }],
  ])('rejects %s without retry', (_label, over) => {
    const p: Record<string, unknown> = payload(over);
    for (const [key, value] of Object.entries(over)) {
      if (value === undefined) delete p[key];
    }
    expect(rejection(p)).toBeInstanceOf(InvalidWorkerResultError);
  });
});

describe('EnrichmentContentResultHandler', () => {
  function setup(doc: unknown) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue(doc ? [doc] : []),
      $executeRaw: jest.fn().mockResolvedValue(1),
      documents: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return {
      handler: new EnrichmentContentResultHandler(prisma as never),
      tx,
      prisma,
    };
  }
  const envelope = (p: Record<string, unknown>) => ({
    result_id: 'ENRICHMENT_CONTENT_RESULT.x',
    kind: 'ENRICHMENT_CONTENT_RESULT' as const,
    source_event_id: null,
    occurred_at: '2026-11-07T10:00:00Z',
    payload: p,
  });

  it.each([
    [null, 'document_missing'],
    [
      {
        processing_generation: 2,
        enrichment_generation: null,
        deleted_at: new Date(),
      },
      'document_missing',
    ],
    [
      {
        processing_generation: 3,
        enrichment_generation: null,
        deleted_at: null,
      },
      'stale_generation',
    ],
    [
      { processing_generation: 2, enrichment_generation: 2, deleted_at: null },
      'already_applied',
    ],
  ])(
    'writes nothing when the result does not apply (%p)',
    async (doc, reason) => {
      const { handler, tx } = setup(doc);
      await expect(handler.handle(envelope(payload()))).resolves.toEqual({
        applied: false,
        reason,
      });
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.documents.update).not.toHaveBeenCalled();
    },
  );

  it('retires drafts, inserts cards and quiz items, then records the generation', async () => {
    const { handler, tx } = setup({
      processing_generation: 2,
      enrichment_generation: 1,
      deleted_at: null,
    });

    await expect(handler.handle(envelope(payload()))).resolves.toEqual({
      applied: true,
      cards: 1,
      quizItems: 1,
      skippedCards: 0,
      skippedQuizItems: 0,
      retiredCards: 1,
      retiredQuizItems: 1,
    });
    // 2 UPDATE soft-delete + 1 INSERT thẻ + 1 INSERT câu: số câu lệnh không
    // tăng theo số thẻ (DB ở xa, transaction có hạn thời gian).
    expect(tx.$executeRaw).toHaveBeenCalledTimes(4);
    expect(tx.documents.update).toHaveBeenCalledWith({
      where: { document_id: DOC },
      data: { enrichment_generation: 2 },
    });
  });

  it('does not run the INSERTs for an empty result', async () => {
    const { handler, tx } = setup({
      processing_generation: 2,
      enrichment_generation: null,
      deleted_at: null,
    });
    await handler.handle(
      envelope(payload({ lesson_cards: [], quiz_items: [] })),
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
  });
});

describe('EnrichmentContentResultHandler.onFinalFailure', () => {
  const envelope = (p: unknown) => ({
    result_id: 'ENRICHMENT_CONTENT_RESULT.x',
    kind: 'ENRICHMENT_CONTENT_RESULT' as const,
    source_event_id: null,
    occurred_at: '2026-11-07T10:00:00Z',
    payload: p as Record<string, unknown>,
  });
  function setup() {
    // Hook không được chạm DB: mọi phương thức Prisma đều là bẫy.
    const trap = () => {
      throw new Error('onFinalFailure must not touch the database');
    };
    const prisma = {
      $transaction: jest.fn(trap),
      $executeRaw: jest.fn(trap),
      $queryRaw: jest.fn(trap),
      documents: { update: jest.fn(trap), updateMany: jest.fn(trap) },
    };
    return { prisma, handler: new EnrichmentContentResultHandler(prisma as never) };
  }
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('only logs which document and generation lost its drafts; the document status is not touched', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(envelope(payload()), new InvalidWorkerResultError('boom'));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(`tài liệu ${DOC} lượt 2`),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.documents.updateMany).not.toHaveBeenCalled();
  });

  it.each(['rác', null, {}, { document_id: 7, processing_generation: 'x' }])(
    'never throws for an unreadable payload (%p)',
    async (p) => {
      const { handler } = setup();

      await expect(
        handler.onFinalFailure(envelope(p), new Error('x')),
      ).resolves.toBeUndefined();
    },
  );
});

describe('enrichment-content-result: độ dài tính theo code point', () => {
  const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16

  it('accepts a card title of exactly 255 non-BMP characters and rejects 256', () => {
    expect(() =>
      parseEnrichmentContentPayload(
        payload({ lesson_cards: [card({ title: MATH.repeat(255) })] }),
        'r1',
      ),
    ).not.toThrow();
    expect(() =>
      parseEnrichmentContentPayload(
        payload({ lesson_cards: [card({ title: MATH.repeat(256) })] }),
        'r1',
      ),
    ).toThrow(/title must be 1..255 chars/);
  });

  it('accepts a model_id of exactly 200 non-BMP characters and rejects 201', () => {
    expect(() =>
      parseEnrichmentContentPayload(payload({ model_id: MATH.repeat(200) }), 'r1'),
    ).not.toThrow();
    expect(() =>
      parseEnrichmentContentPayload(payload({ model_id: MATH.repeat(201) }), 'r1'),
    ).toThrow(/model_id/);
  });
});

// Cùng fixture packages-ai/tests/unit/test_contract_fixtures.py kiểm bằng JSON Schema.
const FIXTURES = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
const describeContract = existsSync(FIXTURES) ? describe : describe.skip;

describeContract('contract fixtures', () => {
  const read = (dir: string, name: string) =>
    JSON.parse(readFileSync(join(FIXTURES, dir, name), 'utf8')) as {
      payload: Record<string, unknown>;
    };

  it('accepts the valid ENRICHMENT_CONTENT_RESULT fixtures', () => {
    for (const name of [
      'enrichment-content-result.json',
      'enrichment-content-result-empty.json',
    ]) {
      expect(() =>
        parseEnrichmentContentPayload(read('valid', name).payload, name),
      ).not.toThrow();
    }
  });

  it('rejects the invalid ENRICHMENT_CONTENT_RESULT fixtures', () => {
    for (const name of [
      'enrichment-content-result-without-generation.json',
      'enrichment-content-result-card-without-bullets.json',
      'enrichment-content-result-title-too-long.json',
      'enrichment-content-result-chunk-id-not-uuid.json',
      'enrichment-content-result-single-choice.json',
      'enrichment-content-result-lesson-cards-missing.json',
    ]) {
      expect(() =>
        parseEnrichmentContentPayload(read('invalid', name).payload, name),
      ).toThrow(InvalidWorkerResultError);
    }
  });
});
