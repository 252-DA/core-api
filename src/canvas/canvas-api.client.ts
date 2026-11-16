import {
  BadGatewayException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CanvasApiError, describeCanvasError } from './canvas-errors';

export type CanvasFile = {
  id: number | string;
  display_name: string;
  filename?: string;
  'content-type'?: string;
  size?: number;
  url?: string;
  updated_at?: string;
};

export type CanvasCourse = {
  id: number;
  name: string;
  course_code?: string;
  syllabus_body?: string | null;
};

export type CanvasModuleItem = {
  id: number;
  title: string;
  /** File | Page | ExternalUrl | Assignment | Quiz | SubHeader | ... */
  type: string;
  content_id?: number;
  published?: boolean;
};

export type CanvasModule = {
  id: number;
  name: string;
  position: number;
  published?: boolean;
  items_count?: number;
  items?: CanvasModuleItem[];
};

const REQUEST_TIMEOUT_MS = 60_000;
// Giáo trình tham khảo có thể nặng; vẫn giới hạn để không nạp cả video vào RAM.
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const TOKEN_CHECK_TIMEOUT_MS = 15_000;
// Ghi lên Canvas nằm trên đường launch LTI nên không được chờ lâu như đọc file.
const WRITE_TIMEOUT_MS = 5_000;

/** Tùy chọn của request ghi; bỏ trống thì là GET như trước. */
type CanvasFetchInit = {
  method?: 'PUT';
  body?: string;
  timeoutMs?: number;
  redirect?: RequestRedirect;
  /** false: không đưa nội dung phản hồi lỗi vào thông báo. */
  detail?: boolean;
};

/** Kết quả kiểm tra token Canvas; lưu nguyên dạng JSON ở Redis (canvas:token-status). */
export type CanvasTokenCheck = {
  checked_at: string;
  ok: boolean;
  http_status: number | null;
  message: string;
};

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/**
 * Link Canvas trả về (phân trang, đường dẫn file) mang tên miền công khai khi
 * Canvas được gọi qua tunnel. Khi CANVAS_API_URL trỏ vào địa chỉ nội bộ thì đổi
 * origin của link công khai về địa chỉ nội bộ, để request không đi vòng ra
 * Cloudflare rồi quay lại. Chỉ đổi link thuộc LTI_PLATFORM_URL/CANVAS_PUBLIC_URL;
 * link tới nơi khác giữ nguyên, để token không gửi sang host lạ.
 *
 * So khớp theo host (bỏ qua http/https) vì Canvas dựng link chuyển hướng bằng
 * scheme của request nội bộ (http) dù tên miền công khai là https.
 */
export function toInternalCanvasUrl(url: string, env: NodeJS.ProcessEnv = process.env): string {
  const internal = originOf(env.CANVAS_API_URL);
  if (!internal) return url;
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return url;
  }
  if (target.origin === internal) return url;
  const publicHosts = [hostOf(env.LTI_PLATFORM_URL), hostOf(env.CANVAS_PUBLIC_URL)];
  if (!publicHosts.includes(target.host)) return url;
  return `${internal}${target.pathname}${target.search}`;
}

/**
 * Client REST API của Canvas.
 *
 * LTI 1.3 không có service đọc file khoá học, nên phải dùng REST API với
 * access token. Hiện là token của user dịch vụ "DA Platform Service" (account
 * admin, không phải site admin nên không hết hạn sau 1 tuần; xem
 * docs/canvas_lti_setup.md) — đủ cho môi trường dev; đưa vào dùng thật thì
 * chuyển sang OAuth2 theo từng giảng viên.
 */
@Injectable()
export class CanvasApiClient {
  private get baseUrl() {
    const url = process.env.CANVAS_API_URL || process.env.LTI_PLATFORM_URL;
    return url?.replace(/\/+$/, '');
  }

  private get token() {
    return process.env.CANVAS_API_TOKEN;
  }

