import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { runBestEffort } from '../../../common/utils/best-effort';
import { isWithinCodePoints } from '../../../common/utils/text-length';
import { extraKeys, isIntIn, isPlainObject } from '../../../common/utils/type-guards';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../../messaging/worker-results/worker-result-handler';

export type DocumentProcessingStage = 'processing' | 'enrichment';

/**
 * Bước trong từng giai đoạn, theo thứ tự xảy ra. Khớp
 * worker/worker/services/document_reporter.py (STAGE_STATUSES) và schema.
 * ERROR là bước cuối của một lần chạy job tài liệu; enrichment lỗi thì lùi về
 * INDEXED (tài liệu vẫn tìm kiếm được), không bao giờ ERROR.
 */
const STEPS: Record<DocumentProcessingStage, Record<string, number>> = {
  processing: { PARSING: 1, CHUNKING: 2, EMBEDDING: 3, INDEXED: 4, ERROR: 5 },
  enrichment: { ENRICHING: 1, INDEXED: 2, GENERATED_DRAFT: 3 },
};
const STAGE_RANK: Record<DocumentProcessingStage, number> = {
  processing: 1,
  enrichment: 2,
};
// Trạng thái còn đang xử lý: hook onFinalFailure chỉ đổi dòng ở một trong các
// trạng thái này. INDEXED/GENERATED_DRAFT/ERROR là kết thúc của job tài liệu.
const PROCESSING_IN_PROGRESS = [
  'QUEUED',
  'PENDING',
  'PARSING',
  'CHUNKING',
  'EMBEDDING',
];
// Giai đoạn enrichment đang chạy; lỗi thì lùi về INDEXED (xem STEPS).
const ENRICHMENT_IN_PROGRESS = ['ENRICHING'];
// processing_seq là INTEGER: 2 * 1e6 + 9999 * 100 + 99 vẫn dưới 2^31.
const MAX_ATTEMPT_IN_SEQUENCE = 9999;
const MAX_INT4 = 2_147_483_647;
const MAX_ERROR = 1000;
const MAX_CHAPTER_CODE = 20;
const MAX_REASON = 255;

export interface DocumentStatusReport {
  value: string;
  stage: DocumentProcessingStage;
  processing_generation: number;
  attempt: number;
  error?: string;
}

export interface DocumentChapterReport {
  chapter_code: string;
  provenance: 'content';
  confidence: number;
  reason: string;
}

/** contracts/integration-events/v1/document-processing-result.json */
export interface DocumentProcessingResultPayload {
  document_id: string;
  status?: DocumentStatusReport;
  chapter?: DocumentChapterReport;
}

export type StatusOutcome =
  | { applied: true; status: string }
  | {
      applied: false;
      reason: 'document_missing' | 'stale_generation' | 'out_of_order';
    };

export type ChapterOutcome =
  | { applied: true; chapter_code: string }
  | { applied: false; reason: 'document_missing' | 'chapter_kept' };

export interface DocumentProcessingOutcome {
  status?: StatusOutcome;
  chapter?: ChapterOutcome;
}

/**
 * Thứ tự của một báo trạng thái trong lượt xử lý: giai đoạn trước lần chạy
 * trước bước. Lần chạy lại của job (attempt lớn hơn) xếp sau mọi bước của lần
 * trước — PARSING của lần 2 thắng ERROR của lần 1 — còn PARSING của lần 1 đến
 * trễ thì thua CHUNKING/ERROR của chính lần đó. Enrichment chạy sau khi job tài
 * liệu xong nên mọi bước của nó xếp sau giai đoạn processing.
 */
export function statusSequence(
  stage: DocumentProcessingStage,
  attempt: number,
  value: string,
): number {
  const step = STEPS[stage][value];
  if (step === undefined) {
    throw new Error(`status ${value} does not belong to stage ${stage}`);
  }
  return (
    STAGE_RANK[stage] * 1_000_000 +
    Math.min(attempt, MAX_ATTEMPT_IN_SEQUENCE) * 100 +
    step
  );
}

function isText(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' && value.length > 0 && isWithinCodePoints(value, max)
  );
}

