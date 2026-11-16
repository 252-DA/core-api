import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CourseService } from '../course/course.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';
import { requireQueryString } from '../common/query-params';

@Controller('api/learning-outcomes')
@UseGuards(BffJwtGuard)
export class LearningOutcomeController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async list(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId?: string | string[],
  ) {
    return this.courseService.getLearningOutcomes(
      claims,
      requireQueryString(courseId, 'courseId'),
    );
  }
}
