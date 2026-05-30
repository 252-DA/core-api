import {
  Controller,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { LtiService } from './lti.service';
import { LaunchSyncDto } from './dto/launch-sync.dto';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/lti')
export class LtiController {
  constructor(private readonly ltiService: LtiService) {}

  @Post('launch-sync')
  @UseGuards(BffJwtGuard)
  async launchSync(
    @Body() dto: LaunchSyncDto,
    @CurrentBffClaims() claims: BffClaims,
  ) {
    if (claims.scope !== 'admin' || claims.sub !== 'lti-bootstrap') {
      throw new UnauthorizedException('Invalid bootstrap claims');
    }

    return this.ltiService.syncLaunch(dto);
  }
}
