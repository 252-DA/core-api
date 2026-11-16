import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CourseService } from '../course/course.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';
import { requireQueryString } from '../common/query-params';

@Controller('api/chapters')
@UseGuards(BffJwtGuard)
export class ChapterController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async list(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId?: string | string[],
  ) {
    return this.courseService.getChapters(
      claims,
      requireQueryString(courseId, 'courseId'),
    );
  }
}
