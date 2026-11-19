import { GRADING_STATUS } from '../../question/answer-grading';
import {
  isQuestionType,
  type QuestionType,
} from '../../question/question-types';

/**
 * Chuẩn hoá lượt làm bài thành quan sát cho mô hình người học: quy tắc ở
 * docs/bao-cao-learning-agent.md §5.3.
 *
 * Mỗi câu (hoặc nhóm câu trùng văn bản) chỉ cho một bằng chứng: lần trả lời
 * ĐẦU TIÊN. Lần làm lại là đã thấy đề, nên không được tính thêm. Lần đầu còn
 * chờ chấm, chờ giảng viên duyệt, hoặc thuộc bài kiểm tra chưa công bố đáp án
 * thì là "đang chờ": không tính đúng cũng không tính sai.
 */
export type AttemptSource = 'practice' | 'exam' | 'lesson';

export interface AttemptEvidence {
  attemptId: string;
  quizId: string;
  loId: string | null;
  type: string;
  optionCount: number | null;
  question: string;
  isCorrect: boolean;
  gradingStatus: string;
  attemptedAt: Date | null;
  source: AttemptSource;
  /** Bài kiểm tra chưa tới lúc công bố đáp án: kết quả từng câu còn ẩn với người học. */
  hidden: boolean;
}

export interface LoObservation {
  loId: string;
  attemptId: string;
  quizId: string;
  type: QuestionType;
  optionCount: number | null;
  correct: boolean;
  at: Date;
  source: AttemptSource;
}

export type PendingReason = 'grading' | 'review' | 'not_revealed';

export interface PendingEvidence {
  loId: string;
  attemptId: string;
  quizId: string;
  reason: PendingReason;
}

export interface NormalizedEvidence {
  /** Theo thứ tự thời điểm làm bài. */
  observations: LoObservation[];
  pending: PendingEvidence[];
  /** Số lần trả lời lại câu đã gặp, theo LO. Ghi để báo cáo, không là bằng chứng. */
  repeats: Map<string, number>;
}

/** Khoá nhóm câu trùng. Chỉ bắt câu chép lại nguyên văn, chưa bắt câu diễn đạt lại. */
export function duplicateKey(question: string): string {
  return question
    .normalize('NFC')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
}

function pendingReason(row: AttemptEvidence): PendingReason | null {
  if (row.hidden) return 'not_revealed';
  if (row.gradingStatus === GRADING_STATUS.graded) return null;
  return row.gradingStatus === GRADING_STATUS.needsReview
    ? 'review'
    : 'grading';
}

/** Thứ tự dựng lại lịch sử: thời điểm làm bài, rồi mã lượt làm để kết quả ổn định. */
export function byAttemptOrder(a: AttemptEvidence, b: AttemptEvidence) {
  const at = (a.attemptedAt?.getTime() ?? 0) - (b.attemptedAt?.getTime() ?? 0);
  return (
    at || (a.attemptId < b.attemptId ? -1 : a.attemptId > b.attemptId ? 1 : 0)
  );
}

/** Lịch sử của MỘT người học trong một khoá. */
export function normalizeAttempts(rows: AttemptEvidence[]): NormalizedEvidence {
  const seen = new Set<string>();
  const observations: LoObservation[] = [];
  const pending: PendingEvidence[] = [];
  const repeats = new Map<string, number>();

  for (const row of [...rows].sort(byAttemptOrder)) {
    if (!row.loId || !isQuestionType(row.type)) continue;
    const key = duplicateKey(row.question);
    if (seen.has(key)) {
      repeats.set(row.loId, (repeats.get(row.loId) ?? 0) + 1);
      continue;
    }
    seen.add(key);
    const reason = pendingReason(row);
    if (reason) {
      pending.push({
        loId: row.loId,
        attemptId: row.attemptId,
        quizId: row.quizId,
        reason,
      });
      continue;
    }
    observations.push({
      loId: row.loId,
      attemptId: row.attemptId,
      quizId: row.quizId,
      type: row.type,
      optionCount: row.optionCount,
      correct: row.isCorrect,
      at: row.attemptedAt ?? new Date(0),
      source: row.source,
    });
  }
  return { observations, pending, repeats };
}
