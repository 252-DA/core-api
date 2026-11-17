import { Injectable, Logger } from '@nestjs/common';
import { STAFF_ROLES } from '../common/constants/course-roles';
import type { BffClaims } from '../auth/bff-claims';
import { AuthzService } from '../auth/authz.service';
import type { CanvasTokenCheck } from '../integrations/canvas/canvas-api.client';
import { CourseRosterRepository } from '../roster/course-roster.repository';
import {
  CanvasSyncRunsService,
  type SyncRunRow,
} from './canvas-sync-runs.service';
import { CanvasTokenStatusService } from './canvas-token-status.service';

const MANAGE_ROLES = STAFF_ROLES;
// Job bị dừng giữa chừng (core-api khởi động lại) để dòng ở "running" mãi.
const STALE_RUNNING_MS = 30 * 60_000;
const INTERRUPTED_MESSAGE = 'Lần đồng bộ bị gián đoạn';

/** Số phần tử của mỗi danh sách trong summary (created, updated, ...) và các số đếm sẵn có. */
export function summaryCounts(
  summary: Record<string, unknown> | null,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries(summary ?? {})) {
    if (Array.isArray(value)) counts[key] = value.length;
    else if (typeof value === 'number') counts[key] = value;
  }
  return counts;
}

/** Trạng thái đồng bộ Canvas của một khóa cho trang quản lý tài liệu: tài liệu, danh sách lớp, token. */
@Injectable()
export class CanvasSyncStatusService {
  private readonly logger = new Logger(CanvasSyncStatusService.name);

  constructor(
    private readonly authz: AuthzService,
    private readonly runs: CanvasSyncRunsService,
    private readonly tokenStatus: CanvasTokenStatusService,
    private readonly roster: CourseRosterRepository,
  ) {}

  async status(claims: BffClaims, courseId: string, now = Date.now()) {
    await this.authz.assertCourseAccess(claims, courseId, MANAGE_ROLES);
    const [run, lastSuccessAt, token, roster] = await Promise.all([
      this.runs.latest(courseId),
      this.runs.lastSuccessAt(courseId),
      this.readToken(),
      this.readRoster(courseId, now),
    ]);
    return {
      last_run: run ? this.describeRun(run, now) : null,
      last_success_at: lastSuccessAt?.toISOString() ?? null,
      token,
      roster,
    };
  }

  /**
   * Danh sách lớp (NRPS): lần chạy gần nhất, lần thành công gần nhất và số sinh
   * viên đang học. Thiếu cột/bảng (migration nrps_roster chưa áp) thì chỉ mất
   * dòng này, không làm hỏng phần trạng thái tài liệu.
   */
  private async readRoster(courseId: string, now: number) {
    try {
      const [run, lastSuccessAt, learners] = await Promise.all([
        this.runs.latest(courseId, 'roster'),
        this.runs.lastSuccessAt(courseId, 'roster'),
        this.roster.countActiveLearners(courseId),
      ]);
      return {
        last_run: run ? this.describeRun(run, now) : null,
        last_success_at: lastSuccessAt?.toISOString() ?? null,
        learners,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Không đọc được trạng thái danh sách lớp: ${String(error)}`,
      );
      return null;
    }
  }

  private describeRun(run: SyncRunRow, now: number) {
    const interrupted =
      run.status === 'running' &&
      now - new Date(run.started_at).getTime() > STALE_RUNNING_MS;
    return {
      run_id: run.run_id,
      status: interrupted ? 'error' : run.status,
      trigger: run.trigger,
      started_at: new Date(run.started_at).toISOString(),
      finished_at: run.finished_at
        ? new Date(run.finished_at).toISOString()
        : null,
      counts: summaryCounts(run.summary),
      error: interrupted ? INTERRUPTED_MESSAGE : run.error,
    };
  }

  /** Redis lỗi chỉ làm mất dòng trạng thái token, không làm hỏng cả trang. */
  private async readToken(): Promise<CanvasTokenCheck | null> {
    try {
      return await this.tokenStatus.read();
    } catch (error: unknown) {
      this.logger.warn(
        `Không đọc được trạng thái token Canvas: ${String(error)}`,
      );
      return null;
    }
  }
}
