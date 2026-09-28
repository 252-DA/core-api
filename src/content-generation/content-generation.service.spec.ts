import type { BffClaims } from '../auth/bff-claims';
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
          scope: request.scope,
        }),
      }),
    });
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
      tx.content_generation_requests.create.mockResolvedValue({ request_id: 'r1' });
      await service.createRequest(claims, { courseId, type: 'quiz', scope: blueprintScope() });
      expect(prisma.documents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            document_id: { in: [SLIDE, REF] },
            course_id: courseId,
            chunks: { some: { deleted_at: null } },
          }),
        }),
      );
      expect(tx.outbox_events.create.mock.calls[0][0].data.payload.scope).toMatchObject({
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
        service.createRequest(claims, { courseId, type: 'quiz', scope: blueprintScope(overrides) }),
      ).rejects.toThrow(message);
      expect(tx.content_generation_requests.create).not.toHaveBeenCalled();
    });

    it('từ chối LO của khóa khác, tài liệu chưa xử lý, hoặc chỉ có tài liệu tham khảo', async () => {
      const { service, prisma } = setup();
      const create = () =>
        service.createRequest(claims, { courseId, type: 'quiz', scope: blueprintScope() });
      prisma.learning_outcomes.findFirst.mockResolvedValueOnce(null);
      await expect(create()).rejects.toThrow('LO không thuộc');
      prisma.documents.findMany.mockResolvedValueOnce([{ document_id: SLIDE, role: 'lecture' }]);
      await expect(create()).rejects.toThrow('chưa xử lý');
      prisma.documents.findMany.mockResolvedValueOnce([
        { document_id: SLIDE, role: 'reference' },
        { document_id: REF, role: 'reference' },
      ]);
      await expect(create()).rejects.toThrow('slide bài giảng');
    });
  });
});
