import { Inject, Injectable, Logger } from '@nestjs/common';
import { errorMessage } from '../common/utils/errors';
import { withoutTrailingSlash } from '../common/utils/url';
import { AGS_CONFIG, AGS_SCORE_SCOPE, type AgsConfig } from '../config/ags.config';
import { AgsTokenService } from '../integrations/lti-platform/ags-token.service';

const SCORE_CONTENT_TYPE = 'application/vnd.ims.lis.v1.score+json';
/** Phần mở rộng của Canvas: loại bài nộp mà SpeedGrader hiện cho giảng viên. */
const CANVAS_SUBMISSION_EXTENSION = 'https://canvas.instructure.com/lti/submission';

export interface AgsScorePayload {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  timestamp: string;
  comment?: string;
  /**
   * Bài làm để SpeedGrader mở lại. Canvas ghi nó thành bài nộp `basic_lti_launch`
   * và launch DA vào đúng `url` khi giảng viên chấm. `submittedAt` phải ổn định
   * giữa các lần đẩy cùng một bài: Canvas chỉ tăng số lần nộp khi nó đổi.
   */
  submission?: { url: string; submittedAt: string };
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
    url.pathname = `${withoutTrailingSlash(url.pathname)}/scores`;
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
      let result = await this.send(url, payload);
      if (!result.ok && result.status === 401) {
        // 401 thường là token hết hạn sớm hơn dự kiến: bỏ cache rồi thử lại một lần.
        this.tokenService.invalidate(AGS_SCORE_SCOPE);
        result = await this.send(url, payload);
      }
      if (!result.ok && payload.submission && attemptsExhausted(result)) {
        // Canvas đếm mỗi lần nộp mới vào số lần làm của Assignment. Hết lượt thì
        // vẫn ghi điểm, chỉ không tạo thêm bài nộp.
        result = await this.send(url, payload, { newSubmission: false });
      }
      return result;
    } catch (err: unknown) {
      // Lỗi mạng / timeout / không lấy được token — luôn coi là tạm thời.
      return { ok: false, retryable: true, error: errorMessage(err) };
    }
  }

  private async send(
    url: string,
    payload: AgsScorePayload,
    options: { newSubmission?: boolean } = {},
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
        ...(payload.submission
          ? {
              submission: { submittedAt: payload.submission.submittedAt },
              [CANVAS_SUBMISSION_EXTENSION]: {
                submission_type: 'basic_lti_launch',
                submission_data: payload.submission.url,
                submitted_at: payload.submission.submittedAt,
                ...(options.newSubmission === false
                  ? { new_submission: false }
                  : {}),
              },
            }
          : {}),
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

function attemptsExhausted(result: { ok: false; status: number; error: string }) {
  return (
    result.status === 422 &&
    /maximum number of allowed attempts/i.test(result.error)
  );
}

function isRetryableStatus(status: number): boolean {
  // 401 xử lý riêng ở postScore (refresh token). 408/429/5xx là tạm thời.
  // 400/403/404/422 nghĩa là line item hoặc payload sai — thử lại vô nghĩa
  // (trừ 422 "unpublished", xử lý riêng ở send).
  return status === 401 || status === 408 || status === 429 || status >= 500;
}
