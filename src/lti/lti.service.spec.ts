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
    };
    return {
      service: new LtiService(prisma as never, jobs as never),
      prisma,
      jobs,
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
    const { service, prisma, jobs } = setup();
    prisma.$transaction.mockRejectedValue(new Error('rollback'));
    await expect(service.syncLaunch(dto)).rejects.toThrow('rollback');
    expect(jobs.triggerLaunch).not.toHaveBeenCalled();
  });
});
