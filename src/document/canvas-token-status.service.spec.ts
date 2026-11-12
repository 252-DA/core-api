import { Logger } from '@nestjs/common';
import {
  CANVAS_TOKEN_CHECK,
  CANVAS_TOKEN_STATUS_KEY,
  CanvasTokenStatusService,
} from './canvas-token-status.service';

describe('CanvasTokenStatusService', () => {
  const okResult = {
    checked_at: '2026-11-12T07:00:00.000Z',
    ok: true,
    http_status: 200,
    message: 'Token hợp lệ',
  };

  function setup(enabled = true) {
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
    const queue = {
      client: Promise.resolve(redis),
      upsertJobScheduler: jest.fn(),
      removeJobScheduler: jest.fn(),
    };
    const canvas = { checkToken: jest.fn().mockResolvedValue(okResult) };
    const service = new CanvasTokenStatusService(
      queue as never,
      canvas as never,
      {
        enabled,
        intervalMs: 900_000,
        launchCooldownMs: 120_000,
      },
    );
    return { service, queue, redis, canvas };
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('schedules a 24-hour check and runs one right away', async () => {
    const { service, queue, canvas, redis } = setup();
    await service.onModuleInit();
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      'canvas-token-check',
      { every: 24 * 60 * 60_000 },
      expect.objectContaining({ name: CANVAS_TOKEN_CHECK }),
    );
    await new Promise((resolve) => setImmediate(resolve));
    expect(canvas.checkToken).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      CANVAS_TOKEN_STATUS_KEY,
      JSON.stringify(okResult),
    );
  });

  it('does nothing and removes the scheduler when auto sync is disabled', async () => {
    const { service, queue, canvas } = setup(false);
    await service.onModuleInit();
    expect(queue.removeJobScheduler).toHaveBeenCalledWith('canvas-token-check');
    expect(queue.upsertJobScheduler).not.toHaveBeenCalled();
    expect(canvas.checkToken).not.toHaveBeenCalled();
  });

  it('stores failed checks too, without a TTL', async () => {
    const { service, redis, canvas } = setup();
    const failed = {
      checked_at: '2026-11-12T07:00:00.000Z',
      ok: false,
      http_status: 401,
      message: 'Token Canvas hết hạn hoặc không hợp lệ',
    };
    canvas.checkToken.mockResolvedValue(failed);
    await expect(service.check()).resolves.toEqual(failed);
    expect(redis.set).toHaveBeenCalledTimes(1);
    expect(redis.set.mock.calls[0]).toEqual([
      CANVAS_TOKEN_STATUS_KEY,
      JSON.stringify(failed),
    ]);
  });

  it('does not fail startup when the first check cannot be stored', async () => {
    const { service, redis } = setup();
    redis.set.mockRejectedValue(new Error('redis offline'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    await new Promise((resolve) => setImmediate(resolve));
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('redis offline'),
    );
  });

  it('reads the stored status, tolerating a missing or corrupt value', async () => {
    const { service, redis } = setup();
    await expect(service.read()).resolves.toBeNull();
    redis.get.mockResolvedValue(JSON.stringify(okResult));
    await expect(service.read()).resolves.toEqual(okResult);
    redis.get.mockResolvedValue('{not json');
    await expect(service.read()).resolves.toBeNull();
    expect(redis.get).toHaveBeenCalledWith(CANVAS_TOKEN_STATUS_KEY);
  });
});
