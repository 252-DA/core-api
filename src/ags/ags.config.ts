/**
 * Config cho AGS score writeback.
 *
 * LTI identity (client_id, key, token endpoint) vốn chỉ có ở `web` — nơi giữ
 * JWKS và verify id_token. AGS lại là backend-to-backend call cần DB
 * (`lti_line_items`, `quiz_attempts`), nên core-api dùng chung cùng bộ key và
 * cùng tên biến môi trường `LTI_*` với web. Xem docker-compose.yml.
 */

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
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function intEnv(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Phải khớp `defaultTokenUrl()` trong web/src/lib/lti.ts — thực tế
 * `LTI_TOKEN_URL` hay để trống và cả hai service cùng suy ra từ platform URL.
 * Lệch nhau ở đây thì AGS tắt âm thầm dù web launch vẫn chạy bình thường.
 */
export function resolveTokenUrl(): string {
  const explicit = env('LTI_TOKEN_URL');
  if (explicit) {
    return withoutTrailingSlash(explicit);
  }

  const platformUrl = withoutTrailingSlash(
    env('LTI_PLATFORM_URL') || 'http://local.edly.io',
  );
  switch (env('LTI_LMS_TYPE')) {
    case 'moodle':
      return `${platformUrl}/mod/lti/token.php`;
    case 'canvas':
      return `${platformUrl}/login/oauth2/token`;
    default:
      return `${platformUrl}/oauth2/access_token`;
  }
}

export function loadAgsConfig(): AgsConfig {
  const clientId = env('LTI_CLIENT_ID') || env('LTI_KEY_ID') || '';
  const tokenUrl = resolveTokenUrl();
  const privateKeyPath = env('LTI_PRIVATE_KEY_PATH') || '';

  // Bật mặc định khi có đủ danh tính tool để ký client assertion; AGS_ENABLED
  // chỉ là công tắc tắt tay. Bật mà chưa có platform thật cũng không sao:
  // poller chỉ gọi ra ngoài khi tồn tại attempt gắn line item, tức là đã có
  // một cú launch AGS thật sự.
  const explicit = env('AGS_ENABLED')?.toLowerCase();
  const configured = Boolean(clientId && privateKeyPath);
  const enabled =
    explicit === 'false' ? false : explicit === 'true' || configured;

  return {
    enabled,
    clientId,
    keyId: env('LTI_KEY_ID') || 'ai-nextjs-1',
    privateKeyPath,
    tokenUrl,
    pollIntervalMs: intEnv('AGS_POLL_INTERVAL_MS', 15000),
    batchSize: intEnv('AGS_BATCH_SIZE', 200),
    requestTimeoutMs: intEnv('AGS_REQUEST_TIMEOUT_MS', 10000),
    maxRetries: intEnv('AGS_MAX_RETRIES', 6),
    backoffBaseMs: intEnv('AGS_BACKOFF_BASE_MS', 30000),
    backoffMaxMs: intEnv('AGS_BACKOFF_MAX_MS', 900000),
    unpublishedRetryMs: intEnv('AGS_UNPUBLISHED_RETRY_MS', 120000),
  };
}

export const AGS_CONFIG = 'AGS_CONFIG';
