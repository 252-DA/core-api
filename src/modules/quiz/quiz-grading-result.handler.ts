import { Injectable, Logger } from '@nestjs/common';
import { runBestEffort } from '../../common/utils/best-effort';
import { isPlainObject } from '../../common/utils/type-guards';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../messaging/worker-results/worker-result-handler';
import {
  answerGradeData,
  GRADING_STATUS,
  GRADING_UNAPPLIED_FEEDBACK,
  lockAwaitingGroup,
  parseAnswerGrades,
  releaseIfGraded,
  salvageAnswerIds,
  type AnswerGradeResult,
} from '../question/answer-grading';

export type QuizGradingResult = {
  submissionId: string;
  courseId: string;
  answers: AnswerGradeResult[];
};

/** Kiểm payload theo contracts/integration-events/v1/quiz-grading-result.json. */
export function parseQuizGradingResult(payload: unknown): QuizGradingResult {
  const label = 'QUIZ_GRADING_RESULT';
  if (!isPlainObject(payload)) {
    throw new InvalidWorkerResultError(`${label}: payload must be an object`);
  }
  const extra = Object.keys(payload).filter(
    (key) => !['submission_id', 'course_id', 'answers'].includes(key),
  );
  if (extra.length) {
    throw new InvalidWorkerResultError(`${label}: unexpected fields ${extra.join(', ')}`);
  }
  const { submission_id: submissionId, course_id: courseId } = payload;
  if (!isUuid(submissionId) || !isUuid(courseId)) {
    throw new InvalidWorkerResultError(`${label}: submission_id and course_id must be uuids`);
  }
  return {
    submissionId,
    courseId,
    answers: parseAnswerGrades(payload.answers, 'attempt_id', label),
  };
}

/**
 * Áp dụng QUIZ_GRADING_RESULT: điểm câu tự luận trong quiz → quiz_attempts,
 * rồi mở khoá AGS khi cả lượt nộp đã GRADED. Thay cho việc worker tự ghi
 * (save_answer_grade / mark_answer_needs_review / release_graded_attempts).
 *
 * Một transaction: khoá lượt nộp như giảng viên chấm tay (lockAwaitingGroup,
 * cùng thứ tự khoá nên không deadlock), chỉ ghi câu còn PENDING — câu giảng
 * viên đã chấm hay đã NEEDS_REVIEW giữ nguyên — rồi releaseIfGraded. Nhận cùng
 * kết quả lần hai thì không còn câu PENDING nào để ghi và không đổi gì.
 */
@Injectable()
@WorkerResultHandler('QUIZ_GRADING_RESULT')
export class QuizGradingResultHandler implements WorkerResultHandler {
  private readonly logger = new Logger(QuizGradingResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(envelope: WorkerResultEnvelope) {
    const result = parseQuizGradingResult(envelope.payload);
    const ids = result.answers.map((a) => a.id);
    const outcome = await this.prisma.$transaction(async (tx) => {
      // Đọc cả dòng đã xoá mềm: id không tồn tại là worker gửi sai, còn dòng
      // đã xoá chỉ là không còn gì để ghi.
      const rows = await tx.quiz_attempts.findMany({
        where: { attempt_id: { in: ids } },
        select: {
          attempt_id: true,
          submission_id: true,
          user_id: true,
          course_id: true,
          resource_link_id: true,
          deleted_at: true,
        },
      });
      const found = new Set(rows.map((r) => r.attempt_id));
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length) {
        throw new InvalidWorkerResultError(
          `QUIZ_GRADING_RESULT ${envelope.result_id}: unknown attempt ids ${missing.join(', ')}`,
        );
      }
      // Mọi câu phải cùng một lượt nộp của khoá này: lesson quiz không lưu
      // submission_id nên so người học + bài tập.
      const first = rows[0];
      const stray = rows.filter(
        (r) =>
          r.course_id !== result.courseId ||
          (r.submission_id !== null && r.submission_id !== result.submissionId) ||
          r.submission_id !== first.submission_id ||
          r.user_id !== first.user_id ||
          r.resource_link_id !== first.resource_link_id,
      );
      if (stray.length) {
        throw new InvalidWorkerResultError(
          `QUIZ_GRADING_RESULT ${envelope.result_id}: attempts ${stray
            .map((r) => r.attempt_id)
            .join(', ')} do not belong to submission ${result.submissionId} of course ${result.courseId}`,
        );
      }

      const group = await lockAwaitingGroup(tx, first);
      let graded = 0;
      let needsReview = 0;
      for (const grade of result.answers) {
        const { count } = await tx.quiz_attempts.updateMany({
          where: {
            attempt_id: grade.id,
            grading_status: GRADING_STATUS.pending,
            deleted_at: null,
          },
          data: answerGradeData(grade),
        });
        if (!count) continue;
        if (grade.status === GRADING_STATUS.graded) graded += 1;
        else needsReview += 1;
      }
      const released = await releaseIfGraded(tx, group);
      return { graded, needsReview, released };
    });
    const skipped = ids.length - outcome.graded - outcome.needsReview;
    this.logger.log(
      `Lượt nộp ${result.submissionId}: ${outcome.graded} câu có điểm, ${outcome.needsReview} câu chờ giảng viên, ` +
        `${skipped} câu bỏ qua (không còn PENDING), mở AGS ${outcome.released} dòng (${envelope.result_id})`,
    );
    return { ...outcome, skipped };
  }

