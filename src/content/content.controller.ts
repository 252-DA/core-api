import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/content')
@UseGuards(BffJwtGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('lessons/:lessonId/cards')
  async getLessonCards(
    @CurrentBffClaims() claims: BffClaims,
    @Param('lessonId') lessonId: string,
  ) {
    return this.contentService.getLessonCards(claims, lessonId);
  }

  @Get('lessons/:lessonId/quiz')
  async getQuizItems(
    @CurrentBffClaims() claims: BffClaims,
    @Param('lessonId') lessonId: string,
  ) {
    return this.contentService.getQuizItems(claims, lessonId);
  }
}
