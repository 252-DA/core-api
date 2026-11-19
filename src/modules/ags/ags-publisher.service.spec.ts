import { AGS_STATUS } from '../../common/constants/ags-status';
import type { AgsConfig } from '../../config/ags.config';
import { AgsPublisherService } from './ags-publisher.service';
import type { AgsScorePayload } from './ags-client.service';

const CONFIG: AgsConfig = {
  enabled: true,
  clientId: 'tool-1',
  keyId: 'tool-1',
  privateKeyPath: '/lti-keys/lti.pem',
  tokenUrl: 'https://canvas.test/login/oauth2/token',
  pollIntervalMs: 15000,
  batchSize: 200,
  requestTimeoutMs: 5000,
  maxRetries: 2,
  backoffBaseMs: 30000,
  backoffMaxMs: 900000,
  unpublishedRetryMs: 120000,
};

const USER = '00000000-0000-0000-0000-0000000000aa';
const OTHER_USER = '00000000-0000-0000-0000-0000000000cc';
const LINK = '00000000-0000-0000-0000-0000000000bb';

type UpdateManyArgs = {
  where: { attempt_id: { in: string[] } };
  data: { ags_status: string; ags_posted_at?: Date };
};

type FindManyArgs = {
  where: { resource_link_id: { not: null; notIn?: string[] } };
};

type UpdateManyMock = jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
type FindManyMock = jest.Mock<Promise<unknown[]>, [FindManyArgs]>;
type PostScoreMock = jest.Mock<Promise<unknown>, [string, AgsScorePayload]>;

function attempt(
  id: string,
  score: number,
  attemptedAt: string,
  userId: string = USER,
) {
  return {
    attempt_id: id,
    user_id: userId,
    resource_link_id: LINK,
    score,
    attempted_at: new Date(attemptedAt),
  };
}

function setup(options: {
  attempts: ReturnType<typeof attempt>[];
  lineItems?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  postResult?: unknown;
  /** Điểm trung bình theo từng lượt nộp đã lưu (kể cả lượt đã đẩy trước đó). */
  recorded?: Array<{
    submission_id: string;
    _avg: { score: number };
    _max?: { attempted_at: Date };
  }>;
  config?: Partial<AgsConfig>;
}) {
  const findMany = jest
    .fn()
    .mockResolvedValue(options.attempts) as FindManyMock;
  const updateMany = jest
    .fn()
    .mockResolvedValue({ count: options.attempts.length }) as UpdateManyMock;
  const groupBy = jest.fn().mockResolvedValue(options.recorded ?? []);
  const quizAttempts = { findMany, updateMany, groupBy };

  const prisma = {
    quiz_attempts: quizAttempts,
    lms_user_mappings: {
      findMany: jest
        .fn()
        .mockResolvedValue(
          options.users ?? [
            { internal_user_id: USER, lms_sub: 'canvas-user-77' },
          ],
        ),
    },
    lti_line_items: {
      findMany: jest.fn().mockResolvedValue(
        options.lineItems ?? [
          {
            resource_link_id: LINK,
            lms_line_item_url: 'https://canvas.test/line_items/9',
            score_maximum: 20,
          },
        ],
      ),
    },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ quiz_attempts: quizAttempts }),
    ),
  };
  const postScore = jest
    .fn()
    .mockResolvedValue(options.postResult ?? { ok: true }) as PostScoreMock;
  const service = new AgsPublisherService(
    prisma as never,
    { postScore } as never,
    { ...CONFIG, ...options.config },
  );

  return { service, prisma, findMany, updateMany, groupBy, postScore };
}

/** Các lệnh updateMany đánh dấu trạng thái, bỏ lệnh giành batch (POSTING). */
function statusUpdates(updateMany: UpdateManyMock): UpdateManyArgs[] {
  return updateMany.mock.calls
    .map(([args]) => args)
    .filter((args) => args.data.ags_status !== AGS_STATUS.posting);
}

/** Đưa mọi mục backoff về quá khứ để mô phỏng đã hết thời gian chờ. */
function expireBackoff(service: AgsPublisherService) {
  const { backoff } = service as unknown as {
    backoff: Map<string, { nextAttemptAt: number }>;
  };
  backoff.forEach((state) => {
    state.nextAttemptAt = 0;
  });
}

