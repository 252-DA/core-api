import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ContentGenerationService } from './content-generation.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/content-generations')
@UseGuards(BffJwtGuard)
export class ContentGenerationController {
  constructor(private readonly service: ContentGenerationService) {}

  @Get()
  async list(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.service.listRequests(claims, courseId, limit, type);
  }

  @Post()
  async create(
    @CurrentBffClaims() claims: BffClaims,
    @Body()
    body: {
      courseId: string;
      type: 'card' | 'quiz';
      scope: Record<string, unknown>;
    },
  ) {
    return this.service.createRequest(claims, body);
  }
}
