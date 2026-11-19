import { Logger } from '@nestjs/common';
import { LtiService } from './lti.service';
import { CanvasApiError } from '../../integrations/canvas/canvas-errors';
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
      service: new LtiService(
        prisma as never,
        jobs as never,
        roster as never,
        { setAssignmentAllowedAttempts: jest.fn() } as never,
      ),
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
      service: new LtiService(
        prisma as never,
        jobs as never,
        roster as never,
        { setAssignmentAllowedAttempts: jest.fn() } as never,
      ),
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

describe('LtiService Canvas assignment settings', () => {
  const QUIZ_SET = '11111111-1111-4111-8111-111111111111';
  const dto: LaunchSyncDto = {
    lmsType: 'canvas',
    lmsSub: 'student-1',
    role: 'learner',
    courseRole: 'learner',
    lmsContextId: 'context-1',
    resourceLinkId: 'rl-1',
    targetKind: 'quiz_set',
    targetId: QUIZ_SET,
    agsLineItemUrl: 'https://canvas.test/api/lti/courses/8/line_items/3?type=inline',
    agsScoreMaximum: 100,
  };
  const assignmentClaims = {
    canvas_assignment_id: '42',
    assignment_points: '10',
    assignment_due: '2026-12-01T16:59:00Z',
    assignment_unlock: '$Canvas.assignment.unlockAt.iso8601',
    assignment_lock: '2026-12-02T00:00:00Z',
    assignment_attempts: '2',
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
      quiz_sets: { findFirst: jest.fn().mockResolvedValue({ quiz_set_id: QUIZ_SET }) },
      lti_resource_links: {
        upsert: jest.fn().mockResolvedValue({ resource_link_id: 'link-1' }),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      lti_line_items: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
      lti_resource_links: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const jobs = { triggerLaunch: jest.fn(), triggerRosterLaunch: jest.fn() };
    const roster = { recordLaunch: jest.fn().mockResolvedValue(undefined) };
    const canvas = { setAssignmentAllowedAttempts: jest.fn().mockResolvedValue(undefined) };
    return {
      service: new LtiService(
        prisma as never,
        jobs as never,
        roster as never,
        canvas as never,
      ),
      tx,
      prisma,
      canvas,
    };
  }

  it('writes the Assignment settings to the resource link and the points to the line item', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({ ...dto, customClaims: assignmentClaims });

    const link = tx.lti_resource_links.upsert.mock.calls[0][0];
    for (const data of [link.create, link.update]) {
      expect(data).toMatchObject({
        canvas_assignment_id: '42',
        assignment_due_at: new Date('2026-12-01T16:59:00Z'),
        assignment_unlock_at: null,
        assignment_lock_at: new Date('2026-12-02T00:00:00Z'),
        assignment_allowed_attempts: 2,
      });
      expect(data.assignment_synced_at).toBeInstanceOf(Date);
    }
    const item = tx.lti_line_items.upsert.mock.calls[0][0];
    expect(item.create.score_maximum).toBe(10);
    expect(item.update.score_maximum).toBe(10);
  });

  it('lets a change of the maximum score on Canvas replace the one chosen at deep linking', async () => {
    const { service, tx } = setup();
    // Resource link custom ags_score_maximum=100 (lúc Deep Linking) nhưng Canvas giờ là 10.
    await service.syncLaunch({
      ...dto,
      agsScoreMaximum: 100,
      customClaims: { ...assignmentClaims, ags_score_maximum: '100' },
    });
    expect(tx.lti_line_items.upsert.mock.calls[0][0].update.score_maximum).toBe(10);
  });

  it('keeps the stored settings when the launch does not come from an Assignment', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: { canvas_assignment_id: '$Canvas.assignment.id' },
    });
    const link = tx.lti_resource_links.upsert.mock.calls[0][0];
    for (const data of [link.create, link.update]) {
      expect(data).not.toHaveProperty('assignment_synced_at');
      expect(data).not.toHaveProperty('assignment_due_at');
      expect(data).not.toHaveProperty('canvas_assignment_id');
    }
    const item = tx.lti_line_items.upsert.mock.calls[0][0];
    // Giá trị đã lưu không bị ags_score_maximum (hay mặc định 100) ghi đè.
    expect(item.update).not.toHaveProperty('score_maximum');
    expect(item.create.score_maximum).toBe(100);
  });

  it('keeps the old points when Canvas sends a score that cannot be used', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: { ...assignmentClaims, assignment_points: '0' },
    });
    const item = tx.lti_line_items.upsert.mock.calls[0][0];
    expect(item.update).not.toHaveProperty('score_maximum');
    expect(item.create.score_maximum).toBe(100);
  });

  it('records "no limit" as a real value once the Assignment is known', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({
      ...dto,
      customClaims: {
        canvas_assignment_id: '42',
        assignment_points: '10',
        assignment_attempts: '-1',
      },
    });
    const link = tx.lti_resource_links.upsert.mock.calls[0][0];
    expect(link.update).toMatchObject({
      assignment_due_at: null,
      assignment_lock_at: null,
      assignment_allowed_attempts: null,
    });
    expect(link.update.assignment_synced_at).toBeInstanceOf(Date);
  });

  it('tells the web how long an exam takes so the session outlives it', async () => {
    const { service, tx } = setup();
    tx.quiz_sets.findFirst.mockResolvedValue({
      quiz_set_id: QUIZ_SET,
      mode: 'exam',
      time_limit_minutes: 90,
    });
    await expect(
      service.syncLaunch({ ...dto, customClaims: assignmentClaims }),
    ).resolves.toMatchObject({ examTimeLimitMinutes: 90 });
  });

  it('does not report a time limit for practice quizzes or exams without one', async () => {
    const { service, tx } = setup();
    tx.quiz_sets.findFirst.mockResolvedValue({
      quiz_set_id: QUIZ_SET,
      mode: 'practice',
      time_limit_minutes: 90,
    });
    expect(await service.syncLaunch(dto)).not.toHaveProperty('examTimeLimitMinutes');
    tx.quiz_sets.findFirst.mockResolvedValue({
      quiz_set_id: QUIZ_SET,
      mode: 'exam',
      time_limit_minutes: null,
    });
    expect(await service.syncLaunch(dto)).not.toHaveProperty('examTimeLimitMinutes');
  });

  it('rejects a quiz from another course', async () => {
    const { service, tx } = setup();
    tx.quiz_sets.findFirst.mockResolvedValue(null);
    await expect(service.syncLaunch(dto)).rejects.toThrow('không thuộc khóa học');
  });

  it('ignores Assignment variables for other LMS types', async () => {
    const { service, tx } = setup();
    await service.syncLaunch({
      ...dto,
      lmsType: 'moodle',
      customClaims: assignmentClaims,
    });
    const link = tx.lti_resource_links.upsert.mock.calls[0][0];
    expect(link.update).not.toHaveProperty('assignment_synced_at');
  });

  describe('đẩy giới hạn lần làm sang Canvas ở lần đọc đầu', () => {
    const noLimit = {
      canvas_assignment_id: '42',
      assignment_points: '10',
      assignment_due: '2026-12-01T16:59:00Z',
      assignment_attempts: '$Canvas.assignment.allowedAttempts',
      canvas_course_id: '8',
    };
    const exam = (max_attempts: number | null) => ({
      quiz_set_id: QUIZ_SET,
      mode: 'exam',
      time_limit_minutes: null,
      max_attempts,
    });
    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => warn.mockRestore());

    it('đẩy giới hạn của DA sang Canvas rồi mới chốt Canvas làm chủ, không lộ chi tiết cho web', async () => {
      const { service, tx, prisma, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      const result = await service.syncLaunch({ ...dto, customClaims: noLimit });

      expect(canvas.setAssignmentAllowedAttempts).toHaveBeenCalledWith('8', '42', 1);
      const link = tx.lti_resource_links.upsert.mock.calls[0][0];
      for (const data of [link.create, link.update]) {
        expect(data).toMatchObject({ canvas_assignment_id: '42' });
        // Chưa chốt trong giao dịch: cài đặt của DA còn hiệu lực cho tới khi Canvas nhận.
        expect(data).not.toHaveProperty('assignment_synced_at');
      }
      expect(prisma.lti_resource_links.updateMany).toHaveBeenCalledTimes(1);
      const update = prisma.lti_resource_links.updateMany.mock.calls[0][0];
      expect(update.where).toEqual({ resource_link_id: 'link-1', assignment_synced_at: null });
      expect(update.data).toMatchObject({ assignment_allowed_attempts: 1 });
      expect(update.data.assignment_synced_at).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('seed');
      expect(result).toMatchObject({ resourceLinkId: 'link-1' });
    });

    it('khóa không có id số thì gọi Canvas theo lti_context_id', async () => {
      const { service, tx, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(3));
      const { canvas_course_id: _omit, ...claims } = noLimit;
      await service.syncLaunch({ ...dto, customClaims: claims });
      expect(canvas.setAssignmentAllowedAttempts).toHaveBeenCalledWith(
        'lti_context_id:context-1',
        '42',
        3,
      );
    });

    it('Canvas lỗi: launch vẫn vào được, link chưa chốt và điểm vẫn cập nhật', async () => {
      const { service, tx, prisma, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      canvas.setAssignmentAllowedAttempts.mockRejectedValue(
        new CanvasApiError('Canvas trả HTTP 401 khi đặt số lần làm', 401),
      );
      await expect(
        service.syncLaunch({ ...dto, customClaims: noLimit }),
      ).resolves.toMatchObject({ resourceLinkId: 'link-1' });

      expect(prisma.lti_resource_links.updateMany).not.toHaveBeenCalled();
      const link = tx.lti_resource_links.upsert.mock.calls[0][0];
      expect(link.update).not.toHaveProperty('assignment_synced_at');
      expect(tx.lti_line_items.upsert.mock.calls[0][0].update.score_maximum).toBe(10);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('Token Canvas hết hạn');
    });

    it('lần launch sau thử lại sau khi lỗi', async () => {
      const { service, tx, prisma, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      canvas.setAssignmentAllowedAttempts
        .mockRejectedValueOnce(new Error('mạng'))
        .mockResolvedValueOnce(undefined);
      await service.syncLaunch({ ...dto, customClaims: noLimit });
      await service.syncLaunch({ ...dto, customClaims: noLimit });
      expect(canvas.setAssignmentAllowedAttempts).toHaveBeenCalledTimes(2);
      expect(prisma.lti_resource_links.updateMany).toHaveBeenCalledTimes(1);
    });

    it('đẩy được nhưng ghi DB lỗi thì launch vẫn vào được', async () => {
      const { service, tx, prisma } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      prisma.lti_resource_links.updateMany.mockRejectedValue(new Error('db'));
      await expect(
        service.syncLaunch({ ...dto, customClaims: noLimit }),
      ).resolves.toMatchObject({ resourceLinkId: 'link-1' });
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('link đã đọc từ Canvas thì Canvas thắng, kể cả khi giảng viên bỏ giới hạn', async () => {
      const { service, tx, prisma, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      tx.lti_resource_links.findUnique.mockResolvedValue({ assignment_synced_at: new Date() });
      await service.syncLaunch({ ...dto, customClaims: noLimit });

      expect(canvas.setAssignmentAllowedAttempts).not.toHaveBeenCalled();
      expect(prisma.lti_resource_links.updateMany).not.toHaveBeenCalled();
      const link = tx.lti_resource_links.upsert.mock.calls[0][0];
      expect(link.update).toMatchObject({ assignment_allowed_attempts: null });
      expect(link.update.assignment_synced_at).toBeInstanceOf(Date);
    });

    it('Canvas đã có giới hạn thì không đẩy, Canvas làm chủ ngay', async () => {
      const { service, tx, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(exam(1));
      await service.syncLaunch({
        ...dto,
        customClaims: { ...noLimit, assignment_attempts: '3' },
      });
      expect(canvas.setAssignmentAllowedAttempts).not.toHaveBeenCalled();
      expect(tx.lti_resource_links.findUnique).not.toHaveBeenCalled();
      const link = tx.lti_resource_links.upsert.mock.calls[0][0];
      expect(link.update).toMatchObject({ assignment_allowed_attempts: 3 });
      expect(link.update.assignment_synced_at).toBeInstanceOf(Date);
    });

    it.each([
      ['luyện tập', { dto: {}, quizSet: { ...exam(1), mode: 'practice' }, claims: noLimit }],
      ['bài kiểm tra không giới hạn lần làm', { dto: {}, quizSet: exam(null), claims: noLimit }],
      [
        'đích không phải quiz',
        { dto: { targetKind: 'chat' as const, targetId: undefined }, quizSet: exam(1), claims: noLimit },
      ],
      [
        'launch không đi từ Assignment',
        { dto: {}, quizSet: exam(1), claims: { canvas_assignment_id: '$Canvas.assignment.id' } },
      ],
      ['LMS khác Canvas', { dto: { lmsType: 'moodle' as const }, quizSet: exam(1), claims: noLimit }],
    ])('không đẩy gì khi %s', async (_name, c) => {
      const { service, tx, prisma, canvas } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(c.quizSet);
      await service.syncLaunch({ ...dto, ...c.dto, customClaims: c.claims });
      expect(canvas.setAssignmentAllowedAttempts).not.toHaveBeenCalled();
      expect(prisma.lti_resource_links.updateMany).not.toHaveBeenCalled();
    });

    it('accepts targetKind micro_content in DTO and syncs lti_resource_links', async () => {
      const { plainToInstance } = await import('class-transformer');
      const { validate } = await import('class-validator');
      const payload = {
        ...dto,
        resourceLinkId: 'rl-mc-1',
        targetKind: 'micro_content' as const,
        targetId: '22222222-2222-4222-8222-222222222222',
      };
      const errors = await validate(plainToInstance(LaunchSyncDto, payload));
      expect(errors).toHaveLength(0);

      const { service, tx } = setup();
      tx.quiz_sets.findFirst.mockResolvedValue(null);
      await service.syncLaunch(payload);
      expect(tx.lti_resource_links.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            target_kind: 'micro_content',
            target_id: '22222222-2222-4222-8222-222222222222',
          }),
        }),
      );
    });
  });
});