describe('AgsPublisherService', () => {
  it('keeps interleaved submissions with identical timestamps intact', async () => {
    const at = '2026-08-25T10:00:00.000Z';
    const attempts = [
      { ...attempt('a1', 0, at), submission_id: 'a' },
      { ...attempt('b1', 100, at), submission_id: 'b' },
      { ...attempt('a2', 0, at), submission_id: 'a' },
      { ...attempt('b2', 0, at), submission_id: 'b' },
    ];
    const { service, postScore } = setup({ attempts });
    await service.publishPending();
    expect(postScore).toHaveBeenCalledWith(
      'https://canvas.test/line_items/9',
      expect.objectContaining({ scoreGiven: 10 }),
    );
  });
  it('publishes the best complete quiz-set submission without averaging retakes', async () => {
    const attempts = [
      {
        ...attempt('old1', 100, '2026-08-25T10:00:00.000Z'),
        submission_id: 'old',
      },
      {
        ...attempt('old2', 100, '2026-08-25T10:00:00.000Z'),
        submission_id: 'old',
      },
      {
        ...attempt('new1', 0, '2026-08-25T10:01:00.000Z'),
        submission_id: 'new',
      },
      {
        ...attempt('new2', 100, '2026-08-25T10:01:00.000Z'),
        submission_id: 'new',
      },
    ];
    const { service, postScore, findMany } = setup({ attempts });
    await service.publishPending();
    // Giành batch, bổ sung câu còn thiếu của lượt nộp, rồi đọc câu của lượt tốt
    // nhất để dựng nhận xét.
    expect(findMany).toHaveBeenCalledTimes(3);
    // Lượt sau kém hơn không kéo điểm xuống; timestamp vẫn là lượt mới nhất
    // vì Canvas từ chối timestamp cũ hơn kết quả đã có.
    expect(postScore).toHaveBeenCalledWith(
      'https://canvas.test/line_items/9',
      expect.objectContaining({
        scoreGiven: 20,
        timestamp: '2026-08-25T10:01:00.000Z',
      }),
    );
  });
  it('keeps a best score posted earlier when a later retake is worse', async () => {
    const retake = [
      {
        ...attempt('r1', 0, '2026-08-25T11:00:00.000Z'),
        submission_id: 'retake',
      },
    ];
    const { service, postScore, groupBy } = setup({
      attempts: retake,
      recorded: [
        { submission_id: 'first', _avg: { score: 100 } },
        { submission_id: 'retake', _avg: { score: 0 } },
      ],
    });
    await service.publishPending();
    expect(groupBy.mock.calls[0][0]).toMatchObject({
      by: ['submission_id'],
      where: {
        user_id: USER,
        resource_link_id: LINK,
        submission_id: { not: null },
      },
    });
    expect(postScore).toHaveBeenCalledWith(
      'https://canvas.test/line_items/9',
      expect.objectContaining({
        scoreGiven: 20,
        timestamp: '2026-08-25T11:00:00.000Z',
      }),
    );
  });
  it('does not look up recorded submissions for lesson quizzes', async () => {
    const { service, groupBy } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
    });
    await service.publishPending();
    expect(groupBy).not.toHaveBeenCalled();
  });
  it('expands a batch boundary to include every answer in the quiz submission', async () => {
    const first = {
      ...attempt('q1', 100, '2026-08-25T10:00:00.000Z'),
      submission_id: 'submission',
    };
    const last = {
      ...attempt('q2', 0, '2026-08-25T10:00:00.000Z'),
      submission_id: 'submission',
    };
    const { service, postScore, findMany } = setup({ attempts: [first] });
    findMany
      .mockResolvedValueOnce([first])
      .mockResolvedValueOnce([first, last]);
    await service.publishPending();
    expect(postScore).toHaveBeenCalledWith(
      'https://canvas.test/line_items/9',
      expect.objectContaining({ scoreGiven: 10 }),
    );
  });
  it('gom các câu của một lượt nộp thành một điểm và quy đổi theo score_maximum', async () => {
    // 3 câu: đúng, đúng, sai → 2/3 của thang 20 = 13.33
    const { service, postScore, updateMany } = setup({
      attempts: [
        attempt('a1', 100, '2026-08-25T10:00:00.000Z'),
        attempt('a2', 100, '2026-08-25T10:00:05.000Z'),
        attempt('a3', 0, '2026-08-25T10:00:09.000Z'),
      ],
    });

    const published = await service.publishPending();

    expect(published).toBe(1);
    expect(postScore).toHaveBeenCalledTimes(1);
    expect(postScore).toHaveBeenCalledWith('https://canvas.test/line_items/9', {
      // định danh phải là sub của platform, không phải internal_user_id
      userId: 'canvas-user-77',
      scoreGiven: 13.33,
      scoreMaximum: 20,
      // mốc thời gian lấy câu trả lời cuối của lượt nộp
      timestamp: '2026-08-25T10:00:09.000Z',
    });

    const marked = statusUpdates(updateMany);
    expect(marked).toHaveLength(1);
    expect(marked[0].where.attempt_id.in).toEqual(['a1', 'a2', 'a3']);
    expect(marked[0].data.ags_status).toBe(AGS_STATUS.posted);
    expect(marked[0].data.ags_posted_at).toBeInstanceOf(Date);
  });

  it('giành batch bằng cách đánh POSTING trong transaction trước khi gọi platform', async () => {
    const { service, prisma, updateMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
    });

    await service.publishPending();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(updateMany.mock.calls[0][0].data.ags_status).toBe(
      AGS_STATUS.posting,
    );
  });

  it('không gọi platform khi không có gì PENDING', async () => {
    const { service, postScore, prisma } = setup({ attempts: [] });

    expect(await service.publishPending()).toBe(0);
    expect(postScore).not.toHaveBeenCalled();
    expect(prisma.lti_line_items.findMany).not.toHaveBeenCalled();
  });

  it('đánh NOT_REQUIRED khi resource link không có line item', async () => {
    const { service, postScore, updateMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      lineItems: [],
    });

    await service.publishPending();

    expect(postScore).not.toHaveBeenCalled();
    expect(statusUpdates(updateMany)[0].data.ags_status).toBe(
      AGS_STATUS.notRequired,
    );
  });

  it('trả về PENDING khi lỗi tạm thời, và bỏ qua link đó ở vòng poll kế tiếp', async () => {
    const { service, updateMany, findMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      postResult: { ok: false, retryable: true, error: 'HTTP 503' },
    });

    await service.publishPending();
    expect(statusUpdates(updateMany)[0].data.ags_status).toBe(
      AGS_STATUS.pending,
    );

    // Vòng sau: link đang trong backoff nên phải bị loại khỏi truy vấn giành batch.
    await service.publishPending();
    expect(findMany.mock.calls[1][0].where.resource_link_id.notIn).toEqual([
      LINK,
    ]);
  });

  it('bỏ cuộc và đánh FAILED sau khi vượt maxRetries', async () => {
    const { service, updateMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      postResult: { ok: false, retryable: true, error: 'HTTP 503' },
    });

    // maxRetries = 2 → hai lần đầu quay lại PENDING, lần thứ ba là FAILED.
    for (let i = 0; i < 3; i += 1) {
      expireBackoff(service);
      await service.publishPending();
    }

    expect(
      statusUpdates(updateMany).map((args) => args.data.ags_status),
    ).toEqual([AGS_STATUS.pending, AGS_STATUS.pending, AGS_STATUS.failed]);
  });

  it('giữ PENDING vô thời hạn khi Canvas báo bài tập chưa publish', async () => {
    const { service, updateMany, findMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      postResult: {
        ok: false,
        retryable: true,
        waitingForPublish: true,
        error: 'HTTP 422',
      },
    });

    // maxRetries = 2 nhưng chờ publish không phải thất bại → không bao giờ FAILED.
    for (let i = 0; i < 5; i += 1) {
      expireBackoff(service);
      await service.publishPending();
    }
    expect(
      new Set(statusUpdates(updateMany).map((args) => args.data.ags_status)),
    ).toEqual(new Set([AGS_STATUS.pending]));

    // Trong lúc chờ, link bị loại khỏi truy vấn giành batch.
    await service.publishPending();
    expect(findMany.mock.calls.at(-1)![0].where.resource_link_id.notIn).toEqual(
      [LINK],
    );
  });

  it('đánh FAILED ngay với lỗi vĩnh viễn, không thử lại', async () => {
    const { service, updateMany, findMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      postResult: { ok: false, retryable: false, error: 'HTTP 404' },
    });

    await service.publishPending();
    expect(statusUpdates(updateMany)[0].data.ags_status).toBe(
      AGS_STATUS.failed,
    );

    // không đưa vào backoff → vòng sau vẫn truy vấn bình thường
    await service.publishPending();
    expect(
      findMany.mock.calls[1][0].where.resource_link_id.notIn,
    ).toBeUndefined();
  });

  it('đánh FAILED khi thiếu ánh xạ lms_sub thay vì đẩy sai người', async () => {
    const { service, postScore, updateMany } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      users: [],
    });

    await service.publishPending();

    expect(postScore).not.toHaveBeenCalled();
    expect(statusUpdates(updateMany)[0].data.ags_status).toBe(
      AGS_STATUS.failed,
    );
  });

  it('tách điểm theo từng người học trong cùng một resource link', async () => {
    const { service, postScore } = setup({
      attempts: [
        attempt('a1', 100, '2026-08-25T10:00:00.000Z'),
        attempt('b1', 0, '2026-08-25T10:01:00.000Z', OTHER_USER),
      ],
      users: [
        { internal_user_id: USER, lms_sub: 'canvas-user-77' },
        { internal_user_id: OTHER_USER, lms_sub: 'canvas-user-88' },
      ],
    });

    expect(await service.publishPending()).toBe(2);
    expect(postScore).toHaveBeenCalledTimes(2);
    expect(postScore.mock.calls[0][1]).toMatchObject({
      userId: 'canvas-user-77',
      scoreGiven: 20,
    });
    expect(postScore.mock.calls[1][1]).toMatchObject({
      userId: 'canvas-user-88',
      scoreGiven: 0,
    });
  });

  it('recoverStuckClaims chỉ thu hồi các dòng POSTING đã quá ngưỡng lease, không phá ngang replica khác', async () => {
    const { service, updateMany } = setup({ attempts: [] });
    const now = new Date('2026-08-25T10:05:00.000Z').getTime();

    await service.recoverStuckClaims(now);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        ags_status: AGS_STATUS.posting,
        deleted_at: null,
        OR: [
          { ags_posted_at: null },
          { ags_posted_at: { lt: new Date('2026-08-25T10:03:00.000Z') } },
        ],
      },
      data: { ags_status: AGS_STATUS.pending, ags_posted_at: null },
    });
  });

  it('bỏ qua vòng đẩy điểm nếu replica khác đã giành batch trước (updateMany count === 0)', async () => {
    const { service, updateMany, postScore } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
    });
    updateMany.mockResolvedValueOnce({ count: 0 });

    const published = await service.publishPending();

    expect(published).toBe(0);
    expect(postScore).not.toHaveBeenCalled();
  });
});

