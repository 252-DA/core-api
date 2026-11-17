import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { BffJwtService } from './bff-jwt.service';

@Injectable()
export class BffJwtGuard implements CanActivate {
  constructor(
    private readonly bffJwtService: BffJwtService,
    @Optional() private readonly pinoLogger?: PinoLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.substring(7);
    const claims = await this.bffJwtService.verify(token);

    // Attach claims to request so we can extract them with @CurrentBffClaims()
    request.user = claims;

    // Gắn user_id và course_id vào ngữ cảnh log của request; tuyệt đối không ghi roles.
    const logFields: Record<string, string> = { user_id: claims.sub };
    if (claims.courseId) {
      logFields.course_id = claims.courseId;
    }
    try {
      this.pinoLogger?.assign(logFields);
    } catch {
      // Ngoài phạm vi HTTP middleware của nestjs-pino (vd. unit test gọi guard trực tiếp).
    }

    return true;
  }
}
