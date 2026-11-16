import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import { AuthzService } from '../auth/authz.service';
import { CourseService } from './course.service';

const baseClaims: BffClaims = {
  sub: '00000000-0000-0000-0000-000000000009',
  roles: ['instructor'],
  scope: 'course',
  jti: 'jti-1',
  iat: 0,
  exp: 1,
};

function makeService(opts: { lmsRole?: string | null } = {}) {
  const prisma = {
    courses: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        course_id: 'course-1',
        ...data,
      })),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    chapters: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    learning_outcomes: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    course_memberships: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    lms_user_mappings: {
      findFirst: jest.fn().mockResolvedValue(opts.lmsRole ? { role: opts.lmsRole } : null),
    },
  };
  const authz = new AuthzService(prisma as never);
  return { service: new CourseService(prisma as never, authz), prisma };
}

describe('CourseService', () => {
  it('allows only platform/LMS admin to createCourse', async () => {
    const nonAdmin = makeService({ lmsRole: 'instructor' });
    await expect(
      nonAdmin.service.createCourse(baseClaims, { code: 'CS101', name: 'Intro' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(nonAdmin.prisma.courses.create).not.toHaveBeenCalled();

    const adminScope = makeService();
    await expect(
      adminScope.service.createCourse(
        { ...baseClaims, scope: 'admin' },
        { code: 'CS101', name: 'Intro' },
      ),
    ).resolves.toMatchObject({ course_id: 'course-1', code: 'CS101', name: 'Intro' });
    expect(adminScope.prisma.courses.create).toHaveBeenCalledTimes(1);

    const lmsAdmin = makeService({ lmsRole: 'administrator' });
    await expect(
      lmsAdmin.service.createCourse(baseClaims, { code: 'CS102', name: 'Algorithms' }),
    ).resolves.toMatchObject({ course_id: 'course-1', code: 'CS102', name: 'Algorithms' });
  });

  it('rejects missing or blank courseId before touching authz or prisma', async () => {
    const { service, prisma } = makeService();
    await expect(service.getChapters({ ...baseClaims, scope: 'admin' }, '')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.getLearningOutcomes({ ...baseClaims, scope: 'admin' }, '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.courses.findFirst).not.toHaveBeenCalled();
    expect(prisma.chapters.findMany).not.toHaveBeenCalled();
    expect(prisma.learning_outcomes.findMany).not.toHaveBeenCalled();
  });
});