  private config() {
    const baseUrl = this.baseUrl;
    const token = this.token;
    if (!baseUrl || !token) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình kết nối Canvas API (CANVAS_API_URL/LTI_PLATFORM_URL và CANVAS_API_TOKEN).',
      );
    }
    return { baseUrl, token };
  }

  /** Canvas cho tra khoá học theo LTI context id qua tiền tố `lti_context_id:`. */
  async getCourseByLtiContext(ltiContextId: string): Promise<CanvasCourse> {
    const id = encodeURIComponent(`lti_context_id:${ltiContextId}`);
    return this.getJson<CanvasCourse>(
      `/api/v1/courses/${id}?include[]=syllabus_body`,
      'khoá học',
    );
  }

  /**
   * Module của khoá học kèm các mục bên trong, theo thứ tự hiển thị. Canvas bỏ
   * `items` khi module có quá nhiều mục; khi đó đọc riêng từng module.
   */
  async listModules(ltiContextId: string): Promise<CanvasModule[]> {
    const course = encodeURIComponent(`lti_context_id:${ltiContextId}`);
    const modules = await this.getAllPages<CanvasModule>(
      `/api/v1/courses/${course}/modules?include[]=items&per_page=${PAGE_SIZE}`,
      'danh sách module',
    );
    for (const module of modules) {
      if (!module.items) {
        module.items = await this.getAllPages<CanvasModuleItem>(
          `/api/v1/courses/${course}/modules/${module.id}/items?per_page=${PAGE_SIZE}`,
          `mục trong module ${module.name}`,
        );
      }
    }
    return modules.sort((a, b) => a.position - b.position);
  }

  async getFile(fileId: string): Promise<CanvasFile> {
    return this.getJson<CanvasFile>(`/api/v1/files/${encodeURIComponent(fileId)}`, `file ${fileId}`);
  }

  /** Batch metadata lookup; module membership still decides what gets imported. */
  async listCourseFiles(ltiContextId: string): Promise<CanvasFile[]> {
    const course = encodeURIComponent(`lti_context_id:${ltiContextId}`);
    return this.getAllPages<CanvasFile>(
      `/api/v1/courses/${course}/files?per_page=${PAGE_SIZE}`,
      'danh sách file của khoá học',
    );
  }

  async downloadFile(file: CanvasFile): Promise<Buffer> {
    if (!file.url) {
      throw new BadGatewayException(`Canvas không trả link tải cho file ${file.display_name}.`);
    }
    if (file.size && file.size > MAX_FILE_BYTES) {
      throw new PayloadTooLargeException(
        `File ${file.display_name} vượt quá ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
      );
    }

    const { token } = this.config();
    // Không đổi origin ở đây: gọi qua địa chỉ nội bộ, Canvas chuyển hướng sang
    // tên miền công khai kèm sf_verifier và chỉ phục vụ nội dung file ở đó (gọi
    // lại bằng địa chỉ nội bộ sẽ bị chuyển hướng vòng). fetch tự bỏ header
    // Authorization khi chuyển sang origin khác; verifier đã đủ để tải.
    const response = await this.fetch(file.url, token, `tải file ${file.display_name}`, false);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FILE_BYTES) {
      throw new PayloadTooLargeException(
        `File ${file.display_name} vượt quá ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
      );
    }
    return buffer;
  }

  private async getJson<T>(path: string, what: string): Promise<T> {
    const { baseUrl, token } = this.config();
    const response = await this.fetch(`${baseUrl}${path}`, token, `đọc ${what}`);
    return (await response.json()) as T;
  }

  /** Canvas phân trang qua header Link (rel="next"). */
  private async getAllPages<T>(path: string, what: string): Promise<T[]> {
    const { baseUrl, token } = this.config();
    const results: T[] = [];
    let url: string | null = `${baseUrl}${path}`;
    for (let page = 0; url && page < MAX_PAGES; page += 1) {
      const response = await this.fetch(url, token, `đọc ${what}`);
      results.push(...((await response.json()) as T[]));
      url = nextPageUrl(response.headers.get('link'));
    }
    // Never treat a truncated module/file listing as a complete snapshot:
    // reconciliation could otherwise hide documents from the missing pages.
    if (url) throw new BadGatewayException(`Danh sách Canvas vượt giới hạn ${MAX_PAGES} trang khi đọc ${what}.`);
    return results;
  }

  /**
   * Kiểm tra token bằng GET /api/v1/users/self. Không ném lỗi: kết quả (kể cả
   * lỗi mạng, 401) trả về dạng dữ liệu để lưu và hiện cho giảng viên.
   */
  async checkToken(): Promise<CanvasTokenCheck> {
    const checked_at = new Date().toISOString();
    let baseUrl: string;
    let token: string;
    try {
      ({ baseUrl, token } = this.config());
    } catch (error: unknown) {
      return { checked_at, ok: false, http_status: null, message: (error as Error).message };
    }
    try {
      const response = await fetch(`${baseUrl}/api/v1/users/self`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        redirect: 'manual',
        signal: AbortSignal.timeout(TOKEN_CHECK_TIMEOUT_MS),
      });
      if (response.ok) {
        return { checked_at, ok: true, http_status: response.status, message: 'Token hợp lệ' };
      }
      const error = new CanvasApiError(
        `Canvas trả HTTP ${response.status} khi kiểm tra token`,
        response.status,
      );
      return { checked_at, ok: false, http_status: response.status, message: describeCanvasError(error) };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      const wrapped = new CanvasApiError(`Không kết nối được Canvas khi kiểm tra token: ${reason}`);
      return { checked_at, ok: false, http_status: null, message: describeCanvasError(wrapped) };
    }
  }

  /**
   * Đặt số lần làm của một Assignment (PUT /courses/:id/assignments/:id). Dùng
   * để đẩy giới hạn lần làm của DA sang Canvas vì Deep Linking không mang nó.
   * `course` là id số của khóa hoặc `lti_context_id:<id>`. Canvas phải trả đúng
   * `allowed_attempts` vừa đặt, không thì coi như chưa ghi được.
   */
  async setAssignmentAllowedAttempts(
    course: string,
    assignmentId: string,
    attempts: number,
  ): Promise<void> {
    if (!/^[1-9]\d{0,31}$/.test(assignmentId) || !Number.isInteger(attempts) || attempts < 1) {
      throw new Error('Tham số số lần làm của Assignment không hợp lệ.');
    }
    const { baseUrl, token } = this.config();
    const path =
      `/api/v1/courses/${encodeURIComponent(course)}/assignments/${assignmentId}`;
    // Không đọc nội dung phản hồi lỗi vào thông báo: log chỉ cần mã HTTP.
    const response = await this.fetch(
      `${baseUrl}${path}`,
      token,
      'đặt số lần làm của Assignment',
      true,
      {
        method: 'PUT',
        body: JSON.stringify({ assignment: { allowed_attempts: attempts } }),
        timeoutMs: WRITE_TIMEOUT_MS,
        redirect: 'manual',
        detail: false,
      },
    );
    let echoed: unknown;
    try {
      echoed = ((await response.json()) as { allowed_attempts?: unknown }).allowed_attempts;
    } catch {
      echoed = undefined;
    }
    if (echoed !== attempts) {
      throw new CanvasApiError(
        'Canvas không xác nhận số lần làm vừa đặt cho Assignment.',
        response.status,
      );
    }
  }

  private async fetch(
    url: string,
    token: string,
    action: string,
    internal = true,
    init: CanvasFetchInit = {},
  ) {
    let response: Response;
    try {
      response = await fetch(internal ? toInternalCanvasUrl(url) : url, {
        ...(init.method ? { method: init.method } : {}),
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(init.body !== undefined ? { body: init.body } : {}),
        redirect: init.redirect ?? 'follow',
        signal: AbortSignal.timeout(init.timeoutMs ?? REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new CanvasApiError(`Không kết nối được Canvas khi ${action}: ${reason}`);
    }
    if (!response.ok) {
      const detail =
        init.detail === false ? '' : (await response.text()).slice(0, 300);
      throw new CanvasApiError(
        `Canvas trả HTTP ${response.status} khi ${action}${detail ? `: ${detail}` : ''}`,
        response.status,
      );
    }
    return response;
  }
}

export function nextPageUrl(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(',')) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}
