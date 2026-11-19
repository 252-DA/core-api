import { QuizService } from './quiz.service';
import type { BffClaims } from '../../../auth/bff-claims';

const COURSE = '33333333-3333-4333-8333-333333333333';
const LESSON = '44444444-4444-4444-8444-444444444444';
const LINK = '66666666-6666-4666-8666-666666666666';
const claims: BffClaims = {
  sub: 'learner',
  scope: 'course',
  roles: ['learner'],
  jti: 'j',
  iat: 0,
  exp: 1,
};
const KEY = { model_answer: 'M', rubric: ['A', 'B'] };

function setup() {
  const prisma = {
    lessons: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ lesson_id: LESSON, course_id: COURSE }),
    },
    quiz_items: {
      findMany: jest.fn().mockResolvedValue([
        {
          quiz_id: 'q1',
          current_version_id: 'v-q1',
          course_id: COURSE,
          type: 'MCQ_SINGLE',
          question: 'Q1',
          correct_answer: 'A',
          explanation: 'e1',
        },
        {
          quiz_id: 'q2',
          current_version_id: 'v-q2',
          course_id: COURSE,
          type: 'SHORT_ANSWER',
          question: 'Q2',
          correct_answer: KEY,
          explanation: 'e2',
        },
      ]),
    },
    quiz_attempts: { createMany: jest.fn() },
    outbox_events: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) =>
    fn(prisma),
  );
  const service = new QuizService(
    prisma as never,
    { assertCourseAccess: jest.fn() } as never,
  );
  return { service, prisma };
}

describe('QuizService.submit (lesson quiz)', () => {
  it('tự luận: lệnh chấm mang đề lúc nộp và bài làm, worker không phải đọc quiz_attempts', async () => {
    const { service, prisma } = setup();

    const result = await service.submit(claims, {
      lessonId: LESSON,
      resourceLinkId: LINK,
      answers: [
        { quizId: 'q1', chosenAnswer: 'A' },
        { quizId: 'q2', chosenAnswer: 'Bài làm' },
      ],
    });

    expect(result).toMatchObject({
      score: 50,
      pendingCount: 1,
      agsStatus: 'AWAITING_GRADE',
    });
    const rows = prisma.quiz_attempts.createMany.mock.calls[0][0].data;
    const event = prisma.outbox_events.create.mock.calls[0][0].data;
    expect(event.event_type).toBe('ANSWER_GRADING_REQUESTED');
    expect(event.payload).toEqual({
      submission_id: event.aggregate_id,
      course_id: COURSE,
      attempt_ids: [rows[0].attempt_id, rows[1].attempt_id],
      essay_attempt_ids: [rows[1].attempt_id],
      answers: [
        {
          attempt_id: rows[1].attempt_id,
          grading_input: {
            type: 'SHORT_ANSWER',
            question: 'Q2',
            correct_answer: KEY,
          },
          chosen_answer: 'Bài làm',
        },
      ],
    });
    // Bản đề trong lệnh đúng là bản ghi vào grading_input của dòng.
    expect(rows[1].grading_input).toEqual(
      event.payload.answers[0].grading_input,
    );
    expect(
      rows.map((r: { quiz_version_id: string | null }) => r.quiz_version_id),
    ).toEqual(['v-q1', 'v-q2']);
    expect(rows.map((r: { quiz_version_id: string | null }) => r.quiz_version_id)).toEqual([
      'v-q1',
      'v-q2',
    ]);
  });

  it('không có tự luận thì không giao worker', async () => {
    const { service, prisma } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: 'q1',
        course_id: COURSE,
        type: 'MCQ_SINGLE',
        question: 'Q1',
        correct_answer: 'A',
        explanation: null,
      },
    ]);

    await service.submit(claims, {
      lessonId: LESSON,
      answers: [{ quizId: 'q1', chosenAnswer: 'A' }],
    });

    expect(prisma.outbox_events.create).not.toHaveBeenCalled();
  });
});
