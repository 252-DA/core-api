import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { AGS_CONFIG, type AgsConfig } from '../ags/ags.config';
import { AgsTokenService } from '../ags/ags-token.service';
import {
  ASSET_SCOPE,
  PNS_SCOPE,
  REPORT_SCOPE,
  SUBMISSION_NOTICE,
} from './essay-grading';

/** File bài nộp lớn hơn mức này không tải: bài luận PDF/DOCX hiếm khi quá vài MB. */
export const MAX_ASSET_BYTES = 25 * 1024 * 1024;

export class LtiServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'LtiServiceError';
  }
}

/**
 * Gọi các dịch vụ LTI Advantage của Asset Processor bằng token
 * client_credentials của tool (cùng key với AGS):
 *   - Platform Notification Service: đăng ký địa chỉ nhận thông báo bài nộp
 *   - Asset Service: tải file sinh viên nộp
 *   - Asset Report Service: gửi báo cáo chấm về SpeedGrader
 *
 * Chỉ gọi tới địa chỉ thuộc LTI_PLATFORM_URL: token của tool không bao giờ
 * được gửi tới host khác, kể cả khi URL đến từ một thông báo đã ký.
 */
@Injectable()
export class LtiServicesClient {
  private readonly platform: URL | null;

  constructor(
    private readonly tokens: AgsTokenService,
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
  ) {
    try {
      const platform = new URL(process.env.LTI_PLATFORM_URL || '');
      this.platform = /^https?:$/.test(platform.protocol) ? platform : null;
    } catch {
      this.platform = null;
    }
  }

  isPlatformUrl(url: string) {
    return this.platformUrl(url) !== null;
  }

  private platformUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!this.platform || parsed.username || parsed.password) return null;
      // Canvas background PNS jobs may build HTTP URLs behind a TLS proxy.
      // Upgrade only the configured host on default ports, before sending a token.
      if (
        this.platform.protocol === 'https:' &&
        !this.platform.port &&
        parsed.protocol === 'http:' &&
        !parsed.port &&
        parsed.hostname === this.platform.hostname
      ) {
        parsed.protocol = 'https:';
      }
      return parsed.origin === this.platform.origin ? parsed.toString() : null;
    } catch {
      return null;
    }
  }

  async registerNoticeHandler(pnsUrl: string, handlerUrl: string) {
    await this.call(pnsUrl, PNS_SCOPE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notice_type: SUBMISSION_NOTICE,
        handler: handlerUrl,
      }),
    });
  }

  async downloadAsset(
    url: string,
  ): Promise<{ content: Buffer; contentType: string | null }> {
    const response = await this.call(url, ASSET_SCOPE, { method: 'GET' });
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > MAX_ASSET_BYTES) {
      throw new LtiServiceError(
        `File lớn hơn ${MAX_ASSET_BYTES / 1024 / 1024} MB`,
        413,
      );
    }
    const content = Buffer.from(await response.arrayBuffer());
    if (content.length > MAX_ASSET_BYTES) {
      throw new LtiServiceError(
        `File lớn hơn ${MAX_ASSET_BYTES / 1024 / 1024} MB`,
        413,
      );
    }
    return { content, contentType: response.headers.get('content-type') };
  }

  async postReport(reportUrl: string, report: Record<string, unknown>) {
    await this.call(reportUrl, REPORT_SCOPE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  }

  private async call(
    url: string,
    scope: string,
    init: RequestInit,
    retried = false,
  ): Promise<Response> {
    const platformUrl = this.platformUrl(url);
    if (!platformUrl) {
      throw new LtiServiceError(
        `Từ chối gọi ${url}: không thuộc LTI_PLATFORM_URL`,
        0,
      );
    }
    const token = await this.tokens.getAccessToken(scope);
    let response: Response;
    try {
      response = await fetch(platformUrl, {
        ...init,
        headers: {
          ...(init.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, */*',
        },
        // Canvas chuyển hướng file sang kho lưu trữ; fetch tự bỏ Authorization
        // khi chuyển sang origin khác.
        redirect: 'follow',
        signal: AbortSignal.timeout(
          Math.max(this.config.requestTimeoutMs, 60_000),
        ),
      });
    } catch (error: unknown) {
      throw new LtiServiceError(
        `Không kết nối được Canvas: ${error instanceof Error ? error.message : String(error)}`,
        0,
      );
    }
    if (response.status === 401 && !retried) {
      this.tokens.invalidate(scope);
      return this.call(url, scope, init, true);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new LtiServiceError(
        `Canvas trả HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
        response.status,
      );
    }
    return response;
  }
}

/** Lỗi gọi Canvas khi giảng viên đang đứng chờ: trả lời dễ hiểu thay vì 500. */
export function asGatewayError(error: unknown, action: string) {
  const message = error instanceof Error ? error.message : String(error);
  return new BadGatewayException(`Không ${action}: ${message}`);
}
