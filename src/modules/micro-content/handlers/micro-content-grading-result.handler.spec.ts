import { readdirSync, readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { resolve } from 'node:path';
import { CONTRACTS_DIR } from '../../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../../messaging/worker-results/worker-result-envelope';
import {
  attemptGradingStatus,
  MicroContentGradingResultHandler,
  parseMicroContentGradingResult,
} from './micro-content-grading-result.handler';

const COURSE = '33333333-3333-4333-8333-333333333333';
const MICRO = '22222222-2222-4222-8222-222222222222';
const ATTEMPT = '44444444-4444-4444-8444-444444444444';
const MCQ = '55555555-5555-4555-8555-555555555555';
const ESSAY_1 = '77777777-7777-4777-8777-777777777777';
const ESSAY_2 = '88888888-8888-4888-8888-888888888888';
const OTHER = '99999999-9999-4999-8999-999999999999';

type Answer = {
  answer_id: string;
  attempt_id: string;
  score: number;
  is_correct: boolean;
  feedback: string | null;
  grading_status: string;
};

function answer(id: string, overrides: Partial<Answer> = {}): Answer {
  return {
    answer_id: id,
    attempt_id: ATTEMPT,
    score: 0,
    is_correct: false,
    feedback: null,
    grading_status: 'PENDING',
    ...overrides,
  };
}

function fakePrisma(
  answers: Answer[],
  attempt: { micro_content_id: string; course_id: string; passing_score: number } | null = {
    micro_content_id: MICRO,
    course_id: COURSE,
    passing_score: 70,
  },
) {
  const attemptRow = { score: 0, passed: false, grading_status: 'PENDING' };
  const tx = {
    $queryRaw: jest.fn(() => Promise.resolve(attempt ? [attempt] : [])),
    micro_content_answers: {
      findMany: jest.fn(({ where }: { where: { answer_id?: { in: string[] }; attempt_id?: string } }) =>
        Promise.resolve(
          answers
            .filter((a) =>
              where.answer_id ? where.answer_id.in.includes(a.answer_id) : a.attempt_id === where.attempt_id,
            )
            .map((a) => ({ ...a })),
        ),
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: Omit<Partial<Answer>, 'answer_id'> & { answer_id: string | { in: string[] } };
          data: Partial<Answer>;
        }) => {
          const hit = answers.filter(
            (a) =>
              (typeof where.answer_id === 'string'
                ? a.answer_id === where.answer_id
                : where.answer_id.in.includes(a.answer_id)) &&
              a.attempt_id === where.attempt_id &&
              a.grading_status === where.grading_status,
          );
          hit.forEach((a) => Object.assign(a, data));
          return Promise.resolve({ count: hit.length });
        },
      ),
    },
    micro_content_attempts: {
      update: jest.fn(({ data }: { data: typeof attemptRow }) => {
        Object.assign(attemptRow, data);
        return Promise.resolve(attemptRow);
      }),
    },
  };
  return {
    attemptRow,
    prisma: { ...tx, $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)) },
  };
}

function graded(id: string, score: number) {
  return { answer_id: id, status: 'GRADED', score, is_correct: score === 100, feedback: 'Nhận xét', grader_model: null };
}

function review(id: string) {
  return { answer_id: id, status: 'NEEDS_REVIEW', reason: 'MODEL_ERROR', feedback: 'Chờ giảng viên', grader_model: null };
}

function envelope(answers: unknown[], payload: Record<string, unknown> = {}) {
  return {
    result_id: 'MICRO_CONTENT_GRADING_RESULT.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab1',
    kind: 'MICRO_CONTENT_GRADING_RESULT' as const,
    source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaab1',
    occurred_at: '2026-11-07T10:31:00.000Z',
    payload: { attempt_id: ATTEMPT, course_id: COURSE, micro_content_id: MICRO, answers, ...payload },
  };
}

function setup(answers: Answer[], attempt?: Parameters<typeof fakePrisma>[1]) {
  const fake = fakePrisma(answers, attempt);
  return { ...fake, handler: new MicroContentGradingResultHandler(fake.prisma as never) };
}

