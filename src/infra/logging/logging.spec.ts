import { Writable } from 'node:stream';
import {
  Body,
  ConsoleLogger,
  Controller,
  Get,
  Logger,
  Post,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import { Logger as PinoNestLogger, LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { BffClaims } from '../../auth/bff-claims';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { BffJwtService } from '../../auth/bff-jwt.service';
import { HttpExceptionLoggingFilter } from './http-exception-logging.filter';
import {
  buildLoggerModuleParams,
  buildPinoOptions,
  createFastifyAdapter,
  isJsonLogsEnabled,
  resolveLogLevel,
  resolveRequestId,
  serializeRequest,
} from './pino-config';

class SampleDto {
  @IsString()
  name!: string;
}

@Controller('api/logging-test')
class LoggingTestController {
  private readonly logger = new Logger(LoggingTestController.name);

  @Get('ok')
  @UseGuards(BffJwtGuard)
  ok() {
    this.logger.log('inside controller');
    return { ok: true };
  }

  @Post('validate')
  @UseGuards(BffJwtGuard)
  validate(@Body() body: SampleDto) {
    return body;
  }

  @Get('boom')
  boom() {
    throw new Error('unexpected failure');
  }

  @Get('invalid-uuid')
  invalidUuid() {
    throw Object.assign(
      new Error('invalid input syntax for type uuid: "bad-input-value-xyz"'),
      {
        name: 'PrismaClientKnownRequestError',
        code: 'P2007',
        clientVersion: '7.8.0',
        meta: {
          modelName: 'documents',
          driverAdapterError: {
            name: 'DriverAdapterError',
            cause: {
              originalCode: '22P02',
              originalMessage:
                'invalid input syntax for type uuid: "bad-input-value-xyz"',
              kind: 'InvalidInputValue',
              message:
                'invalid input syntax for type uuid: "bad-input-value-xyz"',
            },
          },
        },
      },
    );
  }

  @Get('invalid-byte')
  invalidByte() {
    throw Object.assign(
      new Error('invalid byte sequence for encoding "UTF8": 0x00'),
      {
        name: 'DriverAdapterError',
        clientVersion: '7.8.0',
        cause: {
          originalCode: '22021',
          originalMessage: 'invalid byte sequence for encoding "UTF8": 0x00',
          kind: 'postgres',
          code: '22021',
          severity: 'ERROR',
          message: 'invalid byte sequence for encoding "UTF8": 0x00',
        },
      },
    );
  }
}

function createCaptureStream() {
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
    rawText() {
      return chunks.join('');
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

describe('Logging config & HTTP integration', () => {
  describe('resolveLogLevel & isJsonLogsEnabled & resolveRequestId', () => {
    it('maps Python-style log levels case-insensitively and falls back to info', () => {
      expect(resolveLogLevel('DEBUG')).toBe('debug');
      expect(resolveLogLevel('debug')).toBe('debug');
      expect(resolveLogLevel('INFO')).toBe('info');
      expect(resolveLogLevel(' Warning ')).toBe('warn');
      expect(resolveLogLevel('ERROR')).toBe('error');
      expect(resolveLogLevel('CRITICAL')).toBe('fatal');
      expect(resolveLogLevel(undefined)).toBe('info');
      expect(resolveLogLevel('')).toBe('info');
      expect(resolveLogLevel('UNKNOWN')).toBe('info');
      expect(resolveLogLevel('warn')).toBe('info');
    });

    it('enables JSON logs only when APP__JSON_LOGS=true', () => {
      expect(isJsonLogsEnabled('true')).toBe(true);
      expect(isJsonLogsEnabled('TRUE')).toBe(true);
      expect(isJsonLogsEnabled('false')).toBe(false);
      expect(isJsonLogsEnabled(undefined)).toBe(false);

      const jsonOpts = buildPinoOptions({
        APP__LOG_LEVEL: 'WARNING',
        APP__JSON_LOGS: 'true',
      });
      expect(jsonOpts.level).toBe('warn');
      expect(jsonOpts.transport).toBeUndefined();

      const prettyOpts = buildPinoOptions({
        APP__LOG_LEVEL: 'DEBUG',
        APP__JSON_LOGS: 'false',
      });
      expect(prettyOpts.level).toBe('debug');
      expect(prettyOpts.transport).toBeDefined();
      expect((prettyOpts.transport as { target: string }).target).toContain(
        'pino-pretty',
      );
    });

    it('accepts valid x-request-id and replaces invalid values with UUID', () => {
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(resolveRequestId('req_1234-ABCD')).toBe('req_1234-ABCD');
      expect(resolveRequestId(['first_valid_id', 'second'])).toBe(
        'first_valid_id',
      );
      expect(resolveRequestId('short')).toMatch(uuidRe);
      expect(resolveRequestId('bad space id!!')).toMatch(uuidRe);
      expect(resolveRequestId('a'.repeat(65))).toMatch(uuidRe);
      expect(resolveRequestId(undefined)).toMatch(uuidRe);
    });
  });

  describe('structlog JSON format & secret redaction', () => {
    it('emits structlog-compatible keys without pid/hostname', () => {
      const capture = createCaptureStream();
      const logger = pino(
        buildPinoOptions({ APP__LOG_LEVEL: 'DEBUG', APP__JSON_LOGS: 'true' }),
        capture.stream,
      );

      logger.debug({ logger: 'Ctx' }, 'debug event');
      logger.info({ logger: 'Ctx' }, 'info event');
      logger.warn({ logger: 'Ctx' }, 'warn event');
      logger.error({ logger: 'Ctx' }, 'error event');
      logger.fatal({ logger: 'Ctx' }, 'fatal event');

      const lines = capture.parseLines();
      expect(lines.map((l) => l.level)).toEqual([
        'debug',
        'info',
        'warning',
        'error',
        'critical',
      ]);
      for (const line of lines) {
        expect(line.service).toBe('core-api');
        expect(line.pid).toBeUndefined();
        expect(line.hostname).toBeUndefined();
        expect(typeof line.event).toBe('string');
        expect(typeof line.timestamp).toBe('string');
        expect(new Date(line.timestamp as string).toISOString()).toBe(
          line.timestamp,
        );
      }
    });

    it('never leaks authorization header, cookie, or request body', () => {
      const fakeReq = {
        method: 'POST',
        url: '/api/courses',
        headers: {
          authorization: 'Bearer abc.def.ghi',
          cookie: 'sid=secret-cookie',
        },
        body: { sensitive: 'secret-body' },
      };

      expect(serializeRequest(fakeReq)).toEqual({
        method: 'POST',
        url: '/api/courses',
      });

      const capture = createCaptureStream();
      const logger = pino(
        buildPinoOptions({ APP__LOG_LEVEL: 'INFO', APP__JSON_LOGS: 'true' }),
        capture.stream,
      );

      logger.info({ req: fakeReq }, 'request payload test');
      logger.info(
        {
          headers: {
            authorization: 'Bearer abc.def.ghi',
            cookie: 'sid=secret-cookie',
          },
        },
        'headers test',
      );

      const output = capture.rawText();
      expect(output).not.toContain('abc.def.ghi');
      expect(output).not.toContain('secret-cookie');
      expect(output).not.toContain('secret-body');
      expect(output).not.toContain('authorization');
      expect(output).not.toContain('cookie');
    });
  });

  describe('Fastify + nestjs-pino integration', () => {
    let app: NestFastifyApplication;
    const capture = createCaptureStream();

    const claimsWithCourse: BffClaims = {
      sub: 'user-42',
      courseId: 'course-99',
      roles: ['instructor'],
      scope: 'course',
      jti: 'jti-1',
      iat: 1_700_000_000,
      exp: 1_800_000_000,
    };

    const claimsWithoutCourse: BffClaims = {
      sub: 'admin-1',
      roles: ['administrator'],
      scope: 'admin',
      jti: 'jti-2',
      iat: 1_700_000_000,
      exp: 1_800_000_000,
    };

    const mockJwtService = {
      verify: jest.fn(async (token: string) => {
        if (token === 'course-token') return claimsWithCourse;
        if (token === 'admin-token') return claimsWithoutCourse;
        throw new UnauthorizedException('Invalid token');
      }),
    };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          LoggerModule.forRoot(
            buildLoggerModuleParams(
              { APP__LOG_LEVEL: 'DEBUG', APP__JSON_LOGS: 'true' },
              capture.stream,
            ),
          ),
        ],
        controllers: [LoggingTestController],
        providers: [
          BffJwtGuard,
          { provide: BffJwtService, useValue: mockJwtService },
        ],
      }).compile();

      app = moduleRef.createNestApplication<NestFastifyApplication>(
        createFastifyAdapter(),
        { bufferLogs: true },
      );
      app.useLogger(app.get(PinoNestLogger));
      app.useGlobalFilters(
        new HttpExceptionLoggingFilter(app.getHttpAdapter()),
      );
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
      Logger.overrideLogger(new ConsoleLogger());
      await app.close();
    });

    beforeEach(() => {
      capture.clear();
    });

    it('logs request_id, user_id, course_id without roles or authorization token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/logging-test/ok',
        headers: {
          authorization: 'Bearer course-token',
          'x-request-id': 'req-valid-123456',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-request-id']).toBe('req-valid-123456');

      const lines = capture.parseLines();
      const ctrlLog = lines.find(
        (l) =>
          l.logger === 'LoggingTestController' &&
          l.event === 'inside controller',
      );
      expect(ctrlLog).toBeDefined();
      expect(ctrlLog?.request_id).toBe('req-valid-123456');
      expect(ctrlLog?.user_id).toBe('user-42');
      expect(ctrlLog?.course_id).toBe('course-99');
      expect(ctrlLog?.roles).toBeUndefined();

      const accessLog = lines.find((l) => l.event === 'request completed');
      expect(accessLog).toBeDefined();
      expect(accessLog?.logger).toBe('HttpAccess');
      expect(accessLog?.level).toBe('info');
      expect(accessLog?.request_id).toBe('req-valid-123456');
      expect(accessLog?.method).toBe('GET');
      expect(accessLog?.url).toBe('/api/logging-test/ok');
      expect(accessLog?.status).toBe(200);
      expect(typeof accessLog?.duration_ms).toBe('number');
      expect(accessLog?.user_id).toBe('user-42');
      expect(accessLog?.course_id).toBe('course-99');
      expect(accessLog?.roles).toBeUndefined();

      expect(capture.rawText()).not.toContain('course-token');
      expect(capture.rawText()).not.toContain('instructor');
    });

    it('omits course_id when claim does not contain courseId and generates UUID for invalid x-request-id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/logging-test/ok',
        headers: {
          authorization: 'Bearer admin-token',
          'x-request-id': 'bad!',
        },
      });

      expect(res.statusCode).toBe(200);
      const reqId = res.headers['x-request-id'] as string;
      expect(reqId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      const accessLog = capture
        .parseLines()
        .find((l) => l.event === 'request completed');
      expect(accessLog?.logger).toBe('HttpAccess');
      expect(accessLog?.request_id).toBe(reqId);
      expect(accessLog?.user_id).toBe('admin-1');
      expect(accessLog?.course_id).toBeUndefined();
      expect(accessLog?.roles).toBeUndefined();
    });

    it('logs 401 and 400 validation errors at warning level with status, message, and request_id', async () => {
      const unauth = await app.inject({
        method: 'GET',
        url: '/api/logging-test/ok',
      });
      expect(unauth.statusCode).toBe(401);
      const unauthReqId = unauth.headers['x-request-id'] as string;
      expect(unauthReqId).toBeTruthy();

      const lines401 = capture.parseLines();
      const warn401 = lines401.find(
        (l) =>
          l.level === 'warning' && l.status === 401 && l.message !== undefined,
      );
      expect(warn401).toBeDefined();
      expect(warn401?.request_id).toBe(unauthReqId);
      expect(warn401?.message).toBe('Missing or invalid Authorization header');

      const access401 = lines401.find((l) => l.event === 'request completed');
      expect(access401?.logger).toBe('HttpAccess');
      expect(access401?.level).toBe('warning');
      expect(access401?.status).toBe(401);
      expect(access401?.request_id).toBe(unauthReqId);

      capture.clear();

      const badBody = await app.inject({
        method: 'POST',
        url: '/api/logging-test/validate',
        headers: { authorization: 'Bearer course-token' },
        payload: {},
      });
      expect(badBody.statusCode).toBe(400);

      const lines400 = capture.parseLines();
      const warn400 = lines400.find(
        (l) =>
          l.level === 'warning' && l.status === 400 && Array.isArray(l.message),
      );
      expect(warn400).toBeDefined();
      expect(warn400?.user_id).toBe('user-42');
      expect((warn400?.message as string[]).length).toBeGreaterThan(0);

      const access400 = lines400.find((l) => l.event === 'request completed');
      expect(access400?.logger).toBe('HttpAccess');
      expect(access400?.level).toBe('warning');
      expect(access400?.status).toBe(400);
    });

    it('logs uncaught 5xx with stack and request_id at error level', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/logging-test/boom',
        headers: { 'x-request-id': 'boom-req-0001' },
      });
      expect(res.statusCode).toBe(500);
      expect(res.headers['x-request-id']).toBe('boom-req-0001');

      const lines = capture.parseLines();
      const errLog = lines.find(
        (l) => l.logger === 'ExceptionsHandler' && l.level === 'error',
      );
      expect(errLog).toBeDefined();
      expect(errLog?.request_id).toBe('boom-req-0001');
      expect((errLog?.err as { stack?: string })?.stack).toContain(
        'unexpected failure',
      );

      const accessLog = lines.find((l) => l.event === 'request errored');
      expect(accessLog).toBeDefined();
      expect(accessLog?.logger).toBe('HttpAccess');
      expect(accessLog?.level).toBe('error');
      expect(accessLog?.status).toBe(500);
      expect(accessLog?.request_id).toBe('boom-req-0001');
    });

    it('maps Prisma 22P02 input error to 400 warning without leaking invalid value', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/logging-test/invalid-uuid',
        headers: { 'x-request-id': 'bad-uuid-req-0001' },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toEqual({
        statusCode: 400,
        message: 'Tham số không hợp lệ.',
        error: 'Bad Request',
      });

      const lines = capture.parseLines();
      expect(
        lines.filter((l) => l.logger === 'ExceptionsHandler'),
      ).toHaveLength(0);

      const warnings = lines.filter(
        (l) =>
          l.logger === 'HttpExceptionLoggingFilter' && l.level === 'warning',
      );
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        status: 400,
        db_code: '22P02',
        model: 'documents',
        request_id: 'bad-uuid-req-0001',
        message: 'Tham số không hợp lệ.',
      });

      expect(capture.rawText()).not.toContain('bad-input-value-xyz');
    });

    it('maps bare DriverAdapterError 22021 to 400 warning without leaking postgres message', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/logging-test/invalid-byte',
        headers: { 'x-request-id': 'bad-byte-req-0001' },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).toEqual({
        statusCode: 400,
        message: 'Tham số không hợp lệ.',
        error: 'Bad Request',
      });

      const lines = capture.parseLines();
      expect(
        lines.filter((l) => l.logger === 'ExceptionsHandler'),
      ).toHaveLength(0);

      const warnings = lines.filter(
        (l) =>
          l.logger === 'HttpExceptionLoggingFilter' && l.level === 'warning',
      );
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        status: 400,
        db_code: '22021',
        request_id: 'bad-byte-req-0001',
        message: 'Tham số không hợp lệ.',
      });
      expect(warnings[0]?.model).toBeUndefined();
      expect(capture.rawText()).not.toContain('0x00');
    });

    it('skips access logs for GET /metrics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/metrics',
      });
      expect(res.statusCode).toBe(404);
      expect(capture.parseLines()).toEqual([]);
    });
  });
});
