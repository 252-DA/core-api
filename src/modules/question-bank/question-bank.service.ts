import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthzService } from '../../auth/authz.service';
import type { BffClaims } from '../../auth/bff-claims';
import { STAFF_ROLES } from '../../common/constants/course-roles';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { isQuestionType, normalizeAnswerKey } from '../question/question-types';
import {
  atLeast,
  BankAccessService,
  effectiveBankRole,
  relationOf,
  type BankRole,
  type BankShare,
} from './bank-access.service';

export function normalizeLoStatement(text: string | null | undefined): string {
  return typeof text === 'string'
    ? text.trim().replace(/\s+/g, ' ').toLowerCase()
    : '';
}

const VISIBILITIES = ['PRIVATE', 'COURSE', 'SUBJECT'] as const;
const SHARE_ROLES = ['VIEW', 'USE', 'EDIT'] as const;
const GRANTEE_TYPES = ['USER', 'COURSE'] as const;
const ORIGINS = ['AI_GENERATED', 'MANUAL', 'CANVAS_IMPORT', 'FORK'];
const STATUSES = [
  'GENERATED_DRAFT',
  'REVIEWING',
  'CHANGES_REQUESTED',
  'APPROVED',
  'PUBLISHED',
  'RETIRED',
];

/** Trạng thái câu dùng được trong đề. */
export const USABLE_STATUSES = ['APPROVED', 'PUBLISHED'];

