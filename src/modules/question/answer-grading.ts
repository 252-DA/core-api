import type { Prisma } from '@prisma/client';
import { AGS_STATUS } from '../../common/constants/ags-status';
import { isWithinCodePoints } from '../../common/utils/text-length';
import { isPlainObject } from '../../common/utils/type-guards';
import { isUuid } from '../../common/utils/uuid';
import { ANSWER_GRADING_REQUESTED } from '../../messaging/event-types';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';

/**
 * `quiz_attempts.grading_status`: xem migration 20261004120000_question_types
 * và 20261006120000_grading_input_review.
 *
 *   GRADED        có điểm (mọi kiểu chấm ngay, tự luận AI hoặc giảng viên đã chấm)
 *   PENDING       tự luận đang chờ worker chấm
 *   NEEDS_REVIEW  AI không chấm được sau mọi lượt thử: chờ giảng viên chấm tay
 *                 hoặc cho AI chấm lại. `score` chỉ là giá trị tạm như PENDING.
 */
export const GRADING_STATUS = {
  graded: 'GRADED',
  pending: 'PENDING',
  needsReview: 'NEEDS_REVIEW',
} as const;

/**
 * Lượt nộp còn tự luận chờ chấm thì giữ cả lượt ở AWAITING_GRADE thay vì
 * PENDING: AgsPublisherService chỉ nhặt PENDING, nên không gửi lên LMS một
 * điểm tính khi tự luận còn là 0. QuizGradingResultHandler áp dụng kết quả
 * chấm xong sẽ chuyển sang PENDING.
 */
export function rowAgsStatus(agsStatus: string, awaitingGrade: boolean) {
  return awaitingGrade && agsStatus === AGS_STATUS.pending
    ? AGS_STATUS.awaitingGrade
    : agsStatus;
}

/**
 * Đề của câu tự luận đúng như lúc người học làm bài, ghi vào
 * `quiz_attempts.grading_input` cùng transaction nộp bài. Worker và giảng viên
 * chấm theo bản này chứ không đọc lại `quiz_items`, vì câu trong ngân hàng có
 * thể bị sửa sau khi đề đã phát.
 */
export function gradingInput(item: {
  type: string;
  question: string;
  correct_answer: unknown;
}): Prisma.InputJsonValue {
  return {
    type: item.type,
    question: item.question,
    correct_answer: item.correct_answer as Prisma.InputJsonValue,
  };
}

/** Một câu tự luận giao worker chấm: đủ dữ liệu để worker không đọc bảng bài làm. */
export type GradingAnswer = {
  attemptId: string;
  /** Đề lúc nộp (gradingInput()), đúng bản đã ghi vào cột grading_input. */
  gradingInput: Prisma.InputJsonValue;
  chosenAnswer: Prisma.InputJsonValue | null;
};

/**
 * Giao việc chấm cho worker (contracts/integration-events/v1/answer-grading-requested.json).
 * Lệnh tự chứa: `answers` mang đề lúc nộp và bài làm, worker không đọc
 * quiz_attempts. `attempt_ids`/`essay_attempt_ids` worker mới không dùng nữa
 * (handler tự gom lượt nộp bằng lockAwaitingGroup); giữ để worker bản cũ còn
 * chạy được trong lúc deploy lệch nhau.
 */
export function answerGradingEvent(input: {
  submissionId: string;
  courseId: string;
  attemptIds: string[];
  answers: GradingAnswer[];
}) {
  return {
    event_type: ANSWER_GRADING_REQUESTED,
    aggregate_type: 'quiz_submission',
    aggregate_id: input.submissionId,
    payload: {
      submission_id: input.submissionId,
      course_id: input.courseId,
      attempt_ids: input.attemptIds,
      essay_attempt_ids: input.answers.map((a) => a.attemptId),
      answers: input.answers.map((a) => ({
        attempt_id: a.attemptId,
        grading_input: a.gradingInput,
        chosen_answer: a.chosenAnswer,
      })),
    } as Prisma.InputJsonValue,
  };
}

/**
 * Điểm lượt nộp = trung bình điểm từng câu; tự luận chấm theo ý nên có điểm lẻ.
 * Nơi duy nhất có công thức này (kể cả micro-content): worker không tính tổng.
 * Math.round làm tròn .5 lên (50.5 → 51), khác round() của Python.
 */
export function submissionScore(scores: number[]) {
  return scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 0;
}

type AttemptRef = {
  submission_id: string | null;
  user_id: string;
  resource_link_id: string | null;
};

