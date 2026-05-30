import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/lessons')
@UseGuards(BffJwtGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get()
  async list(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId: string,
    @Query('status') status?: string,
  ) {
    return this.lessonService.list(claims, courseId, status);
  }

  @Get(':id')
  async get(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.lessonService.get(claims, id);
  }

  @Get(':id/cards')
  async cards(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.lessonService.cards(claims, id, status);
  }

  @Get(':id/quiz')
  async quiz(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.lessonService.quiz(claims, id, status);
  }

  @Post(':id/publish')
  async publish(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.lessonService.publish(claims, id);
  }
}
