import { BadRequestException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import { MicroContentAttemptService } from './micro-content-attempt.service';

describe('MicroContentAttemptService', () => {
  const learnerClaims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['learner'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };

  const courseId = '11111111-1111-1111-1111-111111111111';
  const microContentId = '22222222-2222-2222-2222-222222222222';

  function setup() {
    const prisma = {
      micro_contents: {
        findFirst: jest.fn(),
      },
      micro_content_progress: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      micro_content_questions: {
        findMany: jest.fn(),
      },
      micro_content_attempts: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      micro_content_answers: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };

    const service = new MicroContentAttemptService(
      prisma as never,
      authz as never,
    );

    return { service, prisma, authz };
  }

  describe('reportProgress (anti-cheat rate limiting)', () => {
    it('restricts watch time increment when user skips/seeks forward', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_duration_ms: 100000,
        required_watch_percent: 90,
      });

      // Đã xem 10s trước đó 5s
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        max_position_ms: 10000,
        watched_ms: 10000,
        updated_at: fiveSecondsAgo,
      });

      prisma.micro_content_progress.upsert.mockImplementation((args) => args.create);

      // Client tua thẳng tới 90s (sau 5s thực tế)
      const res = await service.reportProgress(learnerClaims, {
        microContentId,
        positionMs: 90000,
      });

      // Increment chỉ được tối đa ~5000 * 1.5 = 7500ms, không thể nhảy vọt 80000ms!
      expect(res.watchedMs).toBeLessThanOrEqual(18000);
      expect(res.maxPositionMs).toBe(90000);
      expect(res.unlocked).toBe(false); // Chưa đạt 90%
    });
  });

  describe('submit', () => {
    it('rejects submission when required watch percent is not reached', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        video_duration_ms: 100000,
        required_watch_percent: 80,
      });

      // Mới xem được 20s = 20%
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        watched_ms: 20000,
      });

      await expect(
        service.submit(learnerClaims, {
          microContentId,
          answers: [{ questionId: 'q1', chosenAnswer: 'A' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('grades 4 instant types correctly and saves attempt', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        passing_score: 75,
        video_duration_ms: 100000,
        required_watch_percent: 50,
      });

      // Đã xem 60% (đạt điều kiện)
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        watched_ms: 60000,
      });

      const questions = [
        {
          question_id: 'q1',
          position: 1,
          type: 'MCQ_SINGLE',
          question: '1 + 1 = ?',
          options: ['1', '2', '3', '4'],
          correct_answer: '2',
          explanation: 'Vì 1+1=2',
        },
        {
          question_id: 'q2',
          position: 2,
          type: 'TRUE_FALSE',
          question: 'Mặt trời mọc hướng Đông',
          options: ['Đúng', 'Sai'],
          correct_answer: 'Đúng',
          explanation: 'Quy luật tự nhiên',
        },
        {
          question_id: 'q3',
          position: 3,
          type: 'FILL_BLANK',
          question: 'Thủ đô của Việt Nam là ____.',
          options: null,
          correct_answer: ['Hà Nội', 'Ha Noi'],
          explanation: 'Hà Nội là thủ đô',
        },
        {
          question_id: 'q4',
          position: 4,
          type: 'MCQ_MULTI',
          question: 'Chọn các số chẵn',
          options: ['1', '2', '3', '4'],
          correct_answer: ['2', '4'],
          explanation: '2 và 4 là số chẵn',
        },
      ];

      prisma.micro_content_questions.findMany.mockResolvedValue(questions);
      prisma.micro_content_attempts.create.mockResolvedValue({
        attempt_id: 'attempt-123',
        submitted_at: new Date(),
      });

      const answers = [
        { questionId: 'q1', chosenAnswer: '2' }, // Đúng (100)
        { questionId: 'q2', chosenAnswer: 'Đúng' }, // Đúng (100)
        { questionId: 'q3', chosenAnswer: 'Hà Nội' }, // Đúng (100)
        { questionId: 'q4', chosenAnswer: ['2', '4'] }, // Đúng (100)
      ];

      const res = await service.submit(learnerClaims, {
        microContentId,
        answers,
      });

      expect(res.score).toBe(100);
      expect(res.passed).toBe(true);
      expect(res.gradingStatus).toBe('GRADED');
      expect(res.questions).toHaveLength(4);
      expect(res.questions[0].isCorrect).toBe(true);
      expect(res.questions[0].correctAnswer).toBe('2');
      expect(res.questions[0].explanation).toBe('Vì 1+1=2');
    });

    it('marks short answer as PENDING and captures grading_input for AI worker', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        passing_score: 50,
        required_watch_percent: 0, // Không khoá
      });

      const questions = [
        {
          question_id: 'q_essay',
          position: 1,
          type: 'SHORT_ANSWER',
          question: 'Nêu định nghĩa hàm thuần khiết.',
          options: null,
          correct_answer: {
            model_answer: 'Không tác dụng phụ.',
            rubric: ['Không tác dụng phụ', 'Trả cùng kết quả'],
          },
          explanation: 'Giải thích',
        },
      ];

      prisma.micro_content_questions.findMany.mockResolvedValue(questions);
      prisma.micro_content_attempts.create.mockResolvedValue({
        attempt_id: 'attempt-essay',
        submitted_at: new Date(),
      });

      const res = await service.submit(learnerClaims, {
        microContentId,
        answers: [{ questionId: 'q_essay', chosenAnswer: 'Hàm thuần khiết không sinh side-effect.' }],
      });

      expect(res.gradingStatus).toBe('PENDING');
      expect(prisma.micro_content_answers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          grading_status: 'PENDING',
          grading_input: expect.objectContaining({
            type: 'SHORT_ANSWER',
            question: 'Nêu định nghĩa hàm thuần khiết.',
          }),
        }),
      });
    });
  });
});

