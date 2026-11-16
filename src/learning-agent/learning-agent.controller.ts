import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LearnerModelService } from './learner-model.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

@Controller('api/learning-agent')
@UseGuards(BffJwtGuard)
export class LearningAgentController {
  constructor(private readonly learnerModel: LearnerModelService) {}

  @Get('summary')
  async summary(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
    @Query('userId') userId?: string,
  ) {
    return this.learnerModel.summary(claims, {
      courseId,
      ...(userId ? { userId } : {}),
    });
  }

  @Get('course-mastery')
  async courseMastery(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.learnerModel.courseMastery(claims, { courseId });
  }
}
