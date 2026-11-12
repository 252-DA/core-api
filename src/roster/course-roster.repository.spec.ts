import { Logger } from '@nestjs/common';
import { CourseRosterRepository, canvasNumericId } from './course-roster.repository';

const COURSE = '00000000-0000-0000-0000-000000000001';
const USER = '00000000-0000-0000-0000-000000000002';
const REF = '00000000-0000-0000-0000-000000000003';

const sql = (call: unknown[]) =>
  (call[0] as string[]).join('?').replace(/\s+/g, ' ').trim();

function setup() {
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(1),
    course_memberships: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { repo: new CourseRosterRepository(prisma as never), prisma };
}

describe('canvasNumericId', () => {
  it('chấp nhận số nguyên dương dạng số hoặc chuỗi', () => {
    expect(canvasNumericId('42')).toBe('42');
    expect(canvasNumericId(' 7 ')).toBe('7');
    expect(canvasNumericId(8)).toBe('8');
  });

  it('bỏ biến Canvas chưa mở rộng và giá trị không phải id', () => {
    for (const bad of ['$Canvas.user.id', '', 'abc', '0', '-1', '1.5', '12a', null, undefined, {}, 0])
      expect(canvasNumericId(bad)).toBeUndefined();
  });
});

describe('CourseRosterRepository.recordLaunch', () => {
  const input = {
    internalUserId: USER,
    courseId: COURSE,
    courseRefId: REF,
    courseRole: 'learner',
    platformUserId: '42',
    platformCourseId: '8',
    nrpsUrl: 'https://canvas.test/api/lti/courses/8/names_and_roles',
  };

  it('ghi id Canvas, URL NRPS và đánh dấu membership launch/active', async () => {
    const { repo, prisma } = setup();
    await repo.recordLaunch(input);
    const calls = prisma.$executeRaw.mock.calls;
    expect(calls).toHaveLength(3);
    expect(sql(calls[0])).toContain('UPDATE lms_user_mappings SET lms_platform_user_id');
    expect(calls[0].slice(1)).toEqual(['42', USER, '42']);
    expect(sql(calls[1])).toContain('UPDATE lms_course_ref');
    expect(sql(calls[1])).toContain('COALESCE');
    expect(calls[1].slice(1)).toEqual([
      '8',
      'https://canvas.test/api/lti/courses/8/names_and_roles',
      REF,
    ]);
    expect(sql(calls[2])).toContain("SET source = 'launch', status = 'active'");
    expect(calls[2].slice(1)).toEqual([USER, COURSE, 'learner']);
  });

  it('bỏ qua phần không có dữ liệu (launch thiếu custom field)', async () => {
    const { repo, prisma } = setup();
    await repo.recordLaunch({
      internalUserId: USER,
      courseId: COURSE,
      courseRefId: REF,
      courseRole: 'instructor',
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(sql(prisma.$executeRaw.mock.calls[0])).toContain('UPDATE course_memberships');
  });

  it('không bao giờ ném lỗi: thiếu cột chỉ ghi log để launch vẫn vào được', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      const { repo, prisma } = setup();
      prisma.$executeRaw.mockRejectedValue(new Error('column "source" does not exist'));
      await expect(repo.recordLaunch(input)).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    } finally {
      warn.mockRestore();
    }
  });
});

