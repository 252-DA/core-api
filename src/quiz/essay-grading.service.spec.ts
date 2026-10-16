import { EssayGradingService } from './essay-grading.service';
import type { BffClaims } from '../auth/bff-claims';

const COURSE = '00000000-0000-0000-0000-000000000001';
const TEACHER = '00000000-0000-0000-0000-000000000002';
const ESSAY = '00000000-0000-0000-0000-000000000003';
const MCQ = '00000000-0000-0000-0000-000000000004';
const SUBMISSION = '00000000-0000-0000-0000-000000000005';
const LINK = '00000000-0000-0000-0000-000000000006';
const claims: BffClaims = {
  sub: TEACHER,
  courseId: COURSE,
  scope: 'course',
  roles: ['instructor'],
  jti: 't',
  iat: 0,
  exp: 1,
};
const INPUT = {
  type: 'SHORT_ANSWER',
  question: 'Vì sao?',
  correct_answer: { model_answer: 'M', rubric: ['A'] },
};

function setup(attempt: Record<string, unknown> = {}) {
  const prisma = {
    quiz_attempts: {
      findFirst: jest.fn().mockResolvedValue({
        attempt_id: ESSAY,
        submission_id: SUBMISSION,
        user_id: 'learner',
        course_id: COURSE,
        resource_link_id: LINK,
        grading_status: 'NEEDS_REVIEW',
        grading_input: INPUT,
        feedback: 'AI chưa chấm được',
        ...attempt,
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(0),
    },
    review_audit_logs: { create: jest.fn() },
    outbox_events: { create: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([{ attempt_id: MCQ }, { attempt_id: ESSAY }]),
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) =>
    fn(prisma),
  );
  const authz = { assertCourseAccess: jest.fn() };
  const service = new EssayGradingService(prisma as never, authz as never);
  return { service, prisma, authz };
}

describe('EssayGradingService', () => {
  it('giảng viên chấm tay: ghi điểm, lưu audit và mở khoá AGS khi cả lượt đã có điểm', async () => {
    const { service, prisma, authz } = setup();
    const result = await service.grade(claims, {
      attemptId: ESSAY,
      score: 75,
      feedback: ' Thiếu ý 2. ',
    });
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, COURSE, ['instructor', 'ta']);
    // Khoá nhóm trước khi kiểm tra: worker cũng khoá các dòng này khi mở AGS.
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.quiz_attempts.updateMany.mock.calls[0][0]).toEqual({
      where: { attempt_id: ESSAY, grading_status: 'NEEDS_REVIEW', deleted_at: null },
      data: { score: 75, is_correct: false, feedback: 'Thiếu ý 2.', grading_status: 'GRADED' },
    });
    expect(prisma.review_audit_logs.create.mock.calls[0][0].data).toMatchObject({
      action: 'GRADE_ANSWER',
      entity_id: ESSAY,
      performed_by: TEACHER,
    });
    expect(prisma.quiz_attempts.updateMany.mock.calls[1][0]).toEqual({
      where: { attempt_id: { in: [MCQ, ESSAY] }, ags_status: 'AWAITING_GRADE' },
      data: { ags_status: 'PENDING' },
    });
    expect(result).toMatchObject({ score: 75, released: 1 });
  });

  it('còn câu khác chưa chấm thì giữ cả lượt khỏi AGS', async () => {
    const { service, prisma } = setup();
    prisma.quiz_attempts.count.mockResolvedValue(1);
    const result = await service.grade(claims, { attemptId: ESSAY, score: 100 });
    expect(prisma.quiz_attempts.updateMany).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ released: 0 });
  });

  it('không chấm đè câu đã có điểm hoặc đang được AI chấm lại', async () => {
    const { service, prisma } = setup();
    prisma.quiz_attempts.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.grade(claims, { attemptId: ESSAY, score: 50 })).rejects.toThrow(
      'đã được chấm',
    );
    expect(prisma.review_audit_logs.create).not.toHaveBeenCalled();
  });

  it.each([[-1], [101], [12.5], ['abc'], [null], [''], [undefined]])('từ chối điểm %p', async (score) => {
    const { service, prisma } = setup();
    await expect(service.grade(claims, { attemptId: ESSAY, score })).rejects.toThrow('0 đến 100');
    expect(prisma.quiz_attempts.findFirst).not.toHaveBeenCalled();
  });

  it('cho AI chấm lại: câu về PENDING và worker nhận việc kèm cả lượt nộp', async () => {
    const { service, prisma } = setup();
    await service.retry(claims, { attemptId: ESSAY });
    expect(prisma.quiz_attempts.updateMany.mock.calls[0][0]).toEqual({
      where: { attempt_id: ESSAY, grading_status: 'NEEDS_REVIEW', deleted_at: null },
      data: { grading_status: 'PENDING' },
    });
    expect(prisma.outbox_events.create.mock.calls[0][0].data).toMatchObject({
      event_type: 'ANSWER_GRADING_REQUESTED',
      payload: {
        submission_id: SUBMISSION,
        course_id: COURSE,
        attempt_ids: [MCQ, ESSAY],
        essay_attempt_ids: [ESSAY],
      },
    });
  });

  it('bài không lưu đề lúc nộp thì chỉ chấm tay được', async () => {
    const { service, prisma } = setup({ grading_input: null });
    await expect(service.retry(claims, { attemptId: ESSAY })).rejects.toThrow('chấm tay');
    expect(prisma.outbox_events.create).not.toHaveBeenCalled();
  });
});
