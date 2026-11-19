import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../../auth/bff-claims';
import {
  atLeast,
  BankAccessService,
  effectiveBankRole,
  relationOf,
  type Viewer,
} from './bank-access.service';

const USER = '00000000-0000-4000-8000-000000000001';
const OTHER_USER = '00000000-0000-4000-8000-000000000002';
const COURSE_MINE = '00000000-0000-4000-8000-000000000011';
const COURSE_OTHER = '00000000-0000-4000-8000-000000000012';
const BANK_ID = '00000000-0000-4000-8000-000000000021';

describe('effectiveBankRole (question-bank-design §6.1)', () => {
  const viewer = (over: Partial<Viewer> = {}): Viewer => ({
    userId: USER,
    isAdmin: false,
    isLearnerOnly: false,
    staffCourseIds: new Set([COURSE_MINE]),
    subjectCodes: new Set(['CO3137']),
    ...over,
  });
  const bank = (over: Record<string, unknown> = {}) => ({
    bank_id: BANK_ID,
    owner_id: OTHER_USER,
    home_course_id: COURSE_OTHER,
    subject_code: 'CO3137',
    visibility: 'COURSE',
    ...over,
  });

  it('chủ ngân hàng và admin có EDIT', () => {
    expect(
      effectiveBankRole(
        viewer(),
        bank({ owner_id: USER, visibility: 'PRIVATE' }),
        [],
      ),
    ).toBe('EDIT');
    expect(
      effectiveBankRole(
        viewer({ isAdmin: true, staffCourseIds: new Set() }),
        bank({ visibility: 'PRIVATE' }),
        [],
      ),
    ).toBe('EDIT');
  });

  it('giảng viên khoá gốc sửa được ngân hàng mặc định và ngân hàng không riêng tư', () => {
    const v = viewer({ staffCourseIds: new Set([COURSE_OTHER]) });
    expect(effectiveBankRole(v, bank({ owner_id: null }), [])).toBe('EDIT');
    expect(effectiveBankRole(v, bank(), [])).toBe('EDIT');
    expect(
      effectiveBankRole(v, bank({ visibility: 'PRIVATE' }), []),
    ).toBeNull();
  });

  it('SUBJECT cho giảng viên khoá cùng mã môn quyền USE, khác môn thì không', () => {
    expect(
      effectiveBankRole(viewer(), bank({ visibility: 'SUBJECT' }), []),
    ).toBe('USE');
    expect(
      effectiveBankRole(
        viewer({ subjectCodes: new Set(['CO1111']) }),
        bank({ visibility: 'SUBJECT' }),
        [],
      ),
    ).toBeNull();
    expect(
      effectiveBankRole(viewer(), bank({ visibility: 'COURSE' }), []),
    ).toBeNull();
  });

  it('chia sẻ tường minh cho người hoặc cho khoá; lấy quyền cao nhất', () => {
    const shares = [
      { grantee_type: 'USER', grantee_id: USER, role: 'VIEW' },
      { grantee_type: 'COURSE', grantee_id: COURSE_MINE, role: 'EDIT' },
      { grantee_type: 'USER', grantee_id: OTHER_USER, role: 'EDIT' },
    ];
    expect(
      effectiveBankRole(
        viewer(),
        bank({ visibility: 'PRIVATE' }),
        shares.slice(0, 1),
      ),
    ).toBe('VIEW');
    expect(
      effectiveBankRole(viewer(), bank({ visibility: 'PRIVATE' }), shares),
    ).toBe('EDIT');
    expect(
      effectiveBankRole(
        viewer(),
        bank({ visibility: 'SUBJECT' }),
        shares.slice(0, 1),
      ),
    ).toBe('USE');
    expect(effectiveBankRole(viewer(), bank(), shares.slice(2))).toBeNull();
  });

  it('learner-only không bao giờ thấy ngân hàng kể cả khi được chia sẻ', () => {
    const v = viewer({
      isLearnerOnly: true,
      staffCourseIds: new Set(),
      subjectCodes: new Set(),
    });
    expect(
      effectiveBankRole(v, bank({ visibility: 'SUBJECT' }), [
        { grantee_type: 'USER', grantee_id: USER, role: 'EDIT' },
      ]),
    ).toBeNull();
  });

  it('atLeast và quan hệ gom nhóm hoạt động đúng', () => {
    expect(atLeast('EDIT', 'USE')).toBe(true);
    expect(atLeast('VIEW', 'USE')).toBe(false);
    expect(atLeast(null, 'VIEW')).toBe(false);
    expect(relationOf(viewer(), bank({ owner_id: USER }), [])).toBe('mine');
    expect(
      relationOf(
        viewer({ staffCourseIds: new Set([COURSE_OTHER]) }),
        bank(),
        [],
      ),
    ).toBe('course');
    expect(relationOf(viewer(), bank({ visibility: 'SUBJECT' }), [])).toBe(
      'subject',
    );
    expect(
      relationOf(viewer(), bank(), [
        { grantee_type: 'USER', grantee_id: USER, role: 'USE' },
      ]),
    ).toBe('shared');
    expect(
      relationOf(
        viewer({ isAdmin: true, staffCourseIds: new Set() }),
        bank(),
        [],
      ),
    ).toBe('admin');
  });
});

