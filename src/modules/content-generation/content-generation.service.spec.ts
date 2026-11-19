import type { BffClaims } from '../../auth/bff-claims';
import { ContentGenerationService } from './content-generation.service';

describe('ContentGenerationService', () => {
  const claims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['instructor'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const courseId = '00000000-0000-0000-0000-000000000001';
  const LO = '00000000-0000-0000-0000-0000000000a1';
  const SLIDE = '00000000-0000-0000-0000-0000000000d1';
  const REF = '00000000-0000-0000-0000-0000000000d2';
  const CHAPTER = '00000000-0000-0000-0000-0000000000c1';
  const blueprintScope = (overrides: Record<string, unknown> = {}) => ({
    target_kind: 'lo',
    target_code: LO,
    bloom_level: 'apply',
    count: 2,
    style: 'quiz',
    source_document_ids: [SLIDE, REF],
    ...overrides,
  });

  function setup() {
    const tx = {
      content_generation_requests: {
        create: jest.fn(),
      },
      outbox_events: {
        create: jest.fn(),
      },
    };
    const prisma = {
      chapters: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ chapter_id: CHAPTER, code: '1' }),
      },
      content_generation_requests: {
        findMany: jest.fn(),
      },
      learning_outcomes: {
        findFirst: jest.fn().mockResolvedValue({ lo_id: LO }),
      },
      documents: {
        findMany: jest.fn().mockResolvedValue([
          { document_id: SLIDE, role: 'lecture' },
          { document_id: REF, role: 'reference' },
        ]),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ContentGenerationService(
      prisma as never,
      authz as never,
    );

    return { service, prisma, tx, authz };
  }

  it('creates a queued request and its outbox event atomically', async () => {
    const { service, tx, authz } = setup();
    const request = {
      request_id: '00000000-0000-0000-0000-000000000003',
      course_id: courseId,
      requested_by: claims.sub,
      type: 'quiz',
      scope: { target_kind: 'lo', target_code: 'L.O.1.1', count: 5 },
      status: 'QUEUED',
    };
    tx.content_generation_requests.create.mockResolvedValue(request);
    tx.outbox_events.create.mockResolvedValue({ event_id: 'event-1' });

    await expect(
      service.createRequest(claims, {
        courseId,
        type: 'quiz',
        scope: request.scope,
      }),
    ).resolves.toBe(request);

    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId, [
      'instructor',
      'ta',
    ]);
    expect(tx.content_generation_requests.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        course_id: courseId,
        requested_by: claims.sub,
        type: 'quiz',
        status: 'QUEUED',
      }),
    });
    expect(tx.outbox_events.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event_type: 'CONTENT_GENERATION_REQUESTED',
        aggregate_id: request.request_id,
        payload: expect.objectContaining({
          request_id: request.request_id,
          course_id: courseId,
          type: 'quiz',
          // Thiếu kiểu câu thì core-api ghi rõ mặc định cho worker.
          scope: { ...request.scope, question_type: 'MCQ_SINGLE' },
        }),
      }),
    });
  });

  it('rejects an unknown question type before writing anything', async () => {
    const { service, tx } = setup();

    await expect(
      service.createRequest(claims, {
        courseId,
        type: 'quiz',
        scope: {
          target_kind: 'lo',
          target_code: 'L.O.1.1',
          question_type: 'ESSAY',
        },
      }),
    ).rejects.toThrow('Kiểu câu hỏi không hợp lệ.');
    expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
  });

  it('lists the newest course requests with an upper-clamped limit', async () => {
    const { service, prisma, authz } = setup();
    const requests = [{ request_id: 'request-1' }];
    prisma.content_generation_requests.findMany.mockResolvedValue(requests);

    await expect(
      service.listRequests(claims, courseId, 500, 'quiz'),
    ).resolves.toBe(requests);

    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId, [
      'instructor',
      'ta',
    ]);
    expect(prisma.content_generation_requests.findMany).toHaveBeenCalledWith({
      where: { course_id: courseId, type: 'quiz' },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  });

  it('uses the recent default for an invalid limit', async () => {
    const { service, prisma } = setup();
    prisma.content_generation_requests.findMany.mockResolvedValue([]);

    await service.listRequests(claims, courseId, 'invalid');

    expect(prisma.content_generation_requests.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it('rejects an unsupported request type filter', async () => {
    const { service, prisma } = setup();

    await expect(
      service.listRequests(claims, courseId, 20, 'video'),
    ).rejects.toThrow('type must be one of: card, quiz');

    expect(prisma.content_generation_requests.findMany).not.toHaveBeenCalled();
  });

  describe('ma trận đề với tài liệu nguồn tự chọn', () => {
    it('nhận ô LO × Bloom khi tài liệu thuộc khóa học, đã xử lý và có slide', async () => {
      const { service, prisma, tx } = setup();
      tx.content_generation_requests.create.mockResolvedValue({
        request_id: 'r1',
      });
      await service.createRequest(claims, {
        courseId,
        type: 'quiz',
        scope: blueprintScope(),
      });
      expect(prisma.documents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            document_id: { in: [SLIDE, REF] },
            course_id: courseId,
            chunks: { some: { deleted_at: null } },
          }),
        }),
      );
      expect(
        tx.outbox_events.create.mock.calls[0][0].data.payload.scope,
      ).toMatchObject({
        source_document_ids: [SLIDE, REF],
        bloom_level: 'apply',
        count: 2,
      });
    });

    it.each([
      [{ source_document_ids: [] }, 'tài liệu nguồn'],
      [{ source_document_ids: ['không-phải-uuid'] }, 'tài liệu nguồn'],
      [{ count: 0 }, 'Mỗi ô'],
      [{ count: 21 }, 'Mỗi ô'],
      [{ bloom_level: 'memorize' }, 'Bloom'],
      [{ target_kind: 'chapter' }, 'theo LO'],
    ])('từ chối %j', async (overrides, message) => {
      const { service, tx } = setup();
      await expect(
        service.createRequest(claims, {
          courseId,
          type: 'quiz',
          scope: blueprintScope(overrides),
        }),
      ).rejects.toThrow(message);
      expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
    });

    it('từ chối LO của khóa khác, tài liệu chưa xử lý, hoặc chỉ có tài liệu tham khảo', async () => {
      const { service, prisma } = setup();
      const create = () =>
        service.createRequest(claims, {
          courseId,
          type: 'quiz',
          scope: blueprintScope(),
        });
      prisma.learning_outcomes.findFirst.mockResolvedValueOnce(null);
      await expect(create()).rejects.toThrow('LO không thuộc');
      prisma.documents.findMany.mockResolvedValueOnce([
        { document_id: SLIDE, role: 'lecture' },
      ]);
      await expect(create()).rejects.toThrow('chưa xử lý');
      prisma.documents.findMany.mockResolvedValueOnce([
        { document_id: SLIDE, role: 'reference' },
        { document_id: REF, role: 'reference' },
      ]);
      await expect(create()).rejects.toThrow('slide bài giảng');
    });

    it('tạo nhiều yêu cầu trong một transaction duy nhất và hủy toàn bộ nếu một ô lỗi', async () => {
      const { service, prisma, tx } = setup();
      tx.content_generation_requests.create
        .mockResolvedValueOnce({ request_id: 'r1' })
        .mockResolvedValueOnce({ request_id: 'r2' });

      const result = await service.createRequest(claims, {
        courseId,
        type: 'quiz',
        scopes: [
          blueprintScope({ bloom_level: 'remember', count: 2 }),
          blueprintScope({ bloom_level: 'apply', count: 3 }),
        ],
      });

      expect(result).toEqual([{ request_id: 'r1' }, { request_id: 'r2' }]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.content_generation_requests.create).toHaveBeenCalledTimes(2);
      expect(tx.outbox_events.create).toHaveBeenCalledTimes(2);

      tx.content_generation_requests.create.mockClear();
      tx.outbox_events.create.mockClear();
      await expect(
        service.createRequest(claims, {
          courseId,
          type: 'quiz',
          scopes: [
            blueprintScope({ bloom_level: 'remember', count: 2 }),
            blueprintScope({ bloom_level: 'invalid_bloom', count: 3 }),
          ],
        }),
      ).rejects.toThrow('Bloom');
      expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
    });
  });
  describe('dựng đồ thị quan hệ (type = relations)', () => {
    it('lấy mọi tài liệu đã xử lý của chương làm nguồn', async () => {
      const { service, prisma, tx } = setup();
      tx.content_generation_requests.create.mockResolvedValue({
        request_id: 'r1',
      });
      prisma.documents.findMany.mockResolvedValueOnce([
        { document_id: SLIDE },
        { document_id: REF },
      ]);
      await service.createRequest(claims, {
        courseId,
        type: 'relations',
        scope: { chapter_id: CHAPTER },
      });
      expect(prisma.documents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            course_id: courseId,
            chapter_code: '1',
            chunks: { some: { deleted_at: null } },
          }),
        }),
      );
      expect(
        tx.content_generation_requests.create.mock.calls[0][0].data,
      ).toMatchObject({
        type: 'relations',
        status: 'QUEUED',
      });
      expect(
        tx.outbox_events.create.mock.calls[0][0].data.payload,
      ).toMatchObject({
        type: 'relations',
        scope: { chapter_id: CHAPTER, source_document_ids: [SLIDE, REF] },
      });
    });

    it('nhận danh sách tài liệu khi không chọn chương', async () => {
      const { service, tx } = setup();
      tx.content_generation_requests.create.mockResolvedValue({
        request_id: 'r1',
      });
      await service.createRequest(claims, {
        courseId,
        type: 'relations',
        scope: { source_document_ids: [SLIDE, REF] },
      });
      expect(
        tx.outbox_events.create.mock.calls[0][0].data.payload.scope,
      ).toEqual({
        source_document_ids: [SLIDE, REF],
      });
    });

    it.each([
      [{}, 'chương hoặc ít nhất một tài liệu'],
      [{ source_document_ids: [] }, 'chương hoặc ít nhất một tài liệu'],
      [
        { source_document_ids: ['không-phải-uuid'] },
        'chương hoặc ít nhất một tài liệu',
      ],
    ])('từ chối phạm vi %j', async (scope, message) => {
      const { service, tx } = setup();
      await expect(
        service.createRequest(claims, { courseId, type: 'relations', scope }),
      ).rejects.toThrow(message);
      expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
    });

    it('từ chối chương của khóa khác và chương chưa có tài liệu', async () => {
      const { service, prisma } = setup();
      const create = () =>
        service.createRequest(claims, {
          courseId,
          type: 'relations',
          scope: { chapter_id: CHAPTER },
        });
      prisma.chapters.findFirst.mockResolvedValueOnce(null);
      await expect(create()).rejects.toThrow('Chương không thuộc');
      prisma.documents.findMany.mockResolvedValueOnce([]);
      await expect(create()).rejects.toThrow('chưa có tài liệu');
    });

    it('từ chối tài liệu chưa xử lý hoặc của khóa khác', async () => {
      const { service, prisma } = setup();
      prisma.documents.findMany.mockResolvedValueOnce([{ document_id: SLIDE }]);
      await expect(
        service.createRequest(claims, {
          courseId,
          type: 'relations',
          scope: { source_document_ids: [SLIDE, REF] },
        }),
      ).rejects.toThrow('chưa xử lý');
    });

    it('cho phép lọc danh sách yêu cầu theo loại relations', async () => {
      const { service, prisma } = setup();
      await service.listRequests(claims, courseId, 5, 'relations');
      expect(prisma.content_generation_requests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { course_id: courseId, type: 'relations' },
        }),
      );
    });
  });
});
