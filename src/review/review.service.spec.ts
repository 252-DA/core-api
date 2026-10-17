import type { BffClaims } from '../auth/bff-claims';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const claims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['instructor'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const courseId = '00000000-0000-0000-0000-000000000001';

  function setup() {
    const tx = {
      quiz_items: {
        update: jest.fn().mockImplementation(async ({ where, data }) => ({
          quiz_id: where.quiz_id,
          ...data,
        })),
      },
      review_audit_logs: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      quiz_items: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ReviewService(prisma as never, authz as never);
    return { service, prisma, tx, authz };
  }

  it('validates answer key before approving a single quiz item', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findFirst.mockResolvedValue({
      quiz_id: 'q1',
      course_id: courseId,
      type: 'MCQ_SINGLE',
      question: 'Thủ đô Việt Nam là gì?',
      options: ['Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ'],
      correct_answer: 'TP.HCM', // Không nằm trong options
      status: 'GENERATED_DRAFT',
    });

    await expect(service.approveQuizItem(claims, 'q1')).rejects.toThrow();
    expect(tx.quiz_items.update).not.toHaveBeenCalled();
  });

  it('approves multiple quiz items atomically in one transaction', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: 'q1',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 1?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        status: 'GENERATED_DRAFT',
      },
      {
        quiz_id: 'q2',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 2?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'D',
        status: 'GENERATED_DRAFT',
      },
    ]);

    await expect(
      service.approveQuizItems(claims, ['q1', 'q2']),
    ).resolves.toEqual({ approved: 2 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.quiz_items.update).toHaveBeenCalledTimes(2);
    expect(tx.review_audit_logs.create).toHaveBeenCalledTimes(2);
  });

  it('aborts batch approval before transaction if any item has an invalid answer key', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: 'q1',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 1?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        status: 'GENERATED_DRAFT',
      },
      {
        quiz_id: 'q2',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 2?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'Z', // Sai đáp án
        status: 'GENERATED_DRAFT',
      },
    ]);

    await expect(
      service.approveQuizItems(claims, ['q1', 'q2']),
    ).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.quiz_items.update).not.toHaveBeenCalled();
  });
});
