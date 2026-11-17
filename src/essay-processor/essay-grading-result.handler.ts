import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { runBestEffort } from '../common/utils/best-effort';
import { isWithinCodePoints } from '../common/utils/text-length';
import { extraKeys, isPlainObject } from '../common/utils/type-guards';
import { isUuid } from '../common/utils/uuid';
import { PrismaService } from '../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../messaging/worker-results/worker-result-handler';
import { ESSAY_GRADING_ERROR_CODES, ESSAY_STATUS, type EssayResult } from './essay-grading';

export type EssayGradingResult =
  | { essaySubmissionId: string; status: 'GRADED'; result: EssayResult }
  | {
      essaySubmissionId: string;
      status: 'FAILED';
      errorCode: (typeof ESSAY_GRADING_ERROR_CODES)[number];
      error: string;
    };

/** Điểm tiêu chí làm tròn 2 chữ số nên tổng có thể lệch max_score một chút. */
const EPSILON = 1e-6;
const MAX_ERROR = 2000;
/** Giảng viên đọc câu này trong báo cáo lỗi Canvas: không kèm lỗi kỹ thuật. */
const UNAPPLIED_ERROR = 'Hệ thống không lưu được kết quả chấm của AI cho bài này.';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseResult(raw: unknown, where: string): EssayResult {
  if (!isPlainObject(raw)) throw new InvalidWorkerResultError(`${where}: result must be an object`);
  const problems = extraKeys(raw, [
    'score',
    'max_score',
    'criteria',
    'feedback',
    'truncated',
    'model',
  ]).map((key) => `unexpected field result.${key}`);
  const { score, max_score: maxScore, criteria, feedback, truncated, model } = raw;
  if (!finite(maxScore) || maxScore <= 0) problems.push('result.max_score must be > 0');
  if (!finite(score) || score < 0 || (finite(maxScore) && score > maxScore + EPSILON)) {
    problems.push('result.score must be in [0, max_score]');
  }
  if (typeof feedback !== 'string' || !isWithinCodePoints(feedback, 8000)) {
    problems.push('result.feedback must be a string (≤ 8000)');
  }
  if (typeof truncated !== 'boolean') problems.push('result.truncated must be a boolean');
  if (
    !('model' in raw) ||
    !(model === null || (typeof model === 'string' && isWithinCodePoints(model, 200)))
  ) {
    problems.push('result.model must be a short string or null');
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    problems.push('result.criteria must be a non-empty array');
  } else {
    criteria.forEach((c, i) => {
      const at = `result.criteria[${i}]`;
      if (!isPlainObject(c)) {
        problems.push(`${at} must be an object`);
        return;
      }
      problems.push(
        ...extraKeys(c, ['criterion', 'points', 'max_points', 'comment']).map(
          (key) => `unexpected field ${at}.${key}`,
        ),
      );
      if (typeof c.criterion !== 'string') problems.push(`${at}.criterion must be a string`);
      if (typeof c.comment !== 'string' || !isWithinCodePoints(c.comment, 4000)) {
        problems.push(`${at}.comment must be a string (≤ 4000)`);
      }
      if (!finite(c.max_points) || c.max_points < 0) {
        problems.push(`${at}.max_points must be ≥ 0`);
      }
      if (
        !finite(c.points) ||
        c.points < 0 ||
        (finite(c.max_points) && c.points > c.max_points + EPSILON)
      ) {
        problems.push(`${at}.points must be in [0, max_points]`);
      }
    });
  }
  if (problems.length) throw new InvalidWorkerResultError(`${where}: ${problems.join('; ')}`);
  return raw as unknown as EssayResult;
}

/** Kiểm payload theo contracts/integration-events/v1/essay-grading-result.json. */
export function parseEssayGradingResult(payload: unknown): EssayGradingResult {
  const where = 'ESSAY_GRADING_RESULT';
  if (!isPlainObject(payload)) throw new InvalidWorkerResultError(`${where}: payload must be an object`);
  const { essay_submission_id: id, status } = payload;
  if (!isUuid(id)) {
    throw new InvalidWorkerResultError(`${where}: essay_submission_id must be a uuid`);
  }
  if (status === ESSAY_STATUS.graded) {
    const extra = extraKeys(payload, ['essay_submission_id', 'status', 'result']);
    if (extra.length) throw new InvalidWorkerResultError(`${where}: unexpected fields ${extra.join(', ')}`);
    return { essaySubmissionId: id, status: 'GRADED', result: parseResult(payload.result, where) };
  }
  if (status === ESSAY_STATUS.failed) {
    const extra = extraKeys(payload, ['essay_submission_id', 'status', 'error_code', 'error']);
    if (extra.length) throw new InvalidWorkerResultError(`${where}: unexpected fields ${extra.join(', ')}`);
    const { error_code: errorCode, error } = payload;
    if (!(ESSAY_GRADING_ERROR_CODES as readonly unknown[]).includes(errorCode)) {
      throw new InvalidWorkerResultError(
        `${where}: error_code must be one of ${ESSAY_GRADING_ERROR_CODES.join(', ')}`,
      );
    }
    if (typeof error !== 'string' || !error || !isWithinCodePoints(error, MAX_ERROR)) {
      throw new InvalidWorkerResultError(`${where}: error must be a non-empty string (≤ ${MAX_ERROR})`);
    }
    return {
      essaySubmissionId: id,
      status: 'FAILED',
      errorCode: errorCode as (typeof ESSAY_GRADING_ERROR_CODES)[number],
      error,
    };
  }
  throw new InvalidWorkerResultError(`${where}: status must be GRADED or FAILED`);
}

