import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { importPKCS8, SignJWT, type CryptoKey } from 'jose';
import { AGS_CONFIG, type AgsConfig } from './ags.config';

/** Đổi token sớm hơn hạn một chút để không dùng phải token vừa hết hạn giữa chừng. */
const EXPIRY_SKEW_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

/**
 * Lấy access token của LTI Advantage theo IMS Security Framework:
 * ký một client assertion bằng private key của tool rồi đổi lấy bearer token
 * ở `LTI_TOKEN_URL` qua grant `client_credentials`.
 *
 * Token được cache trong bộ nhớ theo scope — mỗi lần post điểm mà xin token
 * mới là vừa chậm vừa dễ bị platform rate-limit.
 */
@Injectable()
export class AgsTokenService {
  private readonly logger = new Logger(AgsTokenService.name);
  private readonly cache = new Map<string, CachedToken>();
  private privateKeyPromise: Promise<CryptoKey> | null = null;

  constructor(@Inject(AGS_CONFIG) private readonly config: AgsConfig) {}

  /** Bỏ token đã cache — gọi khi platform trả 401 để lần sau xin token mới. */
  invalidate(scope: string) {
    this.cache.delete(scope);
  }

  async getAccessToken(scope: string): Promise<string> {
    const cached = this.cache.get(scope);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.accessToken;
    }

    const assertion = await this.buildClientAssertion();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion,
      scope,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new AgsTokenError(
        `Token endpoint trả HTTP ${response.status}: ${raw.slice(0, 500)}`,
        response.status,
      );
    }

    let parsed: TokenResponse;
    try {
      parsed = JSON.parse(raw) as TokenResponse;
    } catch {
      throw new AgsTokenError(
        `Token endpoint trả body không phải JSON: ${raw.slice(0, 200)}`,
        response.status,
      );
    }

    if (!parsed.access_token) {
      throw new AgsTokenError(
        'Token endpoint không trả access_token',
        response.status,
      );
    }

    // expires_in là tuỳ chọn trong thực tế; mặc định 1 giờ theo IMS.
    const ttlMs = (parsed.expires_in ?? 3600) * 1000;
    this.cache.set(scope, {
      accessToken: parsed.access_token,
      expiresAt: Date.now() + Math.max(ttlMs - EXPIRY_SKEW_MS, 0),
    });

    this.logger.debug(`Đã lấy access token cho scope ${scope}`);
    return parsed.access_token;
  }

  private async buildClientAssertion(): Promise<string> {
    const key = await this.loadPrivateKey();
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: this.config.keyId, typ: 'JWT' })
      .setIssuer(this.config.clientId)
      .setSubject(this.config.clientId)
      .setAudience(this.config.tokenUrl)
      .setJti(randomUUID())
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(key);
  }

  private loadPrivateKey(): Promise<CryptoKey> {
    if (this.privateKeyPromise) {
      return this.privateKeyPromise;
    }

    this.privateKeyPromise = (async () => {
      if (!this.config.privateKeyPath) {
        throw new AgsTokenError('LTI_PRIVATE_KEY_PATH chưa được cấu hình', 0);
      }
      const pem = await readFile(this.config.privateKeyPath, 'utf8');
      return importPKCS8(pem, 'RS256');
    })();

    // Đọc hỏng thì đừng cache promise lỗi vĩnh viễn — cho lần sau thử lại.
    this.privateKeyPromise.catch(() => {
      this.privateKeyPromise = null;
    });

    return this.privateKeyPromise;
  }
}

export class AgsTokenError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AgsTokenError';
  }
}
