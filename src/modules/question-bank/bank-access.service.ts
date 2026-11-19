import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { BffClaims } from '../../auth/bff-claims';
import {
  COURSE_ROLES,
  LMS_ADMIN_ROLE,
  STAFF_ROLES,
} from '../../common/constants/course-roles';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Quyền trên ngân hàng câu hỏi (docs/question-bank-design.md §6.1).
 *
 *   VIEW: xem câu, đáp án, lịch sử.
 *   USE:  + đưa câu vào đề của mình, fork.
 *   EDIT: + sửa, duyệt, ngừng dùng, chia sẻ, xuất/nhập Canvas.
 *
 * Quyền hiệu lực là quyền cao nhất trong: admin; chủ ngân hàng; instructor/TA
 * của khoá gốc (ngân hàng mặc định hoặc không PRIVATE); instructor/TA của khoá
 * cùng mã môn khi ngân hàng để SUBJECT (USE); chia sẻ tường minh.
 * Learner không bao giờ thấy ngân hàng.
 */
export type BankRole = 'VIEW' | 'USE' | 'EDIT';

const RANK: Record<BankRole, number> = { VIEW: 1, USE: 2, EDIT: 3 };

export function atLeast(role: BankRole | null, min: BankRole): boolean {
  return role !== null && RANK[role] >= RANK[min];
}

function higher(a: BankRole | null, b: BankRole | null): BankRole | null {
  if (a === null) return b;
  if (b === null) return a;
  return RANK[a] >= RANK[b] ? a : b;
}

export type BankForAccess = {
  bank_id: string;
  owner_id: string | null;
  home_course_id: string;
  subject_code: string | null;
  visibility: string;
};

export type BankShare = {
  grantee_type: string;
  grantee_id: string;
  role: string;
};

export type Viewer = {
  userId: string;
  isAdmin: boolean;
  isLearnerOnly: boolean;
  /** Khoá mà người dùng là instructor/TA (membership đang active). */
  staffCourseIds: Set<string>;
  /** Mã môn của các khoá đó. */
  subjectCodes: Set<string>;
};

/** Vì sao người dùng thấy ngân hàng: để giao diện gom nhóm. */
export type BankRelation = 'mine' | 'course' | 'shared' | 'subject' | 'admin';

export function effectiveBankRole(
  viewer: Viewer,
  bank: BankForAccess,
  shares: BankShare[],
): BankRole | null {
  if (viewer.isAdmin) return 'EDIT';
  if (viewer.isLearnerOnly) return null;

  let role: BankRole | null = null;
  if (bank.owner_id === viewer.userId) {
    role = 'EDIT';
  }
  if (
    viewer.staffCourseIds.has(bank.home_course_id) &&
    (bank.owner_id === null || bank.visibility !== 'PRIVATE')
  ) {
    role = higher(role, 'EDIT');
  }
  if (
    bank.visibility === 'SUBJECT' &&
    bank.subject_code &&
    viewer.subjectCodes.has(bank.subject_code)
  ) {
    role = higher(role, 'USE');
  }
  for (const share of shares) {
    const mine =
      (share.grantee_type === 'USER' && share.grantee_id === viewer.userId) ||
      (share.grantee_type === 'COURSE' &&
        viewer.staffCourseIds.has(share.grantee_id));
    if (
      mine &&
      (share.role === 'VIEW' || share.role === 'USE' || share.role === 'EDIT')
    ) {
      role = higher(role, share.role);
    }
  }
  return role;
}

export function relationOf(
  viewer: Viewer,
  bank: BankForAccess,
  shares: BankShare[],
): BankRelation {
  if (bank.owner_id === viewer.userId) return 'mine';
  if (viewer.staffCourseIds.has(bank.home_course_id)) return 'course';
  const shared = shares.some(
    (s) =>
      (s.grantee_type === 'USER' && s.grantee_id === viewer.userId) ||
      (s.grantee_type === 'COURSE' && viewer.staffCourseIds.has(s.grantee_id)),
  );
  if (shared) return 'shared';
  if (
    bank.visibility === 'SUBJECT' &&
    bank.subject_code &&
    viewer.subjectCodes.has(bank.subject_code)
  ) {
    return 'subject';
  }
  return 'admin';
}

