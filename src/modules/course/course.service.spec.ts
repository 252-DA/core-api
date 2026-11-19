import { BadRequestException } from '@nestjs/common';
import type { BffClaims } from '../../auth/bff-claims';
import { AuthzService } from '../../auth/authz.service';
import { CourseService } from './course.service';

const baseClaims: BffClaims = {
  sub: '00000000-0000-0000-0000-000000000009',
  roles: ['instructor'],
  scope: 'course',
  jti: 'jti-1',
  iat: 0,
  exp: 1,
};

function makeService() {
  const prisma = {
    courses: {
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
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
  const authz = new AuthzService(prisma as never);
  return { service: new CourseService(prisma as never, authz), prisma };
}

describe('CourseService', () => {
  it('rejects missing or blank courseId before touching authz or prisma', async () => {
    const { service, prisma } = makeService();
    await expect(
      service.getChapters({ ...baseClaims, scope: 'admin' }, ''),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getLearningOutcomes({ ...baseClaims, scope: 'admin' }, '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.courses.findFirst).not.toHaveBeenCalled();
    expect(prisma.chapters.findMany).not.toHaveBeenCalled();
    expect(prisma.learning_outcomes.findMany).not.toHaveBeenCalled();
  });
});
