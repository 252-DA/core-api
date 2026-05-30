import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async listCourses(claims: BffClaims) {
    if (claims.scope === 'admin') {
      return this.prisma.courses.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
      });
    }

    const memberships = await this.prisma.course_memberships.findMany({
      where: { user_id: claims.sub },
      include: { courses: true },
      orderBy: { last_seen_at: 'desc' },
    });

    return memberships
      .map((membership) => membership.courses)
      .filter((course) => !course.deleted_at);
  }

  async getCourse(claims: BffClaims, courseId: string) {
    await this.authz.assertCourseAccess(claims, courseId);
    const course = await this.prisma.courses.findFirst({
      where: { course_id: courseId, deleted_at: null },
    });
    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }
    return course;
  }

  async createCourse(data: {
    code: string;
    name: string;
    description?: string;
    lms_id?: string;
  }) {
    return this.prisma.courses.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        lms_id: data.lms_id,
      },
    });
  }

  async getChapters(claims: BffClaims, courseId: string) {
    await this.getCourse(claims, courseId);
    return this.prisma.chapters.findMany({
      where: { course_id: courseId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
    });
  }

  async getLearningOutcomes(claims: BffClaims, courseId: string) {
    await this.getCourse(claims, courseId);
    return this.prisma.learning_outcomes.findMany({
      where: {
        chapters: { course_id: courseId },
        deleted_at: null,
        is_current: true,
      },
      include: { chapters: true },
      orderBy: [{ chapters: { sort_order: 'asc' } }, { code: 'asc' }],
    });
  }

  async getAssessments(claims: BffClaims, courseId: string) {
    await this.getCourse(claims, courseId);
    return this.prisma.assessments.findMany({
      where: { course_id: courseId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
    });
  }
}
