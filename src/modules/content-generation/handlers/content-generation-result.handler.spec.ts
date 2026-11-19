import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { CONTRACTS_DIR } from '../../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../../messaging/worker-results/worker-result-envelope';
import type { WorkerResultEnvelope } from '../../../messaging/worker-results/worker-result-envelope';
import { aiQuizProvenance } from '../domain/generated-content';
import {
  ContentGenerationResultHandler,
  verificationSummary,
} from './content-generation-result.handler';
import { parseContentGenerationResult } from './content-generation-result.payload';

const REQUEST = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c02';
const COURSE = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c03';
const LO = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c04';
const CHUNK = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c05';

const evidence = { criterion: 'source_grounding', judge_verdict: 'supported' };

function quizItem(overrides: Record<string, unknown> = {}) {
  return {
    quiz_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e11',
    type: 'MCQ_SINGLE',
    question: 'Dijkstra cần gì?',
    options: ['Không âm', 'Âm', 'Bằng 0', 'Tuỳ ý'],
    correct_answer: 'Không âm',
    explanation: 'Slide 12.',
    bloom_level: 3,
    source_chunk_ids: [CHUNK],
    verification_status: 'VERIFIED',
    verification_evidence: evidence,
    ...overrides,
  };
}

function quizPayload(
  items: unknown[] = [quizItem()],
  extra: Record<string, unknown> = {},
) {
  return {
    request_id: REQUEST,
    course_id: COURSE,
    content_type: 'quiz',
    status: 'SUCCEEDED',
    lo_id: LO,
    generated_count: items.length,
    quiz_items: items,
    rejected: [],
    ...extra,
  };
}

function envelope(payload: unknown): WorkerResultEnvelope {
  return {
    result_id: `CONTENT_GENERATION_RESULT.event.${String((payload as { status?: string } | null)?.status)}`,
    kind: 'CONTENT_GENERATION_RESULT',
    source_event_id: 'event',
    occurred_at: '2026-11-07T10:30:15.123Z',
    payload: payload as Record<string, unknown>,
  };
}

