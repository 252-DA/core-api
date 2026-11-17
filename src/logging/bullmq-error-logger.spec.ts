import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';
import {
  ConsoleLogger,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { Logger as PinoNestLogger, LoggerModule } from 'nestjs-pino';
import { BullMqErrorLogger } from './bullmq-error-logger.service';
import { buildLoggerModuleParams } from './pino-config';

function createJsonCaptureStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString('utf8'));
      callback();
    },
  });
  return {
    stream,
    clear() {
      chunks.length = 0;
    },
    parseLines(): Array<Record<string, unknown>> {
      return chunks
        .join('')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    },
  };
}

class FakeWorkerHost extends WorkerHost {
  readonly fakeWorker = Object.assign(new EventEmitter(), {
    name: 'fake_worker_queue',
  });

  override get worker() {
    return this.fakeWorker as never;
  }

  async process(): Promise<void> {
    return undefined;
  }
}

class UninitializedWorkerHost extends WorkerHost {
  async process(): Promise<void> {
    return undefined;
  }
}

@Injectable({ scope: Scope.REQUEST })
class RequestScopedProvider {}

describe('BullMqErrorLogger', () => {
  const capture = createJsonCaptureStream();

  beforeEach(() => {
    capture.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gắn listener lên emitter và ghi logger đúng một lần với queue, role, err', () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const service = new BullMqErrorLogger({} as DiscoveryService);
    const emitter = new EventEmitter();
    const boom = new Error('redis down');

    service.attachErrorListener(emitter, 'doc_queue', 'queue');
    service.attachErrorListener(emitter, 'doc_queue', 'queue');
    emitter.emit('error', boom);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      { queue: 'doc_queue', role: 'queue', err: boom },
      'BullMQ error',
    );
  });

  it('duyệt provider giả (Queue, WorkerHost, lỗi/không tĩnh), xuất JSON log và không gọi console.error', async () => {
    const fakeQueue = Object.assign(
      Object.create(Queue.prototype) as EventEmitter,
      new EventEmitter(),
      { name: 'fake_queue' },
    );
    const fakeWorkerHost = new FakeWorkerHost();

    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(
          buildLoggerModuleParams(
            { APP__LOG_LEVEL: 'INFO', APP__JSON_LOGS: 'true' },
            capture.stream,
          ),
        ),
        DiscoveryModule,
      ],
      providers: [
        BullMqErrorLogger,
        { provide: 'FAKE_QUEUE', useValue: fakeQueue },
        { provide: FakeWorkerHost, useValue: fakeWorkerHost },
        {
          provide: UninitializedWorkerHost,
          useClass: UninitializedWorkerHost,
        },
        { provide: 'NULL_PROVIDER', useValue: null },
        RequestScopedProvider,
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.useLogger(app.get(PinoNestLogger));
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      await app.init();
      capture.clear();

      fakeQueue.emit('error', new Error('queue lost redis'));
      fakeWorkerHost.fakeWorker.emit('error', new Error('worker lost redis'));

      const errorLines = capture
        .parseLines()
        .filter((line) => line.level === 'error');
      expect(errorLines).toHaveLength(2);
      expect(errorLines[0]).toMatchObject({
        level: 'error',
        service: 'core-api',
        logger: 'BullMqErrorLogger',
        queue: 'fake_queue',
        role: 'queue',
        event: 'BullMQ error',
        err: { message: 'queue lost redis' },
      });
      expect(errorLines[1]).toMatchObject({
        level: 'error',
        service: 'core-api',
        logger: 'BullMqErrorLogger',
        queue: 'fake_worker_queue',
        role: 'worker',
        event: 'BullMQ error',
        err: { message: 'worker lost redis' },
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      Logger.overrideLogger(new ConsoleLogger());
      await app.close();
    }
  });
});
