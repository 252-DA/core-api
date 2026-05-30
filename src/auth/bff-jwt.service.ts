import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { importSPKI, jwtVerify, type CryptoKey, type JWTPayload } from 'jose';
import * as fs from 'fs';
import { BffClaims } from './bff-claims';

@Injectable()
export class BffJwtService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BffJwtService.name);
  private publicKey?: CryptoKey;
  private issuer = '';
  private audience = '';
  private jtiCache = new Map<string, number>();
  private cacheCleanupInterval?: NodeJS.Timeout;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const pubKeyPath = this.configService.get<string>(
      'BFF_TO_CORE_PUBLIC_KEY_PATH',
    );
    if (!pubKeyPath) {
      throw new Error('BFF_TO_CORE_PUBLIC_KEY_PATH is not defined');
    }

    try {
      const pem = fs.readFileSync(pubKeyPath, 'utf8');
      this.publicKey = await importSPKI(pem, 'EdDSA');
      this.logger.log('BFF to Core public key loaded successfully');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to load BFF to Core public key: ${message}`);
      throw e;
    }

    this.issuer = this.configService.get<string>(
      'BFF_TO_CORE_JWT_ISSUER',
      'web-bff',
    );
    this.audience = this.configService.get<string>(
      'BFF_TO_CORE_JWT_AUDIENCE',
      'core-api',
    );

    this.cacheCleanupInterval = setInterval(
      () => this.cleanJtiCache(),
      60_000,
    );
    this.cacheCleanupInterval.unref?.();
  }

  onModuleDestroy() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
  }

  async verify(token: string): Promise<BffClaims> {
    if (!this.publicKey) {
      throw new UnauthorizedException('Public key not loaded');
    }

    try {
      const { payload } = await jwtVerify(token, this.publicKey, {
        algorithms: ['EdDSA'],
        issuer: this.issuer,
        audience: this.audience,
        clockTolerance: 5,
      });

      const claims = this.parseClaims(payload);

      // Check replay
      this.cleanJtiCache();
      if (this.jtiCache.has(claims.jti)) {
        throw new UnauthorizedException('Token replay detected');
      }
      // Cache JTI with expiration matching the token's expiration
      this.jtiCache.set(claims.jti, claims.exp * 1000);

      return claims;
    } catch (e: unknown) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      const message = e instanceof Error ? e.message : String(e);
      this.logger.debug(`JWT verification failed: ${message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private parseClaims(payload: JWTPayload): BffClaims {
    if (!payload.sub) {
      throw new UnauthorizedException('Missing sub');
    }
    if (payload.scope !== 'course' && payload.scope !== 'admin') {
      throw new UnauthorizedException('Invalid scope');
    }
    if (!payload.jti) {
      throw new UnauthorizedException('Missing jti');
    }
    if (typeof payload.iat !== 'number') {
      throw new UnauthorizedException('Missing iat');
    }
    if (typeof payload.exp !== 'number') {
      throw new UnauthorizedException('Missing exp');
    }

    const roles = payload.roles;
    if (
      !Array.isArray(roles) ||
      !roles.every((role) => typeof role === 'string')
    ) {
      throw new UnauthorizedException('Invalid roles');
    }

    const courseId = payload.courseId;
    if (courseId !== undefined && typeof courseId !== 'string') {
      throw new UnauthorizedException('Invalid courseId');
    }

    return {
      sub: payload.sub,
      scope: payload.scope,
      roles,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
      ...(courseId && { courseId }),
    };
  }

  private cleanJtiCache() {
    const now = Date.now();
    for (const [jti, exp] of this.jtiCache.entries()) {
      if (now > exp) {
        this.jtiCache.delete(jti);
      }
    }
  }
}