describe('parseContentGenerationResult', () => {
  // Cùng bộ fixture mà packages-ai kiểm bằng JSON Schema: schema và parser
  // của core-api phải đồng ý với nhau.
  const fixtures = join(CONTRACTS_DIR, 'fixtures', 'v1');
  const ours = (dir: string) =>
    existsSync(join(fixtures, dir))
      ? readdirSync(join(fixtures, dir)).filter((f) =>
          f.startsWith('content-generation-result'),
        )
      : [];
  const load = (dir: string, file: string) =>
    JSON.parse(readFileSync(join(fixtures, dir, file), 'utf8')) as {
      payload: unknown;
    };
  const valid = ours('valid');
  const invalid = ours('invalid');
  const itFixtures = valid.length ? it : it.skip;

  itFixtures('accepts every valid contract fixture', () => {
    for (const file of valid) {
      expect(() =>
        parseContentGenerationResult(load('valid', file).payload, file),
      ).not.toThrow();
    }
  });

  itFixtures('rejects every invalid contract fixture', () => {
    for (const file of invalid) {
      expect(() =>
        parseContentGenerationResult(load('invalid', file).payload, file),
      ).toThrow(InvalidWorkerResultError);
    }
  });

  it('normalizes the answer key exactly like the instructor path', () => {
    const result = parseContentGenerationResult(
      quizPayload([
        quizItem({
          quiz_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e12',
          type: 'MCQ_MULTI',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: ['C', 'A'],
        }),
      ]),
    );
    expect(result).toMatchObject({
      status: 'SUCCEEDED',
      quiz_items: [
        { options: ['A', 'B', 'C', 'D'], correct_answer: ['A', 'C'] },
      ],
    });
  });

  it.each([
    [
      'answer not among options',
      quizItem({ correct_answer: 'Khác' }),
      /Đáp án đúng/,
    ],
    [
      'duplicate options',
      quizItem({ options: ['A', 'a', 'B', 'C'], correct_answer: 'A' }),
      /khác nhau/,
    ],
    [
      'options on a fill-blank',
      quizItem({
        type: 'FILL_BLANK',
        question: 'Có ____ cạnh.',
        correct_answer: ['n-1'],
      }),
      /options must be null/,
    ],
    [
      'true/false with other options',
      quizItem({
        type: 'TRUE_FALSE',
        options: ['Có', 'Không'],
        correct_answer: 'Có',
      }),
      /options must be/,
    ],
    [
      'unknown verification status',
      quizItem({ verification_status: 'APPROVED' }),
      /verification_status/,
    ],
    [
      'missing evidence',
      quizItem({ verification_evidence: null }),
      /verification_evidence/,
    ],
    [
      'non-uuid chunk',
      quizItem({ source_chunk_ids: ['chunk-1'] }),
      /source_chunk_ids/,
    ],
    ['unknown type', quizItem({ type: 'ESSAY' }), /question type/],
    [
      'extra field',
      quizItem({ difficulty: 'easy' }),
      /unexpected fields difficulty/,
    ],
  ])('rejects a quiz item with %s', (_name, item, message) => {
    expect(() => parseContentGenerationResult(quizPayload([item]))).toThrow(
      message,
    );
  });

  it('rejects a count that does not match the items', () => {
    expect(() =>
      parseContentGenerationResult(
        quizPayload([quizItem()], { generated_count: 2 }),
      ),
    ).toThrow(/generated_count must equal quiz_items.length/);
  });

  it('rejects the same quiz_id twice in one batch', () => {
    expect(() =>
      parseContentGenerationResult(quizPayload([quizItem(), quizItem()])),
    ).toThrow(/appears twice/);
  });

  it('accepts a FAILED result for a job that could not be read', () => {
    expect(
      parseContentGenerationResult({
        request_id: REQUEST,
        course_id: null,
        content_type: null,
        status: 'FAILED',
        error: 'invalid content-generation job: job payload must be an object',
      }),
    ).toMatchObject({ status: 'FAILED', course_id: null });
  });

  describe('length limits count code points, like the schema maxLength', () => {
    const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16, 1 ký tự

    it('accepts a rejection reason of exactly 300 non-BMP characters', () => {
      const reason = MATH.repeat(300);
      expect(reason.length).toBe(600);
      expect(() =>
        parseContentGenerationResult(
          quizPayload([quizItem()], {
            rejected: [{ reason, regeneration_attempts: 1 }],
          }),
        ),
      ).not.toThrow();
      expect(() =>
        parseContentGenerationResult(
          quizPayload([quizItem()], {
            rejected: [{ reason: `${reason}x`, regeneration_attempts: 1 }],
          }),
        ),
      ).toThrow(/reason must be text of 1–300 characters/);
    });

    it('accepts a FAILED error of exactly 4000 non-BMP characters', () => {
      const failed = (error: string) => ({
        request_id: REQUEST,
        course_id: null,
        content_type: null,
        status: 'FAILED',
        error,
      });
      expect(() =>
        parseContentGenerationResult(failed(MATH.repeat(4000))),
      ).not.toThrow();
      expect(() =>
        parseContentGenerationResult(failed(`${MATH.repeat(4000)}x`)),
      ).toThrow(/error must be text of 1–4000 characters/);
    });

    it('accepts a card title of exactly 255 non-BMP characters', () => {
      const card = (title: string) => ({
        card_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e21',
        title,
        content: {
          key_insight: 'Ý chính',
          bullets: ['Một ý'],
          example: null,
          misconception: null,
          check_question: 'Câu hỏi?',
          check_answer: 'Trả lời.',
          model_id: null,
        },
        source_chunk_ids: [CHUNK],
        verification_status: 'VERIFIED',
        verification_evidence: evidence,
      });
      const payload = (title: string) => ({
        request_id: REQUEST,
        course_id: COURSE,
        content_type: 'card',
        status: 'SUCCEEDED',
        lo_id: LO,
        generated_count: 1,
        lesson_cards: [card(title)],
        rejected: [],
      });
      expect(() =>
        parseContentGenerationResult(payload(MATH.repeat(255))),
      ).not.toThrow();
      expect(() =>
        parseContentGenerationResult(payload(MATH.repeat(256))),
      ).toThrow(/title must be non-empty text of at most 255 characters/);
    });
  });

  it('rejects an unknown status', () => {
    expect(() =>
      parseContentGenerationResult({
        request_id: REQUEST,
        course_id: COURSE,
        content_type: 'quiz',
        status: 'QUEUED',
      }),
    ).toThrow(InvalidWorkerResultError);
  });
});

