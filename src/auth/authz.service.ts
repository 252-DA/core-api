import { ForbiddenException, Injectable } from '@nestjs/common';
import { LMS_ADMIN_ROLE, STAFF_ROLES } from '../common/constants/course-roles';
import { isUuid } from '../common/utils/uuid';
import { PrismaService } from '../infra/prisma/prisma.service';
import type { BffClaims } from './bff-claims';

@Injectable()
export class AuthzService {
  constructor(private readonly prisma: PrismaService) {}

  async assertSessionCourse(
    claims: BffClaims,
    courseId: string,
    roles?: readonly string[],
  ) {
    if (
      !isUuid(courseId) ||
      (claims.scope !== 'admin' && claims.courseId !== courseId)
    ) {
      throw new ForbiddenException('Khóa học không khớp phiên Canvas.');
    }
    await this.assertCourseAccess(claims, courseId, roles);
  }

  async assertCourseAccess(
    claims: BffClaims,
    courseId: string,
    allowedRoles?: readonly string[],
  ) {
    if (claims.scope === 'admin') {
      return;
    }

    const membership = await this.prisma.course_memberships.findFirst({
      where: {
        user_id: claims.sub,
        course_id: courseId,
        ...(allowedRoles?.length ? { role: { in: [...allowedRoles] } } : {}),
      },
    });

    if (!membership) {
      throw new ForbiddenException('No membership for this course');
    }
  }

  /**
   * Nhân sự của khoá: giảng viên, trợ giảng, admin nền tảng, hoặc admin của LMS.
   * Chỉ quyết định ai thấy tài liệu đã ẩn trên LMS, không thay assertCourseAccess:
   * nơi gọi vẫn phải tự kiểm tra quyền vào khoá. Admin Canvas khi launch vào khoá
   * đã được ghi membership 'instructor'; nhánh lms_user_mappings giữ nhất quán
   * với assertPlatformAdmin cho trường hợp membership cũ của họ là role khác.
   */
  async isCourseStaff(claims: BffClaims, courseId: string): Promise<boolean> {
    if (claims.scope === 'admin') {
      return true;
    }
    const membership = await this.prisma.course_memberships.findFirst({
      where: {
        user_id: claims.sub,
        course_id: courseId,
        role: { in: [...STAFF_ROLES] },
      },
      select: { role: true },
    });
    if (membership) {
      return true;
    }
    return this.isLmsAdministrator(claims);
  }

  /**
   * Việc ảnh hưởng mọi khoá học (vd. chọn model AI) chỉ dành cho admin của
   * LMS. Role đọc từ DB, nơi mỗi lần launch LTI ghi lại, không từ claims.
   */
  async assertPlatformAdmin(claims: BffClaims) {
    if (claims.scope === 'admin') {
      return;
    }
    if (!(await this.isLmsAdministrator(claims))) {
      throw new ForbiddenException('Chỉ admin của LMS được làm việc này.');
    }
  }

  private async isLmsAdministrator(claims: BffClaims) {
    const user = await this.prisma.lms_user_mappings.findFirst({
      where: { internal_user_id: claims.sub, deleted_at: null },
      select: { role: true },
    });
    return user?.role === LMS_ADMIN_ROLE;
  }
}
