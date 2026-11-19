import { readdirSync, readFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { resolve } from 'node:path';
import { CONTRACTS_DIR } from '../../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../../messaging/worker-results/worker-result-envelope';
import {
  EssayGradingResultHandler,
  parseEssayGradingResult,
} from './essay-grading-result.handler';

const ESSAY = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const RESULT = {
  score: 8.5,
  max_score: 10,
  criteria: [
    { criterion: 'Ba lớp', points: 6, max_points: 6, comment: 'Đủ ý' },
    {
      criterion: 'Đánh đổi',
      points: 2.5,
      max_points: 4,
      comment: 'Thiếu hạn chế',
    },
  ],
  feedback: 'Bài khá.',
  truncated: false,
  model: 'gemini-test',
};

function envelope(payload: Record<string, unknown>) {
  return {
    result_id: 'ESSAY_GRADING_RESULT.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
    kind: 'ESSAY_GRADING_RESULT' as const,
    source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
    occurred_at: '2026-11-07T10:32:00.000Z',
    payload,
  };
}

function setup(status = 'QUEUED') {
  const row: Record<string, unknown> = {
    status,
    result: null,
    error: 'lần tải trước lỗi',
    error_code: null,
    attempts: 2,
    next_attempt_at: new Date(),
    reported_at: new Date(),
  };
  const prisma = {
    essay_submissions: {
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { essay_submission_id: string; status: string };
          data: Record<string, unknown>;
        }) => {
          if (
            where.essay_submission_id !== ESSAY ||
            row.status !== where.status
          )
            return Promise.resolve({ count: 0 });
          Object.assign(row, data);
          return Promise.resolve({ count: 1 });
        },
      ),
    },
  };
  return {
    row,
    prisma,
    handler: new EssayGradingResultHandler(prisma as never),
  };
}

describe('EssayGradingResultHandler', () => {
  it('GRADED: ghi result để vòng báo cáo gửi điểm gợi ý về SpeedGrader', async () => {
    const { handler, row } = setup();

    const out = await handler.handle(
      envelope({
        essay_submission_id: ESSAY,
        status: 'GRADED',
        result: RESULT,
      }),
    );

    expect(out).toEqual({ applied: true, status: 'GRADED' });
    expect(row).toMatchObject({
      status: 'GRADED',
      result: RESULT,
      error: null,
      error_code: null,
      attempts: 0,
      next_attempt_at: null,
    });
  });

  it('FAILED: ghi mã lỗi và mở lại cờ báo cáo để giảng viên được báo một lần', async () => {
    const { handler, row } = setup();

    await handler.handle(
      envelope({
        essay_submission_id: ESSAY,
        status: 'FAILED',
        error_code: 'PROCESSING_FAILED',
        error: 'AI lỗi',
      }),
    );

    expect(row).toMatchObject({
      status: 'FAILED',
      error_code: 'PROCESSING_FAILED',
      error: 'AI lỗi',
      attempts: 0,
      next_attempt_at: null,
      reported_at: null,
      result: null,
    });
  });

  it.each(['GRADED', 'REPORTED', 'FAILED', 'RECEIVED'])(
    'bài không còn QUEUED (%s) thì bỏ qua, kể cả khi nhận lại cùng kết quả',
    async (status) => {
      const { handler, row } = setup(status);
      const before = { ...row };

      const out = await handler.handle(
        envelope({
          essay_submission_id: ESSAY,
          status: 'GRADED',
          result: RESULT,
        }),
      );

      expect(out.applied).toBe(false);
      expect(row).toEqual(before);
    },
  );

  it.each([
    ['điểm vượt điểm tối đa', { ...RESULT, score: 10.5 }],
    ['điểm âm', { ...RESULT, score: -1 }],
    [
      'tiêu chí vượt tối đa',
      {
        ...RESULT,
        criteria: [{ criterion: 'x', points: 7, max_points: 6, comment: '' }],
      },
    ],
    ['không có tiêu chí', { ...RESULT, criteria: [] }],
    ['max_score = 0', { ...RESULT, max_score: 0, score: 0 }],
    ['thiếu truncated', { ...RESULT, truncated: undefined }],
    ['trường lạ', { ...RESULT, grade: 'A' }],
  ])(
    'payload sai (%s) → InvalidWorkerResultError, không chạm DB',
    async (_label, result) => {
      const { handler, prisma } = setup();

      await expect(
        handler.handle(
          envelope({ essay_submission_id: ESSAY, status: 'GRADED', result }),
        ),
      ).rejects.toBeInstanceOf(InvalidWorkerResultError);
      expect(prisma.essay_submissions.updateMany).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      {
        essay_submission_id: ESSAY,
        status: 'FAILED',
        error_code: 'TIMEOUT',
        error: 'x',
      },
    ],
    [
      {
        essay_submission_id: ESSAY,
        status: 'FAILED',
        error_code: 'PROCESSING_FAILED',
        error: '',
      },
    ],
    [
      {
        essay_submission_id: ESSAY,
        status: 'FAILED',
        error_code: 'PROCESSING_FAILED',
        error: 'x',
        result: RESULT,
      },
    ],
    [{ essay_submission_id: 'essay-1', status: 'GRADED', result: RESULT }],
    [{ essay_submission_id: ESSAY, status: 'SKIPPED' }],
  ])('payload sai %# → InvalidWorkerResultError', async (payload) => {
    const { handler } = setup();
    await expect(handler.handle(envelope(payload))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
  });

  it('tổng điểm làm tròn 2 chữ số được phép lệch max_score rất nhỏ', () => {
    expect(() =>
      parseEssayGradingResult({
        essay_submission_id: ESSAY,
        status: 'GRADED',
        result: { ...RESULT, score: 10.0000000001 },
      }),
    ).not.toThrow();
  });
});

