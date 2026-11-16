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
        create: jest.fn().mockImplementation((args) => Promise.resolve({ answer_id: 'ans-1', ...args?.data })),
      },
      outbox_events: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      $transaction: jest.fn(
        async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
          return cb(prisma);
        },
      ),
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

      prisma.micro_content_progress.upsert.mockImplementation(
        (args: { create: unknown }) => args.create,
      );

      // Client tua thẳng tới 90s (sau 5s thực tế)
      const res = await service.reportProgress(learnerClaims, {
        microContentId,
        positionMs: 90000,
      });

      // Increment chỉ được tối đa ~5000 * 2.2 = 11000ms, không thể nhảy vọt 80000ms!
      expect(res.watchedMs).toBeLessThanOrEqual(22000);
      expect(res.maxPositionMs).toBe(90000);
      expect(res.unlocked).toBe(false); // Chưa đạt 90%
    });

    it('accumulates playedMs when learner seeks ahead (or clicks scene button) then rewinds to watch', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_duration_ms: 100000,
        required_watch_percent: 90,
      });

      // Người học trước đó đã bấm nút cảnh nhảy tới 90s (max_position_ms=90000) nhưng mới xem 10s
      const fifteenSecondsAgo = new Date(Date.now() - 15000);
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        max_position_ms: 90000,
        watched_ms: 80000,
        updated_at: fifteenSecondsAgo,
      });
      prisma.micro_content_progress.upsert.mockImplementation(
        (args: { create: unknown }) => args.create,
      );

      // Quay lại xem đoạn 20s -> 32s (positionMs < max_position_ms nhưng playedMs = 12000ms)
      const res = await service.reportProgress(learnerClaims, {
        microContentId,
        positionMs: 32000,
        playedMs: 12000,
      });

      expect(res.watchedMs).toBe(92000);
      expect(res.maxPositionMs).toBe(90000);
      expect(res.watchedPercent).toBe(92);
      expect(res.unlocked).toBe(true);
    });

    it('supports 2x playback speed to reach full watch threshold without locking', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_duration_ms: 100000,
        required_watch_percent: 90,
      });

      // Sau 10s thực tế ở tốc độ 2x -> phát được 20s video
      const tenSecondsAgo = new Date(Date.now() - 10000);
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        max_position_ms: 75000,
        watched_ms: 75000,
        updated_at: tenSecondsAgo,
      });
      prisma.micro_content_progress.upsert.mockImplementation(
        (args: { create: unknown }) => args.create,
      );

      const res = await service.reportProgress(learnerClaims, {
        microContentId,
        positionMs: 95000,
        playedMs: 20000,
      });

      expect(res.watchedMs).toBe(95000);
      expect(res.watchedPercent).toBe(95);
      expect(res.unlocked).toBe(true);
    });

    it('adds 0 watchedMs when playback position does not advance (paused/idle)', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_duration_ms: 100000,
        required_watch_percent: 80,
      });

      const twoMinutesAgo = new Date(Date.now() - 120000);
      prisma.micro_content_progress.findUnique.mockResolvedValue({
        micro_content_id: microContentId,
        user_id: learnerClaims.sub,
        max_position_ms: 15000,
        watched_ms: 15000,
        updated_at: twoMinutesAgo,
      });
      prisma.micro_content_progress.upsert.mockImplementation(
        (args: { create: unknown }) => args.create,
      );

      const res = await service.reportProgress(learnerClaims, {
        microContentId,
        positionMs: 15000,
      });

      expect(res.watchedMs).toBe(15000);
      expect(res.maxPositionMs).toBe(15000);
      expect(res.watchedPercent).toBe(15);
      expect(res.unlocked).toBe(false);
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
      // Lệnh chấm tự chứa: worker nhận đề lúc nộp và bài làm, không đọc micro_content_answers.
      expect(prisma.outbox_events.create).toHaveBeenCalledWith({
        data: {
          event_type: 'MICRO_CONTENT_GRADING_REQUESTED',
          aggregate_type: 'micro_content_attempt',
          aggregate_id: 'attempt-essay',
          payload: {
            attempt_id: 'attempt-essay',
            course_id: courseId,
            micro_content_id: microContentId,
            answer_ids: ['ans-1'],
            answers: [
              {
                answer_id: 'ans-1',
                grading_input: {
                  type: 'SHORT_ANSWER',
                  question: 'Nêu định nghĩa hàm thuần khiết.',
                  correct_answer: {
                    model_answer: 'Không tác dụng phụ.',
                    rubric: ['Không tác dụng phụ', 'Trả cùng kết quả'],
                  },
                },
                chosen_answer: 'Hàm thuần khiết không sinh side-effect.',
              },
            ],
          },
        },
      });
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

