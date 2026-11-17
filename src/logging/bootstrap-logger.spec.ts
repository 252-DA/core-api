import { Writable } from 'node:stream';
import { ConsoleLogger, Injectable, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  buildLoggerModuleParams,
  createBootstrapLogger,
  getSharedLoggerModuleParams,
} from './pino-config';

@Injectable()
class FailingProvider {
  constructor() {
    throw new Error('DATABASE_URL is not defined');
  }
}

@Module({
  providers: [FailingProvider],
})
class FailingBootstrapModule {}

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

describe('Bootstrap logger (trước khi có Nest app)', () => {
  const capture = createJsonCaptureStream();
  const sharedParams = buildLoggerModuleParams(
    { APP__LOG_LEVEL: 'INFO', APP__JSON_LOGS: 'true' },
    capture.stream,
  );

  beforeEach(() => {
    capture.clear();
  });

  afterAll(() => {
    Logger.overrideLogger(new ConsoleLogger());
  });

  it('trả về cùng một object tham số khi gọi getSharedLoggerModuleParams nhiều lần', () => {
    const first = getSharedLoggerModuleParams();
    const second = getSharedLoggerModuleParams();
    expect(first).toBe(second);
  });

  it('ghi một Error thành dòng JSON có logger, level error và err.message trước khi có app', () => {
    const bootstrapLogger = createBootstrapLogger(sharedParams);

    bootstrapLogger.error(
      new Error('bootstrap failure'),
      undefined,
      'BootstrapTest',
    );

    const lines = capture.parseLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 'error',
      service: 'core-api',
      logger: 'BootstrapTest',
      err: {
        message: 'bootstrap failure',
      },
    });
  });

  it('ghi lỗi khởi tạo DI/constructor thành JSON qua ExceptionHandler mà không cần bufferLogs', async () => {
    const bootstrapLogger = createBootstrapLogger(sharedParams);

    await expect(
      NestFactory.createApplicationContext(FailingBootstrapModule, {
        logger: bootstrapLogger,
        abortOnError: false,
      }),
    ).rejects.toThrow('DATABASE_URL is not defined');

    const lines = capture.parseLines();
    const errLine = lines.find(
      (line) =>
        line.logger === 'ExceptionHandler' &&
        line.level === 'error' &&
        typeof line.err === 'object' &&
        line.err !== null,
    );
    expect(errLine).toBeDefined();
    expect((errLine?.err as { message?: string }).message).toContain(
      'DATABASE_URL is not defined',
    );
  });
});
