import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/review')
@UseGuards(BffJwtGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('drafts')
  async listDrafts(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId: string,
    @Query('kind') kind?: 'card' | 'quiz',
  ) {
    return this.reviewService.listDrafts(claims, courseId, kind);
  }

  @Post('cards/:id/approve')
  async approveCard(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.reviewService.approveCard(claims, id);
  }

  @Post('cards/:id/reject')
  async rejectCard(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.reviewService.rejectCard(claims, id, body.reason);
  }

  @Patch('cards/:id')
  async updateCard(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: { content: unknown },
  ) {
    return this.reviewService.updateCard(claims, id, body.content);
  }

  @Post('quiz-items/:id/approve')
  async approveQuizItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.reviewService.approveQuizItem(claims, id);
  }

  @Post('quiz-items/:id/reject')
  async rejectQuizItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.reviewService.rejectQuizItem(claims, id, body.reason);
  }

  @Patch('quiz-items/:id')
  async updateQuizItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body()
    body: {
      question?: string;
      options?: unknown;
      correct_answer?: unknown;
      explanation?: string;
    },
  ) {
    return this.reviewService.updateQuizItem(claims, id, body);
  }
}
