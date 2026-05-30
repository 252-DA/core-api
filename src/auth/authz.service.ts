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
}