describe('AgsPublisherService SpeedGrader submission and comment', () => {
  const QUIZ_SET = '00000000-0000-0000-0000-0000000000dd';
  const TOOL = 'https://tool.example';
  const quizLineItem = [
    {
      resource_link_id: LINK,
      lms_line_item_url: 'https://canvas.test/line_items/9',
      score_maximum: 10,
      lti_resource_links: { target_kind: 'quiz_set', target_id: QUIZ_SET },
    },
  ];
  const submissionRows = [
    { ...attempt('n1', 100, '2026-08-25T10:01:00.000Z'), submission_id: 'new' },
    { ...attempt('n2', 100, '2026-08-25T10:01:00.000Z'), submission_id: 'new' },
    { ...attempt('n3', 0, '2026-08-25T10:01:30.000Z'), submission_id: 'new' },
    { ...attempt('n4', 100, '2026-08-25T10:01:30.000Z'), submission_id: 'new' },
  ];
  const lo = (code: string, statement: string, correct: boolean) => ({
    is_correct: correct,
    quiz_items: { learning_outcomes: { code, statement_vi: statement } },
  });

  function quizSetup(extra: Partial<Parameters<typeof setup>[0]>) {
    const ctx = setup({
      attempts: submissionRows,
      lineItems: quizLineItem,
      config: { toolUrl: TOOL },
      ...extra,
    });
    // Ba lần findMany: giành batch, bổ sung câu còn thiếu, đọc câu để dựng nhận xét.
    ctx.findMany
      .mockResolvedValueOnce(submissionRows)
      .mockResolvedValueOnce(submissionRows)
      .mockResolvedValueOnce([
        lo('LO1.1', 'Định nghĩa tiến trình', true),
        lo('LO1.1', 'Định nghĩa tiến trình', true),
        lo('LO2.3', 'Phân biệt tiến trình và luồng', false),
        lo('LO2.3', 'Phân biệt tiến trình và luồng', true),
      ]);
    return ctx;
  }

  it('sends the best submission as a SpeedGrader launch URL with a short comment', async () => {
    const { service, postScore } = quizSetup({});
    await service.publishPending();
    expect(postScore).toHaveBeenCalledWith(
      'https://canvas.test/line_items/9',
      expect.objectContaining({
        scoreGiven: 7.5,
        scoreMaximum: 10,
        comment:
          'Đúng 3/4 câu. LO yếu nhất: LO2.3 – Phân biệt tiến trình và luồng (1/2 câu đúng).',
        submission: {
          url: `${TOOL}/learn/quizzes/${QUIZ_SET}/submissions/new`,
          submittedAt: '2026-08-25T10:01:30.000Z',
        },
      }),
    );
  });

  it('keeps the scores in step with the maximum Canvas holds today', async () => {
    const { service, postScore } = quizSetup({
      lineItems: [{ ...quizLineItem[0], score_maximum: 40 }],
    });
    await service.publishPending();
    expect(postScore).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ scoreGiven: 30, scoreMaximum: 40 }),
    );
  });

  it('points SpeedGrader at an earlier better attempt and does not repeat its comment', async () => {
    const retake = [
      {
        ...attempt('r1', 0, '2026-08-25T11:00:00.000Z'),
        submission_id: 'retake',
      },
    ];
    const { service, postScore, findMany } = setup({
      attempts: retake,
      lineItems: quizLineItem,
      config: { toolUrl: TOOL },
      recorded: [
        {
          submission_id: 'first',
          _avg: { score: 100 },
          _max: { attempted_at: new Date('2026-08-25T10:00:00.000Z') },
        },
        {
          submission_id: 'retake',
          _avg: { score: 0 },
          _max: { attempted_at: new Date('2026-08-25T11:00:00.000Z') },
        },
      ],
    });
    await service.publishPending();
    const payload = postScore.mock.calls[0][1];
    expect(payload.scoreGiven).toBe(10);
    expect(payload.submission).toEqual({
      url: `${TOOL}/learn/quizzes/${QUIZ_SET}/submissions/first`,
      // Giữ nguyên lúc nộp của bài đã đẩy để Canvas không tính thêm lần nộp.
      submittedAt: '2026-08-25T10:00:00.000Z',
    });
    // Lượt tốt nhất không nằm trong batch này: không gửi lại nhận xét cũ.
    expect(payload).not.toHaveProperty('comment');
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('prefers the earlier attempt when two attempts score the same', async () => {
    const tie = [
      {
        ...attempt('t1', 100, '2026-08-25T12:00:00.000Z'),
        submission_id: 'later',
      },
    ];
    const { service, postScore } = setup({
      attempts: tie,
      lineItems: quizLineItem,
      config: { toolUrl: TOOL },
      recorded: [
        {
          submission_id: 'earlier',
          _avg: { score: 100 },
          _max: { attempted_at: new Date('2026-08-25T10:00:00.000Z') },
        },
        {
          submission_id: 'later',
          _avg: { score: 100 },
          _max: { attempted_at: new Date('2026-08-25T12:00:00.000Z') },
        },
      ],
    });
    await service.publishPending();
    expect(postScore.mock.calls[0][1].submission?.url).toMatch(
      /\/submissions\/earlier$/,
    );
  });

  it('still pushes the score when the comment cannot be built', async () => {
    const { service, postScore, findMany } = quizSetup({});
    findMany.mockReset();
    findMany
      .mockResolvedValueOnce(submissionRows)
      .mockResolvedValueOnce(submissionRows)
      .mockRejectedValueOnce(new Error('db down'));
    await expect(service.publishPending()).resolves.toBe(1);
    const payload = postScore.mock.calls[0][1];
    expect(payload).not.toHaveProperty('comment');
    expect(payload.submission?.url).toContain('/submissions/new');
  });

  it('sends no submission without a public tool URL', async () => {
    const { service, postScore } = quizSetup({
      config: { toolUrl: undefined },
    });
    await service.publishPending();
    expect(postScore.mock.calls[0][1]).not.toHaveProperty('submission');
  });

  it('leaves lesson quizzes untouched', async () => {
    const { service, postScore } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
      lineItems: [
        {
          ...quizLineItem[0],
          lti_resource_links: { target_kind: 'lesson', target_id: QUIZ_SET },
        },
      ],
      config: { toolUrl: TOOL },
    });
    await service.publishPending();
    const payload = postScore.mock.calls[0][1];
    expect(payload).not.toHaveProperty('submission');
    expect(payload).not.toHaveProperty('comment');
  });
});
