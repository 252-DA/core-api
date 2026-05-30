import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { BffJwtService } from './bff-jwt.service';

@Injectable()
export class BffJwtGuard implements CanActivate {
  constructor(private readonly bffJwtService: BffJwtService) {}

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

    return true;
  }
}
