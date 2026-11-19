import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuizService } from '../services/quiz.service';
import { EssayGradingService } from '../services/essay-grading.service';
import { BffJwtGuard } from '../../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../../auth/bff-claims';
import { GradeEssayAnswerDto, SubmitQuizDto } from '../dto/quiz.dto';

@Controller('api/quiz')
@UseGuards(BffJwtGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly essayGrading: EssayGradingService,
  ) {}

  @Post('submit')
  async submit(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: SubmitQuizDto,
  ) {
    return this.quizService.submit(claims, body);
  }

  @Get('attempts')
  async attempts(
    @CurrentBffClaims() claims: BffClaims,
    @Query('lessonId') lessonId = '',
  ) {
    return this.quizService.attempts(claims, lessonId);
  }

  @Get('essays/review')
  async listEssaysForReview(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.essayGrading.list(claims, { courseId });
  }

  @Post('essays/:attemptId/grade')
  async gradeEssayAnswer(
    @CurrentBffClaims() claims: BffClaims,
    @Param('attemptId') attemptId: string,
    @Body() body: GradeEssayAnswerDto,
  ) {
    return this.essayGrading.grade(claims, {
      attemptId,
      score: body.score,
      feedback: body.feedback,
    });
  }

  @Post('essays/:attemptId/retry')
  async retryEssayGrading(
    @CurrentBffClaims() claims: BffClaims,
    @Param('attemptId') attemptId: string,
  ) {
    return this.essayGrading.retry(claims, { attemptId });
  }
}
