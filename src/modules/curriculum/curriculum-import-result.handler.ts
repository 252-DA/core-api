import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { runBestEffort } from '../../common/utils/best-effort';
import { clipCodePoints } from '../../common/utils/text-length';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../messaging/worker-results/worker-result-handler';
import {
  parseCurriculumImportResult,
  type CurriculumImportResultPayload,
} from './curriculum-payload';

/**
 * Trạng thái còn chờ kết quả xem trước. EXTRACTING chỉ còn ở dòng cũ (worker
 * cũ tự ghi trạng thái này); worker mới không ghi gì vào curriculum_imports.
 */
const AWAITING_PREVIEW = ['QUEUED', 'EXTRACTING'];
/**
 * FAILED còn đến cho job curriculum_apply cũ (lần nạp core-api đã chuyển
 * APPLYING trước 2026-11-07): báo lỗi để lần nạp không treo ở "Đang áp dụng".
 */
const AWAITING_FAILURE = [...AWAITING_PREVIEW, 'APPLYING'];
// curriculum_imports.error là TEXT; schema của lỗi worker giới hạn 2000 ký tự.
const MAX_ERROR = 2000;
// Phần lỗi kỹ thuật kèm trong thông báo cho giảng viên.
const MAX_CAUSE = 300;

/** result_id = CURRICULUM_IMPORT_RESULT.<import_id>[.<lần>]: kết quả thuộc lần nạp nào. */
function resultBelongsToImport(resultId: string, importId: string): boolean {
  const prefix = `CURRICULUM_IMPORT_RESULT.${importId}`;
  return resultId === prefix || resultId.startsWith(`${prefix}.`);
}

/**
 * Toàn bộ phần kiểm không cần DB của một kết quả: dạng payload và result_id phải
 * thuộc đúng lần nạp mà payload nêu. handle() dùng hàm này; tách riêng để spec
 * hợp đồng (contracts/fixtures) chạy đúng bộ kiểm thật của kind.
 */
export function parseCurriculumImportEnvelope(
  payload: Record<string, unknown>,
  resultId: string,
): CurriculumImportResultPayload {
  const result = parseCurriculumImportResult(payload, resultId);
  if (!resultBelongsToImport(resultId, result.import_id)) {
    throw new InvalidWorkerResultError(
      `CURRICULUM_IMPORT_RESULT ${resultId} does not belong to import ${result.import_id}`,
    );
  }
  return result;
}

export type CurriculumImportApplyOutcome =
  | { applied: true; status: 'READY' | 'BLOCKED' | 'FAILED' }
  | {
      applied: false;
      reason: 'import_missing' | 'not_awaiting';
      status?: string;
    };

/**
 * Áp dụng CURRICULUM_IMPORT_RESULT: lưu bản xem trước + bản đề cương chuẩn hoá
 * vào curriculum_imports và chuyển trạng thái. Chưa ghi gì vào đề cương đang
 * dùng — việc đó là của applyImport khi giảng viên duyệt.
 *
 * Idempotent: chỉ áp dụng khi lần nạp còn chờ (một câu UPDATE có điều kiện,
 * tức một transaction); kết quả đến lần hai, hay đến sau khi lần nạp đã có
 * kết quả/đã áp dụng, thì bỏ qua — không bao giờ ghi đè trạng thái kết thúc.
 */
@Injectable()
@WorkerResultHandler('CURRICULUM_IMPORT_RESULT')
export class CurriculumImportResultHandler implements WorkerResultHandler {
  private readonly logger = new Logger(CurriculumImportResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(
    envelope: WorkerResultEnvelope,
  ): Promise<CurriculumImportApplyOutcome> {
    const result = parseCurriculumImportEnvelope(
      envelope.payload,
      envelope.result_id,
    );

    const data: Prisma.curriculum_importsUpdateManyMutationInput =
      result.status === 'FAILED'
        ? // Giữ preview cũ (nếu có) cho lần nạp cũ hỏng ở bước áp dụng.
          { status: 'FAILED', error: result.error, updated_at: new Date() }
        : {
            status: result.status,
            preview: result.preview as Prisma.InputJsonValue,
            curriculum: result.curriculum as unknown as Prisma.InputJsonValue,
            error: null,
            updated_at: new Date(),
          };
    const from =
      result.status === 'FAILED' ? AWAITING_FAILURE : AWAITING_PREVIEW;
    const { count } = await this.prisma.curriculum_imports.updateMany({
      where: { import_id: result.import_id, status: { in: from } },
      data,
    });
    if (count === 1) {
      this.logger.log(
        `Lần nạp đề cương ${result.import_id} → ${result.status} (${envelope.result_id})`,
      );
      return { applied: true, status: result.status };
    }

    // Không áp dụng: phân biệt để log, không ảnh hưởng kết quả.
    const current = await this.prisma.curriculum_imports.findUnique({
      where: { import_id: result.import_id },
      select: { status: true },
    });
    if (!current) {
      // Học phần bị xoá kéo theo lần nạp (ON DELETE CASCADE): bỏ kết quả.
      this.logger.warn(
        `Bỏ ${envelope.result_id}: không còn lần nạp ${result.import_id}`,
      );
      return { applied: false, reason: 'import_missing' };
    }
    this.logger.warn(
      `Bỏ ${envelope.result_id}: lần nạp ${result.import_id} đang ${current.status}, không còn chờ kết quả ${result.status}`,
    );
    return { applied: false, reason: 'not_awaiting', status: current.status };
  }

  /**
   * Kết quả không bao giờ áp dụng được (payload sai, hay lỗi DB hết lượt thử):
   * lần nạp còn QUEUED/EXTRACTING sẽ không bao giờ có bản xem trước, nên chuyển
   * FAILED kèm lý do — giảng viên thấy lỗi, và đồng bộ lại thì tạo lần nạp mới
   * (FAILED không được tái dùng, xem CurriculumImportService.syncFromCanvas).
   *
   * Payload chưa kiểm: chỉ đọc import_id hợp lệ và chỉ khi result_id đúng là của
   * lần nạp đó (như handle()); UPDATE có điều kiện nên lần nạp đã READY/BLOCKED/
   * APPLIED/FAILED không bị đụng. APPLYING (job apply cũ) không thuộc hook này.
   */
  async onFinalFailure(envelope: WorkerResultEnvelope, error: Error) {
    await runBestEffort(
      this.logger,
      `Không đánh dấu FAILED được lần nạp của ${envelope.result_id}`,
      async () => {
        const payload: unknown = envelope.payload;
        const importId =
          typeof payload === 'object' && payload !== null
            ? (payload as Record<string, unknown>).import_id
            : undefined;
        if (!isUuid(importId)) return;
        if (!resultBelongsToImport(envelope.result_id, importId)) return;
        const { count } = await this.prisma.curriculum_imports.updateMany({
          where: { import_id: importId, status: { in: AWAITING_PREVIEW } },
          data: {
            status: 'FAILED',
            error: clipCodePoints(
              `Không áp dụng được kết quả trích xuất đề cương: ${clipCodePoints(error.message, MAX_CAUSE)}`,
              MAX_ERROR,
            ),
            updated_at: new Date(),
          },
        });
        this.logger.warn(
          `Kết quả ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            (count
              ? `lần nạp ${importId} → FAILED`
              : `lần nạp ${importId} không còn chờ kết quả, giữ nguyên`),
        );
      },
    );
  }
}