/**
 * Các câu cùng lượt nộp với `attempt` mà còn khoá AGS. Quiz set gom theo
 * `submission_id`. Lesson quiz không có submission_id nên gom mọi câu đang
 * AWAITING_GRADE của người học trên bài tập đó, đúng như AgsPublisherService
 * gom các dòng PENDING của lesson quiz thành một điểm.
 */
export async function lockAwaitingGroup(tx: Prisma.TransactionClient, attempt: AttemptRef) {
  // Khoá các dòng trước khi đếm: giảng viên chấm tay và QuizGradingResultHandler
  // (kết quả của worker) cùng khoá chúng theo một thứ tự, nên hai bên không
  // cùng thấy "còn câu chưa chấm" rồi bỏ lượt nộp kẹt ở AWAITING_GRADE.
  const rows = attempt.submission_id
    ? await tx.$queryRaw<Array<{ attempt_id: string }>>`
        SELECT attempt_id FROM quiz_attempts
        WHERE submission_id = ${attempt.submission_id}::uuid AND deleted_at IS NULL
        ORDER BY attempt_id FOR UPDATE`
    : attempt.resource_link_id
      ? await tx.$queryRaw<Array<{ attempt_id: string }>>`
          SELECT attempt_id FROM quiz_attempts
          WHERE submission_id IS NULL AND user_id = ${attempt.user_id}::uuid
            AND resource_link_id = ${attempt.resource_link_id}::uuid
            AND ags_status = ${AGS_STATUS.awaitingGrade} AND deleted_at IS NULL
          ORDER BY attempt_id FOR UPDATE`
      : [];
  return rows.map((row) => row.attempt_id);
}

/**
 * Mở khoá AGS cho nhóm câu khi mọi câu đã GRADED. Gọi trong transaction đã
 * `lockAwaitingGroup`. Trả số dòng chuyển sang PENDING.
 */
export async function releaseIfGraded(tx: Prisma.TransactionClient, attemptIds: string[]) {
  if (!attemptIds.length) return 0;
  const ungraded = await tx.quiz_attempts.count({
    where: {
      attempt_id: { in: attemptIds },
      grading_status: { not: GRADING_STATUS.graded },
      deleted_at: null,
    },
  });
  if (ungraded) return 0;
  const { count } = await tx.quiz_attempts.updateMany({
    where: { attempt_id: { in: attemptIds }, ags_status: AGS_STATUS.awaitingGrade },
    data: { ags_status: AGS_STATUS.pending },
  });
  return count;
}

/** Lý do worker trả NEEDS_REVIEW (quiz-grading-result.json, micro-content-grading-result.json). */
export const NEEDS_REVIEW_REASONS = [
  'MODEL_ERROR',
  'NO_GRADING_INPUT',
  'LEGACY_COMMAND',
] as const;

/** Kết quả chấm một câu do worker gửi, đã kiểm. `id` là attempt_id hoặc answer_id. */
export type AnswerGradeResult =
  | {
      id: string;
      status: typeof GRADING_STATUS.graded;
      score: number;
      isCorrect: boolean;
      feedback: string | null;
      graderModel: string | null;
    }
  | {
      id: string;
      status: typeof GRADING_STATUS.needsReview;
      reason: (typeof NEEDS_REVIEW_REASONS)[number];
      feedback: string | null;
      graderModel: string | null;
    };

/** Khớp maxLength trong schema (đếm code point, xem text-length.ts); worker cắt trước khi gửi. */
export const MAX_GRADE_FEEDBACK = 4000;
const MAX_GRADER_MODEL = 200;

function nullableText(value: unknown, max: number) {
  return value === null || (typeof value === 'string' && isWithinCodePoints(value, max));
}

/**
 * Kiểm `answers` của QUIZ_GRADING_RESULT / MICRO_CONTENT_GRADING_RESULT theo
 * schema: GRADED có điểm nguyên 0–100 và is_correct; NEEDS_REVIEW không có
 * điểm (lỗi model không được thành điểm 0). Sai dạng → InvalidWorkerResultError
 * (không retry): gửi lại cũng sai y như vậy.
 */
