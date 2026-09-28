import type { BffClaims } from '../auth/bff-claims';
import { LessonService } from './lesson.service';

describe('LessonService content access', () => {
  const claims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['learner'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const courseId = '00000000-0000-0000-0000-000000000001';
  const lessonId = '00000000-0000-0000-0000-000000000003';

  function setup() {
    const lesson = {
      lesson_id: lessonId,
      course_id: courseId,
      title: 'Lesson',
      learning_outcomes: { lo_id: 'lo-1', code: 'L.O.1', chapter_los: [] },
    };
    const prisma = {
      lessons: {
        findFirst: jest.fn().mockResolvedValue(lesson),
      },
      lesson_cards: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      quiz_items: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const service = new LessonService(prisma as never, authz as never);

    return { service, prisma, authz };
  }

  it('allows course learners to read explicitly published cards', async () => {
    const { service, prisma, authz } = setup();

    await service.cards(claims, lessonId, 'PUBLISHED');

    expect(authz.assertCourseAccess).toHaveBeenCalledTimes(1);
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId);
    expect(prisma.lesson_cards.findMany).toHaveBeenCalledWith({
      where: {
        lesson_id: lessonId,
        deleted_at: null,
        status: 'PUBLISHED',
      },
      orderBy: { created_at: 'asc' },
    });
  });

  it('allows course learners to read explicitly published quiz items', async () => {
    const { service, prisma, authz } = setup();

    await service.quiz(claims, lessonId, 'PUBLISHED');

    expect(authz.assertCourseAccess).toHaveBeenCalledTimes(1);
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId);
    expect(prisma.quiz_items.findMany).toHaveBeenCalledWith({
      where: {
        lesson_id: lessonId,
        deleted_at: null,
        status: 'PUBLISHED',
      },
      orderBy: { created_at: 'asc' },
    });
  });

  it('requires instructor or TA access when card status is omitted', async () => {
    const { service, prisma, authz } = setup();
    authz.assertCourseAccess
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('forbidden'));

    await expect(service.cards(claims, lessonId)).rejects.toThrow('forbidden');

    expect(authz.assertCourseAccess).toHaveBeenLastCalledWith(
      claims,
      courseId,
      ['instructor', 'ta'],
    );
    expect(prisma.lesson_cards.findMany).not.toHaveBeenCalled();
  });

  it('requires instructor or TA access for non-published quiz status', async () => {
    const { service, prisma, authz } = setup();
    authz.assertCourseAccess
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('forbidden'));

    await expect(service.quiz(claims, lessonId, 'REVIEWING')).rejects.toThrow(
      'forbidden',
    );

    expect(authz.assertCourseAccess).toHaveBeenLastCalledWith(
      claims,
      courseId,
      ['instructor', 'ta'],
    );
    expect(prisma.quiz_items.findMany).not.toHaveBeenCalled();
  });
});
