import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { COURSE_ROLES } from '../common/constants/course-roles';
import { resolvePlatformUrl } from '../config/ags.config';
import { CanvasApiClient } from '../canvas/canvas-api.client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CourseRosterRepository,
  canvasNumericId,
  type CourseRefRow,
  type MembershipWrite,
} from './course-roster.repository';
import { NrpsClientService, type NrpsMember } from './nrps-client.service';
import { courseRoleFromNrps, platformRoleFor, type CourseRole } from './nrps-roles';

const LMS_TYPE = 'canvas';
/** Số giá trị tối đa trong một mệnh đề IN khi tra lms_user_mappings. */
const LOOKUP_CHUNK = 500;

export type RosterSyncSummary = {
  /** Số thành viên Canvas trả về. */
  total: number;
  /** Membership mới (người đó chưa có dòng nào cho role này trong khóa). */
  created: number;
  /** Membership đã có nhưng đổi trạng thái hoặc nguồn. */
  updated: number;
  /** Membership không còn trong danh sách Canvas nên chuyển sang inactive. */
  deactivated: number;
  /** Thành viên có role lạ nên bỏ qua. */
  skipped: number;
  /** Sinh viên đang học sau lần đồng bộ này. */
  learners: number;
};

type Resolved = { member: NrpsMember; role: CourseRole };

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Tên có thật từ Canvas (không tính lùi về user_id), hoặc undefined. */
function realName(member: NrpsMember): string | undefined {
  const joined = [member.given_name, member.family_name].filter(Boolean).join(' ').trim();
  return member.name || joined || member.email || undefined;
}

/**
 * Đồng bộ danh sách lớp của một khóa Canvas vào lms_user_mappings và
 * course_memberships qua NRPS. Canvas là nguồn sự thật về ai thuộc lớp: người
 * không còn trong danh sách chuyển sang inactive, không bao giờ bị xóa.
 */
@Injectable()
export class RosterSyncService {
  private readonly logger = new Logger(RosterSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roster: CourseRosterRepository,
    private readonly nrps: NrpsClientService,
    private readonly canvas: CanvasApiClient,
  ) {}

  async syncCourse(courseId: string): Promise<RosterSyncSummary> {
    const ref = await this.roster.courseRef(courseId);
    if (!ref) throw new NotFoundException('Khóa học chưa có liên kết với Canvas.');
    const url = await this.resolveNrpsUrl(ref);
    const members = await this.nrps.listMembers(url);

    const resolved = new Map<string, Resolved>();
    let skipped = 0;
    for (const member of members) {
      const role = courseRoleFromNrps(member.roles);
      if (!role) skipped++;
      else resolved.set(member.user_id, { member, role });
    }

    const userIds = await this.ensureUsers([...resolved.values()]);
    const existing = await this.roster.memberships(courseId);
    const existingByKey = new Map(existing.map((m) => [`${m.user_id}:${m.role}`, m]));

    const writes: MembershipWrite[] = [];
    const wanted = new Set<string>();
    let created = 0;
    let updated = 0;
    let learners = 0;
    for (const { member, role } of resolved.values()) {
      const userId = userIds.get(member.user_id);
      if (!userId) continue;
      const status = member.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active';
      const key = `${userId}:${role}`;
      wanted.add(key);
      if (role === COURSE_ROLES.LEARNER && status === 'active') learners++;
      const current = existingByKey.get(key);
      if (!current) {
        created++;
        writes.push({ userId, role, status });
      } else if (current.status !== status || current.source !== 'nrps') {
        updated++;
        writes.push({ userId, role, status });
      }
    }
    await this.roster.upsertNrpsMemberships(courseId, writes);

    // Danh sách rỗng gần như chắc chắn là lỗi phía Canvas (luôn có ít nhất giảng
    // viên), nên không dùng nó để cho cả lớp nghỉ học.
    let deactivated = 0;
    if (wanted.size > 0) {
      const gone = existing.filter((m) => m.status !== 'inactive' && !wanted.has(`${m.user_id}:${m.role}`));
      await this.roster.deactivateMemberships(
        courseId,
        gone.map((m) => ({ userId: m.user_id, role: m.role })),
      );
      deactivated = gone.length;
    } else if (existing.length > 0) {
      this.logger.warn(`Danh sách lớp Canvas của ${courseId} không có thành viên hợp lệ, giữ nguyên membership hiện có.`);
    }

    await this.roster.markRosterSynced(ref.course_ref_id);
    return { total: members.length, created, updated, deactivated, skipped, learners };
  }

