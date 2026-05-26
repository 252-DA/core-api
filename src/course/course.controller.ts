import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('api/courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async listCourses() {
    return this.courseService.listCourses();
  }

  @Get(':id')
  async getCourse(@Param('id') id: string) {
    return this.courseService.getCourse(id);
  }

  @Post()
  async createCourse(
    @Body()
    body: {
      course_id: string;
      code: string;
      title_vi: string;
      title_en?: string;
      credits?: number;
      semester?: string;
    },
  ) {
    return this.courseService.createCourse(body);
  }

  @Get(':id/chapters')
  async getChapters(@Param('id') id: string) {
    return this.courseService.getChapters(id);
  }

  @Get(':id/learning-outcomes')
  async getLearningOutcomes(@Param('id') id: string) {
    return this.courseService.getLearningOutcomes(id);
  }

  @Get(':id/assessments')
  async getAssessments(@Param('id') id: string) {
    return this.courseService.getAssessments(id);
  }
}