/**
 * Áp dụng ESSAY_GRADING_RESULT: essay_submissions QUEUED → GRADED (kèm result)
 * hoặc FAILED (kèm mã lỗi), đúng như worker từng tự ghi. Bước tiếp theo không
 * đổi: vòng EssayReportPublisherService nhặt dòng GRADED/FAILED và gửi báo cáo
 * về SpeedGrader. Chỉ áp dụng khi bài còn QUEUED (một câu UPDATE có điều kiện,
 * tự là một transaction): bài đã chấm, đã báo cáo hay đã bị xoá thì bỏ qua, nên
 * nhận cùng kết quả hai lần không đổi gì.
 */
@Injectable()
@WorkerResultHandler('ESSAY_GRADING_RESULT')
export class EssayGradingResultHandler implements WorkerResultHandler {
  private readonly logger = new Logger(EssayGradingResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(envelope: WorkerResultEnvelope) {
    const result = parseEssayGradingResult(envelope.payload);
    const now = new Date();
    const data: Prisma.essay_submissionsUpdateManyMutationInput =
      result.status === 'GRADED'
        ? {
            status: ESSAY_STATUS.graded,
            result: result.result,
            error: null,
            error_code: null,
            attempts: 0,
            next_attempt_at: null,
            updated_at: now,
          }
        : {
            status: ESSAY_STATUS.failed,
            error_code: result.errorCode,
            error: result.error,
            attempts: 0,
            next_attempt_at: null,
            // Báo lỗi về Canvas đúng một lần cho lần chấm này.
            reported_at: null,
            updated_at: now,
          };
    const { count } = await this.prisma.essay_submissions.updateMany({
      where: { essay_submission_id: result.essaySubmissionId, status: ESSAY_STATUS.queued },
      data,
    });
    if (count) {
      this.logger.log(
        `Bài luận ${result.essaySubmissionId} → ${result.status}` +
          (result.status === 'GRADED'
            ? ` ${result.result.score}/${result.result.max_score}`
            : ` (${result.errorCode})`) +
          ` (${envelope.result_id})`,
      );
    } else {
      this.logger.warn(
        `Bỏ ${envelope.result_id}: bài luận ${result.essaySubmissionId} không còn QUEUED`,
      );
    }
    return { applied: count === 1, status: result.status };
  }

  /**
   * Kết quả không bao giờ áp dụng được: bài còn QUEUED sẽ không bao giờ có điểm
   * và giảng viên không biết phải chấm tay. QUEUED → FAILED, như worker tự báo
   * PROCESSING_FAILED; vòng EssayReportPublisherService nhặt dòng FAILED chưa
   * báo (reported_at NULL) và gửi báo cáo lỗi về SpeedGrader một lần.
   *
   * Payload chưa kiểm: chỉ đọc essay_submission_id hợp lệ; câu UPDATE có điều
   * kiện QUEUED nên bài đã GRADED/REPORTED/FAILED hay đã xoá không bị đụng.
   * Lỗi kỹ thuật chỉ ghi log: `error` được báo cho giảng viên trong Canvas.
   */
  async onFinalFailure(envelope: WorkerResultEnvelope, error: Error) {
    await runBestEffort(
      this.logger,
      `Không đánh dấu FAILED được bài luận của ${envelope.result_id}`,
      async () => {
        const payload: unknown = envelope.payload;
        const id = isPlainObject(payload) ? payload.essay_submission_id : undefined;
        if (!isUuid(id)) return;
        const { count } = await this.prisma.essay_submissions.updateMany({
          where: { essay_submission_id: id, status: ESSAY_STATUS.queued },
          data: {
            status: ESSAY_STATUS.failed,
            error_code: 'PROCESSING_FAILED',
            error: UNAPPLIED_ERROR,
            attempts: 0,
            next_attempt_at: null,
            reported_at: null,
            updated_at: new Date(),
          },
        });
        this.logger.warn(
          `Kết quả ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            (count
              ? `bài luận ${id} QUEUED → FAILED`
              : `bài luận ${id} không còn QUEUED, giữ nguyên`),
        );
      },
    );
  }
}