function checkStatus(status: unknown, problems: string[]) {
  if (!isPlainObject(status)) {
    problems.push('status must be an object');
    return;
  }
  const extra = extraKeys(status, [
    'value',
    'stage',
    'processing_generation',
    'attempt',
    'error',
  ]);
  if (extra.length)
    problems.push(`unexpected status fields: ${extra.join(', ')}`);
  const { value, stage, processing_generation, attempt, error } = status;
  if (stage !== 'processing' && stage !== 'enrichment') {
    problems.push(
      `status.stage must be processing or enrichment, got ${JSON.stringify(stage)}`,
    );
  } else if (typeof value !== 'string' || STEPS[stage][value] === undefined) {
    problems.push(
      `status.value ${JSON.stringify(value)} is not reported in stage ${stage}`,
    );
  }
  if (!isIntIn(processing_generation, 0, MAX_INT4)) {
    problems.push('status.processing_generation must be an integer >= 0');
  }
  if (!isIntIn(attempt, 1, MAX_INT4)) {
    problems.push('status.attempt must be an integer >= 1');
  }
  if (error !== undefined && !isText(error, MAX_ERROR)) {
    problems.push(`status.error must be a string of 1..${MAX_ERROR} chars`);
  }
}

function checkChapter(chapter: unknown, problems: string[]) {
  if (!isPlainObject(chapter)) {
    problems.push('chapter must be an object');
    return;
  }
  const extra = extraKeys(chapter, [
    'chapter_code',
    'provenance',
    'confidence',
    'reason',
  ]);
  if (extra.length)
    problems.push(`unexpected chapter fields: ${extra.join(', ')}`);
  if (!isText(chapter.chapter_code, MAX_CHAPTER_CODE)) {
    problems.push(
      `chapter.chapter_code must be a string of 1..${MAX_CHAPTER_CODE} chars`,
    );
  }
  // Chỉ suy luận theo nội dung đi qua kết quả worker; quy tắc ghi bên dưới
  // được thiết kế cho đúng loại này.
  if (chapter.provenance !== 'content') {
    problems.push('chapter.provenance must be "content"');
  }
  const { confidence } = chapter;
  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    problems.push('chapter.confidence must be a number in 0..1');
  }
  if (!isText(chapter.reason, MAX_REASON)) {
    problems.push(`chapter.reason must be a string of 1..${MAX_REASON} chars`);
  }
}

/**
 * Kiểm payload đúng schema; sai thì ném InvalidWorkerResultError (không retry)
 * liệt kê mọi chỗ sai. UUID kiểm ở đây vì để Postgres từ chối thì thành lỗi DB
 * và bị retry vô ích.
 */
export function parseDocumentProcessingPayload(
  payload: Record<string, unknown>,
  resultId: string,
): DocumentProcessingResultPayload {
  const problems: string[] = [];
  const extra = extraKeys(payload, ['document_id', 'status', 'chapter']);
  if (extra.length) problems.push(`unexpected fields: ${extra.join(', ')}`);
  if (!isUuid(payload.document_id)) {
    problems.push('document_id must be a UUID');
  }
  if (payload.status === undefined && payload.chapter === undefined) {
    problems.push('payload needs status or chapter');
  }
  if (payload.status !== undefined) checkStatus(payload.status, problems);
  if (payload.chapter !== undefined) checkChapter(payload.chapter, problems);
  if (problems.length) {
    throw new InvalidWorkerResultError(
      `invalid DOCUMENT_PROCESSING_RESULT ${resultId}: ${problems.join('; ')}`,
    );
  }
  return payload as unknown as DocumentProcessingResultPayload;
}

