import type { QuestionType } from '../../question/question-types';

/**
 * Bayesian Knowledge Tracing theo LO: docs/bao-cao-learning-agent.md §6.2–6.4.
 *
 * Hàm thuần: cùng lịch sử quan sát và cùng bộ tham số luôn cho cùng P(L). Các
 * con số dưới đây là cấu hình khởi đầu chưa hiệu chỉnh từ dữ liệu. Đổi bất kỳ
 * giá trị nào thì đổi `version`, để nhật ký quyết định còn truy vết được.
 */
export interface BktParams {
  version: string;
  /** P(L₀): mức biết trước giả định cho một LO chưa có quan sát. */
  prior: number;
  /** T: xác suất chuyển sang đã nắm sau một cơ hội luyện. */
  learn: number;
  /** S = P(sai | đã nắm). */
  slip: number;
  /**
   * G = P(đúng | chưa nắm) theo loại câu. MCQ_SINGLE không nằm ở đây vì tính
   * 1/k theo số phương án của chính câu đó.
   */
  guess: Record<Exclude<QuestionType, 'MCQ_SINGLE'>, number>;
}

export const BKT_DEFAULTS: BktParams = {
  version: 'bkt-v1',
  prior: 0.2,
  learn: 0.15,
  slip: 0.1,
  guess: {
    TRUE_FALSE: 0.5,
    MCQ_MULTI: 0.1,
    FILL_BLANK: 0.05,
    SHORT_ANSWER: 0.05,
  },
};

/** Tiêu chí công nhận: P(L) ≥ threshold và đủ số quan sát hợp lệ (§6.4). */
export interface MasteryCriterion {
  threshold: number;
  minObservations: number;
}

export const MASTERY_DEFAULTS: MasteryCriterion = {
  threshold: 0.95,
  minObservations: 3,
};

export function guessFor(
  type: QuestionType,
  optionCount: number | null,
  params: BktParams = BKT_DEFAULTS,
): number {
  if (type === 'MCQ_SINGLE')
    return 1 / (optionCount && optionCount >= 2 ? optionCount : 4);
  return params.guess[type];
}

/** Hậu nghiệm sau một quan sát, rồi cộng chuyển trạng thái học được T. */
export function bktUpdate(
  p: number,
  correct: boolean,
  guess: number,
  params: BktParams = BKT_DEFAULTS,
): number {
  const { slip, learn } = params;
  const posterior = correct
    ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return posterior + (1 - posterior) * learn;
}

export function meetsCriterion(
  p: number,
  observations: number,
  criterion: MasteryCriterion = MASTERY_DEFAULTS,
): boolean {
  return p >= criterion.threshold && observations >= criterion.minObservations;
}
