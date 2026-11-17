import { Injectable, Logger } from '@nestjs/common';
import { COURSE_ROLES } from '../common/constants/course-roles';
import { PrismaService } from '../prisma/prisma.service';

/** Dòng lms_course_ref cùng các cột Canvas mới. */
export type CourseRefRow = {
  course_ref_id: string;
  lms_context_id: string;
  lms_platform_course_id: string | null;
  nrps_context_memberships_url: string | null;
};

export type MembershipRow = {
  user_id: string;
  role: string;
  status: string;
  source: string;
};

export type MembershipWrite = {
  userId: string;
  role: string;
  status: 'active' | 'inactive';
};

export type LaunchRecord = {
  internalUserId: string;
  courseId: string;
  courseRefId: string;
  courseRole: string;
  /** Id Canvas của người dùng/khóa học, đã kiểm tra là chuỗi số. */
  platformUserId?: string;
  platformCourseId?: string;
  nrpsUrl?: string;
};

const WRITE_CHUNK = 200;
const UNDEFINED_COLUMN = '42703';

/** Id Canvas luôn là số nguyên dương; biến Canvas không mở rộng được trả nguyên chuỗi "$Canvas...". */
export function canvasNumericId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    return String(value);
  return typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value.trim())
    ? value.trim()
    : undefined;
}

function isMissingColumn(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const e = current as { code?: unknown; meta?: { code?: unknown }; cause?: unknown };
    if (e.code === UNDEFINED_COLUMN || e.meta?.code === UNDEFINED_COLUMN) return true;
    current = e.cause;
  }
  return error instanceof Error && /column .* does not exist/i.test(error.message);
}

/**
 * Đọc/ghi các cột mới của migration 20261112130000_nrps_roster
 * (course_memberships.source/status, lms_course_ref.lms_platform_course_id,
 * nrps_context_memberships_url, nrps_synced_at, lms_user_mappings.lms_platform_user_id)
 * bằng SQL trực tiếp.
 *
 * Tạm thời: client Prisma trong container core-api đang ghim ở bản 5/11 vì sáu
 * migration cũ chưa áp lên DB dev, nên delegate chưa biết các cột này và sẽ báo
 * "Unknown argument" nếu truyền vào. Khi các migration đó đã áp và client được
 * generate lại, thay các câu lệnh ở đây bằng delegate
 * (tx.course_memberships.upsert, tx.lms_course_ref.update, ...) rồi bỏ lớp này.
 */