export function parseAnswerGrades(
  value: unknown,
  idKey: 'attempt_id' | 'answer_id',
  label: string,
): AnswerGradeResult[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InvalidWorkerResultError(`${label}: answers must be a non-empty array`);
  }
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const where = `${label}: answers[${index}]`;
    if (!isPlainObject(raw)) throw new InvalidWorkerResultError(`${where} must be an object`);
    const id = raw[idKey];
    if (!isUuid(id)) throw new InvalidWorkerResultError(`${where}.${idKey} must be a uuid`);
    if (seen.has(id)) throw new InvalidWorkerResultError(`${where}: duplicate ${idKey} ${id}`);
    seen.add(id);
    const { status, feedback, grader_model: graderModel } = raw;
    const allowed =
      status === GRADING_STATUS.graded
        ? [idKey, 'status', 'score', 'is_correct', 'feedback', 'grader_model']
        : [idKey, 'status', 'reason', 'feedback', 'grader_model'];
    const problems = Object.keys(raw)
      .filter((key) => !allowed.includes(key))
      .map((key) => `unexpected field ${key}`);
    if (!('feedback' in raw) || !nullableText(feedback, MAX_GRADE_FEEDBACK)) {
      problems.push(`feedback must be a string (≤ ${MAX_GRADE_FEEDBACK}) or null`);
    }
    if (!('grader_model' in raw) || !nullableText(graderModel, MAX_GRADER_MODEL)) {
      problems.push('grader_model must be a short string or null');
    }
    if (status === GRADING_STATUS.graded) {
      const { score, is_correct: isCorrect } = raw;
      if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
        problems.push('score must be an integer in [0, 100]');
      }
      if (typeof isCorrect !== 'boolean') problems.push('is_correct must be a boolean');
      if (problems.length) throw new InvalidWorkerResultError(`${where}: ${problems.join('; ')}`);
      return {
        id,
        status: GRADING_STATUS.graded,
        score: score as number,
        isCorrect: isCorrect as boolean,
        feedback: feedback as string | null,
        graderModel: graderModel as string | null,
      };
    }
    if (status === GRADING_STATUS.needsReview) {
      const reason = raw.reason;
      if (!(NEEDS_REVIEW_REASONS as readonly unknown[]).includes(reason)) {
        problems.push(`reason must be one of ${NEEDS_REVIEW_REASONS.join(', ')}`);
      }
      if (problems.length) throw new InvalidWorkerResultError(`${where}: ${problems.join('; ')}`);
      return {
        id,
        status: GRADING_STATUS.needsReview,
        reason: reason as (typeof NEEDS_REVIEW_REASONS)[number],
        feedback: feedback as string | null,
        graderModel: graderModel as string | null,
      };
    }
    throw new InvalidWorkerResultError(
      `${where}: status must be ${GRADING_STATUS.graded} or ${GRADING_STATUS.needsReview}`,
    );
  });
}

/**
 * Feedback đặt cho câu tự luận mà kết quả chấm không áp dụng được (hook
 * onFinalFailure của QUIZ_GRADING_RESULT / MICRO_CONTENT_GRADING_RESULT): câu
 * chuyển sang NEEDS_REVIEW để giảng viên chấm tay hoặc cho AI chấm lại.
 */
export const GRADING_UNAPPLIED_FEEDBACK =
  'Hệ thống không lưu được kết quả chấm của AI cho câu này. Giảng viên sẽ chấm, điểm cập nhật sau.';

/**
 * Các id (attempt_id hoặc answer_id) hợp lệ trong `answers` của một payload CHƯA
 * kiểm — cho hook onFinalFailure, nơi payload có thể sai dạng. Bỏ phần tử rác và
 * id trùng; không phải mảng thì trả mảng rỗng.
 */
export function salvageAnswerIds(
  answers: unknown,
  idKey: 'attempt_id' | 'answer_id',
): string[] {
  if (!Array.isArray(answers)) return [];
  const ids = new Set<string>();
  for (const raw of answers as unknown[]) {
    if (isPlainObject(raw) && isUuid(raw[idKey])) ids.add(raw[idKey].toLowerCase());
  }
  return [...ids];
}

/** Dữ liệu ghi vào một dòng câu trả lời (quiz_attempts hoặc micro_content_answers). */
export function answerGradeData(grade: AnswerGradeResult) {
  // NEEDS_REVIEW không đụng score: giá trị tạm lúc nộp, chưa bao giờ lên sổ
  // điểm vì lượt nộp còn khoá; giảng viên chấm tay hoặc cho AI chấm lại.
  return grade.status === GRADING_STATUS.graded
    ? {
        score: grade.score,
        is_correct: grade.isCorrect,
        feedback: grade.feedback,
        grading_status: GRADING_STATUS.graded,
      }
    : { feedback: grade.feedback, grading_status: GRADING_STATUS.needsReview };
}
