import { BadGatewayException, Inject, Injectable, Logger } from '@nestjs/common';
import { hostOf } from '../../common/utils/url';
import {
  AGS_CONFIG,
  resolvePlatformUrl,
  type AgsConfig,
} from '../../config/ags.config';
import { AgsTokenService, AgsTokenError } from '../../integrations/lti-platform/ags-token.service';

export const NRPS_SCOPE =
  'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly';
const NRPS_ACCEPT = 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json';
/** Mỗi trang tối đa 100 thành viên (Canvas tự cắt nếu giới hạn của nó thấp hơn). */
const PAGE_LIMIT = 100;
/** Chặn vòng lặp nếu Canvas trả Link next vô tận: 100 trang x 100 = 10.000 thành viên. */
const MAX_PAGES = 100;

/** Một thành viên trong NRPS, chỉ gồm các trường DA dùng. */
export interface NrpsMember {
  status?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  /** Định danh LTI của người dùng, chính là `sub` trong id_token khi launch. */
  user_id: string;
  roles: string[];
}

/** Lỗi khi đọc danh sách lớp từ Canvas; thông báo tiếng Việt để hiện cho giảng viên. */
export class NrpsError extends BadGatewayException {
  constructor(
    message: string,
    readonly nrpsStatus?: number,
  ) {
    super(message);
  }
}

export const NRPS_UNAUTHORIZED_MESSAGE =
  'Canvas từ chối đọc danh sách lớp (401). Kiểm tra tool đã có scope contextmembership.readonly và đã được cài lại.';
export const NRPS_UNREACHABLE_MESSAGE = 'Không kết nối được Canvas để đọc danh sách lớp';

/**
 * Names and Role Provisioning Service (NRPS) v2: đọc danh sách thành viên của
 * một khóa học Canvas bằng access token LTI Advantage (dùng lại AgsTokenService,
 * chỉ khác scope). Canvas phân trang bằng header `Link: <...>; rel="next"`.
 *
 * Không đổi origin sang địa chỉ nội bộ như CanvasApiClient: Canvas kiểm tra
 * `aud` của token theo host của request, token xin ở tên miền công khai nên chỉ
 * dùng được ở chính tên miền đó (gọi qua canvas.docker trả 401 "'aud' is invalid").
 */
@Injectable()
export class NrpsClientService {
  private readonly logger = new Logger(NrpsClientService.name);

  constructor(
    private readonly tokens: AgsTokenService,
    @Inject(AGS_CONFIG) private readonly config: AgsConfig,
  ) {}

  async listMembers(contextMembershipsUrl: string): Promise<NrpsMember[]> {
    const first = this.firstPageUrl(contextMembershipsUrl);
    const members: NrpsMember[] = [];
    let next: string | null = first;
    let pages = 0;
    while (next) {
      if (++pages > MAX_PAGES)
        throw new NrpsError(
          `Danh sách lớp quá dài (hơn ${MAX_PAGES} trang), dừng đọc để tránh vòng lặp`,
        );
      const page = await this.fetchPage(next);
      members.push(...page.members);
      next = page.next;
      // Link do Canvas gửi, nhưng vẫn không đi tới host khác với trang đầu.
      if (next && hostOf(next) !== hostOf(first))
        throw new NrpsError('Canvas trả link trang kế tiếp ở host lạ, dừng đọc danh sách lớp');
    }
    return members;
  }

  /** Chỉ gửi token tới đúng Canvas đã cấu hình, không tới host tùy ý trong claim. */
  private firstPageUrl(raw: string): string {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new NrpsError('Địa chỉ danh sách lớp (NRPS) không hợp lệ');
    }
    const trusted = hostOf(resolvePlatformUrl());
    if (!/^https?:$/.test(url.protocol) || (trusted && url.host !== trusted))
      throw new NrpsError('Địa chỉ danh sách lớp (NRPS) không thuộc Canvas đã cấu hình');
    if (!url.searchParams.has('limit')) url.searchParams.set('limit', String(PAGE_LIMIT));
    return url.toString();
  }

  private async fetchPage(url: string) {
    let response = await this.request(url);
    if (response.status === 401) {
      // Token có thể bị Canvas thu hồi/hết hạn sớm: xin token mới đúng một lần.
      this.tokens.invalidate(NRPS_SCOPE);
      response = await this.request(url);
    }
    if (response.status === 401) throw new NrpsError(NRPS_UNAUTHORIZED_MESSAGE, 401);
    if (!response.ok) {
      const body = (await response.text().catch(() => '')).slice(0, 200);
      this.logger.warn(`NRPS ${url} trả HTTP ${response.status}: ${body}`);
      throw new NrpsError(
        `Canvas trả lỗi HTTP ${response.status} khi đọc danh sách lớp`,
        response.status,
      );
    }
    let json: { members?: unknown };
    try {
      json = (await response.json()) as { members?: unknown };
    } catch {
      throw new NrpsError('Canvas trả danh sách lớp không phải JSON', response.status);
    }
    if (!Array.isArray(json.members))
      throw new NrpsError('Canvas trả danh sách lớp thiếu trường members', response.status);
    return {
      members: json.members.flatMap((raw) => this.parseMember(raw)),
      next: this.nextLink(response.headers.get('link')),
    };
  }

  private async request(url: string): Promise<Response> {
    let token: string;
    try {
      token = await this.tokens.getAccessToken(NRPS_SCOPE);
    } catch (error) {
      if (error instanceof AgsTokenError)
        throw new NrpsError(
          error.status === 0
            ? `Chưa cấu hình khóa LTI để đọc danh sách lớp: ${error.message}`
            : `Canvas không cấp token đọc danh sách lớp (mã ${error.status})`,
          error.status || undefined,
        );
      throw new NrpsError(NRPS_UNREACHABLE_MESSAGE);
    }
    try {
      return await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: NRPS_ACCEPT },
        signal: AbortSignal.timeout(this.config.requestTimeoutMs),
      });
    } catch {
      throw new NrpsError(NRPS_UNREACHABLE_MESSAGE);
    }
  }

  /** Thành viên thiếu user_id không dùng được (không khớp được với lms_sub), bỏ qua. */
  private parseMember(raw: unknown): NrpsMember[] {
    if (!raw || typeof raw !== 'object') return [];
    const m = raw as Record<string, unknown>;
    if (typeof m.user_id !== 'string' || !m.user_id) return [];
    const text = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : undefined;
    return [
      {
        user_id: m.user_id,
        status: text(m.status),
        name: text(m.name),
        given_name: text(m.given_name),
        family_name: text(m.family_name),
        email: text(m.email),
        roles: Array.isArray(m.roles)
          ? m.roles.filter((r): r is string => typeof r === 'string')
          : [],
      },
    ];
  }

  private nextLink(header: string | null): string | null {
    if (!header) return null;
    for (const part of header.split(/,\s*(?=<)/)) {
      const match = part.match(/<([^>]+)>\s*;\s*(.*)/);
      if (match && /rel="?next"?/i.test(match[2])) return match[1];
    }
    return null;
  }
}