@Injectable()
export class CourseRosterRepository {
  private readonly logger = new Logger(CourseRosterRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ghi lại những gì một lần launch cho biết: id Canvas của người dùng và khóa
   * học, URL NRPS, và membership đang hoạt động. Chạy sau khi giao dịch launch
   * đã commit và không bao giờ ném lỗi: thiếu cột (migration chưa áp) hay DB
   * chập chờn chỉ được ghi log, launch vẫn phải vào được.
   */
  async recordLaunch(input: LaunchRecord): Promise<void> {
    try {
      if (input.platformUserId) {
        await this.prisma.$executeRaw`
          UPDATE lms_user_mappings
          SET lms_platform_user_id = ${input.platformUserId}::varchar
          WHERE internal_user_id = ${input.internalUserId}::uuid
            AND lms_platform_user_id IS DISTINCT FROM ${input.platformUserId}::varchar`;
      }
      if (input.platformCourseId || input.nrpsUrl) {
        await this.prisma.$executeRaw`
          UPDATE lms_course_ref
          SET lms_platform_course_id = COALESCE(${input.platformCourseId ?? null}::varchar, lms_platform_course_id),
              nrps_context_memberships_url = COALESCE(${input.nrpsUrl ?? null}::text, nrps_context_memberships_url)
          WHERE course_ref_id = ${input.courseRefId}::uuid`;
      }
      await this.prisma.$executeRaw`
        UPDATE course_memberships
        SET source = 'launch', status = 'active', updated_at = now()
        WHERE user_id = ${input.internalUserId}::uuid
          AND course_id = ${input.courseId}::uuid
          AND role = ${input.courseRole}
          AND (source <> 'launch' OR status <> 'active')`;
    } catch (error) {
      this.logger.warn(
        `Không ghi được thông tin Canvas của lần launch (đã áp migration nrps_roster chưa?): ${String(error)}`,
      );
    }
  }

  /** Tham chiếu LMS còn hiệu lực của khóa (mới nhất nếu có nhiều dòng). */
  async courseRef(courseId: string): Promise<CourseRefRow | null> {
    const rows = await this.prisma.$queryRaw<CourseRefRow[]>`
      SELECT course_ref_id::text AS course_ref_id, lms_context_id,
             lms_platform_course_id, nrps_context_memberships_url
      FROM lms_course_ref
      WHERE course_id = ${courseId}::uuid AND deleted_at IS NULL
      ORDER BY synced_at DESC NULLS LAST
      LIMIT 1`;
    return rows[0] ?? null;
  }

  /** Lưu id khóa Canvas và URL NRPS đã suy ra được. */
  async saveCourseLocation(
    courseRefId: string,
    location: { platformCourseId?: string; nrpsUrl?: string },
  ) {
    await this.prisma.$executeRaw`
      UPDATE lms_course_ref
      SET lms_platform_course_id = COALESCE(${location.platformCourseId ?? null}::varchar, lms_platform_course_id),
          nrps_context_memberships_url = COALESCE(${location.nrpsUrl ?? null}::text, nrps_context_memberships_url)
      WHERE course_ref_id = ${courseRefId}::uuid`;
  }

  async markRosterSynced(courseRefId: string) {
    await this.prisma.$executeRaw`
      UPDATE lms_course_ref SET nrps_synced_at = now()
      WHERE course_ref_id = ${courseRefId}::uuid`;
  }

  async memberships(courseId: string): Promise<MembershipRow[]> {
    return this.prisma.$queryRaw<MembershipRow[]>`
      SELECT user_id::text AS user_id, role, status, source
      FROM course_memberships
      WHERE course_id = ${courseId}::uuid`;
  }

  /**
   * Ghi membership đọc từ NRPS (source = 'nrps'). Dòng mới có last_seen_at rỗng:
   * người đó chưa mở DA lần nào. Dòng đã có giữ nguyên last_seen_at.
   */
  async upsertNrpsMemberships(courseId: string, writes: MembershipWrite[]) {
    for (let i = 0; i < writes.length; i += WRITE_CHUNK) {
      const chunk = writes.slice(i, i + WRITE_CHUNK);
      await this.prisma.$executeRaw`
        INSERT INTO course_memberships (user_id, course_id, role, source, status, last_seen_at, updated_at)
        SELECT t.user_id, ${courseId}::uuid, t.role, 'nrps', t.status, NULL, now()
        FROM unnest(
          ${chunk.map((w) => w.userId)}::uuid[],
          ${chunk.map((w) => w.role)}::text[],
          ${chunk.map((w) => w.status)}::text[]
        ) AS t(user_id, role, status)
        ON CONFLICT (user_id, course_id, role)
        DO UPDATE SET source = 'nrps', status = EXCLUDED.status, updated_at = now()`;
    }
  }

  /** Không xóa dòng nào: người rời lớp chỉ chuyển sang inactive, lịch sử làm bài vẫn còn. */
  async deactivateMemberships(
    courseId: string,
    memberships: Array<{ userId: string; role: string }>,
  ) {
    for (let i = 0; i < memberships.length; i += WRITE_CHUNK) {
      const chunk = memberships.slice(i, i + WRITE_CHUNK);
      await this.prisma.$executeRaw`
        UPDATE course_memberships AS m
        SET status = 'inactive', updated_at = now()
        FROM unnest(
          ${chunk.map((x) => x.userId)}::uuid[],
          ${chunk.map((x) => x.role)}::text[]
        ) AS t(user_id, role)
        WHERE m.course_id = ${courseId}::uuid
          AND m.user_id = t.user_id
          AND m.role = t.role
          AND m.status <> 'inactive'`;
    }
  }

  /**
   * Sinh viên đang học của khóa: mẫu số "cả lớp" cho trang kết quả quiz và
   * learning agent. Nếu migration chưa áp (chưa có cột status) thì lùi về mọi
   * membership learner, như trước khi có danh sách lớp.
   */
  async activeLearnerIds(courseId: string): Promise<string[]> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ user_id: string }>>`
        SELECT user_id::text AS user_id
        FROM course_memberships
        WHERE course_id = ${courseId}::uuid AND role = 'learner' AND status = 'active'`;
      return rows.map((r) => r.user_id);
    } catch (error) {
      if (!isMissingColumn(error)) throw error;
      this.logger.warn('Chưa có cột course_memberships.status, tạm coi mọi learner là đang học.');
      const rows = await this.prisma.course_memberships.findMany({
        where: { course_id: courseId, role: COURSE_ROLES.LEARNER },
        select: { user_id: true },
      });
      return rows.map((r) => r.user_id);
    }
  }

  /** Số sinh viên đang học của khóa, cho dòng trạng thái ở UI; null nếu chưa có cột status. */
  async countActiveLearners(courseId: string): Promise<number | null> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ n: number }>>`
        SELECT count(*)::int AS n FROM course_memberships
        WHERE course_id = ${courseId}::uuid AND role = 'learner' AND status = 'active'`;
      return rows[0]?.n ?? 0;
    } catch (error) {
      if (isMissingColumn(error)) return null;
      throw error;
    }
  }
}
