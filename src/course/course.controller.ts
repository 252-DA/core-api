import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';

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

  @Post()
  async createCourse(
    @Body()
    body: {
      code: string;
      name: string;
      description?: string;
      lms_id?: string;
    },
  ) {
    return this.courseService.createCourse(body);
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

  @Get(':id/assessments')
  async getAssessments(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.courseService.getAssessments(claims, id);
  }
}
