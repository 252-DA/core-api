import type { Prisma } from '@prisma/client';
import { AGS_STATUS } from '../ags/ags-status';

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

/** Outbox chuyển sự kiện này sang hàng đợi `answer_grading` của worker. */
export const ANSWER_GRADING_REQUESTED = 'ANSWER_GRADING_REQUESTED';
export const ANSWER_GRADING_QUEUE = 'answer_grading';

/**
 * Lượt nộp còn tự luận chờ chấm thì giữ cả lượt ở AWAITING_GRADE thay vì
 * PENDING: AgsPublisherService chỉ nhặt PENDING, nên không gửi lên LMS một
 * điểm tính khi tự luận còn là 0. Worker chấm xong sẽ chuyển sang PENDING.
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

/**
 * Giao việc chấm cho worker. `attempt_ids` là mọi câu của lượt nộp (để mở
 * khoá AGS cho cả lượt sau khi chấm), `essay_attempt_ids` là các câu cần chấm.
 */
export function answerGradingEvent(input: {
  submissionId: string;
  courseId: string;
  attemptIds: string[];
  essayAttemptIds: string[];
}) {
  return {
    event_type: ANSWER_GRADING_REQUESTED,
    aggregate_type: 'quiz_submission',
    aggregate_id: input.submissionId,
    payload: {
      submission_id: input.submissionId,
      course_id: input.courseId,
      attempt_ids: input.attemptIds,
      essay_attempt_ids: input.essayAttemptIds,
    } as Prisma.InputJsonValue,
  };
}

/** Điểm lượt nộp = trung bình điểm từng câu; tự luận chấm theo ý nên có điểm lẻ. */
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
  // Khoá các dòng trước khi đếm: worker chấm câu khác của cùng lượt nộp cũng
  // khoá chúng (release_graded_attempts), nên hai bên không cùng thấy "còn câu
  // chưa chấm" rồi bỏ lượt nộp kẹt ở AWAITING_GRADE.
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
