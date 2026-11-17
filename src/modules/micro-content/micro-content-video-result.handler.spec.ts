import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { CONTRACTS_DIR } from '../../testing/repo-paths';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';
import type { WorkerResultEnvelope } from '../../messaging/worker-results/worker-result-envelope';
import {
  MicroContentVideoResultHandler,
  parseMicroContentVideoPayload,
} from './micro-content-video-result.handler';

const MC = '22222222-2222-4222-8222-222222222222';
const ASSET = '55555555-5555-4555-8555-555555555555';
const RENDER = '66666666-6666-4666-8666-666666666666';
const OLD_RENDER = '77777777-7777-4777-8777-777777777777';
const KEY = `micro-content/c/${MC}/ai-${RENDER}.mp4`;

function ready(extra: Record<string, unknown> = {}) {
  return {
    micro_content_id: MC,
    asset_id: ASSET,
    render_id: RENDER,
    status: 'READY',
    object_key: KEY,
    duration_ms: 7700,
    size_bytes: 3,
    mime_type: 'video/mp4',
    ...extra,
  };
}

function failed(extra: Record<string, unknown> = {}) {
  return {
    micro_content_id: MC,
    asset_id: ASSET,
    render_id: RENDER,
    status: 'FAILED',
    error: 'TTS failure',
    ...extra,
  };
}

function envelope(
  payload: Record<string, unknown>,
): WorkerResultEnvelope<Record<string, unknown>> {
  return {
    result_id: `MICRO_CONTENT_VIDEO_RESULT.${RENDER}.${String(payload.status).toLowerCase()}`,
    kind: 'MICRO_CONTENT_VIDEO_RESULT',
    source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaac1',
    occurred_at: '2026-11-07T11:00:00.000Z',
    payload,
  };
}

type UpdateManyArgs = {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
};
const updateMany = (count: number) =>
  jest
    .fn<Promise<{ count: number }>, [UpdateManyArgs]>()
    .mockResolvedValue({ count });

function setup(
  assetUpdated = 1,
  current: { ai_render_id: string | null } | null = null,
) {
  const prisma = {
    video_assets: {
      updateMany: updateMany(assetUpdated),
      findUnique: jest.fn().mockResolvedValue(current),
    },
    micro_contents: {
      updateMany: updateMany(1),
    },
    $transaction: jest.fn(
      async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> =>
        cb(prisma),
    ),
  };
  const handler = new MicroContentVideoResultHandler(prisma as never);
  return { handler, prisma };
}

