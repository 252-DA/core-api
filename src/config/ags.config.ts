/**
 * Config cho AGS score writeback.
 *
 * LTI identity (client_id, key, token endpoint) vốn chỉ có ở `web` — nơi giữ
 * JWKS và verify id_token. AGS lại là backend-to-backend call cần DB
 * (`lti_line_items`, `quiz_attempts`), nên core-api dùng chung cùng bộ key và
 * cùng tên biến môi trường `LTI_*` với web. Xem docker-compose.yml.
 */

import { withoutTrailingSlash } from '../common/utils/url';
import { readEnv } from './env';

export const AGS_SCORE_SCOPE =
  'https://purl.imsglobal.org/spec/lti-ags/scope/score';

export interface AgsConfig {
  enabled: boolean;
  clientId: string;
  keyId: string;
  privateKeyPath: string;
  tokenUrl: string;
  pollIntervalMs: number;
  batchSize: number;
  requestTimeoutMs: number;
  maxRetries: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  /**
   * Canvas tạo bài tập Deep Linking ở trạng thái unpublished và từ chối điểm
   * (422) cho tới khi giảng viên publish. Chờ theo nhịp cố định, không tính
   * vào maxRetries — giảng viên có thể publish sau nhiều ngày.
   */
  unpublishedRetryMs: number;
  /**
   * Địa chỉ công khai của tool (web), để dựng URL trang xem bài làm gửi cho
   * SpeedGrader. Thiếu thì điểm vẫn đẩy được, chỉ không kèm bài nộp.
   */
  toolUrl?: string;
}

// Giữ riêng vì chỉ nhận số nguyên dương (> 0), khác readIntEnv.
function intEnv(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolvePlatformUrl(): string | undefined {
  const raw = readEnv('LTI_PLATFORM_URL');
  return raw ? withoutTrailingSlash(raw) : undefined;
}

/**
 * Phải khớp `defaultTokenUrl()` trong web/src/lib/lti.ts — thực tế
 * `LTI_TOKEN_URL` hay để trống và cả hai service cùng suy ra từ platform URL.
 * Lệch nhau ở đây thì AGS tắt âm thầm dù web launch vẫn chạy bình thường.
 */
export function resolveTokenUrl(): string {
  const explicit = readEnv('LTI_TOKEN_URL');
  if (explicit) {
    return withoutTrailingSlash(explicit);
  }

  const platformUrl = resolvePlatformUrl() || 'http://local.edly.io';
  switch (readEnv('LTI_LMS_TYPE')) {
    case 'moodle':
      return `${platformUrl}/mod/lti/token.php`;
    case 'canvas':
      return `${platformUrl}/login/oauth2/token`;
    default:
      return `${platformUrl}/oauth2/access_token`;
  }
}

/**
 * Origin công khai của tool: LTI_TOOL_URL, hoặc origin của LTI_REDIRECT_URI mà
 * web dùng cho launch. Canvas tìm tool của bài nộp theo tên miền của URL này.
 */
export function resolveToolUrl(): string | undefined {
  const raw = readEnv('LTI_TOOL_URL') || readEnv('LTI_REDIRECT_URI');
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return /^https?:$/.test(url.protocol) ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

export function loadAgsConfig(): AgsConfig {
  const clientId = readEnv('LTI_CLIENT_ID') || readEnv('LTI_KEY_ID') || '';
  const tokenUrl = resolveTokenUrl();
  const privateKeyPath = readEnv('LTI_PRIVATE_KEY_PATH') || '';

  // Bật mặc định khi có đủ danh tính tool để ký client assertion; AGS_ENABLED
  // chỉ là công tắc tắt tay. Bật mà chưa có platform thật cũng không sao:
  // poller chỉ gọi ra ngoài khi tồn tại attempt gắn line item, tức là đã có
  // một cú launch AGS thật sự.
  const explicit = readEnv('AGS_ENABLED')?.toLowerCase();
  const configured = Boolean(clientId && privateKeyPath);
  const enabled =
    explicit === 'false' ? false : explicit === 'true' || configured;

  return {
    enabled,
    clientId,
    keyId: readEnv('LTI_KEY_ID') || 'ai-nextjs-1',
    privateKeyPath,
    tokenUrl,
    pollIntervalMs: intEnv('AGS_POLL_INTERVAL_MS', 15000),
    batchSize: intEnv('AGS_BATCH_SIZE', 200),
    requestTimeoutMs: intEnv('AGS_REQUEST_TIMEOUT_MS', 10000),
    maxRetries: intEnv('AGS_MAX_RETRIES', 6),
    backoffBaseMs: intEnv('AGS_BACKOFF_BASE_MS', 30000),
    backoffMaxMs: intEnv('AGS_BACKOFF_MAX_MS', 900000),
    unpublishedRetryMs: intEnv('AGS_UNPUBLISHED_RETRY_MS', 120000),
    toolUrl: resolveToolUrl(),
  };
}

export const AGS_CONFIG = 'AGS_CONFIG';
