import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { runBestEffort } from '../../../common/utils/best-effort';
import { isPlainObject } from '../../../common/utils/type-guards';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  answerGradeData,
  GRADING_STATUS,
  GRADING_UNAPPLIED_FEEDBACK,
  parseAnswerGrades,
  salvageAnswerIds,
  submissionScore,
  type AnswerGradeResult,
} from '../../question/answer-grading';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../../messaging/worker-results/worker-result-handler';

export type MicroContentGradingResult = {
  attemptId: string;
  courseId: string;
  microContentId: string;
  answers: AnswerGradeResult[];
};

/** Kiểm payload theo contracts/integration-events/v1/micro-content-grading-result.json. */
export function parseMicroContentGradingResult(
  payload: unknown,
): MicroContentGradingResult {
  const label = 'MICRO_CONTENT_GRADING_RESULT';
  if (!isPlainObject(payload)) {
    throw new InvalidWorkerResultError(`${label}: payload must be an object`);
  }
  const keys = ['attempt_id', 'course_id', 'micro_content_id', 'answers'];
  const extra = Object.keys(payload).filter((key) => !keys.includes(key));
  if (extra.length) {
    throw new InvalidWorkerResultError(
      `${label}: unexpected fields ${extra.join(', ')}`,
    );
  }
  const {
    attempt_id: attemptId,
    course_id: courseId,
    micro_content_id: microContentId,
  } = payload;
  if (!isUuid(attemptId) || !isUuid(courseId) || !isUuid(microContentId)) {
    throw new InvalidWorkerResultError(
      `${label}: attempt_id, course_id and micro_content_id must be uuids`,
    );
  }
  return {
    attemptId,
    courseId,
    microContentId,
    answers: parseAnswerGrades(payload.answers, 'answer_id', label),
  };
}

/**
 * Trạng thái chấm của cả lượt nộp từ trạng thái từng câu: còn câu chờ giảng
 * viên thì cả lượt chờ giảng viên, còn câu chờ AI thì cả lượt chờ.
 */
export function attemptGradingStatus(statuses: string[]) {
  if (statuses.includes(GRADING_STATUS.needsReview))
    return GRADING_STATUS.needsReview;
  if (statuses.includes(GRADING_STATUS.pending)) return GRADING_STATUS.pending;
  return GRADING_STATUS.graded;
}

type LockedAttempt = {
  micro_content_id: string;
  course_id: string;
  passing_score: number;
};

/** Khoá dòng lượt nộp (cùng khoá handle() và hook): hai kết quả không tính tổng chồng nhau. */
async function lockAttempt(
  tx: Prisma.TransactionClient,
  attemptId: string,
): Promise<LockedAttempt | undefined> {
  const [attempt] = await tx.$queryRaw<LockedAttempt[]>`
    SELECT a.micro_content_id::text AS micro_content_id, m.course_id::text AS course_id,
           m.passing_score
      FROM micro_content_attempts a
      JOIN micro_contents m ON m.micro_content_id = a.micro_content_id
     WHERE a.attempt_id = ${attemptId}::uuid
       FOR UPDATE OF a`;
  return attempt;
}

/**
 * Tính lại điểm và trạng thái cả lượt nộp từ các câu. Điểm tính trên mọi câu, cả
 * câu chưa có điểm (giữ điểm tạm lúc nộp), đúng như lúc nộp bài.
 */
async function recomputeAttempt(
  tx: Prisma.TransactionClient,
  attemptId: string,
  passingScore: number,
) {
  const all = await tx.micro_content_answers.findMany({
    where: { attempt_id: attemptId },
    select: { score: true, grading_status: true },
  });
  const score = submissionScore(all.map((a) => a.score));
  const totals = {
    score,
    passed: score >= passingScore,
    grading_status: attemptGradingStatus(all.map((a) => a.grading_status)),
  };
  await tx.micro_content_attempts.update({
    where: { attempt_id: attemptId },
    data: totals,
  });
  return totals;
}

/**
 * Áp dụng MICRO_CONTENT_GRADING_RESULT: điểm câu tự luận → micro_content_answers,
 * rồi tính lại micro_content_attempts (score bằng submissionScore — cùng công
 * thức lúc nộp, không còn round() của Python —, passed theo passing_score,
 * grading_status theo attemptGradingStatus). Thay cho MicroContentGradingStore
 * của worker.
 *
 * Một transaction, khoá dòng attempt trước: hai kết quả của cùng lượt nộp (chạy
 * nhiều bản core-api) không tính tổng chồng nhau. Chỉ ghi câu còn PENDING; không
 * câu nào đổi thì không tính lại, nên nhận cùng kết quả hai lần không đổi gì.
 */