/**
 * Áp dụng DOCUMENT_PROCESSING_RESULT: trạng thái xử lý và chương suy luận của
 * tài liệu → documents. Worker không UPDATE documents nữa
 * (docs/ke-hoach-ranh-gioi-du-lieu.md); màn hình tài liệu đọc cột status như cũ.
 *
 * Chống lùi trạng thái: kết quả đi qua hàng đợi, handler lỗi tạm thì BullMQ
 * retry sau khi kết quả kế tiếp đã áp dụng. Chỉ áp dụng khi
 *   - processing_generation = documents.processing_generation: core-api tăng
 *     lượt mỗi khi đưa tài liệu vào hàng đợi, nên kết quả của lượt cũ (xử lý
 *     lại tài liệu ERROR) không đè lượt mới;
 *   - statusSequence(...) > documents.processing_seq: trong một lượt, kết quả
 *     đến trễ không đè kết quả mới hơn, còn lần chạy lại của job thì thắng.
 * Điều kiện nằm trong chính câu UPDATE: hai bản core-api chạy song song cũng
 * không đè được nhau (Postgres khoá dòng).
 *
 * Chương: chỉ ghi khi tài liệu chưa có chương hoặc chương hiện tại cũng do
 * suy luận nội dung. Không bao giờ đè 'confirmed' (giảng viên chọn), và cũng
 * không đè 'module'/'file_name' mà đồng bộ Canvas đặt sau khi worker đọc vị trí
 * — worker chỉ suy luận khi lúc đọc tài liệu chưa có chương.
 *
 * Tài liệu đã xoá (deleted_at) thì bỏ qua cả hai.
 */
@Injectable()
@WorkerResultHandler('DOCUMENT_PROCESSING_RESULT')
export class DocumentProcessingResultHandler implements WorkerResultHandler<
  Record<string, unknown>
