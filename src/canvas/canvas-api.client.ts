import {
  BadGatewayException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { CanvasFile } from '../curriculum/syllabus-file';

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

/**
 * Client REST API của Canvas.
 *
 * LTI 1.3 không có service đọc file khoá học, nên phải dùng REST API với
 * access token. Hiện là token của admin Canvas (CANVAS_API_TOKEN) — đủ cho
 * môi trường dev; đưa vào dùng thật thì chuyển sang OAuth2 theo từng giảng viên.
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
    // Link tải của Canvas chuyển hướng sang object storage; fetch tự bỏ header
    // Authorization khi chuyển sang origin khác.
    const response = await this.fetch(file.url, token, `tải file ${file.display_name}`);
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

  private async fetch(url: string, token: string, action: string) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(`Không kết nối được Canvas khi ${action}: ${reason}`);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new BadGatewayException(
        `Canvas trả HTTP ${response.status} khi ${action}${detail ? `: ${detail}` : ''}`,
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