describe('EssayGradingResultHandler.onFinalFailure', () => {
  afterEach(() => jest.restoreAllMocks());

  it('QUEUED → FAILED với mã PROCESSING_FAILED và mở cờ báo cáo để giảng viên biết phải chấm tay', async () => {
    const { handler, row } = setup();

    await handler.onFinalFailure(
      envelope({
        essay_submission_id: ESSAY,
        status: 'GRADED',
        result: { ...RESULT, score: 99 },
      }),
      new InvalidWorkerResultError('result.score must be in [0, max_score]'),
    );

    expect(row).toMatchObject({
      status: 'FAILED',
      error_code: 'PROCESSING_FAILED',
      attempts: 0,
      next_attempt_at: null,
      reported_at: null,
      result: null,
    });
    // Giảng viên đọc lỗi này trong Canvas: không kèm chi tiết kỹ thuật.
    expect(row.error).toBe(
      'Hệ thống không lưu được kết quả chấm của AI cho bài này.',
    );
    expect(String(row.error)).not.toContain('score');
  });

  it.each(['GRADED', 'REPORTED', 'FAILED', 'RECEIVED'])(
    'bài không còn QUEUED (%s) thì giữ nguyên',
    async (status) => {
      const { handler, row } = setup(status);
      const before = { ...row };

      await handler.onFinalFailure(
        envelope({
          essay_submission_id: ESSAY,
          status: 'GRADED',
          result: RESULT,
        }),
        new Error('x'),
      );

      expect(row).toEqual(before);
    },
  );

  it.each([
    ['payload không phải object', 'rác'],
    ['thiếu essay_submission_id', { status: 'GRADED' }],
    [
      'essay_submission_id không phải uuid',
      { essay_submission_id: 'abc', status: 'GRADED' },
    ],
    ['essay_submission_id không phải chuỗi', { essay_submission_id: 5 }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const { handler, prisma, row } = setup();

    await handler.onFinalFailure(
      envelope(payload as Record<string, unknown>),
      new Error('x'),
    );

    expect(prisma.essay_submissions.updateMany).not.toHaveBeenCalled();
    expect(row.status).toBe('QUEUED');
  });

  it('chạy lại không đổi gì thêm', async () => {
    const { handler, row } = setup();
    const result = envelope({
      essay_submission_id: ESSAY,
      status: 'GRADED',
      result: RESULT,
    });

    await handler.onFinalFailure(result, new Error('x'));
    const snapshot = { ...row };
    await handler.onFinalFailure(result, new Error('x'));

    expect(row).toEqual(snapshot);
  });

  it('không bao giờ ném ra ngoài khi DB lỗi', async () => {
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { handler, prisma } = setup();
    prisma.essay_submissions.updateMany.mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(
        envelope({ essay_submission_id: ESSAY }),
        new Error('x'),
      ),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('essay-grading-result: độ dài tính theo code point', () => {
  const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16

  const graded = (result: Record<string, unknown>) => ({
    essay_submission_id: ESSAY,
    status: 'GRADED',
    result,
  });

  it('nhận feedback 8000, comment 4000 và model 200 ký tự ngoài BMP', () => {
    const result = {
      ...RESULT,
      feedback: MATH.repeat(8000),
      model: MATH.repeat(200),
      criteria: [
        {
          criterion: 'x',
          points: 1,
          max_points: 1,
          comment: MATH.repeat(4000),
        },
      ],
      score: 1,
    };
    expect(() => parseEssayGradingResult(graded(result))).not.toThrow();
  });

  it.each([
    ['feedback', { feedback: `${MATH.repeat(8000)}x` }, /feedback/],
    ['model', { model: MATH.repeat(201) }, /model/],
    [
      'comment',
      {
        criteria: [
          {
            criterion: 'x',
            points: 1,
            max_points: 1,
            comment: MATH.repeat(4001),
          },
        ],
        score: 1,
      },
      /comment/,
    ],
  ])('vẫn từ chối %s vượt giới hạn một ký tự', (_label, override, message) => {
    expect(() =>
      parseEssayGradingResult(graded({ ...RESULT, ...override })),
    ).toThrow(message);
  });

  it('nhận error FAILED đúng 2000 ký tự ngoài BMP, từ chối 2001', () => {
    const failed = (error: string) => ({
      essay_submission_id: ESSAY,
      status: 'FAILED',
      error_code: 'PROCESSING_FAILED',
      error,
    });
    expect(parseEssayGradingResult(failed(MATH.repeat(2000)))).toMatchObject({
      status: 'FAILED',
    });
    expect(() => parseEssayGradingResult(failed(MATH.repeat(2001)))).toThrow(
      /error must be/,
    );
  });
});

describe('essay-grading-result fixtures', () => {
  const dir = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
  const load = (kind: 'valid' | 'invalid') =>
    readdirSync(resolve(dir, kind))
      .filter((f) => f.startsWith('essay-grading-result'))
      .map(
        (f) =>
          [f, JSON.parse(readFileSync(resolve(dir, kind, f), 'utf8'))] as const,
      );

  it.each(load('valid'))('%s qua được parser', (_f, fixture) => {
    expect(() => parseEssayGradingResult(fixture.payload)).not.toThrow();
  });

  it.each(load('invalid'))('%s bị parser từ chối', (_f, fixture) => {
    expect(() => parseEssayGradingResult(fixture.payload)).toThrow(
      InvalidWorkerResultError,
    );
  });
});