> {
  private readonly logger = new Logger(DocumentProcessingResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
  ): Promise<DocumentProcessingOutcome> {
    const result = parseDocumentProcessingPayload(
      envelope.payload,
      envelope.result_id,
    );
    if (result.status?.error) {
      // documents chưa có cột lỗi: giữ lỗi trong log cùng ngữ cảnh tài liệu.
      this.logger.warn(
        `Tài liệu ${result.document_id} → ${result.status.value} (${result.status.stage}, lần ${result.status.attempt}): ${result.status.error}`,
      );
    }
    const outcome = await this.prisma.$transaction(async (tx) => {
      const out: DocumentProcessingOutcome = {};
      if (result.status) {
        out.status = await this.applyStatus(
          tx,
          result.document_id,
          result.status,
        );
      }
      if (result.chapter) {
        out.chapter = await this.applyChapter(
          tx,
          result.document_id,
          result.chapter,
        );
      }
      return out;
    });
    for (const part of [outcome.status, outcome.chapter]) {
      if (part && !part.applied) {
        this.logger.log(
          `Bỏ qua ${envelope.result_id} (tài liệu ${result.document_id}): ${part.reason}`,
        );
      }
    }
    return outcome;
  }

  /**
   * Báo cáo trạng thái không bao giờ áp dụng được (payload sai, hay lỗi DB hết
   * lượt thử): tài liệu kẹt ở trạng thái đang xử lý và không còn gì làm nó chuyển
   * tiếp. Đẩy về trạng thái lỗi của giai đoạn đó, như worker tự báo khi job lỗi:
   *   - processing → ERROR (giảng viên/đồng bộ Canvas xử lý lại, tăng lượt mới);
   *   - enrichment → INDEXED (enrichment lỗi không bao giờ làm tài liệu ERROR, nó
   *     vẫn tìm kiếm được).
   * documents chưa có cột lỗi nên lý do chỉ vào log, như khi báo lỗi bình thường.
   *
   * Dùng đúng cơ chế của handle(): chỉ khi processing_generation = lượt hiện tại
   * và thứ tự của báo cáo lỗi lớn hơn processing_seq, nên báo cáo của lượt/lần
   * chạy cũ không đè tiến độ mới hơn. Thứ tự đặt bằng chính vị trí của báo cáo
   * hỏng (giai đoạn, lần chạy, bước), không phải vị trí ERROR: báo cáo mới hơn của
   * cùng lần chạy vẫn đè được — nếu hỏng chỉ một báo cáo trung gian mà job vẫn
   * chạy tiếp thì tài liệu tự hồi phục, còn nếu job chết thật thì ERROR giữ nguyên.
   * Chỉ đổi tài liệu còn ở trạng thái đang xử lý của giai đoạn đó.
   *
   * Payload chưa kiểm: không đủ document_id, giai đoạn, lượt, lần chạy hay bước
   * hợp lệ thì không làm gì.
   */
  async onFinalFailure(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
    error: Error,
  ) {
    await runBestEffort(
      this.logger,
      `Không đưa được tài liệu của ${envelope.result_id} ra khỏi trạng thái đang xử lý`,
      async () => {
        const payload: unknown = envelope.payload;
        if (!isPlainObject(payload) || !isPlainObject(payload.status)) return;
        const documentId = payload.document_id;
        const { stage, value, processing_generation, attempt } =
          payload.status;
        if (!isUuid(documentId)) return;
        if (stage !== 'processing' && stage !== 'enrichment') return;
        if (typeof value !== 'string' || STEPS[stage][value] === undefined) {
          return;
        }
        if (
          !isIntIn(processing_generation, 0, MAX_INT4) ||
          !isIntIn(attempt, 1, MAX_INT4)
        ) {
          return;
        }
        const seq = statusSequence(stage, attempt, value);
        const target = stage === 'processing' ? 'ERROR' : 'INDEXED';
        const { count } = await this.prisma.documents.updateMany({
          where: {
            document_id: documentId,
            deleted_at: null,
            processing_generation,
            processing_seq: { lt: seq },
            status: {
              in:
                stage === 'processing'
                  ? PROCESSING_IN_PROGRESS
                  : ENRICHMENT_IN_PROGRESS,
            },
          },
          data: { status: target, processing_seq: seq },
        });
        this.logger.warn(
          `Kết quả ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            (count
              ? `tài liệu ${documentId} → ${target} (${stage}, lần ${attempt}, đang báo ${value})`
              : `tài liệu ${documentId} giữ nguyên (đã kết thúc, sang lượt khác hay đã có tiến độ mới hơn)`),
        );
      },
    );
  }

  private async applyStatus(
    tx: Prisma.TransactionClient,
    documentId: string,
    status: DocumentStatusReport,
  ): Promise<StatusOutcome> {
    const seq = statusSequence(status.stage, status.attempt, status.value);
    const updated = await tx.documents.updateMany({
      where: {
        document_id: documentId,
        deleted_at: null,
        processing_generation: status.processing_generation,
        processing_seq: { lt: seq },
      },
      data: { status: status.value, processing_seq: seq },
    });
    if (updated.count > 0) return { applied: true, status: status.value };

    const doc = await tx.documents.findUnique({
      where: { document_id: documentId },
      select: { deleted_at: true, processing_generation: true },
    });
    if (!doc || doc.deleted_at)
      return { applied: false, reason: 'document_missing' };
    if (doc.processing_generation !== status.processing_generation) {
      return { applied: false, reason: 'stale_generation' };
    }
    return { applied: false, reason: 'out_of_order' };
  }

  private async applyChapter(
    tx: Prisma.TransactionClient,
    documentId: string,
    chapter: DocumentChapterReport,
  ): Promise<ChapterOutcome> {
    // IS DISTINCT FROM: chapter_provenance NULL vẫn ghi được (Prisma `not`
    // trên cột nullable dễ sinh `<>` loại mất NULL).
    const count = await tx.$executeRaw`
      UPDATE documents
         SET chapter_code = ${chapter.chapter_code},
             chapter_provenance = ${chapter.provenance},
             chapter_confidence = ROUND(${chapter.confidence}::numeric, 2),
             chapter_reason = ${chapter.reason}
       WHERE document_id = ${documentId}::uuid
         AND deleted_at IS NULL
         AND chapter_provenance IS DISTINCT FROM 'confirmed'
         AND (chapter_code IS NULL OR chapter_provenance = 'content')`;
    if (count > 0) return { applied: true, chapter_code: chapter.chapter_code };

    const doc = await tx.documents.findUnique({
      where: { document_id: documentId },
      select: { deleted_at: true },
    });
    if (!doc || doc.deleted_at)
      return { applied: false, reason: 'document_missing' };
    return { applied: false, reason: 'chapter_kept' };
  }
}
