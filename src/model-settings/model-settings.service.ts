import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { PrismaService } from '../prisma/prisma.service';
import { loadModelCatalog } from './model-catalog';

/** Khớp _BINDING_TTL_SECONDS ở worker/container.py: lâu nhất chừng này giây thì job mới dùng model mới. */
export const BINDING_TTL_SECONDS = 30;
const RECENT_HOURS = 24;

/**
 * review_audit_logs.entity_id là UUID, task là chuỗi: lấy UUID cố định theo
 * tên task (kiểu v5) để mọi lần đổi của một task chung một entity_id.
 */
export function taskEntityId(task: string) {
  const bytes = createHash('sha1').update(`llm_model_binding:${task}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Admin chọn model cho từng task. Chỉ ghi TÊN profile có trong danh mục; API
 * key không đi qua đây. Worker đọc bảng mỗi BINDING_TTL_SECONDS giây.
 */
@Injectable()
export class ModelSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(claims: BffClaims) {
    await this.authz.assertPlatformAdmin(claims);
    const catalog = loadModelCatalog();
    const bindings = await this.prisma.llm_model_bindings.findMany({
      include: { lms_user_mappings: { select: { display_name: true } } },
    });
    const byTask = new Map(bindings.map((b) => [b.task, b]));
    const since = new Date(Date.now() - RECENT_HOURS * 3600 * 1000);

    const tasks = await Promise.all(
      catalog.tasks.map(async (task) => {
        const where = { use_case: { in: task.use_cases } };
        const [lastCall, counts] = await Promise.all([
          this.prisma.llm_usage_logs.findFirst({
            where,
            orderBy: { called_at: 'desc' },
            select: { use_case: true, provider: true, model: true, status: true, called_at: true },
          }),
          this.prisma.llm_usage_logs.groupBy({
            by: ['status'],
            where: { ...where, called_at: { gte: since } },
            _count: { _all: true },
          }),
        ]);
        const binding = byTask.get(task.task);
        const ok = counts.find((c) => c.status === 'OK')?._count._all ?? 0;
        const total = counts.reduce((sum, c) => sum + c._count._all, 0);
        return {
          ...task,
          binding: binding
            ? {
                profile: binding.profile,
                updated_at: binding.updated_at,
                updated_by: binding.lms_user_mappings.display_name,
              }
            : null,
          last_call: lastCall,
          recent: { hours: RECENT_HOURS, ok, error: total - ok },
        };
      }),
    );
    return { profiles: catalog.profiles, tasks, ttl_seconds: BINDING_TTL_SECONDS };
  }

  /** `profile` rỗng/null = bỏ lựa chọn, task quay về env/mặc định của worker. */
  async set(claims: BffClaims, body: { task?: unknown; profile?: unknown }) {
    await this.authz.assertPlatformAdmin(claims);
    const catalog = loadModelCatalog();
    const task = typeof body.task === 'string' ? body.task : '';
    if (!catalog.tasks.some((t) => t.task === task)) {
      throw new BadRequestException(`Task không hỗ trợ chọn model: ${task || '(trống)'}`);
    }
    const profile = typeof body.profile === 'string' ? body.profile.trim() : '';
    if (profile && !catalog.profiles.some((p) => p.name === profile)) {
      throw new BadRequestException(`Model không có trong danh mục: ${profile}`);
    }

    await this.prisma.$transaction(async (tx) => {
      const before = await tx.llm_model_bindings.findUnique({ where: { task } });
      const from = before?.profile ?? null;
      const to = profile || null;
      if (from === to) return;
      if (to) {
        await tx.llm_model_bindings.upsert({
          where: { task },
          create: { task, profile: to, updated_by: claims.sub },
          update: { profile: to, updated_by: claims.sub, updated_at: new Date() },
        });
      } else {
        await tx.llm_model_bindings.delete({ where: { task } });
      }
      await tx.review_audit_logs.create({
        data: {
          action: to ? 'SET_MODEL_BINDING' : 'RESET_MODEL_BINDING',
          entity_type: 'llm_model_binding',
          entity_id: taskEntityId(task),
          performed_by: claims.sub,
          raw_changes: { task, from, to },
        },
      });
    });
    return this.list(claims);
  }
}