describe('MicroContentGradingResultHandler', () => {
  it('ghi điểm câu tự luận rồi tính lại điểm, đạt/không đạt và trạng thái lượt nộp', async () => {
    const answers = [answer(MCQ, { score: 100, is_correct: true, grading_status: 'GRADED' }), answer(ESSAY_1)];
    const { handler, prisma, attemptRow } = setup(answers);

    const out = await handler.handle(envelope([graded(ESSAY_1, 60)]));

    expect(answers[1]).toMatchObject({ score: 60, is_correct: false, feedback: 'Nhận xét', grading_status: 'GRADED' });
    expect(attemptRow).toEqual({ score: 80, passed: true, grading_status: 'GRADED' });
    expect(out).toMatchObject({ graded: 1, needsReview: 0, skipped: 0 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Khoá dòng attempt trước khi đọc/ghi câu trả lời.
    expect((prisma.$queryRaw.mock.calls[0] as unknown[])[0]).toEqual(
      expect.arrayContaining([expect.stringContaining('FOR UPDATE')]),
    );
  });

  it('điểm tổng làm tròn theo Math.round của core-api: trung bình 50.5 → 51', async () => {
    // round() của Python cũ cho 50; lúc nộp core-api tính 51 → phải khớp.
    const answers = [answer(MCQ, { score: 1, grading_status: 'GRADED' }), answer(ESSAY_1)];
    const { handler, attemptRow } = setup(answers, { micro_content_id: MICRO, course_id: COURSE, passing_score: 51 });

    await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(attemptRow).toMatchObject({ score: 51, passed: true });
  });

  it('còn câu chờ giảng viên thì cả lượt NEEDS_REVIEW, không ghi điểm cho câu đó', async () => {
    const answers = [answer(ESSAY_1), answer(ESSAY_2)];
    const { handler, attemptRow } = setup(answers);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100), review(ESSAY_2)]));

    expect(answers[1]).toMatchObject({ score: 0, grading_status: 'NEEDS_REVIEW', feedback: 'Chờ giảng viên' });
    expect(attemptRow).toEqual({ score: 50, passed: false, grading_status: 'NEEDS_REVIEW' });
    expect(out).toMatchObject({ graded: 1, needsReview: 1 });
  });

  it('còn câu chưa chấm (không có trong kết quả) thì lượt nộp vẫn PENDING', async () => {
    const answers = [answer(ESSAY_1), answer(ESSAY_2)];
    const { handler, attemptRow } = setup(answers);

    await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(attemptRow.grading_status).toBe('PENDING');
  });

  it('nhận cùng kết quả hai lần không đổi gì', async () => {
    const answers = [answer(ESSAY_1)];
    const { handler, prisma, attemptRow } = setup(answers);
    const result = envelope([graded(ESSAY_1, 90)]);

    await handler.handle(result);
    const snapshot = JSON.stringify({ answers, attemptRow });
    const again = await handler.handle(result);

    expect(again).toMatchObject({ graded: 0, needsReview: 0, skipped: 1, attempt: null });
    expect(JSON.stringify({ answers, attemptRow })).toBe(snapshot);
    expect(prisma.micro_content_attempts.update).toHaveBeenCalledTimes(1);
  });

  it('bỏ qua câu không còn PENDING', async () => {
    const answers = [answer(ESSAY_1, { grading_status: 'GRADED', score: 30 })];
    const { handler, prisma } = setup(answers);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(out).toMatchObject({ graded: 0, skipped: 1 });
    expect(answers[0].score).toBe(30);
    expect(prisma.micro_content_attempts.update).not.toHaveBeenCalled();
  });

  it('lượt nộp đã bị xoá theo micro content thì bỏ qua, không lỗi', async () => {
    const { handler, prisma } = setup([], null);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(out).toMatchObject({ graded: 0, skipped: 1 });
    expect(prisma.micro_content_answers.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['attempt của micro content khác', [answer(ESSAY_1)], { micro_content_id: OTHER, course_id: COURSE, passing_score: 70 }],
    ['attempt của khoá khác', [answer(ESSAY_1)], { micro_content_id: MICRO, course_id: OTHER, passing_score: 70 }],
    ['câu của attempt khác', [answer(ESSAY_1, { attempt_id: OTHER })], undefined],
    ['câu không tồn tại', [], undefined],
  ])('từ chối kết quả có %s, không ghi gì', async (_label, answers, attempt) => {
    const { handler, prisma } = setup(answers, attempt);

    await expect(handler.handle(envelope([graded(ESSAY_1, 100)]))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
    expect(prisma.micro_content_answers.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['điểm > 100', [graded(ESSAY_1, 120)]],
    ['NEEDS_REVIEW kèm điểm', [{ ...review(ESSAY_1), score: 0, is_correct: false }]],
    ['dùng attempt_id thay answer_id', [{ ...graded(ESSAY_1, 1), answer_id: undefined, attempt_id: ESSAY_1 }]],
  ])('payload sai (%s) → InvalidWorkerResultError', async (_label, answers) => {
    const { handler, prisma } = setup([answer(ESSAY_1)]);

    await expect(handler.handle(envelope(answers))).rejects.toBeInstanceOf(InvalidWorkerResultError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('trạng thái lượt nộp: NEEDS_REVIEW > PENDING > GRADED', () => {
    expect(attemptGradingStatus(['GRADED', 'PENDING', 'NEEDS_REVIEW'])).toBe('NEEDS_REVIEW');
    expect(attemptGradingStatus(['GRADED', 'PENDING'])).toBe('PENDING');
    expect(attemptGradingStatus(['GRADED', 'GRADED'])).toBe('GRADED');
  });
});

describe('MicroContentGradingResultHandler.onFinalFailure', () => {
  afterEach(() => jest.restoreAllMocks());

  it('chuyển câu PENDING sang NEEDS_REVIEW rồi tính lại trạng thái lượt như handle()', async () => {
    const answers = [
      answer(MCQ, { score: 100, is_correct: true, grading_status: 'GRADED' }),
      answer(ESSAY_1),
      answer(ESSAY_2),
    ];
    const { handler, prisma, attemptRow } = setup(answers);

    await handler.onFinalFailure(
      envelope([graded(ESSAY_1, 60), graded(ESSAY_2, 80)]),
      new InvalidWorkerResultError('x'),
    );

    expect(answers[1]).toMatchObject({ grading_status: 'NEEDS_REVIEW', score: 0, feedback: expect.stringContaining('Giảng viên sẽ chấm') as string });
    expect(answers[2].grading_status).toBe('NEEDS_REVIEW');
    expect(answers[0]).toMatchObject({ grading_status: 'GRADED', score: 100 });
    // Điểm tính trên mọi câu: (100 + 0 + 0) / 3 = 33; còn câu chờ giảng viên.
    expect(attemptRow).toEqual({ score: 33, passed: false, grading_status: 'NEEDS_REVIEW' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect((prisma.$queryRaw.mock.calls[0] as unknown[])[0]).toEqual(
      expect.arrayContaining([expect.stringContaining('FOR UPDATE')]),
    );
  });

  it('dùng được cả khi payload sai dạng: chỉ cần id hợp lệ', async () => {
    const answers = [answer(ESSAY_1), answer(ESSAY_2)];
    const { handler } = setup(answers);
    const bad = envelope([graded(ESSAY_1, 101), { answer_id: ESSAY_2 }, 7]);
    await expect(handler.handle(bad)).rejects.toBeInstanceOf(InvalidWorkerResultError);

    await handler.onFinalFailure(bad, new InvalidWorkerResultError('score'));

    expect(answers.map((a) => a.grading_status)).toEqual(['NEEDS_REVIEW', 'NEEDS_REVIEW']);
  });

  it('không đụng câu đã chấm, câu đã chờ giảng viên, câu của lượt nộp khác', async () => {
    const answers = [
      answer(ESSAY_1, { grading_status: 'GRADED', score: 70 }),
      answer(ESSAY_2, { grading_status: 'NEEDS_REVIEW' }),
      answer(OTHER, { attempt_id: MCQ }),
    ];
    const { handler, attemptRow } = setup(answers);
    const snapshot = JSON.stringify(answers);

    await handler.onFinalFailure(
      envelope([graded(ESSAY_1, 1), graded(ESSAY_2, 1), graded(OTHER, 1)]),
      new Error('x'),
    );

    expect(JSON.stringify(answers)).toBe(snapshot);
    // Không câu nào đổi thì không tính lại lượt nộp.
    expect(attemptRow).toEqual({ score: 0, passed: false, grading_status: 'PENDING' });
  });

  it.each([
    ['lượt nộp không còn', null],
    ['lượt nộp thuộc micro content khác', { micro_content_id: OTHER, course_id: COURSE, passing_score: 70 }],
    ['lượt nộp thuộc khoá khác', { micro_content_id: MICRO, course_id: OTHER, passing_score: 70 }],
  ])('không làm gì khi %s', async (_label, attempt) => {
    const answers = [answer(ESSAY_1)];
    const { handler, attemptRow } = setup(answers, attempt);

    await handler.onFinalFailure(envelope([graded(ESSAY_1, 50)]), new Error('x'));

    expect(answers[0].grading_status).toBe('PENDING');
    expect(attemptRow.grading_status).toBe('PENDING');
  });

  it.each([
    ['payload không phải object', 'rác'],
    ['không có answers', { attempt_id: ATTEMPT, course_id: COURSE, micro_content_id: MICRO }],
    ['answers không có id hợp lệ', { attempt_id: ATTEMPT, course_id: COURSE, micro_content_id: MICRO, answers: [{ answer_id: 'x' }] }],
    ['thiếu attempt_id', { course_id: COURSE, micro_content_id: MICRO, answers: [{ answer_id: ESSAY_1 }] }],
    ['micro_content_id không phải uuid', { attempt_id: ATTEMPT, course_id: COURSE, micro_content_id: 'x', answers: [{ answer_id: ESSAY_1 }] }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const answers = [answer(ESSAY_1)];
    const { handler, prisma } = setup(answers);

    await handler.onFinalFailure(
      { ...envelope([]), payload: payload as Record<string, unknown> },
      new Error('x'),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(answers[0].grading_status).toBe('PENDING');
  });

  it('chạy lại không đổi gì thêm', async () => {
    const answers = [answer(ESSAY_1)];
    const { handler, attemptRow } = setup(answers);
    const result = envelope([graded(ESSAY_1, 50)]);

    await handler.onFinalFailure(result, new Error('x'));
    const snapshot = JSON.stringify([answers, attemptRow]);
    await handler.onFinalFailure(result, new Error('x'));

    expect(JSON.stringify([answers, attemptRow])).toBe(snapshot);
  });

  it('không bao giờ ném ra ngoài khi DB lỗi', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handler, prisma } = setup([answer(ESSAY_1)]);
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(envelope([graded(ESSAY_1, 50)]), new Error('x')),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('micro-content-grading-result: độ dài tính theo code point', () => {
  it('nhận feedback đúng 4000 ký tự ngoài BMP, từ chối 4001', () => {
    const feedback = '𝑓'.repeat(4000);
    const ok = { ...graded(ESSAY_1, 50), feedback };
    expect(parseMicroContentGradingResult(envelope([ok]).payload).answers[0]).toMatchObject({ feedback });
    expect(() =>
      parseMicroContentGradingResult(envelope([{ ...ok, feedback: `${feedback}x` }]).payload),
    ).toThrow(/feedback/);
  });
});

describe('micro-content-grading-result fixtures', () => {
  const dir = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
  const load = (kind: 'valid' | 'invalid') =>
    readdirSync(resolve(dir, kind))
      .filter((f) => f.startsWith('micro-content-grading-result'))
      .map((f) => [f, JSON.parse(readFileSync(resolve(dir, kind, f), 'utf8'))] as const);

  it.each(load('valid'))('%s qua được parser', (_f, fixture) => {
    expect(() => parseMicroContentGradingResult(fixture.payload)).not.toThrow();
  });

  it.each(load('invalid'))('%s bị parser từ chối', (_f, fixture) => {
    expect(() => parseMicroContentGradingResult(fixture.payload)).toThrow(InvalidWorkerResultError);
  });
});