describe('CourseRosterRepository roster writes', () => {
  it('upsert membership NRPS theo lô, last_seen_at rỗng cho dòng mới', async () => {
    const { repo, prisma } = setup();
    const writes = Array.from({ length: 450 }, (_, i) => ({
      userId: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      role: 'learner',
      status: 'active' as const,
    }));
    await repo.upsertNrpsMemberships(COURSE, writes);
    const calls = prisma.$executeRaw.mock.calls;
    expect(calls).toHaveLength(3);
    expect((calls[0][2] as string[]).length).toBe(200);
    expect((calls[2][2] as string[]).length).toBe(50);
    const text = sql(calls[0]);
    expect(text).toContain('INSERT INTO course_memberships');
    expect(text).toContain("'nrps'");
    expect(text).toContain('NULL, now()');
    expect(text).toContain('ON CONFLICT (user_id, course_id, role)');
    // Dòng đã có giữ nguyên last_seen_at.
    expect(text).not.toMatch(/DO UPDATE SET[^)]*last_seen_at/);
  });

  it('không ghi gì khi không có thay đổi', async () => {
    const { repo, prisma } = setup();
    await repo.upsertNrpsMemberships(COURSE, []);
    await repo.deactivateMemberships(COURSE, []);
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('rời lớp chỉ chuyển sang inactive, không có câu lệnh DELETE nào', async () => {
    const { repo, prisma } = setup();
    await repo.deactivateMemberships(COURSE, [{ userId: USER, role: 'learner' }]);
    const text = sql(prisma.$executeRaw.mock.calls[0]);
    expect(text).toContain("SET status = 'inactive'");
    expect(text).toContain("m.status <> 'inactive'");
    expect(text).not.toMatch(/DELETE/i);
    expect(prisma.$executeRaw.mock.calls[0].slice(1)).toEqual([[USER], ['learner'], COURSE]);
  });

  it('đánh dấu thời điểm đồng bộ danh sách lớp', async () => {
    const { repo, prisma } = setup();
    await repo.markRosterSynced(REF);
    expect(sql(prisma.$executeRaw.mock.calls[0])).toContain('SET nrps_synced_at = now()');
  });

  it('đọc tham chiếu khóa và membership kèm cột mới', async () => {
    const { repo, prisma } = setup();
    prisma.$queryRaw.mockResolvedValueOnce([
      { course_ref_id: REF, lms_context_id: 'ctx', lms_platform_course_id: '8', nrps_context_memberships_url: null },
    ]);
    await expect(repo.courseRef(COURSE)).resolves.toMatchObject({ course_ref_id: REF });
    expect(sql(prisma.$queryRaw.mock.calls[0])).toContain('deleted_at IS NULL');
    await expect(repo.courseRef(COURSE)).resolves.toBeNull();
    await repo.memberships(COURSE);
    expect(sql(prisma.$queryRaw.mock.calls[2])).toContain('SELECT user_id::text AS user_id, role, status, source');
  });
});

describe('CourseRosterRepository.activeLearnerIds', () => {
  it('chỉ lấy learner đang hoạt động', async () => {
    const { repo, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([{ user_id: USER }]);
    await expect(repo.activeLearnerIds(COURSE)).resolves.toEqual([USER]);
    const text = sql(prisma.$queryRaw.mock.calls[0]);
    expect(text).toContain("role = 'learner' AND status = 'active'");
    expect(prisma.course_memberships.findMany).not.toHaveBeenCalled();
  });

  it('chưa có cột status thì lùi về mọi learner như trước khi có danh sách lớp', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      const { repo, prisma } = setup();
      prisma.$queryRaw.mockRejectedValue(
        Object.assign(new Error('column "status" does not exist'), { code: '42703' }),
      );
      prisma.course_memberships.findMany.mockResolvedValue([{ user_id: USER }]);
      await expect(repo.activeLearnerIds(COURSE)).resolves.toEqual([USER]);
      expect(prisma.course_memberships.findMany).toHaveBeenCalledWith({
        where: { course_id: COURSE, role: 'learner' },
        select: { user_id: true },
      });
    } finally {
      warn.mockRestore();
    }
  });

  it('nhận ra lỗi thiếu cột bọc trong cause hoặc meta của Prisma', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    try {
      const { repo, prisma } = setup();
      prisma.$queryRaw.mockRejectedValueOnce({ meta: { code: '42703' } });
      await expect(repo.activeLearnerIds(COURSE)).resolves.toEqual([]);
      prisma.$queryRaw.mockRejectedValueOnce(
        Object.assign(new Error('Raw query failed'), { cause: { code: '42703' } }),
      );
      await expect(repo.activeLearnerIds(COURSE)).resolves.toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it('lỗi khác thì ném lên, không nuốt', async () => {
    const { repo, prisma } = setup();
    prisma.$queryRaw.mockRejectedValue(new Error('connection reset'));
    await expect(repo.activeLearnerIds(COURSE)).rejects.toThrow('connection reset');
    await expect(repo.countActiveLearners(COURSE)).rejects.toThrow('connection reset');
  });

  it('đếm sinh viên đang học, null khi chưa có cột', async () => {
    const { repo, prisma } = setup();
    prisma.$queryRaw.mockResolvedValueOnce([{ n: 37 }]);
    await expect(repo.countActiveLearners(COURSE)).resolves.toBe(37);
    prisma.$queryRaw.mockRejectedValueOnce(Object.assign(new Error('x'), { code: '42703' }));
    await expect(repo.countActiveLearners(COURSE)).resolves.toBeNull();
  });
});
