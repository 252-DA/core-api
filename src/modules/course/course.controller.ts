import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';

@Controller('api/courses')
@UseGuards(BffJwtGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async listCourses(@CurrentBffClaims() claims: BffClaims) {
    return this.courseService.listCourses(claims);
  }

  @Get(':id')
  async getCourse(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.courseService.getCourse(claims, id);
  }

  @Get(':id/chapters')
  async getChapters(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.courseService.getChapters(claims, id);
  }

  @Get(':id/learning-outcomes')
  async getLearningOutcomes(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.courseService.getLearningOutcomes(claims, id);
  }
}
