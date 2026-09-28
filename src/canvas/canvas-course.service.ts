import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CANVAS_LMS_PREFIX = 'canvas:';

/** Khoá học DA ↔ khoá Canvas: LTI context id là khoá để gọi Canvas API. */
@Injectable()
export class CanvasCourseService {
  constructor(private readonly prisma: PrismaService) {}

  async contextId(courseId: string): Promise<string> {
    const course = await this.prisma.courses.findFirst({
      where: { course_id: courseId, deleted_at: null },
      include: {
        lms_course_ref: {
          where: { deleted_at: null },
          orderBy: { synced_at: 'desc' },
          take: 1,
        },
      },
    });
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khoá học ${courseId}.`);
    }
    const ref = course.lms_course_ref[0];
    if (!course.lms_id?.startsWith(CANVAS_LMS_PREFIX) || !ref) {
      throw new BadRequestException('Khoá học này không được mở từ Canvas nên không đồng bộ được.');
    }
    return ref.lms_context_id;
  }
}
