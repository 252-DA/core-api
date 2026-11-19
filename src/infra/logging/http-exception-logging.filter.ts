import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  detectInvalidInputSqlState,
  getPrismaErrorModel,
} from '../prisma/invalid-input-error';

interface RequestLike {
  method?: string;
  url?: string;
  originalUrl?: string;
}

/**
 * Ghi log mức warning cho mọi HttpException 4xx (Nest mặc định bỏ qua không log).
 * Bỏ qua 404 từ GET /metrics để tránh nhiễu log khi Prometheus scrape định kỳ.
 * Chuyển lỗi DB do giá trị đầu vào sai định dạng (22P02, 22021) sang 400.
 * Các lỗi ngoài HttpException còn lại vẫn rơi về BaseExceptionFilter để ghi stack 5xx.
 */
@Catch()
export class HttpExceptionLoggingFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggingFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const dbCode = detectInvalidInputSqlState(exception);
    const model = dbCode ? getPrismaErrorModel(exception) : undefined;
    const target = dbCode
      ? new BadRequestException('Tham số không hợp lệ.')
      : exception;

    if (!(target instanceof HttpException)) {
      super.catch(target, host);
      return;
    }

    const status = target.getStatus();

    if (status >= 400 && status < 500) {
      const req = host.switchToHttp().getRequest<RequestLike>();
      const method = (req?.method ?? '').toUpperCase();
      const rawUrl = req?.originalUrl || req?.url || '';
      const pathname = rawUrl.split('?')[0];

      if (!(status === 404 && method === 'GET' && pathname === '/metrics')) {
        const response = target.getResponse();
        const message =
          typeof response === 'object' &&
          response !== null &&
          'message' in response
            ? (response as { message: unknown }).message
            : response;

        this.logger.warn(
          {
            status,
            message,
            ...(dbCode ? { db_code: dbCode } : {}),
            ...(model ? { model } : {}),
          },
          'HTTP client error',
        );
      }
    } else if (status >= 500) {
      this.logger.error(target);
    }

    super.catch(target, host);
  }
}
