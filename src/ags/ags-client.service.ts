import { Inject, Injectable, Logger } from '@nestjs/common';
import { AGS_CONFIG, AGS_SCORE_SCOPE, type AgsConfig } from './ags.config';
import { AgsTokenService } from './ags-token.service';

const SCORE_CONTENT_TYPE = 'application/vnd.ims.lis.v1.score+json';

export interface AgsScorePayload {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  timestamp: string;
  comment?: string;
}

export type AgsPostResult =
  | { ok: true }
  /**
   * `retryable: true` — lỗi tạm (mạng, 5xx, 429, token hết hạn): giữ nguyên
   * PENDING để poller thử lại. `false` — lỗi vĩnh viễn (line item bị xoá,
   * payload sai): đánh FAILED, thử lại cũng vô ích.
   */
  | {
      ok: false;
      retryable: boolean;
      error: string;
      /**
       * Canvas từ chối điểm vì bài tập chưa publish. Không phải lỗi: điểm chờ
       * tới khi giảng viên publish rồi mới vào sổ.
       */
      waitingForPublish?: boolean;
    };

/**
 * Đẩy một điểm số lên line item của platform theo LTI-AGS 1.0.
 *
 * Score service ghi đè theo (userId, timestamp) — nộp lại bài sẽ ghi đè điểm
 * cũ, đúng hành vi AGS mong đợi, không cần xoá gì trước.
 */
@Injectable()
export class AgsClientService {
  private readonly logger = new Logger(AgsClientService.name);

  constructor(
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
    private readonly tokenService: AgsTokenService,
  ) {}

  /**
   * Line item URL của Canvas mang sẵn query string (vd `?type=inline`), nên
   * phải chèn `/scores` vào pathname chứ không nối chuỗi vào cuối URL.
   */
  static scoresUrl(lineItemUrl: string): string {
    const url = new URL(lineItemUrl);
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/scores`;
    return url.toString();
  }

  async postScore(
    lineItemUrl: string,
    payload: AgsScorePayload,
  ): Promise<AgsPostResult> {
    let url: string;
    try {
      url = AgsClientService.scoresUrl(lineItemUrl);
    } catch {
      return {
        ok: false,
        retryable: false,
        error: `lms_line_item_url không hợp lệ: ${lineItemUrl}`,
      };
    }

    try {
      const result = await this.send(url, payload);
      if (result.ok || result.status !== 401) {
        return result;
      }

      // 401 thường là token hết hạn sớm hơn dự kiến: bỏ cache rồi thử lại một lần.
      this.tokenService.invalidate(AGS_SCORE_SCOPE);
      return await this.send(url, payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Lỗi mạng / timeout / không lấy được token — luôn coi là tạm thời.
      return { ok: false, retryable: true, error: message };
    }
  }

  private async send(
    url: string,
    payload: AgsScorePayload,
  ): Promise<{ ok: true } | (AgsPostResult & { ok: false; status: number })> {
    const token = await this.tokenService.getAccessToken(AGS_SCORE_SCOPE);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': SCORE_CONTENT_TYPE,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        scoreGiven: payload.scoreGiven,
        scoreMaximum: payload.scoreMaximum,
        timestamp: payload.timestamp,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        ...(payload.comment ? { comment: payload.comment } : {}),
      }),
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });

    if (response.ok) {
      return { ok: true };
    }

    const body = await response.text().catch(() => '');
    const error = `HTTP ${response.status} từ score service: ${body.slice(0, 500)}`;

    // Canvas chặn điểm của bài tập unpublished (Lti::IMS::ScoresController
    // #verify_assignment_published), mà bài tập tạo qua Deep Linking luôn
    // unpublished lúc đầu. Giảng viên publish xong thì cùng điểm đó sẽ được nhận.
    if (response.status === 422 && /unpublished/i.test(body)) {
      return {
        ok: false,
        status: response.status,
        retryable: true,
        waitingForPublish: true,
        error,
      };
    }

    return {
      ok: false,
      status: response.status,
      retryable: isRetryableStatus(response.status),
      error,
    };
  }
}

function isRetryableStatus(status: number): boolean {
  // 401 xử lý riêng ở postScore (refresh token). 408/429/5xx là tạm thời.
  // 400/403/404/422 nghĩa là line item hoặc payload sai — thử lại vô nghĩa
  // (trừ 422 "unpublished", xử lý riêng ở send).
  return status === 401 || status === 408 || status === 429 || status >= 500;
}
