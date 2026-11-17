import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuizSetService } from './quiz-set.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';
import {
  CreateQuizSetDto,
  QuizBuilderContextDto,
  StartQuizSetDto,
  SubmitQuizSetDto,
} from './dto/quiz.dto';

@Controller('api/quiz-sets')
@UseGuards(BffJwtGuard)
export class QuizSetController {
  constructor(private readonly quizSets: QuizSetService) {}

  @Get('canvas-context')
  async canvasContext(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
    @Query('moduleId') moduleId?: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.quizSets.context(claims, {
      courseId,
      moduleId: moduleId ?? null,
      chapterId,
    });
  }

  @Post('builder-context')
  async builderContext(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: QuizBuilderContextDto,
  ) {
    return this.quizSets.builderContext(claims, body);
  }

  @Post()
  async create(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateQuizSetDto,
  ) {
    return this.quizSets.create(claims, body);
  }

  @Get(':id')
  async get(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') quizSetId: string,
    @Query('resourceLinkId') resourceLinkId?: string,
  ) {
    return this.quizSets.get(claims, quizSetId, resourceLinkId);
  }

  @Post(':id/start')
  async start(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') quizSetId: string,
    @Body() body: StartQuizSetDto,
  ) {
    return this.quizSets.start(claims, { quizSetId, ...body });
  }

  @Post(':id/submit')
  async submit(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') quizSetId: string,
    @Body() body: SubmitQuizSetDto,
  ) {
    return this.quizSets.submit(claims, { quizSetId, ...body });
  }

  @Get(':id/results')
  async results(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') quizSetId: string,
    @Query('resourceLinkId') resourceLinkId?: string,
  ) {
    return this.quizSets.results(claims, { quizSetId, resourceLinkId });
  }

  @Get(':id/submissions/:submissionId')
  async submissionDetail(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') quizSetId: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.quizSets.submissionDetail(claims, { quizSetId, submissionId });
  }
}
