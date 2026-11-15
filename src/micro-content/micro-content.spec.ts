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
      $transaction: jest.fn(
        async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
          return cb(prisma);
        },
      ),
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

      expect(result.questions[0]).toMatchObject({
        correctAnswer: '2',
        explanation: 'Vì 1+1=2',
      });
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

  describe('requestRender', () => {
    // Kết quả worker chỉ được áp dụng khi mang đúng render_id đang ghi trên
    // asset (MicroContentVideoResultHandler), nên lệnh và asset phải cùng id.
    type DataArgs = { data: Record<string, unknown> };
    function renderSetup(existingAsset: { source_type: string } | null) {
      const { service, prisma } = setup();
      const tx = {
        video_assets: {
          findUnique: jest.fn().mockResolvedValue(existingAsset),
          update: jest.fn<Promise<unknown>, [DataArgs]>(),
          create: jest
            .fn<Promise<{ asset_id: string }>, [DataArgs]>()
            .mockResolvedValue({ asset_id: 'new-asset' }),
        },
        micro_contents: { update: jest.fn() },
        outbox_events: { create: jest.fn<Promise<unknown>, [DataArgs]>() },
      };
      prisma.$transaction.mockImplementation(
        async (cb: (t: unknown) => Promise<unknown>) => cb(tx),
      );
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Đệ quy',
        video_asset_id: existingAsset ? 'ai-asset' : null,
        ai_script: { scenes: [{ title: 'Giới thiệu' }] },
      });
      return { service, tx };
    }

    it('puts the same new render_id on the created asset and in the command', async () => {
      const { service, tx } = renderSetup(null);

      await service.requestRender(instructorClaims, { microContentId });

      const renderId =
        tx.video_assets.create.mock.calls[0][0].data.ai_render_id;
      expect(renderId).toMatch(/^[0-9a-f-]{36}$/);
      const command = tx.outbox_events.create.mock.calls[0][0].data;
      expect(command.event_type).toBe('MICRO_CONTENT_RENDER_REQUESTED');
      expect(command.payload).toEqual({
        micro_content_id: microContentId,
        course_id: courseId,
        asset_id: 'new-asset',
        render_id: renderId,
        script: { scenes: [{ title: 'Giới thiệu' }] },
      });
    });

    it('sends the canonical id from the database, not the spelling the client used', async () => {
      const { service, tx } = renderSetup(null);
      // Postgres nhận uuid viết hoa và bỏ gạch nên findFirst vẫn thấy dòng; worker
      // kiểm uuid dạng chuẩn thì từ chối lệnh mang chuỗi của client.
      const sloppy = microContentId.toUpperCase().replace(/-/g, '');

      await service.requestRender(instructorClaims, { microContentId: sloppy });

      const command = tx.outbox_events.create.mock.calls[0][0].data;
      expect(command.aggregate_id).toBe(microContentId);
      expect(command.payload).toMatchObject({ micro_content_id: microContentId });
      expect(tx.micro_contents.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { micro_content_id: microContentId } }),
      );
    });

    it('re-render of the AI asset replaces its render_id with a fresh one', async () => {
      const { service, tx } = renderSetup({ source_type: 'AI_STUDIO' });

      await service.requestRender(instructorClaims, { microContentId });
      await service.requestRender(instructorClaims, { microContentId });

      const [first, second] = tx.video_assets.update.mock.calls.map(
        (call) => call[0].data.ai_render_id,
      );
      expect(first).not.toEqual(second);
      expect(
        tx.outbox_events.create.mock.calls[1][0].data.payload,
      ).toMatchObject({ asset_id: 'ai-asset', render_id: second });
    });

    it('blocks rendering when FLAGGED scenes exist unless allowFlagged is true', async () => {
      const { service, prisma } = setup();
      const tx = {
        video_assets: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue({ asset_id: 'new-asset' }),
        },
        micro_contents: { update: jest.fn() },
        outbox_events: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation(
        async (cb: (t: unknown) => Promise<unknown>) => cb(tx),
      );
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Spark RDD',
        video_asset_id: null,
        ai_script: {
          scenes: [
            { title: 'Cảnh 1', check: { status: 'VERIFIED' } },
            { title: 'Cảnh 2', check: { status: 'FLAGGED' } },
          ],
        },
      });

      await expect(
        service.requestRender(instructorClaims, { microContentId }),
      ).rejects.toThrow(/chưa kiểm chứng/);
      expect(tx.outbox_events.create).not.toHaveBeenCalled();

      await service.requestRender(instructorClaims, {
        microContentId,
        allowFlagged: true,
      });
      expect(tx.outbox_events.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('AI outline / script / quiz workflow', () => {
    const docId = '33333333-3333-4333-8333-333333333333';
    const loId = '44444444-4444-4444-8444-444444444444';

    function aiSetup() {
      const reqId = '55555555-5555-4555-8555-555555555555';
      const tx = {
        content_generation_requests: {
          create: jest.fn().mockResolvedValue({ request_id: reqId, status: 'QUEUED' }),
        },
        micro_contents: {
          create: jest.fn(),
          update: jest.fn().mockResolvedValue({}),
        },
        outbox_events: {
          create: jest.fn().mockResolvedValue({ event_id: 'evt-1' }),
        },
      };
      const prisma = {
        documents: {
          findFirst: jest.fn(),
        },
        chunks: {
          count: jest.fn().mockResolvedValue(12),
        },
        learning_outcomes: {
          findFirst: jest.fn(),
        },
        content_generation_requests: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        micro_contents: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        $transaction: jest.fn(async (cb: (t: unknown) => Promise<unknown>) => cb(tx)),
      };
      const authz = {
        assertCourseAccess: jest.fn().mockResolvedValue(undefined),
      };
      const service = new MicroContentService(prisma as never, authz as never);
      return { service, prisma, tx, reqId };
    }

    it('requestOutline validates lecture doc & chunks and emits CONTENT_GENERATION_REQUESTED', async () => {
      const { service, prisma, tx, reqId } = aiSetup();
      prisma.documents.findFirst.mockResolvedValue({
        document_id: docId,
        title: 'Spark.pdf',
        role: 'lecture',
        chapter_code: '8',
      });

      const res = await service.requestOutline(instructorClaims, {
        courseId,
        documentId: docId,
      });

      expect(res).toEqual({ requestId: reqId, status: 'QUEUED', deduplicated: false });
      expect(tx.content_generation_requests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          course_id: courseId,
          type: 'micro_outline',
          status: 'QUEUED',
        }),
      });
      expect(tx.outbox_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'CONTENT_GENERATION_REQUESTED',
          payload: expect.objectContaining({
            request_id: reqId,
            type: 'micro_outline',
            scope: expect.objectContaining({ document_id: docId, chapter_code: '8' }),
          }),
        }),
      });
    });

    it('requestOutline deduplicates active request for same document', async () => {
      const { service, prisma, tx } = aiSetup();
      prisma.documents.findFirst.mockResolvedValue({
        document_id: docId,
        title: 'Spark.pdf',
        role: 'lecture',
        chapter_code: '8',
      });
      prisma.content_generation_requests.findMany.mockResolvedValue([
        { request_id: 'active-req-1', status: 'PROCESSING', scope: { document_id: docId } },
      ]);

      const res = await service.requestOutline(instructorClaims, {
        courseId,
        documentId: docId,
      });

      expect(res).toEqual({ requestId: 'active-req-1', status: 'PROCESSING', deduplicated: true });
      expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
    });

    it('requestScript rejects when source_document_id is missing, else queues video_script', async () => {
      const { service, prisma, tx, reqId } = aiSetup();
      prisma.micro_contents.findFirst.mockResolvedValueOnce({
        micro_content_id: microContentId,
        course_id: courseId,
        source_document_id: null,
        title: 'Chủ đề 1',
      });
      await expect(
        service.requestScript(instructorClaims, { microContentId }),
      ).rejects.toThrow(BadRequestException);

      prisma.micro_contents.findFirst.mockResolvedValueOnce({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Spark RDD',
        description: 'Tóm tắt RDD',
        source_document_id: docId,
        source_page_from: 3,
        source_page_to: 8,
        lo_id: loId,
        learning_outcome: {
          lo_id: loId,
          code: 'L.O.8.1',
          statement_vi: 'Hiểu mô hình RDD',
          statement_en: null,
        },
      });
      prisma.micro_contents.findMany.mockResolvedValue([{ title: 'DataFrame API' }]);

      const res = await service.requestScript(instructorClaims, { microContentId });

      expect(res).toEqual({
        success: true,
        requestId: reqId,
        scriptStatus: 'GENERATING',
      });
      expect(tx.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          script_status: 'GENERATING',
          script_request_id: reqId,
        }),
      });
      expect(tx.outbox_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: 'CONTENT_GENERATION_REQUESTED',
          payload: expect.objectContaining({
            type: 'video_script',
            scope: expect.objectContaining({
              micro_content_id: microContentId,
              document_id: docId,
              page_from: 3,
              page_to: 8,
              lo_code: 'L.O.8.1',
              neighbor_topics: ['DataFrame API'],
            }),
          }),
        }),
      });
    });

    it('requestQuiz emits micro_quiz request with clamped count and valid types', async () => {
      const { service, prisma, tx, reqId } = aiSetup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Spark RDD',
        source_document_id: docId,
        source_page_from: 3,
        source_page_to: 8,
        lo_id: loId,
        learning_outcome: { lo_id: loId, code: 'L.O.8.1', statement_vi: 'Hiểu RDD', statement_en: null },
        ai_script: { scenes: [] },
      });

      const res = await service.requestQuiz(instructorClaims, {
        microContentId,
        count: 4,
        questionTypes: ['MCQ_SINGLE', 'SHORT_ANSWER'],
      });

      expect(res).toEqual({ success: true, requestId: reqId, status: 'QUEUED' });
      expect(tx.outbox_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            type: 'micro_quiz',
            scope: expect.objectContaining({
              micro_content_id: microContentId,
              count: 4,
              question_types: ['MCQ_SINGLE', 'SHORT_ANSWER'],
            }),
          }),
        }),
      });
    });

    it('list orders sections of same source_document_id by position', async () => {
      const { service, prisma } = aiSetup();
      prisma.micro_contents.findMany.mockResolvedValue([
        {
          micro_content_id: 'b2',
          course_id: courseId,
          title: 'Phần 2',
          source_document_id: docId,
          source_document: { document_id: docId, title: 'Spark.pdf' },
          source_page_from: 6,
          source_page_to: 10,
          lo_id: loId,
          learning_outcome: { lo_id: loId, code: 'L.O.8.1', statement_vi: 'Hiểu RDD' },
          position: 2,
          script_status: 'READY',
          ai_script: { scenes: [{ check: { status: 'FLAGGED' } }] },
          _count: { questions: 0, attempts: 0 },
        },
        {
          micro_content_id: 'a1',
          course_id: courseId,
          title: 'Phần 1',
          source_document_id: docId,
          source_document: { document_id: docId, title: 'Spark.pdf' },
          source_page_from: 1,
          source_page_to: 5,
          lo_id: null,
          learning_outcome: null,
          position: 1,
          script_status: 'NONE',
          ai_script: null,
          _count: { questions: 2, attempts: 1 },
        },
      ]);

      const items = await service.list(instructorClaims, courseId);

      expect(items.map((i) => i.id)).toEqual(['a1', 'b2']);
      expect(items[1].flaggedSceneCount).toBe(1);
    });
  });
});