describe('verificationSummary', () => {
  it('counts kept items by verdict and rejected items separately', () => {
    expect(
      verificationSummary(
        ['VERIFIED', 'VERIFIED', 'INCONCLUSIVE', 'FLAGGED'],
        [{ reason: 'không bám nguồn', regeneration_attempts: 2 }],
      ),
    ).toEqual({
      criterion: 'source_grounding',
      verified: 2,
      inconclusive: 1,
      flagged: 1,
      unverified: 0,
      rejected: 1,
      rejected_reasons: ['không bám nguồn'],
    });
  });
});

describe('aiQuizProvenance', () => {
  it('copies writer_model, judge_model and judge_is_writer only', () => {
    expect(
      aiQuizProvenance({
        criterion: 'source_grounding',
        judge_verdict: 'supported',
        writer_model: 'gemini-2.5',
        judge_model: 'deepseek-r1',
        judge_is_writer: false,
      }),
    ).toEqual({
      writer_model: 'gemini-2.5',
      judge_model: 'deepseek-r1',
      judge_is_writer: false,
    });
    expect(
      aiQuizProvenance({
        writer_model: null,
        judge_model: null,
        judge_is_writer: false,
      }),
    ).toEqual({
      writer_model: null,
      judge_model: null,
      judge_is_writer: false,
    });
    expect(aiQuizProvenance({ criterion: 'source_grounding' })).toEqual({});
  });
});

