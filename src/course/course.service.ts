import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses() {
    return this.prisma.courses.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getCourse(courseId: string) {
    const course = await this.prisma.courses.findUnique({
      where: { course_id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }
    return course;
  }

  async createCourse(data: {
    course_id: string;
    code: string;
    title_vi: string;
    title_en?: string;
    credits?: number;
    semester?: string;
  }) {
    return this.prisma.courses.create({
      data: {
        course_id: data.course_id,
        code: data.code,
        title_vi: data.title_vi,
        title_en: data.title_en,
        credits: data.credits,
        semester: data.semester,
      },
    });
  }

  async getChapters(courseId: string) {
    await this.getCourse(courseId);
    return this.prisma.chapters.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: 'asc' },
    });
  }

  async getLearningOutcomes(courseId: string) {
    await this.getCourse(courseId);
    return this.prisma.learning_outcomes.findMany({
      where: { course_id: courseId },
      orderBy: { code: 'asc' },
    });
  }

  async getAssessments(courseId: string) {
    await this.getCourse(courseId);
    return this.prisma.assessments.findMany({
      where: { course_id: courseId },
      orderBy: { code: 'asc' },
    });
  }
}