  /** URL đã lưu từ lần launch, hoặc suy ra từ id khóa học Canvas rồi lưu lại. */
  private async resolveNrpsUrl(ref: CourseRefRow): Promise<string> {
    if (ref.nrps_context_memberships_url) return ref.nrps_context_memberships_url;
    const platform = resolvePlatformUrl();
    if (!platform)
      throw new ServiceUnavailableException('Chưa cấu hình LTI_PLATFORM_URL nên không suy ra được địa chỉ danh sách lớp.');
    let platformCourseId = canvasNumericId(ref.lms_platform_course_id);
    let learned = false;
    if (!platformCourseId) {
      const course = await this.canvas.getCourseByLtiContext(ref.lms_context_id);
      platformCourseId = canvasNumericId(course.id);
      learned = true;
    }
    if (!platformCourseId) throw new NotFoundException('Không tìm thấy khóa học này trên Canvas.');
    const nrpsUrl = `${platform}/api/lti/courses/${platformCourseId}/names_and_roles`;
    await this.roster.saveCourseLocation(ref.course_ref_id, {
      nrpsUrl,
      ...(learned ? { platformCourseId } : {}),
    });
    return nrpsUrl;
  }

  /**
   * Bảo đảm mọi thành viên có dòng lms_user_mappings và trả về id nội bộ theo
   * user_id của NRPS (chính là lms_sub). Người đã có giữ nguyên role (không hạ
   * quyền); chỉ cập nhật tên khi Canvas cho biết tên thật.
   */
  private async ensureUsers(items: Resolved[]): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    const names = new Map<string, string>();
    const byId = new Map(items.map((i) => [i.member.user_id, i]));
    const subs = [...byId.keys()];

    for (const part of chunks(subs, LOOKUP_CHUNK)) {
      const found = await this.prisma.lms_user_mappings.findMany({
        where: { lms_type: LMS_TYPE, lms_sub: { in: part } },
        select: { internal_user_id: true, lms_sub: true, display_name: true },
      });
      for (const row of found) {
        ids.set(row.lms_sub, row.internal_user_id);
        names.set(row.lms_sub, row.display_name);
      }
    }

    const missing = subs.filter((sub) => !ids.has(sub));
    for (const part of chunks(missing, LOOKUP_CHUNK)) {
      await this.prisma.lms_user_mappings.createMany({
        data: part.map((sub) => {
          const { member, role } = byId.get(sub)!;
          return {
            lms_type: LMS_TYPE,
            lms_sub: sub,
            display_name: realName(member) ?? sub,
            role: platformRoleFor(role),
          };
        }),
        skipDuplicates: true,
      });
      const created = await this.prisma.lms_user_mappings.findMany({
        where: { lms_type: LMS_TYPE, lms_sub: { in: part } },
        select: { internal_user_id: true, lms_sub: true },
      });
      for (const row of created) ids.set(row.lms_sub, row.internal_user_id);
    }

    for (const sub of subs) {
      const name = realName(byId.get(sub)!.member);
      const current = names.get(sub);
      if (!name || current === undefined || current === name) continue;
      await this.prisma.lms_user_mappings.update({
        where: { internal_user_id: ids.get(sub)! },
        data: { display_name: name, updated_at: new Date() },
      });
    }
    return ids;
  }
}
