import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import {
  WORKER_RESULT_KINDS,
  isWorkerResultKind,
  type WorkerResultKind,
} from './worker-results.constants';
import {
  workerResultHandlerMetadata,
  type WorkerResultHandler,
} from './worker-result-handler';

export interface DiscoveredHandler {
  kind: unknown;
  name: string;
  instance: unknown;
  /** Singleton: request/transient scope không có một instance để gọi. */
  singleton: boolean;
}

/**
 * kind → handler. Ném lỗi khi một kind có hơn một handler, kind lạ, hoặc
 * provider không dùng được — đây là lỗi cấu hình, phải chặn app khởi động.
 */
export function buildHandlerMap(
  found: DiscoveredHandler[],
): Map<WorkerResultKind, WorkerResultHandler> {
  const problems: string[] = [];
  const byKind = new Map<WorkerResultKind, DiscoveredHandler[]>();
  for (const handler of found) {
    if (!isWorkerResultKind(handler.kind)) {
      problems.push(
        `${handler.name}: unknown kind ${JSON.stringify(handler.kind)}`,
      );
      continue;
    }
    if (!handler.singleton) {
      problems.push(`${handler.name}: handler must be a singleton provider`);
    } else if (
      typeof (handler.instance as Partial<WorkerResultHandler> | undefined)
        ?.handle !== 'function'
    ) {
      problems.push(`${handler.name}: missing handle() method`);
    } else {
      const hook = (handler.instance as Partial<WorkerResultHandler>)
        .onFinalFailure;
      if (hook !== undefined && typeof hook !== 'function') {
        problems.push(`${handler.name}: onFinalFailure must be a method`);
      }
    }
    byKind.set(handler.kind, [...(byKind.get(handler.kind) ?? []), handler]);
  }
  for (const [kind, handlers] of byKind) {
    if (handlers.length < 2) continue;
    const names = handlers.map((h) => h.name);
    const hint =
      new Set(names).size < names.length
        ? ' (same class listed in providers of more than one module?)'
        : '';
    problems.push(
      `${kind} has ${handlers.length} handlers: ${names.join(', ')}${hint}`,
    );
  }
  if (problems.length) {
    throw new Error(
      `worker_results handlers misconfigured: ${problems.join('; ')}`,
    );
  }
  return new Map(
    [...byKind].map(([kind, [handler]]) => [
      kind,
      handler.instance as WorkerResultHandler,
    ]),
  );
}

@Injectable()
export class WorkerResultHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(WorkerResultHandlerRegistry.name);
  private handlers?: Map<WorkerResultKind, WorkerResultHandler>;

  constructor(private readonly discovery: DiscoveryService) {}

  /** Quét ngay lúc khởi động để cấu hình sai làm app dừng, không đợi tới job đầu. */
  onModuleInit() {
    this.load();
  }

  /** undefined: kind chưa có handler. */
  get(kind: WorkerResultKind): WorkerResultHandler | undefined {
    return this.load().get(kind);
  }

  /**
   * Worker BullMQ được tạo trong onModuleInit của BullRegistrar và có thể nhận
   * job trước onModuleInit của registry; mọi provider đã dựng xong trước mọi
   * onModuleInit nên quét muộn ở đây vẫn thấy đủ handler.
   */
  private load(): Map<WorkerResultKind, WorkerResultHandler> {
    if (this.handlers) return this.handlers;
    const found = this.discovery
      .getProviders({ metadataKey: workerResultHandlerMetadata.KEY })
      .map(
        (wrapper): DiscoveredHandler => ({
          kind: this.discovery.getMetadataByDecorator(
            workerResultHandlerMetadata,
            wrapper,
          ),
          name: String(wrapper.name),
          instance: wrapper.instance as unknown,
          singleton: wrapper.isDependencyTreeStatic() && !wrapper.isTransient,
        }),
      );
    const handlers = buildHandlerMap(found);
    const missing = WORKER_RESULT_KINDS.filter((kind) => !handlers.has(kind));
    if (missing.length) {
      this.logger.warn(
        `Chưa có handler cho ${missing.join(', ')}: kết quả loại này sẽ fail, không retry`,
      );
    }
    this.handlers = handlers;
    return handlers;
  }
}
