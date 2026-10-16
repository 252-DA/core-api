import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ModelSettingsService, taskEntityId } from './model-settings.service';
import type { BffClaims } from '../auth/bff-claims';

jest.mock('./model-catalog', () => ({
  loadModelCatalog: () => ({
    profiles: [
      { name: 'deepseek-chat', provider: 'deepseek', model: 'deepseek-chat' },
      { name: 'gemini-flash', provider: 'gemini', model: 'gemini-3-flash-preview' },
    ],
    tasks: [
      { task: 'quiz_generation', default_profile: 'deepseek-chat', use_cases: ['quiz_generation'] },
      {
        task: 'quiz_verification',
        default_profile: 'gemini-flash',
        use_cases: ['quiz_verification', 'answer_grading'],
      },
    ],
  }),
}));

const ADMIN = '00000000-0000-0000-0000-00000000000a';
const claims: BffClaims = {
  sub: ADMIN,
  scope: 'course',
  roles: ['administrator'],
  jti: 't',
  iat: 0,
  exp: 1,
};

function setup(existing: { task: string; profile: string } | null = null) {
  const prisma = {
    llm_model_bindings: {
      findMany: jest.fn().mockResolvedValue(
        existing
          ? [{ ...existing, updated_at: new Date(0), lms_user_mappings: { display_name: 'Admin' } }]
          : [],
      ),
      findUnique: jest.fn().mockResolvedValue(existing),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    llm_usage_logs: {
      findFirst: jest.fn().mockResolvedValue(null),
      groupBy: jest.fn().mockResolvedValue([
        { status: 'OK', _count: { _all: 3 } },
        { status: 'ERROR', _count: { _all: 2 } },
      ]),
    },
    review_audit_logs: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  const authz = { assertPlatformAdmin: jest.fn() };
  const service = new ModelSettingsService(prisma as never, authz as never);
  return { service, prisma, authz };
}

describe('ModelSettingsService', () => {
  it('liệt kê mọi task trong danh mục, kèm lựa chọn hiện tại và số lần gọi gần đây', async () => {
    const { service, authz } = setup({ task: 'quiz_verification', profile: 'deepseek-chat' });
    const result = await service.list(claims);

    expect(authz.assertPlatformAdmin).toHaveBeenCalledWith(claims);
    expect(result.tasks.map((t) => t.task)).toEqual(['quiz_generation', 'quiz_verification']);
    expect(result.tasks[0].binding).toBeNull();
    expect(result.tasks[1].binding).toMatchObject({ profile: 'deepseek-chat', updated_by: 'Admin' });
    expect(result.tasks[1].recent).toEqual({ hours: 24, ok: 3, error: 2 });
    expect(result.ttl_seconds).toBe(30);
  });

  it('chọn model: ghi binding và một dòng audit có giá trị trước/sau', async () => {
    const { service, prisma } = setup();
    await service.set(claims, { task: 'quiz_generation', profile: 'gemini-flash' });

    expect(prisma.llm_model_bindings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { task: 'quiz_generation' },
        create: { task: 'quiz_generation', profile: 'gemini-flash', updated_by: ADMIN },
      }),
    );
    expect(prisma.review_audit_logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'SET_MODEL_BINDING',
        entity_type: 'llm_model_binding',
        entity_id: taskEntityId('quiz_generation'),
        performed_by: ADMIN,
        raw_changes: { task: 'quiz_generation', from: null, to: 'gemini-flash' },
      }),
    });
  });

  it('profile rỗng: xoá binding để task quay về mặc định', async () => {
    const { service, prisma } = setup({ task: 'quiz_generation', profile: 'gemini-flash' });
    await service.set(claims, { task: 'quiz_generation', profile: '' });

    expect(prisma.llm_model_bindings.delete).toHaveBeenCalledWith({ where: { task: 'quiz_generation' } });
    expect(prisma.review_audit_logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'RESET_MODEL_BINDING',
        raw_changes: { task: 'quiz_generation', from: 'gemini-flash', to: null },
      }),
    });
  });

  it('chọn lại đúng model đang dùng: không ghi gì', async () => {
    const { service, prisma } = setup({ task: 'quiz_generation', profile: 'gemini-flash' });
    await service.set(claims, { task: 'quiz_generation', profile: 'gemini-flash' });

    expect(prisma.llm_model_bindings.upsert).not.toHaveBeenCalled();
    expect(prisma.review_audit_logs.create).not.toHaveBeenCalled();
  });

  it('từ chối profile ngoài danh mục: không ai trỏ được key thật sang model lạ', async () => {
    const { service, prisma } = setup();
    await expect(
      service.set(claims, { task: 'quiz_generation', profile: 'gpt-99' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('từ chối task không đọc bảng này', async () => {
    const { service } = setup();
    await expect(service.set(claims, { task: 'tutor', profile: 'gemini-flash' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('không phải admin thì không đọc cũng không ghi được', async () => {
    const { service, prisma, authz } = setup();
    authz.assertPlatformAdmin.mockRejectedValue(new ForbiddenException());

    await expect(service.list(claims)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.set(claims, { task: 'quiz_generation', profile: 'gemini-flash' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('entity_id của audit là UUID cố định theo task', () => {
    const id = taskEntityId('quiz_generation');

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(taskEntityId('quiz_generation')).toBe(id);
    expect(taskEntityId('enrichment')).not.toBe(id);
  });
});
