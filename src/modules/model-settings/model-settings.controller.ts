import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ModelSettingsService } from './model-settings.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';
import { SetModelBindingDto } from './dto/model-settings.dto';

@Controller('api/model-bindings')
@UseGuards(BffJwtGuard)
export class ModelSettingsController {
  constructor(private readonly modelSettings: ModelSettingsService) {}

  @Get()
  async list(@CurrentBffClaims() claims: BffClaims) {
    return this.modelSettings.list(claims);
  }

  @Put()
  async set(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: SetModelBindingDto,
  ) {
    return this.modelSettings.set(claims, body);
  }
}
