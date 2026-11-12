import { LtiService } from './lti.service';
import { LaunchSyncDto } from './dto/launch-sync.dto';

describe('LtiService document sync trigger', () => {
  const dto: LaunchSyncDto = {
    lmsType: 'canvas',
    lmsSub: 'teacher-1',
    role: 'instructor',
    courseRole: 'instructor',
    lmsContextId: 'context-1',
  };

  function setup() {
    const tx = {
      lms_user_mappings: {
        upsert: jest.fn().mockResolvedValue({ internal_user_id: 'user-1' }),
      },
      courses: {
        upsert: jest.fn().mockResolvedValue({ course_id: 'course-1' }),
      },
      lms_course_ref: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ course_ref_id: 'ref-1' }),
      },
      course_memberships: { upsert: jest.fn() },
    };
    let committed = false;
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        const result = await callback(tx);
        committed = true;
        return result;
      }),
    };
    const jobs = {
      triggerLaunch: jest.fn().mockImplementation(async () => {
        expect(committed).toBe(true);
      }),
      triggerRosterLaunch: jest.fn().mockImplementation(async () => {
        expect(committed).toBe(true);
      }),
    };
    const roster = {
      recordLaunch: jest.fn().mockImplementation(async () => {
        expect(committed).toBe(true);
      }),
    };
    return {
      service: new LtiService(prisma as never, jobs as never, roster as never),
      prisma,
      jobs,
      roster,
    };
  }

  it('triggers only after committing the course and membership', async () => {
    const { service, jobs } = setup();
    await expect(service.syncLaunch(dto)).resolves.toMatchObject({
      internalCourseId: 'course-1',
    });
    expect(jobs.triggerLaunch).toHaveBeenCalledWith(
      'course-1',
      'canvas',
      'instructor',
    );
  });

  it('does not wait for a slow Redis connection before returning the launch', async () => {
    const { service, jobs } = setup();
    jobs.triggerLaunch.mockReturnValue(new Promise(() => {}));
    await expect(service.syncLaunch(dto)).resolves.toMatchObject({
      internalCourseId: 'course-1',
    });
  });

  it('does not trigger if the database transaction fails', async () => {
    const { service, prisma, jobs, roster } = setup();
    prisma.$transaction.mockRejectedValue(new Error('rollback'));
    await expect(service.syncLaunch(dto)).rejects.toThrow('rollback');
    expect(jobs.triggerLaunch).not.toHaveBeenCalled();
    expect(jobs.triggerRosterLaunch).not.toHaveBeenCalled();
    expect(roster.recordLaunch).not.toHaveBeenCalled();
  });

  it('asks for a roster sync after the commit, passing the platform role for administrators', async () => {
    const { service, jobs } = setup();
    await service.syncLaunch({ ...dto, role: 'administrator' });
    expect(jobs.triggerRosterLaunch).toHaveBeenCalledWith(
      'course-1',
      'canvas',
      'instructor',
      'administrator',
    );
  });
});

describe('LtiService Canvas ids and NRPS url', () => {
  const dto: LaunchSyncDto = {
    lmsType: 'canvas',
    lmsSub: 'student-1',
    role: 'learner',
    courseRole: 'learner',
    lmsContextId: 'context-1',
  };

  function setup() {
    const tx = {
      lms_user_mappings: {
        upsert: jest.fn().mockResolvedValue({ internal_user_id: 'user-1' }),
      },
      courses: { upsert: jest.fn().mockResolvedValue({ course_id: 'course-1' }) },
      lms_course_ref: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ course_ref_id: 'ref-1' }),
      },
      course_memberships: { upsert: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    };
    const jobs = { triggerLaunch: jest.fn(), triggerRosterLaunch: jest.fn() };
    const roster = { recordLaunch: jest.fn().mockResolvedValue(undefined) };
    return {
      service: new LtiService(prisma as never, jobs as never, roster as never),
      tx,
      roster,
    };
  }

  it('records Canvas user/course ids and the NRPS url from the launch', async () => {
    const { service, roster } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: { canvas_user_id: '42', canvas_course_id: '8' },
      nrps: {
        contextMembershipsUrl: 'https://canvas.test/api/lti/courses/8/names_and_roles',
        serviceVersions: ['2.0'],
      },
    });
    expect(roster.recordLaunch).toHaveBeenCalledWith({
      internalUserId: 'user-1',
      courseId: 'course-1',
      courseRefId: 'ref-1',
      courseRole: 'learner',
      platformUserId: '42',
      platformCourseId: '8',
      nrpsUrl: 'https://canvas.test/api/lti/courses/8/names_and_roles',
    });
  });

  it('ignores unexpanded Canvas variables and malformed urls', async () => {
    const { service, roster } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: {
        canvas_user_id: '$Canvas.user.id',
        canvas_course_id: 'abc',
      },
      nrps: { contextMembershipsUrl: 'javascript:alert(1)' },
    });
    expect(roster.recordLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        platformUserId: undefined,
        platformCourseId: undefined,
        nrpsUrl: undefined,
      }),
    );
  });

  it('never passes the new columns to a Prisma delegate', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: { canvas_user_id: '42', canvas_course_id: '8' },
      nrps: { contextMembershipsUrl: 'https://canvas.test/api/lti/courses/8/names_and_roles' },
    });
    const written = JSON.stringify([
      tx.lms_user_mappings.upsert.mock.calls,
      tx.lms_course_ref.create.mock.calls,
      tx.course_memberships.upsert.mock.calls,
    ]);
    expect(written).not.toMatch(/lms_platform|nrps_|"source"|"status"/);
  });

  it('skips the Canvas columns for other LMS types', async () => {
    const { service, roster } = setup();
    await service.syncLaunch({ ...dto, lmsType: 'moodle' });
    expect(roster.recordLaunch).not.toHaveBeenCalled();
  });
});
