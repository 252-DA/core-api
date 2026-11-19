import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  CanvasApiClient,
  type CanvasTokenCheck,
} from '../../../integrations/canvas/canvas-api.client';
import {
  CANVAS_SYNC_CONFIG,
  type CanvasSyncConfig,
} from '../../../config/canvas-sync.config';
import { CANVAS_SYNC_QUEUE } from '../../../messaging/queues';

export const CANVAS_TOKEN_CHECK = 'check_token';
export const CANVAS_TOKEN_STATUS_KEY = 'canvas:token-status';
const TOKEN_SCHEDULER_ID = 'canvas-token-check';
const CHECK_EVERY_MS = 24 * 60 * 60_000;

/**
 * Kiểm tra token Canvas mỗi 24 giờ (và một lần khi khởi động) bằng
 * GET /api/v1/users/self; kết quả lưu ở Redis, không TTL, để trang quản lý
 * tài liệu báo token hỏng ngay thay vì đợi lần đồng bộ kế tiếp thất bại.
 * Chạy khi CANVAS_AUTO_SYNC_ENABLED, như sweep.
 */
@Injectable()
export class CanvasTokenStatusService implements OnModuleInit {
  private readonly logger = new Logger(CanvasTokenStatusService.name);

  constructor(
    @InjectQueue(CANVAS_SYNC_QUEUE) private readonly queue: Queue,
    private readonly canvas: CanvasApiClient,
    @Inject(CANVAS_SYNC_CONFIG) private readonly config: CanvasSyncConfig,
  ) {}

  async onModuleInit() {
    if (!this.config.enabled) {
      await this.queue.removeJobScheduler(TOKEN_SCHEDULER_ID);
      return;
    }
    await this.queue.upsertJobScheduler(
      TOKEN_SCHEDULER_ID,
      { every: CHECK_EVERY_MS },
      {
        name: CANVAS_TOKEN_CHECK,
        data: {},
        opts: { removeOnComplete: true, removeOnFail: 100 },
      },
    );
    // Không chặn khởi động: Canvas tắt hay Redis lỗi chỉ ghi log.
    void this.check().catch((error: unknown) =>
      this.logger.warn(
        `Không kiểm tra được token Canvas lúc khởi động: ${String(error)}`,
      ),
    );
  }

  async check(): Promise<CanvasTokenCheck> {
    const result = await this.canvas.checkToken();
    if (result.ok) this.logger.log('Token Canvas hợp lệ');
    else
      this.logger.warn(
        `Token Canvas lỗi: ${result.message} (HTTP ${result.http_status ?? 'không có'})`,
      );
    const redis = await this.queue.client;
    await redis.set(CANVAS_TOKEN_STATUS_KEY, JSON.stringify(result));
    return result;
  }

  async read(): Promise<CanvasTokenCheck | null> {
    const redis = await this.queue.client;
    const raw = await redis.get(CANVAS_TOKEN_STATUS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CanvasTokenCheck;
    } catch {
      return null;
    }
  }
}
