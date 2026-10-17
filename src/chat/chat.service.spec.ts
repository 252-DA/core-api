import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import { ChatService, settingEntityId } from './chat.service';

const claims: BffClaims = {
  sub: '00000000-0000-0000-0000-000000000002',
  courseId: '00000000-0000-0000-0000-000000000001',
  roles: ['learner'],
  scope: 'course',
  jti: 'jti',
  iat: 0,
  exp: 1,
};
const COURSE = '00000000-0000-0000-0000-000000000001';

function setup() {
  const tx = {
    chat_settings: { findUnique: jest.fn(), upsert: jest.fn() },
    review_audit_logs: { create: jest.fn() },
  };
  const prisma = {
    chat_settings: { findUnique: jest.fn().mockResolvedValue(null) },
    chat_runs: {
      create: jest.fn().mockResolvedValue({ run_id: 'run-1' }),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    documents: { findMany: jest.fn().mockResolvedValue([]) },
    chapters: { findMany: jest.fn().mockResolvedValue([]) },
    content_generation_requests: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
    $transaction: jest.fn(async (cb: (c: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  const authz = {
    assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    assertPlatformAdmin: jest.fn().mockResolvedValue(undefined),
  };
  return { service: new ChatService(prisma as never, authz as never), prisma, tx, authz };
}

describe('ChatService', () => {
  describe('chế độ truy xuất', () => {
    it('mặc định là vector khi chưa có dòng cài đặt', async () => {
      const { service } = setup();
      await expect(service.getSettings(claims)).resolves.toMatchObject({
        mode: 'vector',
        modes: ['vector', 'tools', 'graph'],
      });
    });

    it('bỏ qua giá trị lạ trong bảng và quay về vector', async () => {
      const { service, prisma } = setup();
      prisma.chat_settings.findUnique.mockResolvedValue({
        value: 'bogus', updated_at: new Date(), lms_user_mappings: { display_name: 'Admin' },
      });
      await expect(service.getSettings(claims)).resolves.toMatchObject({ mode: 'vector' });
    });

    it('admin đổi chế độ: ghi cài đặt và audit trong một giao dịch', async () => {
      const { service, tx, authz } = setup();
      tx.chat_settings.findUnique.mockResolvedValue({ value: 'vector' });
      await service.setMode(claims, { mode: 'graph' });
      expect(authz.assertPlatformAdmin).toHaveBeenCalled();
      expect(tx.chat_settings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: { key: 'retrieval_mode', value: 'graph', updated_by: claims.sub } }),
      );
      expect(tx.review_audit_logs.create.mock.calls[0][0].data).toMatchObject({
        action: 'SET_CHAT_MODE',
        entity_id: settingEntityId('retrieval_mode'),
        raw_changes: { from: 'vector', to: 'graph' },
      });
    });

    it('chọn lại đúng chế độ đang bật thì không ghi gì', async () => {
      const { service, tx } = setup();
      tx.chat_settings.findUnique.mockResolvedValue({ value: 'tools' });
      await service.setMode(claims, { mode: 'tools' });
      expect(tx.chat_settings.upsert).not.toHaveBeenCalled();
      expect(tx.review_audit_logs.create).not.toHaveBeenCalled();
    });

    it('từ chối chế độ không có trong danh sách', async () => {
      const { service, prisma } = setup();
      await expect(service.setMode(claims, { mode: 'agent' })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('không phải admin thì không đổi được', async () => {
      const { service, authz, prisma } = setup();
      authz.assertPlatformAdmin.mockRejectedValue(new ForbiddenException());
      await expect(service.setMode(claims, { mode: 'graph' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('ghi lượt hỏi đáp', () => {
    const body = {
      courseId: COURSE, mode: 'tools', question: 'Deadlock là gì?', answer: 'Là… [1]',
      citations: [{ index: 1, chunk_id: 'c1' }], toolCalls: [{ tool: 'search_chunks' }],
      model: 'gemini', steps: 2, inputTokens: 100.4, outputTokens: 30, latencyMs: 1200,
    };

    it('lưu đủ trường, làm tròn số, gắn người hỏi và nguồn web', async () => {
      const { service, prisma, authz } = setup();
      await expect(service.recordRun(claims, body)).resolves.toEqual({ run_id: 'run-1' });
      expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, COURSE);
      expect(prisma.chat_runs.create.mock.calls[0][0].data).toMatchObject({
        course_id: COURSE, user_id: claims.sub, mode: 'tools', source: 'web',
        steps: 2, input_tokens: 100, output_tokens: 30, latency_ms: 1200, status: 'OK',
      });
    });

    it('ghi lượt lỗi với trạng thái ERROR', async () => {
      const { service, prisma } = setup();
      await service.recordRun(claims, { ...body, answer: undefined, status: 'ERROR', error: 'LLM timeout' });
      expect(prisma.chat_runs.create.mock.calls[0][0].data).toMatchObject({
        status: 'ERROR', error: 'LLM timeout', answer: null,
      });
    });

    it.each([
      [{ courseId: undefined }, 'courseId'],
      [{ mode: 'bogus' }, 'Chế độ'],
      [{ question: '' }, 'câu hỏi'],
    ])('từ chối %j', async (override, message) => {
      const { service, prisma } = setup();
      await expect(service.recordRun(claims, { ...body, ...override })).rejects.toThrow(message);
      expect(prisma.chat_runs.create).not.toHaveBeenCalled();
    });

    it('người không thuộc khóa học bị từ chối trước khi ghi', async () => {
      const { service, prisma, authz } = setup();
      authz.assertCourseAccess.mockRejectedValue(new ForbiddenException());
      await expect(service.recordRun(claims, body)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.chat_runs.create).not.toHaveBeenCalled();
    });
  });

  describe('chấm 👍/👎', () => {
    it('chỉ người hỏi được chấm', async () => {
      const { service, prisma } = setup();
      prisma.chat_runs.findUnique.mockResolvedValue({ user_id: 'someone-else' });
      await expect(service.rateRun(claims, { runId: 'run-1', rating: 1 })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.chat_runs.update).not.toHaveBeenCalled();
    });

    it('ghi 1, -1 và bỏ chấm bằng 0', async () => {
      const { service, prisma } = setup();
      prisma.chat_runs.findUnique.mockResolvedValue({ user_id: claims.sub });
      await service.rateRun(claims, { runId: 'run-1', rating: -1 });
      expect(prisma.chat_runs.update).toHaveBeenLastCalledWith({ where: { run_id: 'run-1' }, data: { rating: -1 } });
      await service.rateRun(claims, { runId: 'run-1', rating: 0 });
      expect(prisma.chat_runs.update).toHaveBeenLastCalledWith({ where: { run_id: 'run-1' }, data: { rating: null } });
    });

    it('từ chối điểm lạ và lượt không tồn tại', async () => {
      const { service, prisma } = setup();
      await expect(service.rateRun(claims, { runId: 'run-1', rating: 5 })).rejects.toBeInstanceOf(BadRequestException);
      prisma.chat_runs.findUnique.mockResolvedValue(null);
      await expect(service.rateRun(claims, { runId: 'nope', rating: 1 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('thống kê', () => {
    it('gộp theo chế độ, đủ ba chế độ kể cả khi chưa có lượt nào', async () => {
      const { service, prisma } = setup();
      prisma.chat_runs.groupBy
        .mockResolvedValueOnce([
          { mode: 'tools', _count: { _all: 4 }, _avg: { latency_ms: 2500.6, steps: 2.25, input_tokens: 900, output_tokens: 120 } },
        ])
        .mockResolvedValueOnce([{ mode: 'tools', status: 'ERROR', _count: { _all: 1 } }])
        .mockResolvedValueOnce([
          { mode: 'tools', rating: 1, _count: { _all: 2 } },
          { mode: 'tools', rating: -1, _count: { _all: 1 } },
        ]);
      const out = await service.stats(claims, { courseId: COURSE });
      expect(out.modes.map((m) => m.mode)).toEqual(['vector', 'tools', 'graph']);
      expect(out.modes[0]).toMatchObject({ runs: 0, avg_latency_ms: null });
      expect(out.modes[1]).toMatchObject({
        runs: 4, errors: 1, avg_latency_ms: 2501, avg_steps: 2.3, rated_up: 2, rated_down: 1,
      });
    });

    it('giảng viên cần quyền trong khóa; không chỉ định khóa thì cần admin', async () => {
      const { service, authz } = setup();
      await service.stats(claims, { courseId: COURSE });
      expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, COURSE, ['instructor', 'ta']);
      await service.stats(claims, {});
      expect(authz.assertPlatformAdmin).toHaveBeenCalled();
    });

    it('trả số quan hệ theo tài liệu và cắt ngắn câu trả lời dài', async () => {
      const { service, prisma } = setup();
      prisma.documents.findMany.mockResolvedValue([
        { document_id: 'd1', title: 'Ch1.pdf', role: 'lecture', chapter_code: '1' },
        { document_id: 'd2', title: 'Ch2.pdf', role: 'lecture', chapter_code: '2' },
      ]);
      prisma.$queryRaw.mockResolvedValue([{ document_id: 'd1', n: 12 }]);
      prisma.chat_runs.findMany.mockResolvedValue([{ run_id: 'r', answer: 'x'.repeat(900) }]);
      const out = await service.stats(claims, { courseId: COURSE });
      expect(out.graph?.documents).toEqual([
        expect.objectContaining({ document_id: 'd1', relations: 12 }),
        expect.objectContaining({ document_id: 'd2', relations: 0 }),
      ]);
      expect(out.graph?.total_relations).toBe(12);
      expect(out.recent[0].answer?.length).toBe(601);
    });
  });
});
