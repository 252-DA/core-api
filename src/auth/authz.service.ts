import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { BffClaims } from './bff-claims';

@Injectable()
export class AuthzService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCourseAccess(
    claims: BffClaims,
    courseId: string,
    allowedRoles?: string[],
  ) {
    if (claims.scope === 'admin') {
      return;
    }

    const membership = await this.prisma.course_memberships.findFirst({
      where: {
        user_id: claims.sub,
        course_id: courseId,
        ...(allowedRoles?.length ? { role: { in: allowedRoles } } : {}),
      },
    });

    if (!membership) {
      throw new ForbiddenException('No membership for this course');
    }
  }

  /**
   * Việc ảnh hưởng mọi khoá học (vd. chọn model AI) chỉ dành cho admin của
   * LMS. Role đọc từ DB, nơi mỗi lần launch LTI ghi lại, không từ claims.
   */
  async assertPlatformAdmin(claims: BffClaims) {
    if (claims.scope === 'admin') {
      return;
    }
    const user = await this.prisma.lms_user_mappings.findFirst({
      where: { internal_user_id: claims.sub, deleted_at: null },
      select: { role: true },
    });
    if (user?.role !== 'administrator') {
      throw new ForbiddenException('Chỉ admin của LMS được làm việc này.');
    }
  }
}