@Injectable()
export class BankAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async viewer(claims: BffClaims): Promise<Viewer> {
    const [user, memberships] = await Promise.all([
      this.prisma.lms_user_mappings.findFirst({
        where: { internal_user_id: claims.sub, deleted_at: null },
        select: { role: true },
      }),
      this.prisma.course_memberships.findMany({
        where: {
          user_id: claims.sub,
          role: { in: [...STAFF_ROLES] },
          status: 'active',
        },
        select: {
          course_id: true,
          courses: { select: { subject_code: true, deleted_at: true } },
        },
      }),
    ]);
    const live = memberships.filter((m) => !m.courses.deleted_at);
    const isAdmin = claims.scope === 'admin' || user?.role === LMS_ADMIN_ROLE;
    const staffCourseIds = new Set(live.map((m) => m.course_id));
    const isLearnerOnly =
      !isAdmin &&
      staffCourseIds.size === 0 &&
      (user?.role === COURSE_ROLES.LEARNER ||
        (!user &&
          claims.roles.includes(COURSE_ROLES.LEARNER) &&
          !claims.roles.some((r) => STAFF_ROLES.includes(r))));
    return {
      userId: claims.sub,
      isAdmin,
      isLearnerOnly,
      staffCourseIds,
      subjectCodes: new Set(
        live.flatMap((m) =>
          m.courses.subject_code ? [m.courses.subject_code] : [],
        ),
      ),
    };
  }

  /** Điều kiện Prisma cho mọi ngân hàng người dùng có quyền ít nhất VIEW. */
  visibleWhere(viewer: Viewer): Prisma.question_banksWhereInput {
    if (viewer.isAdmin) return { deleted_at: null };
    if (viewer.isLearnerOnly) return { bank_id: { in: [] } };
    const courses = [...viewer.staffCourseIds];
    const subjects = [...viewer.subjectCodes];
    return {
      deleted_at: null,
      OR: [
        { owner_id: viewer.userId },
        ...(courses.length
          ? [
              {
                home_course_id: { in: courses },
                OR: [{ owner_id: null }, { visibility: { not: 'PRIVATE' } }],
              },
            ]
          : []),
        ...(subjects.length
          ? [{ visibility: 'SUBJECT', subject_code: { in: subjects } }]
          : []),
        {
          question_bank_shares: {
            some: {
              OR: [
                { grantee_type: 'USER', grantee_id: viewer.userId },
                ...(courses.length
                  ? [{ grantee_type: 'COURSE', grantee_id: { in: courses } }]
                  : []),
              ],
            },
          },
        },
      ],
    };
  }

  async effectiveRole(
    claims: BffClaims,
    bankId: unknown,
  ): Promise<BankRole | null> {
    if (!isUuid(bankId)) return null;
    const [viewer, bank] = await Promise.all([
      this.viewer(claims),
      this.prisma.question_banks.findFirst({
        where: { bank_id: bankId, deleted_at: null },
        include: { question_bank_shares: true },
      }),
    ]);
    if (!bank) return null;
    return effectiveBankRole(viewer, bank, bank.question_bank_shares);
  }

  /** Ngân hàng kèm quyền; NotFound nếu không có, Forbidden nếu quyền thấp hơn `min`. */
  async assertRole(claims: BffClaims, bankId: unknown, min: BankRole) {
    if (!isUuid(bankId)) {
      throw new NotFoundException('Không tìm thấy ngân hàng câu hỏi.');
    }
    const [viewer, bank] = await Promise.all([
      this.viewer(claims),
      this.prisma.question_banks.findFirst({
        where: { bank_id: bankId, deleted_at: null },
        include: { question_bank_shares: true },
      }),
    ]);
    if (!bank) {
      throw new NotFoundException('Không tìm thấy ngân hàng câu hỏi.');
    }
    const role = effectiveBankRole(viewer, bank, bank.question_bank_shares);
    if (!atLeast(role, min)) {
      throw new ForbiddenException(forbiddenMessage(min));
    }
    return { bank, role: role as BankRole, viewer };
  }

  /** Quyền của người dùng trên nhiều ngân hàng cùng lúc (bank_id → quyền). */
  async rolesFor(viewer: Viewer, bankIds: string[]) {
    const ids = [...new Set(bankIds)];
    const banks = ids.length
      ? await this.prisma.question_banks.findMany({
          where: { bank_id: { in: ids }, deleted_at: null },
          include: { question_bank_shares: true },
        })
      : [];
    return new Map(
      banks.map(
        (b) =>
          [
            b.bank_id,
            effectiveBankRole(viewer, b, b.question_bank_shares),
          ] as const,
      ),
    );
  }

  /** Bảo đảm người dùng có quyền ít nhất `min` trên mọi ngân hàng trong danh sách. */
  async assertAll(claims: BffClaims, bankIds: string[], min: BankRole) {
    const viewer = await this.viewer(claims);
    const roles = await this.rolesFor(viewer, bankIds);
    for (const id of new Set(bankIds)) {
      if (!atLeast(roles.get(id) ?? null, min)) {
        throw new ForbiddenException(forbiddenMessage(min));
      }
    }
    return { viewer, roles };
  }

  /** Mọi ngân hàng người dùng có quyền ít nhất `min`, kèm vai trò và quan hệ. */
  async accessibleBanks(claims: BffClaims, min: BankRole) {
    const viewer = await this.viewer(claims);
    if (viewer.isLearnerOnly) return [];
    const banks = await this.prisma.question_banks.findMany({
      where: this.visibleWhere(viewer),
      include: {
        question_bank_shares: true,
        courses: {
          select: {
            course_id: true,
            name: true,
            code: true,
            subject_code: true,
          },
        },
      },
      orderBy: [{ is_course_default: 'desc' }, { created_at: 'asc' }],
      take: 200,
    });
    return banks.flatMap((bank) => {
      const role = effectiveBankRole(viewer, bank, bank.question_bank_shares);
      if (!role || !atLeast(role, min)) return [];
      return [
        {
          bank,
          role,
          relation: relationOf(viewer, bank, bank.question_bank_shares),
        },
      ];
    });
  }
}

function forbiddenMessage(min: BankRole): string {
  switch (min) {
    case 'EDIT':
      return 'Bạn không có quyền sửa ngân hàng câu hỏi này.';
    case 'USE':
      return 'Bạn không có quyền dùng ngân hàng câu hỏi này.';
    case 'VIEW':
      return 'Bạn không có quyền xem ngân hàng câu hỏi này.';
  }
}