describe('BankAccessService', () => {
  const claims: BffClaims = {
    sub: USER,
    courseId: COURSE_MINE,
    roles: ['instructor'],
    scope: 'course',
    jti: 'j1',
    iat: 0,
    exp: 1,
  };

  function setup(opts?: {
    userRole?: string;
    memberships?: Array<{
      course_id: string;
      courses: { subject_code: string | null; deleted_at: Date | null };
    }>;
    bank?: Record<string, unknown> | null;
    banks?: Array<Record<string, unknown>>;
  }) {
    const prisma = {
      lms_user_mappings: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ role: opts?.userRole ?? 'instructor' }),
      },
      course_memberships: {
        findMany: jest.fn().mockResolvedValue(
          opts?.memberships ?? [
            {
              course_id: COURSE_MINE,
              courses: { subject_code: 'CO3137', deleted_at: null },
            },
          ],
        ),
      },
      question_banks: {
        findFirst: jest.fn().mockResolvedValue(
          opts && 'bank' in opts
            ? opts.bank
            : {
                bank_id: BANK_ID,
                owner_id: OTHER_USER,
                home_course_id: COURSE_OTHER,
                subject_code: 'CO3137',
                visibility: 'COURSE',
                question_bank_shares: [],
              },
        ),
        findMany: jest.fn().mockResolvedValue(opts?.banks ?? []),
      },
    };
    return { prisma, service: new BankAccessService(prisma as never) };
  }

  it('assertRole trả 404 khi id không phải UUID hoặc ngân hàng không tồn tại', async () => {
    const { service } = setup({ bank: null });
    await expect(
      service.assertRole(claims, 'not-a-uuid', 'VIEW'),
    ).rejects.toThrow(NotFoundException);
    await expect(service.assertRole(claims, BANK_ID, 'VIEW')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assertRole trả 403 khi thiếu quyền và thành công khi đủ quyền', async () => {
    const { service } = setup({
      bank: {
        bank_id: BANK_ID,
        owner_id: OTHER_USER,
        home_course_id: COURSE_OTHER,
        subject_code: 'CO3137',
        visibility: 'SUBJECT',
        question_bank_shares: [],
      },
    });
    await expect(service.effectiveRole(claims, BANK_ID)).resolves.toBe('USE');
    await expect(
      service.assertRole(claims, BANK_ID, 'USE'),
    ).resolves.toMatchObject({ role: 'USE' });
    await expect(service.assertRole(claims, BANK_ID, 'EDIT')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('assertAll từ chối nếu bất kỳ ngân hàng nào không đủ quyền', async () => {
    const BANK_2 = '00000000-0000-4000-8000-000000000022';
    const { service } = setup({
      banks: [
        {
          bank_id: BANK_ID,
          owner_id: USER,
          home_course_id: COURSE_MINE,
          subject_code: 'CO3137',
          visibility: 'COURSE',
          question_bank_shares: [],
        },
        {
          bank_id: BANK_2,
          owner_id: OTHER_USER,
          home_course_id: COURSE_OTHER,
          subject_code: 'CO3137',
          visibility: 'PRIVATE',
          question_bank_shares: [],
        },
      ],
    });
    await expect(
      service.assertAll(claims, [BANK_ID, BANK_2], 'USE'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('accessibleBanks lọc đúng ngân hàng đạt ngưỡng USE (gồm SUBJECT cùng môn, bỏ PRIVATE người khác)', async () => {
    const BANK_SUBJ = '00000000-0000-4000-8000-000000000023';
    const BANK_VIEW = '00000000-0000-4000-8000-000000000024';
    const BANK_DIFF = '00000000-0000-4000-8000-000000000025';
    const { service } = setup({
      banks: [
        {
          bank_id: BANK_SUBJ,
          owner_id: OTHER_USER,
          home_course_id: COURSE_OTHER,
          subject_code: 'CO3137',
          visibility: 'SUBJECT',
          question_bank_shares: [],
          courses: { course_id: COURSE_OTHER, name: 'Lớp L02' },
        },
        {
          bank_id: BANK_VIEW,
          owner_id: OTHER_USER,
          home_course_id: COURSE_OTHER,
          subject_code: 'CO3137',
          visibility: 'PRIVATE',
          question_bank_shares: [
            { grantee_type: 'USER', grantee_id: USER, role: 'VIEW' },
          ],
          courses: { course_id: COURSE_OTHER, name: 'Lớp L02' },
        },
        {
          bank_id: BANK_DIFF,
          owner_id: OTHER_USER,
          home_course_id: COURSE_OTHER,
          subject_code: 'CO3011',
          visibility: 'SUBJECT',
          question_bank_shares: [],
          courses: { course_id: COURSE_OTHER, name: 'Môn khác' },
        },
      ],
    });
    const usable = await service.accessibleBanks(claims, 'USE');
    expect(usable.map((x) => [x.bank.bank_id, x.role, x.relation])).toEqual([
      [BANK_SUBJ, 'USE', 'subject'],
    ]);
  });
});