@Injectable()
@WorkerResultHandler('MICRO_CONTENT_GRADING_RESULT')
export class MicroContentGradingResultHandler implements WorkerResultHandler {
  private readonly logger = new Logger(MicroContentGradingResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(envelope: WorkerResultEnvelope) {
    const result = parseMicroContentGradingResult(envelope.payload);
    const ids = result.answers.map((a) => a.id);
    const outcome = await this.prisma.$transaction(async (tx) => {
      const attempt = await lockAttempt(tx, result.attemptId);
      // micro_content_attempts xoá theo cascade khi xoá hẳn micro content: không
      // còn gì để ghi, không phải lỗi của worker.
      if (!attempt) return null;
      if (
        attempt.micro_content_id !== result.microContentId ||
        attempt.course_id !== result.courseId
      ) {
        throw new InvalidWorkerResultError(
          `MICRO_CONTENT_GRADING_RESULT ${envelope.result_id}: attempt ${result.attemptId} does not belong to micro content ${result.microContentId} of course ${result.courseId}`,
        );
      }
      const answers = await tx.micro_content_answers.findMany({
        where: { answer_id: { in: ids } },
        select: { answer_id: true, attempt_id: true },
      });
      const owned = new Set(
        answers
          .filter((a) => a.attempt_id === result.attemptId)
          .map((a) => a.answer_id),
      );
      const stray = ids.filter((id) => !owned.has(id));
      if (stray.length) {
        throw new InvalidWorkerResultError(
          `MICRO_CONTENT_GRADING_RESULT ${envelope.result_id}: answers ${stray.join(', ')} do not belong to attempt ${result.attemptId}`,
        );
      }

      let graded = 0;
      let needsReview = 0;
      for (const grade of result.answers) {
        const { count } = await tx.micro_content_answers.updateMany({
          where: {
            answer_id: grade.id,
            attempt_id: result.attemptId,
            grading_status: GRADING_STATUS.pending,
          },
          data: answerGradeData(grade),
        });
        if (!count) continue;
        if (grade.status === GRADING_STATUS.graded) graded += 1;
        else needsReview += 1;
      }
      if (!graded && !needsReview)
        return { graded, needsReview, attempt: null };

      const totals = await recomputeAttempt(
        tx,
        result.attemptId,
        attempt.passing_score,
      );
      return { graded, needsReview, attempt: totals };
    });
    if (!outcome) {
      this.logger.warn(
        `Bỏ ${envelope.result_id}: lượt nộp micro content ${result.attemptId} không còn`,
      );
      return { graded: 0, needsReview: 0, skipped: ids.length, attempt: null };
    }
    const skipped = ids.length - outcome.graded - outcome.needsReview;
    this.logger.log(
      `Lượt nộp micro content ${result.attemptId}: ${outcome.graded} câu có điểm, ${outcome.needsReview} câu chờ giảng viên, ` +
        `${skipped} câu bỏ qua${outcome.attempt ? `, điểm ${outcome.attempt.score} (${outcome.attempt.grading_status})` : ''} (${envelope.result_id})`,
    );
    return { ...outcome, skipped };
  }

  /**
   * Kết quả không bao giờ áp dụng được: các câu của kết quả này còn PENDING sẽ
   * không bao giờ có điểm và lượt nộp kẹt ở PENDING. Chuyển chúng sang
   * NEEDS_REVIEW rồi tính lại trạng thái lượt như handle() (còn câu chờ giảng
   * viên thì cả lượt NEEDS_REVIEW).
   *
   * Payload chưa kiểm: chỉ đọc attempt_id/course_id/micro_content_id/answer_id
   * hợp lệ, đối chiếu lượt nộp với DB (lệch thì không làm gì) và chỉ chạm câu
   * thuộc đúng lượt nộp, còn PENDING.
   */
  async onFinalFailure(envelope: WorkerResultEnvelope, error: Error) {
    await runBestEffort(
      this.logger,
      `Không chuyển được câu của ${envelope.result_id} sang NEEDS_REVIEW`,
      async () => {
        const payload: unknown = envelope.payload;
        if (!isPlainObject(payload)) return;
        const ids = salvageAnswerIds(payload.answers, 'answer_id');
        const {
          attempt_id: attemptId,
          course_id: courseId,
          micro_content_id: microContentId,
        } = payload;
        if (
          !ids.length ||
          !isUuid(attemptId) ||
          !isUuid(courseId) ||
          !isUuid(microContentId)
        ) {
          return;
        }

        const marked = await this.prisma.$transaction(async (tx) => {
          const attempt = await lockAttempt(tx, attemptId);
          if (
            !attempt ||
            attempt.micro_content_id !== microContentId.toLowerCase() ||
            attempt.course_id !== courseId.toLowerCase()
          ) {
            return 0;
          }
          const { count } = await tx.micro_content_answers.updateMany({
            where: {
              answer_id: { in: ids },
              attempt_id: attemptId,
              grading_status: GRADING_STATUS.pending,
            },
            data: {
              grading_status: GRADING_STATUS.needsReview,
              feedback: GRADING_UNAPPLIED_FEEDBACK,
            },
          });
          if (count) {
            await recomputeAttempt(tx, attemptId, attempt.passing_score);
          }
          return count;
        });
        this.logger.warn(
          `Kết quả ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            `${marked}/${ids.length} câu PENDING chuyển sang NEEDS_REVIEW`,
        );
      },
    );
  }
}