describe('ContentGenerationResultHandler', () => {
  function setup(
    request:
      | {
          status: string;
          type?: string;
          course_id?: string;
          requested_by?: string | null;
        }
      | undefined,
  ) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue(
        request
          ? [
              {
                request_id: REQUEST,
                course_id: request.course_id ?? COURSE,
                type: request.type ?? 'quiz',
                status: request.status,
                requested_by:
                  request.requested_by !== undefined
                    ? request.requested_by
                    : null,
              },
            ]
          : [],
      ),
      $executeRaw: jest.fn().mockResolvedValue(1),
      learning_outcomes: {
        findFirst: jest.fn().mockResolvedValue({
          lo_id: LO,
          course_id: COURSE,
          statement_vi: 'Hiểu đồ thị',
        }),
      },
      lessons: {
        upsert: jest.fn().mockResolvedValue({
          lesson_id: 'lesson',
          course_id: COURSE,
          lo_id: LO,
        }),
      },
      content_generation_requests: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
      content_generation_requests: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    return {
      tx,
      prisma,
      handler: new ContentGenerationResultHandler(prisma as never),
    };
  }

  it('moves a queued request to RUNNING', async () => {
    const { tx, handler } = setup({ status: 'QUEUED' });

    await expect(
      handler.handle(
        envelope({
          request_id: REQUEST,
          course_id: COURSE,
          content_type: 'quiz',
          status: 'RUNNING',
        }),
      ),
    ).resolves.toMatchObject({ applied: true, status: 'RUNNING' });

    expect(tx.content_generation_requests.update).toHaveBeenCalledWith({
      where: { request_id: REQUEST },
      data: expect.objectContaining({ status: 'RUNNING', last_error: null }),
    });
  });

  it('writes the lesson, the items and the request in one transaction', async () => {
    const { tx, prisma, handler } = setup({ status: 'RUNNING' });

    const outcome = await handler.handle(
      envelope(
        quizPayload([quizItem()], {
          rejected: [{ reason: 'sai', regeneration_attempts: 2 }],
        }),
      ),
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(outcome).toMatchObject({
      applied: true,
      status: 'SUCCEEDED',
      written: 1,
      skipped: 0,
    });
    expect(tx.lessons.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          course_id: COURSE,
          lo_id: LO,
          title: 'Hiểu đồ thị',
          status: 'DRAFT',
        }),
      }),
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.content_generation_requests.update).toHaveBeenCalledWith({
      where: { request_id: REQUEST },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        generated_count: 1,
        last_error: null,
        quiz_ids: ['8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e11'],
        verification_summary: expect.objectContaining({
          verified: 1,
          rejected: 1,
        }),
      }),
    });
  });

  it('passes origin, provenance and excludes skipped items from quiz_ids', async () => {
    const userId = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c88';
    const { tx, handler } = setup({
      status: 'RUNNING',
      requested_by: userId,
    });
    const first = quizItem({
      quiz_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e11',
      verification_evidence: {
        ...evidence,
        writer_model: 'gemini-pro',
        judge_model: 'deepseek-chat',
        judge_is_writer: false,
      },
    });
    const second = quizItem({
      quiz_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e12',
    });
    tx.$executeRaw.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const outcome = await handler.handle(
      envelope(quizPayload([first, second])),
    );

    expect(outcome).toMatchObject({
      applied: true,
      status: 'SUCCEEDED',
      written: 1,
      skipped: 1,
    });
    const [sqlStrings, ...values] = tx.$executeRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    const sql = sqlStrings.join('?');
    expect(sql).toContain('generation_request_id');
    expect(sql).toContain('author_id');
    expect(sql).toContain('updated_by');
    expect(sql).toContain('provenance');
    expect(sql).not.toContain('bank_id');
    expect(values).toContain(REQUEST);
    expect(values).toContain(userId);
    expect(values).toContain(
      JSON.stringify({
        writer_model: 'gemini-pro',
        judge_model: 'deepseek-chat',
        judge_is_writer: false,
      }),
    );
    expect(tx.content_generation_requests.update).toHaveBeenCalledWith({
      where: { request_id: REQUEST },
      data: expect.objectContaining({
        quiz_ids: [first.quiz_id],
      }),
    });
  });

  it.each(['SUCCEEDED', 'FAILED', 'CANCELLED'])(
    'ignores a late result for a %s request',
    async (status) => {
      const { tx, handler } = setup({ status });

      await expect(
        handler.handle(envelope(quizPayload())),
      ).resolves.toMatchObject({
        applied: false,
        reason: `request already ${status}`,
      });

      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.lessons.upsert).not.toHaveBeenCalled();
      expect(tx.content_generation_requests.update).not.toHaveBeenCalled();
    },
  );

  it('fails the request instead of writing when the LO is no longer current', async () => {
    const { tx, handler } = setup({ status: 'RUNNING' });
    tx.learning_outcomes.findFirst.mockResolvedValue(null);

    await expect(
      handler.handle(envelope(quizPayload())),
    ).resolves.toMatchObject({
      applied: true,
      status: 'FAILED',
    });

    expect(tx.lessons.upsert).not.toHaveBeenCalled();
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.content_generation_requests.update).toHaveBeenCalledWith({
      where: { request_id: REQUEST },
      data: expect.objectContaining({
        status: 'FAILED',
        last_error: expect.stringContaining('not current'),
      }),
    });
  });

  it('rejects a result for another course without touching the request', async () => {
    const { tx, prisma, handler } = setup({
      status: 'RUNNING',
      course_id: '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9cff',
    });

    await expect(handler.handle(envelope(quizPayload()))).rejects.toThrow(
      InvalidWorkerResultError,
    );

    expect(tx.content_generation_requests.update).not.toHaveBeenCalled();
    expect(
      prisma.content_generation_requests.updateMany,
    ).not.toHaveBeenCalled();
  });

  it('throws InvalidWorkerResultError for a bad payload without touching the database', async () => {
    const { prisma, handler } = setup({ status: 'RUNNING' });

    await expect(
      handler.handle(
        envelope(quizPayload([quizItem({ correct_answer: 'Khác' })])),
      ),
    ).rejects.toThrow(InvalidWorkerResultError);

    // Việc đánh dấu FAILED là của hook onFinalFailure, processor gọi sau đó.
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(
      prisma.content_generation_requests.updateMany,
    ).not.toHaveBeenCalled();
  });

  describe('onFinalFailure', () => {
    const activeOnly = {
      where: { request_id: REQUEST, status: { in: ['QUEUED', 'RUNNING'] } },
    };

    it('marks the request FAILED when the payload was invalid', async () => {
      const { prisma, handler } = setup({ status: 'RUNNING' });
      const env = envelope(quizPayload([quizItem({ correct_answer: 'Khác' })]));
      const error = await handler.handle(env).catch((e: Error) => e);

      await handler.onFinalFailure(env, error as Error);

      expect(
        prisma.content_generation_requests.updateMany,
      ).toHaveBeenCalledWith({
        ...activeOnly,
        data: expect.objectContaining({
          status: 'FAILED',
          last_error: expect.stringContaining('Invalid worker result'),
        }),
      });
    });

    it.each([
      [
        'a course different from the request',
        { course_id: '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c99' },
        /belongs to course/,
      ],
      ['a type different from the request', { type: 'card' }, /is type card/],
    ])(
      'fails the request when the transaction rejects %s',
      async (_label, requestOverrides, message) => {
        // InvalidWorkerResultError ném BÊN TRONG $transaction (lệch với request).
        const { prisma, handler } = setup({
          status: 'RUNNING',
          ...requestOverrides,
        });
        const env = envelope(quizPayload());
        const error = await handler.handle(env).catch((e: Error) => e);
        expect(error).toBeInstanceOf(InvalidWorkerResultError);
        expect((error as Error).message).toMatch(message);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        await handler.onFinalFailure(env, error as Error);

        expect(
          prisma.content_generation_requests.updateMany,
        ).toHaveBeenCalledWith({
          ...activeOnly,
          data: expect.objectContaining({
            status: 'FAILED',
            last_error: expect.stringContaining('Invalid worker result'),
          }),
        });
      },
    );

    it('fails the request when the learning outcome belongs to another course', async () => {
      const { prisma, tx, handler } = setup({ status: 'RUNNING' });
      tx.learning_outcomes.findFirst.mockResolvedValue({
        lo_id: LO,
        course_id: '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c99',
        statement_vi: 'Hiểu đồ thị',
      });
      const env = envelope(quizPayload());
      const error = await handler.handle(env).catch((e: Error) => e);
      expect(error).toBeInstanceOf(InvalidWorkerResultError);

      await handler.onFinalFailure(env, error as Error);

      expect(
        prisma.content_generation_requests.updateMany,
      ).toHaveBeenCalledTimes(1);
    });

    it('records an exhausted ordinary error as not applied, not as an invalid result', async () => {
      const { prisma, handler } = setup({ status: 'RUNNING' });

      await handler.onFinalFailure(
        envelope(quizPayload()),
        new Error('connection terminated'),
      );

      const call = prisma.content_generation_requests.updateMany.mock
        .calls[0][0] as { data: { last_error: string } };
      expect(call.data.last_error).toBe(
        'Worker result could not be applied: connection terminated',
      );
    });

    it('only targets a request that is still waiting', async () => {
      const { prisma, handler } = setup({ status: 'SUCCEEDED' });

      await handler.onFinalFailure(envelope(quizPayload()), new Error('x'));

      // Điều kiện status nằm trong chính câu UPDATE: SUCCEEDED/FAILED/CANCELLED
      // không khớp, nên không bị đè.
      expect(
        prisma.content_generation_requests.updateMany,
      ).toHaveBeenCalledWith(expect.objectContaining(activeOnly));
    });

    it('does nothing for a payload that does not name a request', async () => {
      const { prisma, handler } = setup({ status: 'RUNNING' });

      for (const payload of [
        {},
        { request_id: 'not-a-uuid' },
        { request_id: 42 },
        'text',
        null,
        [REQUEST],
      ]) {
        await handler.onFinalFailure(
          envelope(payload),
          new InvalidWorkerResultError('bad'),
        );
      }

      expect(
        prisma.content_generation_requests.updateMany,
      ).not.toHaveBeenCalled();
    });

    it('never throws when the database is down', async () => {
      const { prisma, handler } = setup({ status: 'RUNNING' });
      prisma.content_generation_requests.updateMany.mockRejectedValue(
        new Error('db down'),
      );
      const error = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      await expect(
        handler.onFinalFailure(envelope(quizPayload()), new Error('x')),
      ).resolves.toBeUndefined();

      expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
      error.mockRestore();
    });

    it('clips a long reason by code point so Postgres never sees half a pair', async () => {
      const { prisma, handler } = setup({ status: 'RUNNING' });

      await handler.onFinalFailure(
        envelope(quizPayload()),
        new Error('𝑓'.repeat(5000)),
      );

      const { data } = prisma.content_generation_requests.updateMany.mock
        .calls[0][0] as { data: { last_error: string } };
      expect(Array.from(data.last_error)).toHaveLength(4000);
      expect(data.last_error.endsWith('…')).toBe(true);
      // Không có surrogate lẻ: encode UTF-8 rồi giải mã lại cho đúng chuỗi cũ.
      expect(Buffer.from(data.last_error, 'utf8').toString('utf8')).toBe(
        data.last_error,
      );
    });
  });

  it('ignores a result whose request no longer exists', async () => {
    const { tx, handler } = setup(undefined);

    await expect(
      handler.handle(envelope(quizPayload())),
    ).resolves.toMatchObject({
      applied: false,
      reason: 'request not found',
    });
    expect(tx.content_generation_requests.update).not.toHaveBeenCalled();
  });

  describe('micro-content generation results (outline, script, quiz)', () => {
    const DOC = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c10';
    const MC = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c11';
    const USER = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c12';

    function microSetup(request: {
      type: string;
      status: string;
      requested_by?: string | null;
    }) {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([
          {
            request_id: REQUEST,
            course_id: COURSE,
            type: request.type,
            status: request.status,
            requested_by: request.requested_by ?? USER,
          },
        ]),
        documents: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ document_id: DOC, created_by: USER }),
        },
        learning_outcomes: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ lo_id: LO, course_id: COURSE }),
          findMany: jest.fn().mockResolvedValue([{ lo_id: LO }]),
        },
        micro_contents: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          create: jest.fn().mockResolvedValue({ micro_content_id: MC }),
          findFirst: jest.fn().mockResolvedValue({
            micro_content_id: MC,
            script_request_id: REQUEST,
            lo_id: LO,
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        micro_content_questions: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({}),
        },
        content_generation_requests: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      const prisma = {
        $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
        content_generation_requests: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        micro_contents: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return {
        tx,
        prisma,
        handler: new ContentGenerationResultHandler(prisma as never),
      };
    }

    it('micro_outline SUCCEEDED replaces untouched drafts and validates suggested_lo_id', async () => {
      const { tx, handler } = microSetup({
        type: 'micro_outline',
        status: 'RUNNING',
      });
      const unknownLo = '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9cff';

      const out = await handler.handle(
        envelope({
          request_id: REQUEST,
          course_id: COURSE,
          content_type: 'micro_outline',
          status: 'SUCCEEDED',
          document_id: DOC,
          generated_count: 2,
          sections: [
            {
              title: 'Phần 1: Kiến trúc',
              page_from: 1,
              page_to: 5,
              summary: 'Tổng quan kiến trúc',
              suggested_lo_id: LO,
              low_text: false,
            },
            {
              title: 'Phần 2: Thực hành',
              page_from: 6,
              page_to: 10,
              summary: 'Ví dụ minh hoạ',
              suggested_lo_id: unknownLo,
              low_text: true,
            },
          ],
        }),
      );

      expect(out).toMatchObject({
        applied: true,
        status: 'SUCCEEDED',
        written: 2,
      });
      expect(tx.micro_contents.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            course_id: COURSE,
            source_document_id: DOC,
            status: 'DRAFT',
            video_status: 'NONE',
          }),
        }),
      );
      expect(tx.micro_contents.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Phần 1: Kiến trúc',
            source_page_from: 1,
            source_page_to: 5,
            lo_id: LO,
            position: 1,
          }),
        }),
      );
      expect(tx.micro_contents.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Phần 2: Thực hành',
            lo_id: null,
            position: 2,
          }),
        }),
      );
    });

    it('video_script SUCCEEDED updates ai_script and script_status when active, skips if superseded', async () => {
      const { tx, handler } = microSetup({
        type: 'video_script',
        status: 'RUNNING',
      });
      const scriptPayload = {
        request_id: REQUEST,
        course_id: COURSE,
        content_type: 'video_script',
        status: 'SUCCEEDED',
        micro_content_id: MC,
        generated_count: 1,
        script: {
          language: 'vi',
          voice: 'vi-VN-HoaiMyNeural',
          topic: 'Spark RDD',
          scenes: [
            {
              title: 'Mở đầu',
              bullets: ['Khái niệm RDD'],
              narration: 'RDD là tập dữ liệu bất biến.',
              check: { status: 'VERIFIED' },
            },
          ],
        },
        rejected: [],
      };

      const activeOut = await handler.handle(envelope(scriptPayload));
      expect(activeOut).toMatchObject({
        applied: true,
        status: 'SUCCEEDED',
        written: 1,
      });
      expect(tx.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: MC },
        data: expect.objectContaining({
          script_status: 'READY',
          ai_script: scriptPayload.script,
        }),
      });

      tx.micro_contents.update.mockClear();
      tx.micro_contents.findFirst.mockResolvedValueOnce({
        micro_content_id: MC,
        script_request_id: '0193f2a1-7c4e-7d10-9a3b-5e6f7a8b9c99',
      });
      const staleOut = await handler.handle(envelope(scriptPayload));
      expect(staleOut).toMatchObject({
        applied: true,
        status: 'SUCCEEDED',
        written: 0,
        skipped: 1,
      });
      expect(tx.micro_contents.update).not.toHaveBeenCalled();
    });

    it('video_script FAILED marks micro_contents.script_status = FAILED', async () => {
      const { tx, handler } = microSetup({
        type: 'video_script',
        status: 'RUNNING',
      });
      tx.micro_contents.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 1 }) as never;

      const out = await handler.handle(
        envelope({
          request_id: REQUEST,
          course_id: COURSE,
          content_type: 'video_script',
          status: 'FAILED',
          error: 'Không có chunk nào trong trang slide.',
        }),
      );

      expect(out).toMatchObject({ applied: true, status: 'FAILED' });
      expect(tx.micro_contents.updateMany).toHaveBeenCalledWith({
        where: { script_request_id: REQUEST, script_status: 'GENERATING' },
        data: expect.objectContaining({ script_status: 'FAILED' }),
      });
    });

    it('micro_quiz SUCCEEDED soft-deletes old questions and writes generated questions', async () => {
      const { tx, handler } = microSetup({
        type: 'micro_quiz',
        status: 'RUNNING',
      });

      const out = await handler.handle(
        envelope({
          request_id: REQUEST,
          course_id: COURSE,
          content_type: 'micro_quiz',
          status: 'SUCCEEDED',
          micro_content_id: MC,
          lo_id: LO,
          generated_count: 2,
          quiz_items: [
            quizItem(),
            quizItem({
              quiz_id: '8d3c6a52-5b1e-5c7a-9f0e-2a4b6c8d0e12',
              type: 'SHORT_ANSWER',
              question: 'Giải thích tính bất biến của RDD.',
              options: null,
              correct_answer: {
                model_answer: 'Không thể sửa đổi sau khi tạo.',
                rubric: ['Không thể thay đổi trực tiếp'],
              },
            }),
          ],
          rejected: [],
        }),
      );

      expect(out).toMatchObject({
        applied: true,
        status: 'SUCCEEDED',
        written: 2,
      });
      expect(tx.micro_content_questions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { micro_content_id: MC, deleted_at: null },
        }),
      );
      expect(tx.micro_content_questions.create).toHaveBeenCalledTimes(2);
    });
  });
});
