import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BffClaims } from './bff-claims';

export const CurrentBffClaims = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): BffClaims => {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.user as BffClaims; // We'll attach claims to request.user in the guard
  },
);
