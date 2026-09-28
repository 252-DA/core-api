import { AgsPublisherService } from './ags-publisher.service';
import { AGS_STATUS } from './ags-status';
import type { AgsConfig } from './ags.config';
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
  recorded?: Array<{ submission_id: string; _avg: { score: number } }>;
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
    CONFIG,
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
    expect(postScore).toHaveBeenCalledWith('https://canvas.test/line_items/9', expect.objectContaining({ scoreGiven: 10 }));
  });
  it('publishes the best complete quiz-set submission without averaging retakes', async () => {
    const attempts = [
      { ...attempt('old1', 100, '2026-08-25T10:00:00.000Z'), submission_id: 'old' },
      { ...attempt('old2', 100, '2026-08-25T10:00:00.000Z'), submission_id: 'old' },
      { ...attempt('new1', 0, '2026-08-25T10:01:00.000Z'), submission_id: 'new' },
      { ...attempt('new2', 100, '2026-08-25T10:01:00.000Z'), submission_id: 'new' },
    ];
    const { service, postScore, findMany } = setup({ attempts });
    await service.publishPending();
    expect(findMany).toHaveBeenCalledTimes(2);
    // Lượt sau kém hơn không kéo điểm xuống; timestamp vẫn là lượt mới nhất
    // vì Canvas từ chối timestamp cũ hơn kết quả đã có.
    expect(postScore).toHaveBeenCalledWith('https://canvas.test/line_items/9', expect.objectContaining({ scoreGiven: 20, timestamp: '2026-08-25T10:01:00.000Z' }));
  });
  it('keeps a best score posted earlier when a later retake is worse', async () => {
    const retake = [
      { ...attempt('r1', 0, '2026-08-25T11:00:00.000Z'), submission_id: 'retake' },
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
      where: { user_id: USER, resource_link_id: LINK, submission_id: { not: null } },
    });
    expect(postScore).toHaveBeenCalledWith('https://canvas.test/line_items/9', expect.objectContaining({ scoreGiven: 20, timestamp: '2026-08-25T11:00:00.000Z' }));
  });
  it('does not look up recorded submissions for lesson quizzes', async () => {
    const { service, groupBy } = setup({
      attempts: [attempt('a1', 100, '2026-08-25T10:00:00.000Z')],
    });
    await service.publishPending();
    expect(groupBy).not.toHaveBeenCalled();
  });
  it('expands a batch boundary to include every answer in the quiz submission', async () => {
    const first = { ...attempt('q1', 100, '2026-08-25T10:00:00.000Z'), submission_id: 'submission' };
    const last = { ...attempt('q2', 0, '2026-08-25T10:00:00.000Z'), submission_id: 'submission' };
    const { service, postScore, findMany } = setup({ attempts: [first] });
    findMany.mockResolvedValueOnce([first]).mockResolvedValueOnce([first, last]);
    await service.publishPending();
    expect(postScore).toHaveBeenCalledWith('https://canvas.test/line_items/9', expect.objectContaining({ scoreGiven: 10 }));
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
    expect(findMany.mock.calls.at(-1)![0].where.resource_link_id.notIn).toEqual([
      LINK,
    ]);
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
});