describe('MicroContentVideoResultHandler', () => {
  it('READY: asset of this render and every waiting lesson on it, in one transaction', async () => {
    const { handler, prisma } = setup();

    const out = await handler.handle(envelope(ready()));

    expect(out).toEqual({ applied: true, status: 'READY', microContents: 1 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Điều kiện chống kết quả cũ nằm trong chính câu UPDATE.
    expect(prisma.video_assets.updateMany).toHaveBeenCalledWith({
      where: { asset_id: ASSET, ai_render_id: RENDER, status: 'PROCESSING' },
      data: expect.objectContaining({
        status: 'READY',
        object_key: KEY,
        duration_ms: 7700,
        size_bytes: BigInt(3),
        mime_type: 'video/mp4',
        error_message: null,
      }),
    });
    expect(prisma.micro_contents.updateMany).toHaveBeenCalledWith({
      where: { video_asset_id: ASSET, video_status: 'PROCESSING' },
      data: expect.objectContaining({
        video_status: 'READY',
        video_source: 'AI',
        video_object_key: KEY,
        video_duration_ms: 7700,
        video_size_bytes: BigInt(3),
        video_mime_type: 'video/mp4',
        video_error: null,
      }),
    });
  });

  it('READY: persists vtt_subtitles_key, transcript_text, and scene_timeline when provided', async () => {
    const { handler, prisma } = setup();
    const vttKey = `micro-content/c/${MC}/ai-${RENDER}.vtt`;
    const timeline = [
      { scene_index: 0, title: 'Giới thiệu', start_ms: 0, end_ms: 3500, duration_ms: 3500 },
      { scene_index: 1, title: 'Chi tiết', start_ms: 3500, end_ms: 7700, duration_ms: 4200 },
    ];

    const out = await handler.handle(
      envelope(
        ready({
          vtt_object_key: vttKey,
          transcript_text: 'Xin chào các bạn',
          scene_timeline: timeline,
        }),
      ),
    );

    expect(out).toEqual({ applied: true, status: 'READY', microContents: 1 });
    expect(prisma.video_assets.updateMany).toHaveBeenCalledWith({
      where: { asset_id: ASSET, ai_render_id: RENDER, status: 'PROCESSING' },
      data: expect.objectContaining({
        vtt_subtitles_key: vttKey,
        transcript_status: 'READY',
        transcript_text: 'Xin chào các bạn',
        scene_timeline: timeline,
      }),
    });
  });

  it('FAILED: status and error on asset and waiting lessons, keeps the old file', async () => {
    const { handler, prisma } = setup();

    const out = await handler.handle(envelope(failed()));

    expect(out).toEqual({ applied: true, status: 'FAILED', microContents: 1 });
    const assetData = prisma.video_assets.updateMany.mock.calls[0][0].data;
    expect(assetData).toEqual(
      expect.objectContaining({
        status: 'FAILED',
        error_message: 'TTS failure',
      }),
    );
    expect(assetData).not.toHaveProperty('object_key');
    const lessonData = prisma.micro_contents.updateMany.mock.calls[0][0].data;
    expect(lessonData).toEqual(
      expect.objectContaining({
        video_status: 'FAILED',
        video_error: 'TTS failure',
      }),
    );
    expect(lessonData).not.toHaveProperty('video_object_key');
  });

  it('same result twice: second one changes nothing', async () => {
    const { handler, prisma } = setup(0, { ai_render_id: RENDER });

    const out = await handler.handle(envelope(ready()));

    expect(out).toEqual({ applied: false, reason: 'already_applied' });
    expect(prisma.micro_contents.updateMany).not.toHaveBeenCalled();
  });

  it('result of an older render does not overwrite the newer one', async () => {
    const { handler, prisma } = setup(0, { ai_render_id: RENDER });

    const out = await handler.handle(
      envelope(ready({ render_id: OLD_RENDER, object_key: 'old.mp4' })),
    );

    expect(out).toEqual({ applied: false, reason: 'superseded' });
    expect(prisma.video_assets.updateMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ ai_render_id: OLD_RENDER }),
    );
    expect(prisma.micro_contents.updateMany).not.toHaveBeenCalled();
  });

  it('asset gone: ignored, not retried', async () => {
    const { handler, prisma } = setup(0, null);

    await expect(handler.handle(envelope(failed()))).resolves.toEqual({
      applied: false,
      reason: 'asset_missing',
    });
    expect(prisma.micro_contents.updateMany).not.toHaveBeenCalled();
  });

  it('DB errors propagate so BullMQ retries', async () => {
    const { handler, prisma } = setup();
    prisma.micro_contents.updateMany.mockRejectedValue(
      new Error('connection reset'),
    );

    const err = await handler
      .handle(envelope(ready()))
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(InvalidWorkerResultError);
  });

  it.each([
    ['missing object_key', ready({ object_key: undefined })],
    ['empty object_key', ready({ object_key: '' })],
    [
      'object_key longer than the column',
      ready({ object_key: 'k'.repeat(513) }),
    ],
    ['fractional duration', ready({ duration_ms: 1.5 })],
    ['duration beyond INTEGER', ready({ duration_ms: 2_147_483_648 })],
    ['negative size', ready({ size_bytes: -1 })],
    ['size as string', ready({ size_bytes: '3' })],
    ['non-video mime type', ready({ mime_type: 'application/pdf' })],
    ['render_id not a UUID', ready({ render_id: 'render-1' })],
    ['asset_id missing', ready({ asset_id: undefined })],
    ['micro_content_id not a UUID', failed({ micro_content_id: 'mc-1' })],
    ['unknown status', { ...failed(), status: 'PROCESSING' }],
    ['READY with error field', ready({ error: 'x' })],
    ['FAILED with object_key', failed({ object_key: KEY })],
    ['empty error', failed({ error: '' })],
    ['error longer than 1000', failed({ error: 'e'.repeat(1001) })],
  ])('rejects %s without touching the DB', async (_name, payload) => {
    const clean = JSON.parse(JSON.stringify(payload)) as Record<
      string,
      unknown
    >;
    const { handler, prisma } = setup();

    await expect(handler.handle(envelope(clean))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('MicroContentVideoResultHandler.onFinalFailure', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fails the asset of this render and the lessons waiting on it, like the FAILED branch', async () => {
    const { handler, prisma } = setup();
    const bad = envelope(ready({ duration_ms: 1.5 }));
    const error = await handler.handle(bad).catch((e: Error) => e);
    expect(error).toBeInstanceOf(InvalidWorkerResultError);
    expect(prisma.$transaction).not.toHaveBeenCalled();

    await handler.onFinalFailure(bad, error as Error);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Cùng điều kiện chống kết quả cũ: đúng render, asset còn PROCESSING.
    expect(prisma.video_assets.updateMany).toHaveBeenCalledWith({
      where: { asset_id: ASSET, ai_render_id: RENDER, status: 'PROCESSING' },
      data: expect.objectContaining({
        status: 'FAILED',
        error_message: expect.stringContaining('Không lưu được kết quả render video') as string,
      }),
    });
    expect(prisma.video_assets.updateMany.mock.calls[0][0].data).not.toHaveProperty('object_key');
    expect(prisma.micro_contents.updateMany).toHaveBeenCalledWith({
      where: { video_asset_id: ASSET, video_status: 'PROCESSING' },
      data: expect.objectContaining({ video_status: 'FAILED' }),
    });
  });

  it('also works when only the render ids are readable (garbled micro_content_id, status, fields)', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope({ asset_id: ASSET, render_id: RENDER, status: 'READY', junk: 1 }),
      new Error('x'),
    );

    expect(prisma.video_assets.updateMany).toHaveBeenCalledTimes(1);
  });

  it('leaves an asset that was already rendered again, or already finished, alone', async () => {
    // updateMany không khớp dòng nào (render_id khác / không còn PROCESSING).
    const { handler, prisma } = setup(0, { ai_render_id: OLD_RENDER });

    await handler.onFinalFailure(envelope(ready()), new Error('x'));

    expect(prisma.video_assets.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.micro_contents.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['payload không phải object', 'rác'],
    ['thiếu render_id', { asset_id: ASSET }],
    ['thiếu asset_id', { render_id: RENDER }],
    ['asset_id không phải uuid', { asset_id: 'asset-1', render_id: RENDER }],
    ['render_id không phải uuid', { asset_id: ASSET, render_id: 'render-1' }],
    ['render_id không phải chuỗi', { asset_id: ASSET, render_id: 7 }],
  ])('không chạm DB khi %s', async (_label, payload) => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(
      envelope(payload as Record<string, unknown>),
      new Error('x'),
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('keeps the stored error within the column limit by code point', async () => {
    const { handler, prisma } = setup();

    await handler.onFinalFailure(envelope(ready()), new Error('𝑓'.repeat(3000)));

    const { error_message } = prisma.video_assets.updateMany.mock.calls[0][0].data as {
      error_message: string;
    };
    expect(Array.from(error_message)).toHaveLength(1000);
    expect(Buffer.from(error_message, 'utf8').toString('utf8')).toBe(error_message);
  });

  it('never throws when the database is down', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handler, prisma } = setup();
    prisma.$transaction.mockRejectedValue(new Error('db down'));

    await expect(
      handler.onFinalFailure(envelope(ready()), new Error('x')),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining('db down'));
  });
});

describe('micro-content-video-result: độ dài tính theo code point', () => {
  const MATH = '𝑓'; // ngoài BMP: 2 đơn vị UTF-16
  const parse = (payload: Record<string, unknown>) =>
    parseMicroContentVideoPayload(payload, 'r');

  it('accepts an error of exactly 1000 non-BMP characters and rejects 1001', () => {
    expect(() => parse(failed({ error: MATH.repeat(1000) }))).not.toThrow();
    expect(() => parse(failed({ error: MATH.repeat(1001) }))).toThrow(
      /error must be a string/,
    );
  });

  it('accepts an object_key of exactly 512 non-BMP characters and rejects 513', () => {
    expect(() => parse(ready({ object_key: MATH.repeat(512) }))).not.toThrow();
    expect(() => parse(ready({ object_key: MATH.repeat(513) }))).toThrow(
      /object_key/,
    );
  });

  it('rejects malformed scene_timeline where end_ms < start_ms', () => {
    expect(() =>
      parse(
        ready({
          scene_timeline: [
            { scene_index: 0, title: 'Cảnh 1', start_ms: 2000, end_ms: 1000, duration_ms: 1000 },
          ],
        }),
      ),
    ).toThrow(/scene_timeline\[0\]\.end_ms/);
  });
});

// Cùng bộ fixture packages-ai/tests/unit/test_contract_fixtures.py kiểm bằng JSON
// Schema: parser bên TS phải chấp nhận/từ chối đúng như schema.
const FIXTURES = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
const describeContract = existsSync(FIXTURES) ? describe : describe.skip;

describeContract('micro-content-video-result contract fixtures', () => {
  const load = (dir: 'valid' | 'invalid') =>
    readdirSync(join(FIXTURES, dir))
      .filter((name) => name.startsWith('micro-content-video-result'))
      .map(
        (name) =>
          [
            name,
            JSON.parse(readFileSync(join(FIXTURES, dir, name), 'utf8')) as {
              result_id: string;
              payload: Record<string, unknown>;
            },
          ] as const,
      );
  const accepted = (fixture: {
    result_id: string;
    payload: Record<string, unknown>;
  }) => {
    try {
      parseMicroContentVideoPayload(fixture.payload, fixture.result_id);
      return true;
    } catch (err) {
      if (err instanceof InvalidWorkerResultError) return false;
      throw err;
    }
  };

  it('accepts every valid fixture', () => {
    const valid = load('valid');
    expect(valid.length).toBeGreaterThanOrEqual(2);
    expect(valid.filter(([, f]) => !accepted(f)).map(([n]) => n)).toEqual([]);
  });

  it('rejects every invalid fixture', () => {
    const invalid = load('invalid');
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.filter(([, f]) => accepted(f)).map(([n]) => n)).toEqual([]);
  });
});
