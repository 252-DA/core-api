import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CanvasCourseService } from './canvas-course.service';

describe('CanvasCourseService', () => {
  const courseId = '01900000-0000-7000-8000-000000000001';

  function setup(course: unknown) {
    const prisma = { courses: { findFirst: jest.fn().mockResolvedValue(course) } };
    return new CanvasCourseService(prisma as never);
  }

  it('returns the LTI context id of a course launched from Canvas', async () => {
    const service = setup({ lms_id: 'canvas:ctx-1', lms_course_ref: [{ lms_context_id: 'ctx-1' }] });
    await expect(service.contextId(courseId)).resolves.toBe('ctx-1');
  });

  it('refuses a course launched from another LMS', async () => {
    const service = setup({ lms_id: 'moodle:ctx-1', lms_course_ref: [{ lms_context_id: 'ctx-1' }] });
    await expect(service.contextId(courseId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a missing course', async () => {
    await expect(setup(null).contextId(courseId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
