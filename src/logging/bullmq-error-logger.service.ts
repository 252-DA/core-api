import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { DiscoveryService } from '@nestjs/core';
import { Queue } from 'bullmq';

export type BullMqRole = 'queue' | 'worker';

export interface BullMqErrorTarget {
  on(event: 'error', listener: (err: unknown) => void): unknown;
  name?: string;
}

/**
 * Gắn listener 'error' cho mọi Queue và Worker của BullMQ khi ứng dụng khởi động
 * xong, để lỗi mất kết nối Redis đi qua logger của Nest thay vì rơi vào nhánh
 * in trực tiếp ra stderr trong QueueBase.emit().
 *
 * Giới hạn đã biết: lỗi phát ra trước onApplicationBootstrap (Redis chết đúng
 * lúc app khởi động) vẫn rơi ra stderr mặc định của BullMQ.
 */
@Injectable()
export class BullMqErrorLogger implements OnApplicationBootstrap {
  private readonly logger = new Logger(BullMqErrorLogger.name);
  private readonly attached = new WeakSet<object>();

  constructor(private readonly discovery: DiscoveryService) {}

  onApplicationBootstrap(): void {
    try {
      for (const wrapper of this.discovery.getProviders()) {
        try {
          if (
            !wrapper ||
            !wrapper.isDependencyTreeStatic() ||
            wrapper.isTransient
          ) {
            continue;
          }
          const instance: unknown = wrapper.instance;
          if (!instance || typeof instance !== 'object') {
            continue;
          }

          if (instance instanceof Queue) {
            this.attachErrorListener(instance, instance.name, 'queue');
          } else if (instance instanceof WorkerHost) {
            const worker = instance.worker;
            this.attachErrorListener(worker, worker.name, 'worker');
          }
        } catch {
          // Bỏ qua provider lỗi (vd. WorkerHost chưa có _worker) để không làm chết app.
        }
      }
    } catch {
      // Không bao giờ để hook ghi log làm gián đoạn khởi động ứng dụng.
    }
  }

  attachErrorListener(
    target: BullMqErrorTarget,
    queueName: string,
    role: BullMqRole,
  ): void {
    if (this.attached.has(target)) {
      return;
    }
    this.attached.add(target);
    target.on('error', (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        {
          queue: queueName || target.name || 'unknown',
          role,
          err,
        },
        'BullMQ error',
      );
    });
  }
}
