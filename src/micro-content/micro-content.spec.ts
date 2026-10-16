import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import { MicroContentService } from './micro-content.service';

describe('MicroContentService', () => {
  const instructorClaims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000001',
    roles: ['instructor'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };

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
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      micro_content_questions: {
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };

    const service = new MicroContentService(prisma as never, authz as never);
    return { service, prisma, authz };
  }

  describe('list', () => {
    it('requires instructor/ta/admin role and returns items', async () => {
      const { service, prisma, authz } = setup();
      prisma.micro_contents.findMany.mockResolvedValue([
        {
          micro_content_id: microContentId,
          course_id: courseId,
          title: 'Bài học 1',
          description: 'Mô tả',
          video_source: 'UPLOAD',
          video_status: 'READY',
          video_duration_ms: 120000,
          video_error: null,
          passing_score: 70,
          required_watch_percent: 90,
          status: 'PUBLISHED',
          created_at: new Date(),
          updated_at: new Date(),
          _count: { questions: 3, attempts: 5 },
        },
      ]);

      const result = await service.list(instructorClaims, courseId);

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(instructorClaims, courseId, [
        'instructor',
        'ta',
        'admin',
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].questionCount).toBe(3);
      expect(result[0].attemptCount).toBe(5);
    });
  });

  describe('get', () => {
    const mockContent = {
      micro_content_id: microContentId,
      course_id: courseId,
      title: 'Micro Content 1',
      description: 'Mô tả',
      video_source: 'UPLOAD',
      video_status: 'READY',
      video_duration_ms: 60000,
      video_error: null,
      passing_score: 70,
      required_watch_percent: 90,
      status: 'PUBLISHED',
      questions: [
        {
          question_id: 'q1',
          position: 1,
          type: 'MCQ_SINGLE',
          question: '1 + 1 = ?',
          options: ['1', '2', '3', '4'],
          correct_answer: '2',
          explanation: 'Vì 1+1=2',
        },
      ],
    };

    it('returns full data including answers and explanations for staff', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue(mockContent);

      const result = await service.get(instructorClaims, microContentId);

      expect(result.questions[0].correctAnswer).toBe('2');
      expect(result.questions[0].explanation).toBe('Vì 1+1=2');
    });

    it('hides correct_answer and explanation for learner', async () => {
      const { service, prisma, authz } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue(mockContent);

      const result = await service.get(learnerClaims, microContentId);

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(learnerClaims, courseId, ['learner']);
      expect(result.questions[0]).toHaveProperty('id', 'q1');
      expect(result.questions[0]).toHaveProperty('question', '1 + 1 = ?');
      expect(result.questions[0]).not.toHaveProperty('correctAnswer');
      expect(result.questions[0]).not.toHaveProperty('correct_answer');
      expect(result.questions[0]).not.toHaveProperty('explanation');
    });

    it('throws NotFoundException when learner tries to view DRAFT content', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        ...mockContent,
        status: 'DRAFT',
      });

      await expect(service.get(learnerClaims, microContentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('refuses to publish when video is not READY', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_status: 'PROCESSING',
        status: 'DRAFT',
        _count: { questions: 2 },
      });

      await expect(service.publish(instructorClaims, microContentId, 'PUBLISHED')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses to publish when there are no questions', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_status: 'READY',
        status: 'DRAFT',
        _count: { questions: 0 },
      });

      await expect(service.publish(instructorClaims, microContentId, 'PUBLISHED')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('publishes successfully when video is READY and has questions', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_status: 'READY',
        status: 'DRAFT',
        _count: { questions: 1 },
      });
      prisma.micro_contents.update.mockResolvedValue({
        micro_content_id: microContentId,
        status: 'PUBLISHED',
      });

      const res = await service.publish(instructorClaims, microContentId, 'PUBLISHED');
      expect(res.status).toBe('PUBLISHED');
    });
  });

  describe('saveQuestions', () => {
    it('normalizes valid questions and saves them in a transaction', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
      });

      const questions = [
        {
          position: 1,
          type: 'MCQ_SINGLE',
          question: 'Thủ đô của Việt Nam là gì?',
          options: ['Hà Nội', 'Đà Nẵng', 'Huế', 'TP.HCM'],
          correctAnswer: 'Hà Nội',
          explanation: 'Hà Nội là thủ đô.',
        },
        {
          position: 2,
          type: 'TRUE_FALSE',
          question: 'Mặt trời mọc ở hướng Đông.',
          options: ['Đúng', 'Sai'],
          correctAnswer: 'Đúng',
        },
        {
          position: 3,
          type: 'FILL_BLANK',
          question: 'Hà Nội là thủ đô của ____.',
          options: null,
          correctAnswer: ['Việt Nam', 'Vietnam'],
        },
        {
          position: 4,
          type: 'SHORT_ANSWER',
          question: 'Trình bày định nghĩa hàm thuần khiết.',
          options: null,
          correctAnswer: {
            model_answer: 'Hàm thuần khiết không có tác dụng phụ.',
            rubric: ['Không tác dụng phụ', 'Cùng đầu vào trả cùng kết quả'],
          },
        },
      ];

      const res = await service.saveQuestions(instructorClaims, {
        microContentId,
        questions,
      });

      expect(res.success).toBe(true);
      expect(res.savedCount).toBe(4);
      expect(prisma.micro_content_questions.updateMany).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId, deleted_at: null },
        data: { deleted_at: expect.any(Date) },
      });
      expect(prisma.micro_content_questions.create).toHaveBeenCalledTimes(4);
    });

    it('rejects invalid answer key for MCQ_SINGLE', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
      });

      const questions = [
        {
          position: 1,
          type: 'MCQ_SINGLE',
          question: 'Câu hỏi test',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'E', // Không nằm trong options!
        },
      ];

      await expect(
        service.saveQuestions(instructorClaims, { microContentId, questions }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects FILL_BLANK if question has no blank placeholder', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
      });

      const questions = [
        {
          position: 1,
          type: 'FILL_BLANK',
          question: 'Câu hỏi không có chỗ trống nào.',
          options: null,
          correctAnswer: ['Đáp án'],
        },
      ];

      await expect(
        service.saveQuestions(instructorClaims, { microContentId, questions }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