  /**
   * Kết quả không bao giờ áp dụng được (payload sai, câu không thuộc lượt nộp,
   * hay lỗi DB hết lượt thử): các câu của kết quả này còn PENDING sẽ không bao
   * giờ có điểm và cả lượt nộp kẹt ở AWAITING_GRADE, nên chuyển chúng sang
   * NEEDS_REVIEW — giảng viên chấm tay (EssayGradingService.grade) hoặc cho AI
   * chấm lại (retry). AGS vẫn giữ AWAITING_GRADE tới khi mọi câu có điểm.
   *
   * Payload chưa kiểm nên chỉ đọc attempt_id/course_id/submission_id hợp lệ và
   * chỉ chạm câu: cùng khoá học, cùng lượt nộp (như handle()), chưa xoá, và còn
   * PENDING. Câu đã có điểm hay đã NEEDS_REVIEW giữ nguyên.
   */
  async onFinalFailure(envelope: WorkerResultEnvelope, error: Error) {
    await runBestEffort(
      this.logger,
      `Không chuyển được câu của ${envelope.result_id} sang NEEDS_REVIEW`,
      async () => {
        const payload: unknown = envelope.payload;
        if (!isPlainObject(payload)) return;
        const ids = salvageAnswerIds(payload.answers, 'attempt_id');
        const { course_id: courseId, submission_id: submissionId } = payload;
        if (!ids.length || !isUuid(courseId) || !isUuid(submissionId)) return;

        const marked = await this.prisma.$transaction(async (tx) => {
          const rows = await tx.quiz_attempts.findMany({
            where: {
              attempt_id: { in: ids },
              course_id: courseId,
              deleted_at: null,
            },
            select: {
              attempt_id: true,
              submission_id: true,
              user_id: true,
              resource_link_id: true,
            },
          });
          // Lesson quiz không lưu submission_id (xem handle()).
          const own = rows.filter(
            (r) => r.submission_id === null || r.submission_id === submissionId,
          );
          if (!own.length) return 0;
          // Cùng thứ tự khoá với giảng viên chấm tay và handle(): không deadlock.
          await lockAwaitingGroup(tx, own[0]);
          const { count } = await tx.quiz_attempts.updateMany({
            where: {
              attempt_id: { in: own.map((r) => r.attempt_id) },
              grading_status: GRADING_STATUS.pending,
              deleted_at: null,
            },
            data: {
              grading_status: GRADING_STATUS.needsReview,
              feedback: GRADING_UNAPPLIED_FEEDBACK,
            },
          });
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
