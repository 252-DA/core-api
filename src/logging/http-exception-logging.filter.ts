import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

interface RequestLike {
  method?: string;
  url?: string;
  originalUrl?: string;
}

/**
 * Ghi log mức warning cho mọi HttpException 4xx (Nest mặc định bỏ qua không log).
 * Bỏ qua 404 từ GET /metrics để tránh nhiễu log khi Prometheus scrape định kỳ.
 * Các lỗi ngoài HttpException vẫn rơi về BaseExceptionFilter để ghi stack 5xx.
 */
@Catch(HttpException)
export class HttpExceptionLoggingFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggingFilter.name);

  override catch(exception: HttpException, host: ArgumentsHost): void {
    const status = exception.getStatus();

    if (status >= 400 && status < 500) {
      const req = host.switchToHttp().getRequest<RequestLike>();
      const method = (req?.method ?? '').toUpperCase();
      const rawUrl = req?.originalUrl || req?.url || '';
      const pathname = rawUrl.split('?')[0];

      if (!(status === 404 && method === 'GET' && pathname === '/metrics')) {
        const response = exception.getResponse();
        const message =
          typeof response === 'object' &&
          response !== null &&
          'message' in response
            ? (response as { message: unknown }).message
            : response;

        this.logger.warn({ status, message }, 'HTTP client error');
      }
    } else if (status >= 500) {
      this.logger.error(exception);
    }

    super.catch(exception, host);
  }
}
