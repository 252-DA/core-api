import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ContentGenerationService } from './content-generation.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/content-generations')
@UseGuards(BffJwtGuard)
export class ContentGenerationController {
  constructor(private readonly service: ContentGenerationService) {}

  @Post()
  async create(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: { courseId: string; type: 'card' | 'quiz'; scope: Record<string, unknown> },
  ) {
    return this.service.createRequest(claims, body);
  }
}