function readText(
  value: unknown,
  max: number,
  label: string,
  required = true,
): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new BadRequestException(`${label} không được để trống.`);
    }
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadRequestException(`${label} không hợp lệ.`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new BadRequestException(`${label} không được để trống.`);
  }
  if (trimmed.length > max) {
    throw new BadRequestException(`${label} dài quá ${max} ký tự.`);
  }
  return trimmed || null;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (
    typeof value !== 'string' ||
    !(allowed as readonly string[]).includes(value)
  ) {
    throw new BadRequestException(`${label} không hợp lệ.`);
  }
  return value as T;
}

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly access: BankAccessService,
  ) {}

  /**
   * Ngân hàng người dùng thấy được, kèm quyền hiệu lực và số câu theo trạng
   * thái. Truyền `courseId` (khoá đang mở) thì bảo đảm khoá có ngân hàng mặc định.
   */
  async listBanks(claims: BffClaims, courseId?: string) {
    const viewer = await this.access.viewer(claims);
    if (viewer.isLearnerOnly) {
      return [];
    }
    if (
      isUuid(courseId) &&
      (viewer.isAdmin || viewer.staffCourseIds.has(courseId))
    ) {
      await this.prisma
        .$queryRaw`SELECT ensure_default_question_bank(${courseId}::uuid)`;
    }
    const banks = await this.prisma.question_banks.findMany({
      where: this.access.visibleWhere(viewer),
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
        owner: { select: { internal_user_id: true, display_name: true } },
      },
      orderBy: [{ is_course_default: 'desc' }, { created_at: 'asc' }],
      take: 200,
    });
    const counts = banks.length
      ? await this.prisma.quiz_items.groupBy({
          by: ['bank_id', 'status'],
          where: {
            bank_id: { in: banks.map((b) => b.bank_id) },
            deleted_at: null,
          },
          _count: { _all: true },
        })
      : [];
    const editableShares = banks
      .filter((bank) =>
        atLeast(
          effectiveBankRole(viewer, bank, bank.question_bank_shares),
          'EDIT',
        ),
      )
      .flatMap((bank) => bank.question_bank_shares);
    const shareLabels = await this.shareLabelMaps(editableShares);
    return banks.map((bank) => {
      const role = effectiveBankRole(
        viewer,
        bank,
        bank.question_bank_shares,
      ) as BankRole;
      const byStatus: Record<string, number> = {};
      for (const c of counts) {
        if (c.bank_id === bank.bank_id) {
          byStatus[c.status] = c._count._all;
        }
      }
      const canChangeVisibility =
        viewer.isAdmin ||
        bank.owner_id === viewer.userId ||
        (bank.owner_id === null &&
          viewer.staffCourseIds.has(bank.home_course_id));
      return {
        bank_id: bank.bank_id,
        title: bank.title,
        description: bank.description,
        visibility: bank.visibility,
        is_course_default: bank.is_course_default,
        subject_code: bank.subject_code ?? bank.courses.subject_code,
        home_course: {
          course_id: bank.courses.course_id,
          name: bank.courses.name,
          subject_code: bank.courses.subject_code ?? bank.courses.code,
        },
        owner: bank.owner
          ? {
              user_id: bank.owner.internal_user_id,
              display_name: bank.owner.display_name,
            }
          : null,
        role,
        can_change_visibility: canChangeVisibility,
        relation: relationOf(viewer, bank, bank.question_bank_shares),
        is_current_course: bank.home_course_id === courseId,
        counts: {
          // Câu ngừng dùng không tính vào tổng sử dụng được.
          total: Object.entries(byStatus)
            .filter(([status]) => status !== 'RETIRED')
            .reduce((sum, [, n]) => sum + n, 0),
          usable: (byStatus.APPROVED ?? 0) + (byStatus.PUBLISHED ?? 0),
          retired: byStatus.RETIRED ?? 0,
          by_status: byStatus,
        },
        shares: atLeast(role, 'EDIT')
          ? bank.question_bank_shares.map((s) => ({
              ...s,
              grantee_label: this.labelForShare(shareLabels, s),
            }))
          : undefined,
      };
    });
  }

  async createBank(
    claims: BffClaims,
    body: {
      courseId?: string;
      homeCourseId?: string;
      title?: unknown;
      description?: unknown;
      visibility?: unknown;
    },
  ) {
    const courseId = body.courseId ?? body.homeCourseId;
    if (!isUuid(courseId)) {
      throw new BadRequestException('Khoá học không hợp lệ.');
    }
    await this.authz.assertCourseAccess(claims, courseId, STAFF_ROLES);
    const title = readText(body.title, 255, 'Tên ngân hàng') as string;
    const description = readText(body.description, 2000, 'Mô tả', false);
    const visibility =
      body.visibility === undefined
        ? 'COURSE'
        : oneOf(body.visibility, VISIBILITIES, 'Phạm vi');
    const course = await this.prisma.courses.findFirst({
      where: { course_id: courseId, deleted_at: null },
      select: { subject_code: true },
    });
    if (!course) {
      throw new NotFoundException('Không tìm thấy khoá học.');
    }
    if (visibility === 'SUBJECT' && !course.subject_code) {
      throw new BadRequestException(
        'Khoá học chưa có mã môn (hãy nạp đề cương trước khi chia sẻ theo môn).',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const bank = await tx.question_banks.create({
        data: {
          title,
          description,
          visibility,
          owner_id: claims.sub,
          home_course_id: courseId,
          subject_code: course.subject_code,
        },
      });
      await this.audit(
        tx,
        claims,
        'CREATE_QUESTION_BANK',
        'question_bank',
        bank.bank_id,
        { title, visibility },
      );
      return bank;
    });
  }

  async updateBank(
    claims: BffClaims,
    bankId: string,
    body: { title?: unknown; description?: unknown; visibility?: unknown },
  ) {
    const { bank, viewer } = await this.access.assertRole(
      claims,
      bankId,
      'EDIT',
    );
    const data: Prisma.question_banksUpdateInput = { updated_at: new Date() };
    if (body.title !== undefined) {
      data.title = readText(body.title, 255, 'Tên ngân hàng') as string;
    }
    if (body.description !== undefined) {
      data.description = readText(body.description, 2000, 'Mô tả', false);
    }
    if (body.visibility !== undefined) {
      const visibility = oneOf(body.visibility, VISIBILITIES, 'Phạm vi');
      // Chỉ chủ, admin, hoặc giảng viên khoá gốc (với ngân hàng mặc định) mới đổi được phạm vi.
      const canScope =
        viewer.isAdmin ||
        bank.owner_id === viewer.userId ||
        (bank.owner_id === null &&
          viewer.staffCourseIds.has(bank.home_course_id));
      if (!canScope) {
        throw new ForbiddenException(
          'Chỉ chủ ngân hàng được đổi phạm vi chia sẻ.',
        );
      }
      if (bank.is_course_default && visibility === 'PRIVATE') {
        throw new BadRequestException(
          'Ngân hàng chung của khoá không thể để riêng tư.',
        );
      }
      if (visibility === 'SUBJECT') {
        const homeCourse = await this.prisma.courses.findFirst({
          where: { course_id: bank.home_course_id, deleted_at: null },
          select: { subject_code: true },
        });
        const subjectCode = homeCourse?.subject_code ?? bank.subject_code;
        if (!subjectCode) {
          throw new BadRequestException(
            'Khoá học chưa có mã môn (hãy nạp đề cương trước khi chia sẻ theo môn).',
          );
        }
        data.subject_code = subjectCode;
      }
      data.visibility = visibility;
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.question_banks.update({
        where: { bank_id: bank.bank_id },
        data,
      });
      await this.audit(
        tx,
        claims,
        'UPDATE_QUESTION_BANK',
        'question_bank',
        bank.bank_id,
        {
          before: { title: bank.title, visibility: bank.visibility },
          after: { title: updated.title, visibility: updated.visibility },
        },
      );
      return updated;
    });
  }

  async listItems(
    claims: BffClaims,
    bankId: string,
    query: {
      lo?: string;
      type?: string;
      status?: string;
      origin?: string;
      search?: string;
    },
  ) {
    const { bank, role, viewer } = await this.access.assertRole(
      claims,
      bankId,
      'VIEW',
    );
    const where: Prisma.quiz_itemsWhereInput = {
      bank_id: bank.bank_id,
      deleted_at: null,
    };
    if (typeof query.type === 'string' && isQuestionType(query.type)) {
      where.type = query.type;
    }
    if (typeof query.status === 'string' && STATUSES.includes(query.status)) {
      where.status = query.status;
    } else {
      where.status = { not: 'RETIRED' };
    }
    if (typeof query.origin === 'string' && ORIGINS.includes(query.origin)) {
      where.origin = query.origin;
    }
    if (typeof query.lo === 'string' && query.lo.trim()) {
      const lo = query.lo.trim();
      if (isUuid(lo)) {
        where.lo_id = lo;
      } else {
        where.learning_outcomes = { code: lo };
      }
    }
    if (typeof query.search === 'string' && query.search.trim()) {
      where.question = {
        contains: query.search.trim().slice(0, 200),
        mode: 'insensitive',
      };
    }
    const [homeCourse, items, shareLabels] = await Promise.all([
      this.prisma.courses.findFirst({
        where: { course_id: bank.home_course_id, deleted_at: null },
        select: { course_id: true, name: true, code: true, subject_code: true },
      }),
      this.prisma.quiz_items.findMany({
        where,
        include: {
          learning_outcomes: {
            select: { lo_id: true, code: true, statement_vi: true },
          },
          current_version: { select: { version_id: true, version_no: true } },
          author: { select: { display_name: true } },
          question_lms_links: {
            select: {
              direction: true,
              lms_type: true,
              lms_context_type: true,
              lms_context_id: true,
              ext_bank_id: true,
              ext_bank_title: true,
              ext_question_id: true,
              version_id: true,
              synced_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 500,
      }),
      atLeast(role, 'EDIT')
        ? this.shareLabelMaps(bank.question_bank_shares)
        : Promise.resolve({
            users: new Map<string, string>(),
            courses: new Map<string, string>(),
          }),
    ]);
    const canChangeVisibility =
      viewer.isAdmin ||
      bank.owner_id === viewer.userId ||
      (bank.owner_id === null &&
        viewer.staffCourseIds.has(bank.home_course_id));
    return {
      bank: {
        bank_id: bank.bank_id,
        title: bank.title,
        description: bank.description,
        visibility: bank.visibility,
        is_course_default: bank.is_course_default,
        subject_code: bank.subject_code ?? homeCourse?.subject_code ?? null,
        home_course_id: bank.home_course_id,
        home_course_name: homeCourse?.name ?? null,
        can_change_visibility: canChangeVisibility,
        role,
        shares: atLeast(role, 'EDIT')
          ? bank.question_bank_shares.map((s) => ({
              ...s,
              grantee_label: this.labelForShare(shareLabels, s),
            }))
          : undefined,
      },
      items: items.map(({ question_lms_links, ...item }) => ({
        ...item,
        lms_links: question_lms_links.map((link) => ({
          ...link,
          // Canvas đang giữ phiên bản cũ hơn bản hiện tại: cần đẩy lại.
          stale: link.version_id !== item.current_version_id,
        })),
      })),
    };
  }

  /** Câu giảng viên tự viết: đã duyệt ngay vì người viết chính là người duyệt. */
  async createItem(
    claims: BffClaims,
    bankId: string,
    body: {
      type?: unknown;
      question?: unknown;
      options?: unknown;
      correct_answer?: unknown;
      explanation?: unknown;
      loId?: unknown;
      bloomLevel?: unknown;
    },
  ) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    if (typeof body.type !== 'string' || !isQuestionType(body.type)) {
      throw new BadRequestException('Kiểu câu hỏi không hợp lệ.');
    }
    const type = body.type;
    const question = readText(body.question, 5000, 'Câu hỏi') as string;
    const key = normalizeAnswerKey(type, question, {
      options: body.options,
      correct_answer: body.correct_answer,
    });
    const explanation = readText(body.explanation, 5000, 'Giải thích', false);
    const loId = await this.loOfCourse(body.loId, bank.home_course_id);
    const bloom =
      body.bloomLevel === undefined || body.bloomLevel === null
        ? null
        : Number(body.bloomLevel);
    if (
      bloom !== null &&
      !(Number.isInteger(bloom) && bloom >= 1 && bloom <= 6)
    ) {
      throw new BadRequestException('Mức Bloom phải từ 1 đến 6.');
    }
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.quiz_items.create({
        data: {
          bank_id: bank.bank_id,
          course_id: bank.home_course_id,
          lesson_id: null,
          lo_id: loId,
          type,
          question,
          options: (key.options === null
            ? Prisma.DbNull
            : key.options) as Prisma.InputJsonValue,
          correct_answer: key.correct_answer as Prisma.InputJsonValue,
          explanation,
          bloom_level: bloom,
          source_chunk_ids: [],
          status: 'APPROVED',
          origin: 'MANUAL',
          author_id: claims.sub,
          updated_by: claims.sub,
        },
      });
      // Đọc lại để lấy current_version_id do trigger AFTER INSERT ghi.
      const item = await tx.quiz_items.findUniqueOrThrow({
        where: { quiz_id: created.quiz_id },
      });
      await this.audit(tx, claims, 'CREATE_QUIZ', 'quiz_item', item.quiz_id, {
        bank_id: bank.bank_id,
      });
      return item;
    });
  }

  /**
   * Ứng viên chia sẻ: các khoá cùng mã môn với ngân hàng và giảng viên của chúng.
   * Nếu khoá chưa nạp đề cương (chưa có subject_code), trả về giảng viên của chính khoá gốc.
   */
  async shareCandidates(claims: BffClaims, bankId: string) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    const homeCourse = await this.prisma.courses.findFirst({
      where: { course_id: bank.home_course_id, deleted_at: null },
      select: { subject_code: true },
    });
    const subjectCode = bank.subject_code ?? homeCourse?.subject_code ?? null;
    const courses = await this.prisma.courses.findMany({
      where: subjectCode
        ? { subject_code: subjectCode, deleted_at: null }
        : { course_id: bank.home_course_id, deleted_at: null },
      select: {
        course_id: true,
        name: true,
        course_memberships: {
          where: { role: { in: [...STAFF_ROLES] }, status: 'active' },
          select: {
            role: true,
            lms_user_mappings: {
              select: {
                internal_user_id: true,
                display_name: true,
                deleted_at: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
    const users = new Map<
      string,
      { user_id: string; display_name: string; courses: string[] }
    >();
    for (const course of courses) {
      for (const m of course.course_memberships) {
        const u = m.lms_user_mappings;
        if (u.deleted_at || u.internal_user_id === claims.sub) continue;
        const entry = users.get(u.internal_user_id) ?? {
          user_id: u.internal_user_id,
          display_name: u.display_name,
          courses: [],
        };
        if (!entry.courses.includes(course.name)) {
          entry.courses.push(course.name);
        }
        users.set(u.internal_user_id, entry);
      }
    }
    return {
      subject_code: subjectCode,
      courses: courses
        .filter((c) => c.course_id !== bank.home_course_id)
        .map((c) => ({ course_id: c.course_id, name: c.name })),
      users: [...users.values()],
    };
  }

  /**
   * Nhân bản (fork) câu hỏi sang ngân hàng khác mà người dùng có quyền EDIT (§6.3).
   * Dùng uuidv7() mới, map LO theo mã sang khoá của ngân hàng đích, ghi audit FORK_QUIZ.
   */
  async forkItem(
    claims: BffClaims,
    bankId: string,
    quizId: string,
    body: { targetBankId?: unknown },
  ) {
    if (!isUuid(quizId)) {
      throw new BadRequestException('Câu hỏi không hợp lệ.');
    }
    const { bank: source } = await this.access.assertRole(
      claims,
      bankId,
      'USE',
    );
    const { bank: target } = await this.access.assertRole(
      claims,
      body.targetBankId,
      'EDIT',
    );
    if (target.bank_id === source.bank_id) {
      throw new BadRequestException(
        'Ngân hàng đích phải khác ngân hàng nguồn.',
      );
    }
    const src = await this.prisma.quiz_items.findFirst({
      where: { quiz_id: quizId, bank_id: source.bank_id, deleted_at: null },
      include: {
        learning_outcomes: {
          select: {
            lo_id: true,
            code: true,
            statement_vi: true,
            deleted_at: true,
          },
        },
        current_version: true,
      },
    });
    if (!src) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong ngân hàng.');
    }

    const sourceLo =
      src.learning_outcomes && !src.learning_outcomes.deleted_at
        ? src.learning_outcomes
        : null;
    const loCode = sourceLo?.code ?? null;
    let loId: string | null = null;
    let loStatementDiffers = false;

    if (sourceLo) {
      if (src.course_id === target.home_course_id) {
        loId = sourceLo.lo_id;
      } else {
        const targetLo = await this.prisma.learning_outcomes.findFirst({
          where: {
            course_id: target.home_course_id,
            code: sourceLo.code,
            is_current: true,
            deleted_at: null,
          },
          orderBy: { version: 'desc' },
          select: { lo_id: true, statement_vi: true },
        });
        if (targetLo) {
          loId = targetLo.lo_id;
          loStatementDiffers =
            normalizeLoStatement(sourceLo.statement_vi) !==
            normalizeLoStatement(targetLo.statement_vi);
        }
      }
    }

    const snapshot = src.current_version ?? src;
    const loMapped = !loCode || loId !== null;
    return this.prisma.$transaction(async (tx) => {
      // Không đặt quiz_id để Postgres sinh uuidv7() mới, tránh trùng id câu gốc.
      const created = await tx.quiz_items.create({
        data: {
          bank_id: target.bank_id,
          course_id: target.home_course_id,
          lesson_id: null,
          lo_id: loId,
          type: snapshot.type,
          question: snapshot.question,
          options: (snapshot.options === null
            ? Prisma.DbNull
            : snapshot.options) as Prisma.InputJsonValue,
          correct_answer: snapshot.correct_answer as Prisma.InputJsonValue,
          explanation: snapshot.explanation,
          bloom_level: snapshot.bloom_level,
          source_chunk_ids: snapshot.source_chunk_ids,
          status: USABLE_STATUSES.includes(src.status)
            ? 'APPROVED'
            : 'GENERATED_DRAFT',
          origin: 'FORK',
          forked_from_version_id: src.current_version_id,
          author_id: claims.sub,
          updated_by: claims.sub,
          provenance: {
            forked_from_quiz_id: src.quiz_id,
            forked_from_bank_id: source.bank_id,
            ...(src.current_version_id
              ? { forked_from_version_id: src.current_version_id }
              : {}),
            ...(loCode && !loId ? { unmapped_lo_code: loCode } : {}),
          },
        },
      });
      // Đọc lại để lấy current_version_id do trigger AFTER INSERT ghi.
      const item = await tx.quiz_items.findUniqueOrThrow({
        where: { quiz_id: created.quiz_id },
      });
      await this.audit(tx, claims, 'FORK_QUIZ', 'quiz_item', item.quiz_id, {
        from: src.quiz_id,
        from_version: src.current_version_id,
        from_bank: source.bank_id,
        to_bank: target.bank_id,
        lo_mapped: loMapped,
      });
      return {
        item,
        source_quiz_id: src.quiz_id,
        target_bank_id: target.bank_id,
        lo_mapped: loMapped,
        unmapped_lo_code: loCode && !loId ? loCode : null,
        lo_statement_differs: loStatementDiffers,
      };
    });
  }

  async share(
    claims: BffClaims,
    bankId: string,
    body: { granteeType?: unknown; granteeId?: unknown; role?: unknown },
  ) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    const granteeType = oneOf(
      body.granteeType,
      GRANTEE_TYPES,
      'Đối tượng chia sẻ',
    );
    const role = oneOf(body.role, SHARE_ROLES, 'Quyền chia sẻ');
    if (!isUuid(body.granteeId)) {
      throw new BadRequestException('Đối tượng chia sẻ không hợp lệ.');
    }
    const granteeId = body.granteeId;
    const exists =
      granteeType === 'USER'
        ? await this.prisma.lms_user_mappings.count({
            where: { internal_user_id: granteeId, deleted_at: null },
          })
        : await this.prisma.courses.count({
            where: { course_id: granteeId, deleted_at: null },
          });
    if (!exists) {
      throw new NotFoundException('Không tìm thấy người dùng hoặc khoá học.');
    }
    return this.prisma.$transaction(async (tx) => {
      const share = await tx.question_bank_shares.upsert({
        where: {
          bank_id_grantee_type_grantee_id: {
            bank_id: bank.bank_id,
            grantee_type: granteeType,
            grantee_id: granteeId,
          },
        },
        create: {
          bank_id: bank.bank_id,
          grantee_type: granteeType,
          grantee_id: granteeId,
          role,
          granted_by: claims.sub,
        },
        update: { role, granted_by: claims.sub },
      });
      await this.audit(
        tx,
        claims,
        'SHARE_QUESTION_BANK',
        'question_bank',
        bank.bank_id,
        {
          grantee_type: granteeType,
          grantee_id: granteeId,
          role,
        },
      );
      return share;
    });
  }

  async unshare(
    claims: BffClaims,
    bankId: string,
    body: { granteeType?: unknown; granteeId?: unknown },
  ) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    const granteeType = oneOf(
      body.granteeType,
      GRANTEE_TYPES,
      'Đối tượng chia sẻ',
    );
    if (!isUuid(body.granteeId)) {
      throw new BadRequestException('Đối tượng chia sẻ không hợp lệ.');
    }
    const granteeId = body.granteeId;
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.question_bank_shares.deleteMany({
        where: {
          bank_id: bank.bank_id,
          grantee_type: granteeType,
          grantee_id: granteeId,
        },
      });
      await this.audit(
        tx,
        claims,
        'UNSHARE_QUESTION_BANK',
        'question_bank',
        bank.bank_id,
        {
          grantee_type: granteeType,
          grantee_id: granteeId,
        },
      );
      return { removed: count };
    });
  }

  async listVersions(claims: BffClaims, quizId: string) {
    if (!isUuid(quizId)) {
      throw new BadRequestException('Câu hỏi không hợp lệ.');
    }
    const item = await this.prisma.quiz_items.findFirst({
      where: { quiz_id: quizId, deleted_at: null },
      select: {
        quiz_id: true,
        bank_id: true,
        current_version_id: true,
        forked_from_version_id: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy câu hỏi.');
    }
    await this.access.assertRole(claims, item.bank_id, 'VIEW');
    const versions = await this.prisma.quiz_item_versions.findMany({
      where: { quiz_id: item.quiz_id },
      include: { creator: { select: { display_name: true } } },
      orderBy: { version_no: 'desc' },
    });
    return {
      quiz_id: item.quiz_id,
      current_version_id: item.current_version_id,
      forked_from_version_id: item.forked_from_version_id,
      versions,
    };
  }

  /** Ngừng dùng câu (hoặc khôi phục nếu `restore = true`): ẩn khỏi ngân hàng và soạn đề mới. */
  async retireItem(
    claims: BffClaims,
    bankId: string,
    quizId: string,
    body?: { restore?: boolean },
  ) {
    const { bank } = await this.access.assertRole(claims, bankId, 'EDIT');
    if (!isUuid(quizId)) {
      throw new BadRequestException('Câu hỏi không hợp lệ.');
    }
    const item = await this.prisma.quiz_items.findFirst({
      where: { quiz_id: quizId, bank_id: bank.bank_id, deleted_at: null },
      select: { quiz_id: true, bank_id: true, status: true },
    });
    if (!item) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong ngân hàng.');
    }
    const restore = body?.restore === true;
    const next = restore
      ? item.status === 'RETIRED'
        ? 'APPROVED'
        : item.status
      : 'RETIRED';
    if (next === item.status) {
      return { quiz_id: item.quiz_id, status: item.status, updated: false };
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quiz_items.update({
        where: { quiz_id: item.quiz_id },
        data: { status: next, updated_at: new Date() },
      });
      await this.audit(
        tx,
        claims,
        restore ? 'RESTORE_QUIZ' : 'RETIRE_QUIZ',
        'quiz_item',
        item.quiz_id,
        {
          before: item.status,
          after: next,
        },
      );
      return {
        quiz_id: updated.quiz_id,
        status: updated.status,
        updated: true,
      };
    });
  }

  private async shareLabelMaps(shares: BankShare[]) {
    const userIds = [
      ...new Set(
        shares
          .filter((s) => s.grantee_type === 'USER')
          .map((s) => s.grantee_id),
      ),
    ];
    const courseIds = [
      ...new Set(
        shares
          .filter((s) => s.grantee_type === 'COURSE')
          .map((s) => s.grantee_id),
      ),
    ];
    const [users, courses] = await Promise.all([
      userIds.length
        ? this.prisma.lms_user_mappings.findMany({
            where: { internal_user_id: { in: userIds } },
            select: { internal_user_id: true, display_name: true },
          })
        : Promise.resolve([]),
      courseIds.length
        ? this.prisma.courses.findMany({
            where: { course_id: { in: courseIds } },
            select: { course_id: true, name: true },
          })
        : Promise.resolve([]),
    ]);
    return {
      users: new Map(users.map((u) => [u.internal_user_id, u.display_name])),
      courses: new Map(courses.map((c) => [c.course_id, c.name])),
    };
  }

  private labelForShare(
    maps: { users: Map<string, string>; courses: Map<string, string> },
    share: BankShare,
  ) {
    if (share.grantee_type === 'USER') {
      return maps.users.get(share.grantee_id) ?? share.grantee_id;
    }
    return maps.courses.get(share.grantee_id) ?? share.grantee_id;
  }

  private async loOfCourse(loId: unknown, courseId: string) {
    if (loId === undefined || loId === null || loId === '') return null;
    if (!isUuid(loId)) {
      throw new BadRequestException('LO không hợp lệ.');
    }
    const lo = await this.prisma.learning_outcomes.findFirst({
      where: { lo_id: loId, course_id: courseId, deleted_at: null },
      select: { lo_id: true },
    });
    if (!lo) {
      throw new BadRequestException('LO không thuộc khoá của ngân hàng.');
    }
    return lo.lo_id;
  }

  private audit(
    tx: Prisma.TransactionClient,
    claims: BffClaims,
    action: string,
    entityType: string,
    entityId: string,
    changes: Record<string, unknown>,
  ) {
    return tx.review_audit_logs.create({
      data: {
        action,
        entity_type: entityType,
        entity_id: entityId,
        performed_by: claims.sub,
        raw_changes: changes as Prisma.InputJsonValue,
      },
    });
  }
}
