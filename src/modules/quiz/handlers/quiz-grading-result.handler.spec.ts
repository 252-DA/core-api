import { readdirSync, readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { resolve } from 'node:path';
import { CONTRACTS_DIR } from '../../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../../messaging/worker-results/worker-result-envelope';
import {
  parseQuizGradingResult,
  QuizGradingResultHandler,
} from './quiz-grading-result.handler';
import { submissionScore } from '../../question/answer-grading';

const COURSE = '33333333-3333-4333-8333-333333333333';
const SUBMISSION = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const LINK = '66666666-6666-4666-8666-666666666666';
const MCQ = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ESSAY_1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ESSAY_2 = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const OTHER = '99999999-9999-4999-8999-999999999999';
const REVIEW = 'AI chưa chấm được câu này. Giảng viên sẽ chấm, điểm cập nhật sau.';

type Row = {
  attempt_id: string;
  submission_id: string | null;
  user_id: string;
  course_id: string;
  resource_link_id: string | null;
  score: number;
  is_correct: boolean;
  feedback: string | null;
  grading_status: string;
  ags_status: string;
  deleted_at: Date | null;
};

function row(id: string, overrides: Partial<Row> = {}): Row {
  return {
    attempt_id: id,
    submission_id: SUBMISSION,
    user_id: USER,
    course_id: COURSE,
    resource_link_id: LINK,
    score: 0,
    is_correct: false,
    feedback: 'giải thích lúc nộp',
    grading_status: 'PENDING',
    ags_status: 'AWAITING_GRADE',
    deleted_at: null,
    ...overrides,
  };
}

function inList(value: unknown, field: string) {
  if (value === undefined) return true;
  if (value && typeof value === 'object') {
    const cond = value as { in?: string[]; not?: string };
    if (cond.in) return cond.in.includes(field);
    if (cond.not !== undefined) return field !== cond.not;
  }
  return value === field;
}

/** quiz_attempts trong bộ nhớ, đủ cho lockAwaitingGroup/releaseIfGraded và handler. */
function fakePrisma(rows: Row[]) {
  const matches = (r: Row, where: Record<string, unknown>) =>
    inList(where.attempt_id, r.attempt_id) &&
    inList(where.grading_status, r.grading_status) &&
    inList(where.ags_status, r.ags_status) &&
    (!('deleted_at' in where) || (where.deleted_at === null) === (r.deleted_at === null));
  const tx = {
    quiz_attempts: {
      findMany: jest.fn(({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(
          rows
            .filter(
              (r) =>
                inList(where.attempt_id, r.attempt_id) &&
                (where.course_id === undefined || where.course_id === r.course_id) &&
                (!('deleted_at' in where) || (where.deleted_at === null) === (r.deleted_at === null)),
            )
            .map((r) => ({ ...r })),
        ),
      ),
      updateMany: jest.fn(
        ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
          const hit = rows.filter((r) => matches(r, where));
          hit.forEach((r) => Object.assign(r, data));
          return Promise.resolve({ count: hit.length });
        },
      ),
      count: jest.fn(({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(rows.filter((r) => matches(r, where)).length),
      ),
    },
    $queryRaw: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('?');
      const group = sql.includes('submission_id IS NULL')
        ? rows.filter(
            (r) =>
              r.submission_id === null &&
              r.user_id === values[0] &&
              r.resource_link_id === values[1] &&
              r.ags_status === values[2] &&
              !r.deleted_at,
          )
        : rows.filter((r) => r.submission_id === values[0] && !r.deleted_at);
      return Promise.resolve(
        group.map((r) => ({ attempt_id: r.attempt_id })).sort((a, b) => a.attempt_id.localeCompare(b.attempt_id)),
      );
    }),
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  return prisma;
}

function graded(id: string, score: number, feedback: string | null = 'Đúng ý chính.') {
  return { attempt_id: id, status: 'GRADED', score, is_correct: score === 100, feedback, grader_model: 'gemini-test' };
}

function review(id: string, reason = 'MODEL_ERROR') {
  return { attempt_id: id, status: 'NEEDS_REVIEW', reason, feedback: REVIEW, grader_model: 'gemini-test' };
}

function envelope(answers: unknown[], payload: Record<string, unknown> = {}) {
  return {
    result_id: 'QUIZ_GRADING_RESULT.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    kind: 'QUIZ_GRADING_RESULT' as const,
    source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    occurred_at: '2026-11-07T10:30:15.123Z',
    payload: { submission_id: SUBMISSION, course_id: COURSE, answers, ...payload },
  };
}

function setup(rows: Row[]) {
  const prisma = fakePrisma(rows);
  return { prisma, handler: new QuizGradingResultHandler(prisma as never) };
}

describe('QuizGradingResultHandler', () => {
  it('ghi điểm câu tự luận và mở khoá AGS khi cả lượt nộp đã có điểm', async () => {
    const rows = [row(MCQ, { grading_status: 'GRADED', score: 100 }), row(ESSAY_1)];
    const { handler, prisma } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 75, 'Thiếu ý 2.')]));

    expect(out).toMatchObject({ graded: 1, needsReview: 0, skipped: 0, released: 2 });
    expect(rows[1]).toMatchObject({
      score: 75,
      is_correct: false,
      feedback: 'Thiếu ý 2.',
      grading_status: 'GRADED',
      ags_status: 'PENDING',
    });
    expect(rows[0].ags_status).toBe('PENDING');
    // Khoá lượt nộp trước khi ghi, như giảng viên chấm tay.
    expect(prisma.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.quiz_attempts.updateMany.mock.invocationCallOrder[0],
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('nhận cùng kết quả hai lần không đổi gì', async () => {
    const rows = [row(MCQ, { grading_status: 'GRADED', score: 100 }), row(ESSAY_1)];
    const { handler } = setup(rows);
    const result = envelope([graded(ESSAY_1, 75)]);

    await handler.handle(result);
    const snapshot = JSON.stringify(rows);
    const again = await handler.handle(result);

    expect(again).toMatchObject({ graded: 0, needsReview: 0, skipped: 1, released: 0 });
    expect(JSON.stringify(rows)).toBe(snapshot);
  });

  it('không đè câu giảng viên đã chấm hay câu đã chờ giảng viên', async () => {
    const rows = [
      row(ESSAY_1, { grading_status: 'GRADED', score: 40, feedback: 'GV chấm' }),
      row(ESSAY_2, { grading_status: 'NEEDS_REVIEW', feedback: REVIEW }),
    ];
    const { handler } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100), graded(ESSAY_2, 90)]));

    expect(out).toMatchObject({ graded: 0, skipped: 2, released: 0 });
    expect(rows[0]).toMatchObject({ score: 40, feedback: 'GV chấm', grading_status: 'GRADED' });
    expect(rows[1]).toMatchObject({ score: 0, grading_status: 'NEEDS_REVIEW' });
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);
  });

  it('lỗi model thành NEEDS_REVIEW không có điểm, và giữ cả lượt khỏi AGS', async () => {
    const rows = [row(ESSAY_1), row(ESSAY_2)];
    const { handler } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100), review(ESSAY_2)]));

    expect(out).toMatchObject({ graded: 1, needsReview: 1, released: 0 });
    // Không ghi điểm cho câu chờ giảng viên: giữ điểm tạm lúc nộp.
    expect(rows[1]).toMatchObject({ score: 0, feedback: REVIEW, grading_status: 'NEEDS_REVIEW' });
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);
  });

  it('chỉ mở AGS khi câu cuối cùng của lượt có điểm (chấm lại từng câu)', async () => {
    const rows = [row(ESSAY_1), row(ESSAY_2, { grading_status: 'NEEDS_REVIEW' })];
    const { handler } = setup(rows);

    await handler.handle(envelope([graded(ESSAY_1, 50)]));
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);

    // Giảng viên cho AI chấm lại câu 2: câu về PENDING, kết quả mới đến.
    rows[1].grading_status = 'PENDING';
    const out = await handler.handle(envelope([graded(ESSAY_2, 100)]));
    expect(out.released).toBe(2);
    expect(rows.every((r) => r.ags_status === 'PENDING')).toBe(true);
  });

  it('lesson quiz không có submission_id: gom theo người học + bài tập', async () => {
    const rows = [
      row(MCQ, { submission_id: null, grading_status: 'GRADED' }),
      row(ESSAY_1, { submission_id: null }),
    ];
    const { handler, prisma } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(prisma.$queryRaw.mock.calls[0][0].join('?')).toContain('submission_id IS NULL');
    expect(out.released).toBe(2);
  });

  it('lesson quiz không cần đẩy điểm (không resource link): chỉ ghi điểm', async () => {
    const rows = [row(ESSAY_1, { submission_id: null, resource_link_id: null, ags_status: 'NOT_REQUIRED' })];
    const { handler } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(out).toMatchObject({ graded: 1, released: 0 });
    expect(rows[0]).toMatchObject({ grading_status: 'GRADED', ags_status: 'NOT_REQUIRED' });
  });

  it('câu đã xoá mềm thì bỏ qua', async () => {
    const rows = [row(ESSAY_1, { deleted_at: new Date() })];
    const { handler } = setup(rows);

    const out = await handler.handle(envelope([graded(ESSAY_1, 100)]));

    expect(out).toMatchObject({ graded: 0, skipped: 1 });
    expect(rows[0].grading_status).toBe('PENDING');
  });

  it.each([
    ['id không tồn tại', [row(ESSAY_1)], [graded(ESSAY_1, 1), graded(OTHER, 1)]],
    ['câu của khoá khác', [row(ESSAY_1, { course_id: OTHER })], [graded(ESSAY_1, 1)]],
    ['câu của lượt nộp khác', [row(ESSAY_1, { submission_id: OTHER })], [graded(ESSAY_1, 1)]],
    [
      'câu của hai người học',
      [row(ESSAY_1, { submission_id: null }), row(ESSAY_2, { submission_id: null, user_id: OTHER })],
      [graded(ESSAY_1, 1), graded(ESSAY_2, 1)],
    ],
  ])('từ chối kết quả có %s, không ghi gì', async (_label, rows, answers) => {
    const { handler, prisma } = setup(rows);

    await expect(handler.handle(envelope(answers))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
    expect(prisma.quiz_attempts.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['điểm > 100', [graded(ESSAY_1, 101)]],
    ['điểm âm', [graded(ESSAY_1, -1)]],
    ['điểm lẻ', [graded(ESSAY_1, 62.5)]],
    ['điểm dạng chuỗi', [{ ...graded(ESSAY_1, 50), score: '50' }]],
    ['NEEDS_REVIEW kèm điểm 0', [{ ...review(ESSAY_1), score: 0 }]],
    ['NEEDS_REVIEW không có lý do', [{ ...review(ESSAY_1), reason: undefined }]],
    ['trạng thái lạ', [{ ...graded(ESSAY_1, 50), status: 'FAILED' }]],
    ['GRADED thiếu is_correct', [{ ...graded(ESSAY_1, 50), is_correct: undefined }]],
    ['thiếu feedback', [{ attempt_id: ESSAY_1, status: 'GRADED', score: 1, is_correct: false, grader_model: null }]],
    ['id trùng', [graded(ESSAY_1, 50), graded(ESSAY_1, 60)]],
    ['id không phải uuid', [graded('a-essay', 50)]],
    ['danh sách rỗng', []],
  ])('payload sai (%s) → InvalidWorkerResultError, không chạm DB', async (_label, answers) => {
    const { handler, prisma } = setup([row(ESSAY_1)]);

    await expect(handler.handle(envelope(answers))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('từ chối trường lạ ở payload', () => {
    expect(() =>
      parseQuizGradingResult({ ...envelope([graded(ESSAY_1, 1)]).payload, score: 50 }),
    ).toThrow(InvalidWorkerResultError);
  });

  it('điểm lượt nộp làm tròn theo Math.round: trung bình .5 lên', () => {
    // 50.5: round() của Python (về số chẵn) ra 50, sổ điểm phải ra 51 như lúc nộp.
    expect(submissionScore([100, 1])).toBe(51);
    expect(submissionScore([75, 76])).toBe(76);
    expect(submissionScore([])).toBe(0);
  });
});

describe('QuizGradingResultHandler.onFinalFailure', () => {
  const UNAPPLIED = expect.stringContaining('Giảng viên sẽ chấm') as string;

  afterEach(() => jest.restoreAllMocks());

  it('chuyển câu còn PENDING của lượt nộp sang NEEDS_REVIEW, giữ cả lượt khỏi AGS', async () => {
    const rows = [
      row(MCQ, { grading_status: 'GRADED', score: 100 }),
      row(ESSAY_1),
      row(ESSAY_2),
    ];
    const { handler, prisma } = setup(rows);

    await handler.onFinalFailure(
      envelope([graded(ESSAY_1, 75), graded(ESSAY_2, 90)]),
      new InvalidWorkerResultError('x'),
    );

    expect(rows[1]).toMatchObject({ grading_status: 'NEEDS_REVIEW', feedback: UNAPPLIED, score: 0 });
    expect(rows[2]).toMatchObject({ grading_status: 'NEEDS_REVIEW', feedback: UNAPPLIED });
    // Câu trắc nghiệm đã có điểm giữ nguyên; AGS vẫn chờ giảng viên chấm.
    expect(rows[0]).toMatchObject({ grading_status: 'GRADED', feedback: 'giải thích lúc nộp' });
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);
    // Khoá nhóm trước khi ghi, như handle() và giảng viên chấm tay.
    expect(prisma.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.quiz_attempts.updateMany.mock.invocationCallOrder[0],
    );
  });

  it('dùng được cả khi payload sai dạng: chỉ cần id hợp lệ', async () => {
    const rows = [row(ESSAY_1), row(ESSAY_2)];
    const { handler } = setup(rows);
    // Điểm 101 làm handle() từ chối cả kết quả; id vẫn đọc được.
    const bad = envelope([graded(ESSAY_1, 101), { attempt_id: ESSAY_2 }, 'rác', null]);
    await expect(handler.handle(bad)).rejects.toBeInstanceOf(InvalidWorkerResultError);

    await handler.onFinalFailure(bad, new InvalidWorkerResultError('score'));

    expect(rows.map((r) => r.grading_status)).toEqual(['NEEDS_REVIEW', 'NEEDS_REVIEW']);
  });

  it('không đụng câu đã có điểm, đã chờ giảng viên, đã xoá, khoá khác hay lượt nộp khác', async () => {
    const OTHER_ESSAY = '12121212-1212-4121-8121-121212121212';
    const rows = [
      row(ESSAY_1, { grading_status: 'GRADED', score: 40, feedback: 'GV chấm' }),
      row(ESSAY_2, { grading_status: 'NEEDS_REVIEW', feedback: REVIEW }),
      row('13131313-1313-4131-8131-131313131313', { deleted_at: new Date() }),
      row('14141414-1414-4141-8141-141414141414', { course_id: OTHER }),
      row('15151515-1515-4151-8151-151515151515', { submission_id: OTHER }),
      row(OTHER_ESSAY),
    ];
    const { handler } = setup(rows);
    const snapshot = JSON.stringify(rows);

    await handler.onFinalFailure(
      envelope(rows.slice(0, 5).map((r) => graded(r.attempt_id, 50))),
      new Error('x'),
    );

    expect(JSON.stringify(rows)).toBe(snapshot);
  });

  it('lesson quiz không có submission_id vẫn gỡ được câu PENDING', async () => {
    const rows = [row(MCQ, { submission_id: null, grading_status: 'GRADED' }), row(ESSAY_1, { submission_id: null })];
    const { handler, prisma } = setup(rows);

    await handler.onFinalFailure(envelope([graded(ESSAY_1, 100)]), new Error('x'));

    expect(prisma.$queryRaw.mock.calls[0][0].join('?')).toContain('submission_id IS NULL');
    expect(rows[1].grading_status).toBe('NEEDS_REVIEW');
  });

  it.each([
    ['payload không phải object', 'rác'],
    ['không có answers', { submission_id: SUBMISSION, course_id: COURSE }],
    ['answers không phải mảng', { submission_id: SUBMISSION, course_id: COURSE, answers: 'x' }],
    ['answers không có id hợp lệ', { submission_id: SUBMISSION, course_id: COURSE, answers: [{ attempt_id: 'a-b' }] }],
    ['thiếu course_id', { submission_id: SUBMISSION, answers: [{ attempt_id: ESSAY_1 }] }],
    ['thiếu submission_id', { course_id: COURSE, answers: [{ attempt_id: ESSAY_1 }] }],
    ['course_id không phải uuid', { submission_id: SUBMISSION, course_id: 'x', answers: [{ attempt_id: ESSAY_1 }] }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const rows = [row(ESSAY_1)];
    const { handler, prisma } = setup(rows);

    await handler.onFinalFailure(
      { ...envelope([]), payload: payload as Record<string, unknown> },
      new Error('x'),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(rows[0].grading_status).toBe('PENDING');
  });

  it('chạy lại không đổi gì thêm', async () => {
    const rows = [row(ESSAY_1)];
    const { handler } = setup(rows);
    const result = envelope([graded(ESSAY_1, 50)]);

    await handler.onFinalFailure(result, new Error('x'));
    const snapshot = JSON.stringify(rows);
    await handler.onFinalFailure(result, new Error('x'));

    expect(JSON.stringify(rows)).toBe(snapshot);
  });

  it('không bao giờ ném ra ngoài khi DB lỗi', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handler, prisma } = setup([row(ESSAY_1)]);
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(envelope([graded(ESSAY_1, 50)]), new Error('x')),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('quiz-grading-result: độ dài tính theo code point', () => {
  const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16

  it('nhận feedback đúng 4000 ký tự ngoài BMP và grader_model đúng 200', () => {
    const feedback = MATH.repeat(4000);
    expect(feedback.length).toBe(8000);
    const answers = [{ ...graded(ESSAY_1, 50), feedback, grader_model: MATH.repeat(200) }];

    expect(parseQuizGradingResult(envelope(answers).payload).answers[0]).toMatchObject({ feedback });
  });

  it('vẫn từ chối vượt giới hạn một ký tự', () => {
    expect(() =>
      parseQuizGradingResult(
        envelope([{ ...graded(ESSAY_1, 50), feedback: `${MATH.repeat(4000)}x` }]).payload,
      ),
    ).toThrow(/feedback must be a string \(≤ 4000\)/);
    expect(() =>
      parseQuizGradingResult(
        envelope([{ ...graded(ESSAY_1, 50), grader_model: MATH.repeat(201) }]).payload,
      ),
    ).toThrow(/grader_model/);
  });
});

describe('quiz-grading-result fixtures', () => {
  const dir = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
  const load = (kind: 'valid' | 'invalid') =>
    readdirSync(resolve(dir, kind))
      .filter((f) => f.startsWith('quiz-grading-result'))
      .map((f) => [f, JSON.parse(readFileSync(resolve(dir, kind, f), 'utf8'))] as const);

  it.each(load('valid'))('%s qua được parser', (_f, fixture) => {
    expect(() => parseQuizGradingResult(fixture.payload)).not.toThrow();
  });

  it.each(load('invalid'))('%s bị parser từ chối', (_f, fixture) => {
    expect(() => parseQuizGradingResult(fixture.payload)).toThrow(InvalidWorkerResultError);
  });
});
