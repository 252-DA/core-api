import { NotFoundException } from '@nestjs/common';
import { RosterSyncService } from './roster-sync.service';
import type { NrpsMember } from './nrps-client.service';

const COURSE = '00000000-0000-0000-0000-000000000001';
const REF = '00000000-0000-0000-0000-000000000002';
const M = 'http://purl.imsglobal.org/vocab/lis/v2/membership';
const LEARNER = [`${M}#Learner`];
const TEACHER = [`${M}#Instructor`];
const TA = [`${M}#Instructor`, `${M}/Instructor#TeachingAssistant`];
const URL_ = 'https://canvas.test/api/lti/courses/8/names_and_roles';

const member = (id: string, roles = LEARNER, extra: Partial<NrpsMember> = {}): NrpsMember => ({
  user_id: id,
  status: 'Active',
  name: `Tên ${id}`,
  roles,
  ...extra,
});

/** Id nội bộ giả: u(sub). */
const uid = (sub: string) => `internal-${sub}`;

function setup(
  members: NrpsMember[],
  options: {
    existingUsers?: Array<{ sub: string; name?: string }>;
    existingMemberships?: Array<{ user_id: string; role: string; status: string; source: string }>;
    ref?: Partial<{
      lms_platform_course_id: string | null;
      nrps_context_memberships_url: string | null;
    }> | null;
  } = {},
) {
  const users = new Map<string, { internal_user_id: string; lms_sub: string; display_name: string }>();
  for (const u of options.existingUsers ?? [])
    users.set(u.sub, { internal_user_id: uid(u.sub), lms_sub: u.sub, display_name: u.name ?? `Tên ${u.sub}` });
  const prisma = {
    lms_user_mappings: {
      findMany: jest.fn().mockImplementation(async ({ where }: { where: { lms_sub: { in: string[] } } }) =>
        where.lms_sub.in.flatMap((sub) => (users.has(sub) ? [users.get(sub)!] : [])),
      ),
      createMany: jest.fn().mockImplementation(async ({ data }: { data: Array<{ lms_sub: string; display_name: string }> }) => {
        for (const row of data)
          users.set(row.lms_sub, {
            internal_user_id: uid(row.lms_sub),
            lms_sub: row.lms_sub,
            display_name: row.display_name,
          });
        return { count: data.length };
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const roster = {
    courseRef: jest.fn().mockResolvedValue(
      options.ref === null
        ? null
        : {
            course_ref_id: REF,
            lms_context_id: 'ctx-1',
            lms_platform_course_id: null,
            nrps_context_memberships_url: URL_,
            ...options.ref,
          },
    ),
    saveCourseLocation: jest.fn().mockResolvedValue(undefined),
    memberships: jest.fn().mockResolvedValue(options.existingMemberships ?? []),
    upsertNrpsMemberships: jest.fn().mockResolvedValue(undefined),
    deactivateMemberships: jest.fn().mockResolvedValue(undefined),
    markRosterSynced: jest.fn().mockResolvedValue(undefined),
  };
  const nrps = { listMembers: jest.fn().mockResolvedValue(members) };
  const canvas = { getCourseByLtiContext: jest.fn().mockResolvedValue({ id: 8 }) };
  const service = new RosterSyncService(prisma as never, roster as never, nrps as never, canvas as never);
  return { service, prisma, roster, nrps, canvas };
}

describe('RosterSyncService.syncCourse', () => {
  const env = process.env.LTI_PLATFORM_URL;
  beforeEach(() => {
    process.env.LTI_PLATFORM_URL = 'https://canvas.test/';
  });
  afterEach(() => {
    if (env === undefined) delete process.env.LTI_PLATFORM_URL;
    else process.env.LTI_PLATFORM_URL = env;
  });

  it('thêm người chưa từng mở DA: tạo mapping và membership NRPS, đếm đúng', async () => {
    const { service, prisma, roster, nrps } = setup([
      member('t1', TEACHER),
      member('s1'),
      member('s2', LEARNER, { status: 'Inactive' }),
    ]);
    const summary = await service.syncCourse(COURSE);
    expect(nrps.listMembers).toHaveBeenCalledWith(URL_);
    expect(prisma.lms_user_mappings.createMany).toHaveBeenCalledWith({
      data: [
        { lms_type: 'canvas', lms_sub: 't1', display_name: 'Tên t1', role: 'instructor' },
        { lms_type: 'canvas', lms_sub: 's1', display_name: 'Tên s1', role: 'learner' },
        { lms_type: 'canvas', lms_sub: 's2', display_name: 'Tên s2', role: 'learner' },
      ],
      skipDuplicates: true,
    });
    expect(roster.upsertNrpsMemberships).toHaveBeenCalledWith(COURSE, [
      { userId: uid('t1'), role: 'instructor', status: 'active' },
      { userId: uid('s1'), role: 'learner', status: 'active' },
      { userId: uid('s2'), role: 'learner', status: 'inactive' },
    ]);
    expect(roster.markRosterSynced).toHaveBeenCalledWith(REF);
    expect(summary).toEqual({ total: 3, created: 3, updated: 0, deactivated: 0, skipped: 0, learners: 1 });
  });

  it('trợ giảng thành ta, role nền tảng instructor', async () => {
    const { service, prisma, roster } = setup([member('ta1', TA)]);
    await service.syncCourse(COURSE);
    expect(prisma.lms_user_mappings.createMany.mock.calls[0][0].data[0].role).toBe('instructor');
    expect(roster.upsertNrpsMemberships.mock.calls[0][1]).toEqual([
      { userId: uid('ta1'), role: 'ta', status: 'active' },
    ]);
  });

  it('role lạ thì bỏ qua và đếm vào skipped', async () => {
    const { service, prisma, roster } = setup([
      member('s1'),
      member('x1', [`${M}#Administrator`]),
      member('x2', []),
    ]);
    const summary = await service.syncCourse(COURSE);
    expect(summary).toMatchObject({ total: 3, skipped: 2, created: 1 });
    expect(prisma.lms_user_mappings.createMany.mock.calls[0][0].data).toHaveLength(1);
    expect(roster.upsertNrpsMemberships.mock.calls[0][1]).toHaveLength(1);
  });

  it('người đã có: không đổi role, không ghi lại membership không đổi, chỉ cập nhật tên thật', async () => {
    const { service, prisma, roster } = setup(
      [
        member('s1'),
        member('t1', TEACHER, { name: 'Cô Mai' }),
        member('s3', LEARNER, { name: undefined, given_name: undefined, family_name: undefined, email: undefined }),
      ],
      {
        existingUsers: [
          { sub: 's1' },
          { sub: 't1', name: 'Tên cũ' },
          { sub: 's3', name: 'Tên từ lần launch' },
        ],
        existingMemberships: [
          { user_id: uid('s1'), role: 'learner', status: 'active', source: 'nrps' },
          { user_id: uid('t1'), role: 'instructor', status: 'active', source: 'launch' },
          { user_id: uid('s3'), role: 'learner', status: 'active', source: 'launch' },
        ],
      },
    );
    const summary = await service.syncCourse(COURSE);
    expect(prisma.lms_user_mappings.createMany).not.toHaveBeenCalled();
    // Chỉ t1 đổi tên; s3 không có tên thật nên giữ tên cũ thay vì ghi đè bằng user_id.
    expect(prisma.lms_user_mappings.update).toHaveBeenCalledTimes(1);
    const update = prisma.lms_user_mappings.update.mock.calls[0][0];
    expect(update.where).toEqual({ internal_user_id: uid('t1') });
    expect(update.data).toMatchObject({ display_name: 'Cô Mai' });
    expect(update.data).not.toHaveProperty('role');
    // s1 đã đúng (nrps, active): không ghi lại; t1 và s3 đổi nguồn launch -> nrps.
    expect(roster.upsertNrpsMemberships.mock.calls[0][1]).toEqual([
      { userId: uid('t1'), role: 'instructor', status: 'active' },
      { userId: uid('s3'), role: 'learner', status: 'active' },
    ]);
    expect(summary).toMatchObject({ created: 0, updated: 2, deactivated: 0, learners: 2 });
  });

  it('tên lùi theo thứ tự name, họ tên ghép, email, rồi user_id cho người mới', async () => {
    const { service, prisma } = setup([
      member('a', LEARNER, { name: undefined, given_name: 'An', family_name: 'Nguyễn' }),
      member('b', LEARNER, { name: undefined, email: 'b@x.test' }),
      member('c', LEARNER, { name: undefined }),
    ]);
    await service.syncCourse(COURSE);
    expect(prisma.lms_user_mappings.createMany.mock.calls[0][0].data.map((d: { display_name: string }) => d.display_name)).toEqual([
      'An Nguyễn',
      'b@x.test',
      'c',
    ]);
  });

  it('người không còn trong danh sách chuyển sang inactive, không xóa', async () => {
    const { service, roster } = setup([member('s1')], {
      existingUsers: [{ sub: 's1' }, { sub: 's2' }],
      existingMemberships: [
        { user_id: uid('s1'), role: 'learner', status: 'active', source: 'nrps' },
        { user_id: uid('s2'), role: 'learner', status: 'active', source: 'launch' },
        { user_id: uid('s3'), role: 'learner', status: 'inactive', source: 'nrps' },
        // Cùng người nhưng role cũ (ví dụ trợ giảng từng launch với role instructor).
        { user_id: uid('s1'), role: 'instructor', status: 'active', source: 'launch' },
      ],
    });
    const summary = await service.syncCourse(COURSE);
    expect(roster.deactivateMemberships).toHaveBeenCalledWith(COURSE, [
      { userId: uid('s2'), role: 'learner' },
      { userId: uid('s1'), role: 'instructor' },
    ]);
    expect(summary).toMatchObject({ deactivated: 2, created: 0, updated: 0 });
  });

  it('khôi phục người quay lại lớp (inactive -> active)', async () => {
    const { service, roster } = setup([member('s1')], {
      existingUsers: [{ sub: 's1' }],
      existingMemberships: [{ user_id: uid('s1'), role: 'learner', status: 'inactive', source: 'nrps' }],
    });
    const summary = await service.syncCourse(COURSE);
    expect(roster.upsertNrpsMemberships.mock.calls[0][1]).toEqual([
      { userId: uid('s1'), role: 'learner', status: 'active' },
    ]);
    expect(summary).toMatchObject({ updated: 1, created: 0, deactivated: 0 });
  });

  it('danh sách rỗng không được dùng để cho cả lớp nghỉ học', async () => {
    const { service, roster } = setup([], {
      existingMemberships: [{ user_id: uid('s1'), role: 'learner', status: 'active', source: 'nrps' }],
    });
    const summary = await service.syncCourse(COURSE);
    expect(roster.deactivateMemberships).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ total: 0, deactivated: 0 });
    expect(roster.markRosterSynced).toHaveBeenCalledWith(REF);
  });

  it('lỗi NRPS thì không ghi gì và không đánh dấu đã đồng bộ', async () => {
    const { service, nrps, roster, prisma } = setup([]);
    nrps.listMembers.mockRejectedValue(new Error('Canvas từ chối đọc danh sách lớp (401).'));
    await expect(service.syncCourse(COURSE)).rejects.toThrow('401');
    expect(prisma.lms_user_mappings.createMany).not.toHaveBeenCalled();
    expect(roster.upsertNrpsMemberships).not.toHaveBeenCalled();
    expect(roster.deactivateMemberships).not.toHaveBeenCalled();
    expect(roster.markRosterSynced).not.toHaveBeenCalled();
  });

  it('khóa chưa có tham chiếu Canvas', async () => {
    const { service, nrps } = setup([], { ref: null });
    await expect(service.syncCourse(COURSE)).rejects.toThrow(NotFoundException);
    expect(nrps.listMembers).not.toHaveBeenCalled();
  });

  describe('địa chỉ NRPS', () => {
    it('suy ra từ id khóa Canvas đã lưu rồi lưu URL', async () => {
      const { service, nrps, roster, canvas } = setup([member('s1')], {
        ref: { nrps_context_memberships_url: null, lms_platform_course_id: '8' },
      });
      await service.syncCourse(COURSE);
      expect(canvas.getCourseByLtiContext).not.toHaveBeenCalled();
      expect(nrps.listMembers).toHaveBeenCalledWith(URL_);
      expect(roster.saveCourseLocation).toHaveBeenCalledWith(REF, { nrpsUrl: URL_ });
    });

    it('chưa biết id khóa thì hỏi Canvas theo lti_context_id và lưu cả id', async () => {
      const { service, nrps, roster, canvas } = setup([member('s1')], {
        ref: { nrps_context_memberships_url: null, lms_platform_course_id: null },
      });
      await service.syncCourse(COURSE);
      expect(canvas.getCourseByLtiContext).toHaveBeenCalledWith('ctx-1');
      expect(nrps.listMembers).toHaveBeenCalledWith(URL_);
      expect(roster.saveCourseLocation).toHaveBeenCalledWith(REF, { nrpsUrl: URL_, platformCourseId: '8' });
    });

    it('dùng URL đã lưu từ lần launch, không gọi Canvas REST', async () => {
      const { service, canvas, roster } = setup([member('s1')]);
      await service.syncCourse(COURSE);
      expect(canvas.getCourseByLtiContext).not.toHaveBeenCalled();
      expect(roster.saveCourseLocation).not.toHaveBeenCalled();
    });

    it('thiếu LTI_PLATFORM_URL thì báo rõ', async () => {
      delete process.env.LTI_PLATFORM_URL;
      const { service } = setup([], { ref: { nrps_context_memberships_url: null, lms_platform_course_id: '8' } });
      await expect(service.syncCourse(COURSE)).rejects.toThrow('LTI_PLATFORM_URL');
    });
  });
});
