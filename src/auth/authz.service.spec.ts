import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from './authz.service';
import type { BffClaims } from './bff-claims';

const COURSE = '00000000-0000-0000-0000-000000000001';
const claims: BffClaims = {
  sub: '00000000-0000-0000-0000-000000000009',
  roles: [],
  scope: 'course',
  jti: 't',
  iat: 0,
  exp: 1,
};

function setup(opts: { membership?: boolean; lmsRole?: string | null } = {}) {
  const prisma = {
    course_memberships: {
      findFirst: jest.fn().mockResolvedValue(opts.membership ? { role: 'instructor' } : null),
    },
    lms_user_mappings: {
      findFirst: jest.fn().mockResolvedValue(opts.lmsRole ? { role: opts.lmsRole } : null),
    },
  };
  return { authz: new AuthzService(prisma as never), prisma };
}

describe('AuthzService.isCourseStaff', () => {
  it('treats platform admin scope as staff without touching the database', async () => {
    const { authz, prisma } = setup();
    await expect(authz.isCourseStaff({ ...claims, scope: 'admin' }, COURSE)).resolves.toBe(true);
    expect(prisma.course_memberships.findFirst).not.toHaveBeenCalled();
    expect(prisma.lms_user_mappings.findFirst).not.toHaveBeenCalled();
  });

  it('looks only for instructor/ta membership of this very course', async () => {
    const { authz, prisma } = setup({ membership: true });
    await expect(authz.isCourseStaff(claims, COURSE)).resolves.toBe(true);
    expect(prisma.course_memberships.findFirst).toHaveBeenCalledWith({
      where: { user_id: claims.sub, course_id: COURSE, role: { in: ['instructor', 'ta'] } },
      select: { role: true },
    });
  });

  it('treats an LMS administrator as staff, as assertPlatformAdmin does', async () => {
    const { authz } = setup({ lmsRole: 'administrator' });
    await expect(authz.isCourseStaff(claims, COURSE)).resolves.toBe(true);
  });

  it('does not treat a learner or an observer as staff', async () => {
    const { authz } = setup({ lmsRole: 'learner' });
    await expect(authz.isCourseStaff(claims, COURSE)).resolves.toBe(false);
  });

  it('does not treat an unknown user as staff', async () => {
    const { authz } = setup();
    await expect(authz.isCourseStaff(claims, COURSE)).resolves.toBe(false);
  });
});

describe('AuthzService.assertPlatformAdmin', () => {
  it('still accepts only admin scope or an LMS administrator', async () => {
    await expect(setup().authz.assertPlatformAdmin({ ...claims, scope: 'admin' })).resolves.toBeUndefined();
    await expect(setup({ lmsRole: 'administrator' }).authz.assertPlatformAdmin(claims)).resolves.toBeUndefined();
    await expect(setup({ lmsRole: 'instructor' }).authz.assertPlatformAdmin(claims)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(setup().authz.assertPlatformAdmin(claims)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
