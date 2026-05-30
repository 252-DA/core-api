import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/quiz')
@UseGuards(BffJwtGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('submit')
  async submit(
    @CurrentBffClaims() claims: BffClaims,
    @Body()
    body: {
      lessonId: string;
      resourceLinkId?: string;
      answers: Array<{ quizId: string; chosenAnswer: unknown; responseTimeMs?: number }>;
    },
  ) {
    return this.quizService.submit(claims, body);
  }

  @Get('attempts')
  async attempts(
    @CurrentBffClaims() claims: BffClaims,
    @Query('lessonId') lessonId: string,
  ) {
    return this.quizService.attempts(claims, lessonId);
  }
}
