import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger as PinoNestLogger, type Params, PinoLogger } from 'nestjs-pino';
import pino, { type DestinationStream, type LoggerOptions } from 'pino';
import { loadLoggingConfig } from '../config/logging.config';

export const REQUEST_ID_HEADER = 'x-request-id';
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export type PinoLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const PYTHON_LEVEL_TO_PINO: Record<string, PinoLogLevel> = {
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  critical: 'fatal',
};

const PINO_LABEL_TO_STRUCTLOG: Record<string, string> = {
  warn: 'warning',
  fatal: 'critical',
};

type RequestLike = {
  method?: string;
  url?: string;
  originalUrl?: string;
};

type ResponseLike = {
  statusCode?: number;
};

/**
 * Quy đổi mức log kiểu Python (DEBUG, INFO, WARNING, ERROR, CRITICAL) sang mức của pino.
 * Giá trị lạ hoặc rỗng mặc định về "info".
 */
export function resolveLogLevel(raw?: string): PinoLogLevel {
  if (!raw) return 'info';
  const normalized = raw.trim().toLowerCase();
  return PYTHON_LEVEL_TO_PINO[normalized] ?? 'info';
}

/**
 * Kiểm tra cờ bật xuất log JSON một dòng (khớp APP__JSON_LOGS của các service Python).
 */
export function isJsonLogsEnabled(raw?: string): boolean {
  return (raw ?? '').trim().toLowerCase() === 'true';
}

/**
 * Lấy request id từ header x-request-id nếu hợp lệ, ngược lại tự sinh UUID.
 */
export function resolveRequestId(
  headerValue: string | string[] | undefined,
): string {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof candidate === 'string' && REQUEST_ID_PATTERN.test(candidate)) {
    return candidate;
  }
  return randomUUID();
}

export function getRequestUrl(req: RequestLike | undefined): string {
  return req?.originalUrl || req?.url || '';
}

/**
 * Chỉ giữ method và url trong log request; loại bỏ hoàn toàn headers và body.
 */
export function serializeRequest(req: RequestLike) {
  return {
    method: req?.method,
    url: getRequestUrl(req),
  };
}

export function serializeResponse(res: ResponseLike) {
  return {
    statusCode: res?.statusCode,
  };
}

/**
 * Dựng tùy chọn pino thuần từ env, không phụ thuộc trạng thái ngoài để dễ unit test.
 */
export function buildPinoOptions(
  env: NodeJS.ProcessEnv = loadLoggingConfig(),
): LoggerOptions {
  const jsonLogs = isJsonLogsEnabled(env.APP__JSON_LOGS);

  const options: LoggerOptions = {
    level: resolveLogLevel(env.APP__LOG_LEVEL),
    messageKey: 'event',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    base: { service: 'core-api' },
    formatters: {
      level(label: string) {
        return { level: PINO_LABEL_TO_STRUCTLOG[label] ?? label };
      },
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'headers.authorization',
        'headers.cookie',
        'authorization',
        'cookie',
      ],
      remove: true,
    },
    serializers: {
      req: serializeRequest,
      res: serializeResponse,
      err: pino.stdSerializers.err,
    },
  };

  if (!jsonLogs) {
    // Dùng require.resolve để pino tìm được pino-pretty bất kể layout node_modules của pnpm.
    options.transport = {
      target: require.resolve('pino-pretty'),
      options: {
        messageKey: 'event',
        timestampKey: 'timestamp',
        ignore: 'service,hostname,pid',
        useOnlyCustomProps: false,
        customLevels: 'warning:40,critical:60',
      },
    };
  }

  return options;
}

/**
 * Dựng cấu hình cho LoggerModule của nestjs-pino (access log, request_id, bỏ qua GET /metrics).
 */
export function buildLoggerModuleParams(
  env: NodeJS.ProcessEnv = loadLoggingConfig(),
  stream?: DestinationStream,
): Params {
  const pinoOptions = buildPinoOptions(env);
  const pinoHttpOptions = {
    ...pinoOptions,
    customAttributeKeys: {
      reqId: 'request_id',
      responseTime: 'duration_ms',
    },
    genReqId: (req: IncomingMessage) =>
      resolveRequestId(req.headers[REQUEST_ID_HEADER]),
    quietReqLogger: true,
    quietResLogger: true,
    customLogLevel: (
      _req: IncomingMessage,
      res: { statusCode: number },
      err?: Error,
    ) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessObject: (
      req: IncomingMessage,
      res: { statusCode: number },
      val: { duration_ms?: number },
    ) => ({
      logger: 'HttpAccess',
      method: req.method,
      url: getRequestUrl(req as RequestLike),
      status: res.statusCode,
      duration_ms: val.duration_ms,
    }),
    customErrorObject: (
      req: IncomingMessage,
      res: { statusCode: number },
      _error: Error,
      val: { duration_ms?: number },
    ) => ({
      logger: 'HttpAccess',
      method: req.method,
      url: getRequestUrl(req as RequestLike),
      status: res.statusCode,
      duration_ms: val.duration_ms,
    }),
    customErrorMessage: () => 'request errored',
    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const method = (req.method ?? '').toUpperCase();
        const pathname = getRequestUrl(req as RequestLike).split('?')[0];
        return method === 'GET' && pathname === '/metrics';
      },
    },
  };

  return {
    renameContext: 'logger',
    assignResponse: true,
    pinoHttp: stream ? [pinoHttpOptions, stream] : pinoHttpOptions,
  };
}

let sharedLoggerModuleParams: Params | undefined;

/**
 * Trả về cùng một object cấu hình LoggerModule cho toàn bộ vòng đời process.
 * nestjs-pino khởi tạo root logger duy nhất ở lần dựng PinoLogger đầu tiên và
 * bỏ qua tham số ở các lần sau, nên logger khởi động và LoggerModule phải dùng
 * chung một object tham số này.
 */
export function getSharedLoggerModuleParams(): Params {
  sharedLoggerModuleParams ??= buildLoggerModuleParams();
  return sharedLoggerModuleParams;
}

/**
 * Dựng LoggerService từ nestjs-pino trước khi NestFactory tạo DI container,
 * giúp các dòng khởi động và lỗi DI/constructor xuất đúng định dạng ngay từ đầu.
 */
export function createBootstrapLogger(
  params: Params = getSharedLoggerModuleParams(),
): PinoNestLogger {
  return new PinoNestLogger(new PinoLogger(params), params);
}

/**
 * Tạo FastifyAdapter thống nhất sinh/nhận x-request-id và gắn lại vào response header.
 */
export function createFastifyAdapter(): FastifyAdapter {
  const adapter = new FastifyAdapter({
    bodyLimit: 10 * 1024 * 1024,
    requestIdHeader: false,
    genReqId: (req: IncomingMessage) =>
      resolveRequestId(req.headers[REQUEST_ID_HEADER]),
  });

  adapter.getInstance().addHook('onRequest', (request, reply, done) => {
    reply.header(REQUEST_ID_HEADER, String(request.id));
    done();
  });

  return adapter;
}
