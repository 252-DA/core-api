import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type SyncRunTrigger = 'launch' | 'sweep' | 'manual';
export type SyncRunStatus = 'running' | 'success' | 'error';
/** documents: đồng bộ tài liệu từ module; roster: đồng bộ danh sách lớp (NRPS). */
export type SyncRunKind = 'documents' | 'roster';

export type SyncRunRow = {
  run_id: string;
  trigger: SyncRunTrigger;
  status: SyncRunStatus;
  started_at: Date;
  finished_at: Date | null;
  summary: Record<string, unknown> | null;
  error: string | null;
};

/**
 * Lịch sử đồng bộ từ Canvas (bảng canvas_sync_runs, migration 20261112120000;
 * cột `kind` từ 20261112130000 phân biệt tài liệu với danh sách lớp). Dùng SQL trực tiếp thay cho delegate Prisma để ghi lịch sử
 * không phụ thuộc phiên bản client đã generate; bảng vẫn khai báo trong
 * schema.prisma cho đủ cặp với migration.
 */
@Injectable()
export class CanvasSyncRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(
    courseId: string,
    trigger: SyncRunTrigger,
    kind: SyncRunKind = 'documents',
  ): Promise<string> {
    const rows = await this.prisma.$queryRaw<Array<{ run_id: string }>>`
      INSERT INTO canvas_sync_runs (course_id, trigger, kind, status)
      VALUES (${courseId}::uuid, ${trigger}, ${kind}, 'running')
      RETURNING run_id::text AS run_id`;
    return rows[0].run_id;
  }

  async finish(runId: string, summary: unknown) {
    await this.prisma.$executeRaw`
      UPDATE canvas_sync_runs
      SET status = 'success', finished_at = now(), error = NULL,
          summary = ${JSON.stringify(summary ?? null)}::jsonb
      WHERE run_id = ${runId}::uuid`;
  }

  async fail(runId: string, message: string) {
    await this.prisma.$executeRaw`
      UPDATE canvas_sync_runs
      SET status = 'error', finished_at = now(), error = ${message}
      WHERE run_id = ${runId}::uuid`;
  }

  /** Lần chạy gần nhất của khóa theo loại, bất kể kết quả. */
  async latest(
    courseId: string,
    kind: SyncRunKind = 'documents',
  ): Promise<SyncRunRow | null> {
    const rows = await this.prisma.$queryRaw<SyncRunRow[]>`
      SELECT run_id::text AS run_id, trigger, status, started_at, finished_at, summary, error
      FROM canvas_sync_runs
      WHERE course_id = ${courseId}::uuid AND kind = ${kind}
      ORDER BY started_at DESC
      LIMIT 1`;
    return rows[0] ?? null;
  }

  /** Thời điểm kết thúc của lần chạy thành công gần nhất theo loại. */
  async lastSuccessAt(
    courseId: string,
    kind: SyncRunKind = 'documents',
  ): Promise<Date | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ finished_at: Date | null }>
    >`
      SELECT finished_at
      FROM canvas_sync_runs
      WHERE course_id = ${courseId}::uuid AND kind = ${kind} AND status = 'success'
      ORDER BY started_at DESC
      LIMIT 1`;
    return rows[0]?.finished_at ?? null;
  }
}
