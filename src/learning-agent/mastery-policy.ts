import type { QuestionType } from '../quiz/question-types';
import {
  BKT_DEFAULTS,
  MASTERY_DEFAULTS,
  bktUpdate,
  guessFor,
  meetsCriterion,
  type BktParams,
  type MasteryCriterion,
} from './bkt';

/**
 * Ba cách quyết định "đã thành thạo LO" dùng chung một giao diện (§2.4, §10.2):
 * BKT là chính sách đề xuất, N-CCR và EMA là đối chứng. Tách mô hình khỏi tiêu
 * chí dừng để bộ mô phỏng thay qua lại mà không đổi phần chọn câu.
 */
export interface PolicyObservation {
  type: QuestionType;
  optionCount: number | null;
  correct: boolean;
}

export interface MasteryPolicy<S> {
  readonly id: 'bkt' | 'n-ccr' | 'ema';
  readonly version: string;
  initial(): S;
  update(state: S, obs: PolicyObservation): S;
  mastered(state: S, observations: number): boolean;
  /** Ước lượng 0–1 để hiển thị; N-CCR không có xác suất nên trả null. */
  estimate(state: S): number | null;
}

export function bktPolicy(
  params: BktParams = BKT_DEFAULTS,
  criterion: MasteryCriterion = MASTERY_DEFAULTS,
): MasteryPolicy<number> {
  return {
    id: 'bkt',
    version: `${params.version}/θ${criterion.threshold}/n${criterion.minObservations}`,
    initial: () => params.prior,
    update: (p, obs) => bktUpdate(p, obs.correct, guessFor(obs.type, obs.optionCount, params), params),
    mastered: (p, n) => meetsCriterion(p, n, criterion),
    estimate: (p) => p,
  };
}

/** N câu đúng liên tiếp (ASSISTments dùng N = 3). */
export function consecutiveCorrectPolicy(n = 3): MasteryPolicy<number> {
  return {
    id: 'n-ccr',
    version: `n-ccr-v1/n${n}`,
    initial: () => 0,
    update: (streak, obs) => (obs.correct ? streak + 1 : 0),
    mastered: (streak) => streak >= n,
    estimate: () => null,
  };
}

/**
 * Trung bình trượt mũ của kết quả đúng/sai (Pelánek & Řihák 2017). α và ngưỡng
 * mặc định chỉ để chạy được; giai đoạn đánh giá chọn lại trên tập hiệu chỉnh
 * riêng, không chọn trên tập đánh giá cuối.
 */
export function emaPolicy(alpha = 0.3, threshold = 0.8, minObservations = 3): MasteryPolicy<number> {
  return {
    id: 'ema',
    version: `ema-v1/a${alpha}/θ${threshold}/n${minObservations}`,
    initial: () => 0,
    update: (value, obs) => alpha * (obs.correct ? 1 : 0) + (1 - alpha) * value,
    mastered: (value, observations) => value >= threshold && observations >= minObservations,
    estimate: (value) => value,
  };
}

export interface ReplayResult<S> {
  state: S;
  observations: number;
  /** Số thứ tự (1-based) của quan sát làm LO lần đầu đạt tiêu chí; null nếu chưa. */
  firstMasteredAt: number | null;
}

/** Chạy lại toàn bộ lịch sử theo thứ tự; trạng thái lưu chỉ là bộ đệm của hàm này. */
export function replay<S>(policy: MasteryPolicy<S>, history: PolicyObservation[]): ReplayResult<S> {
  let state = policy.initial();
  let firstMasteredAt: number | null = null;
  history.forEach((obs, index) => {
    state = policy.update(state, obs);
    if (firstMasteredAt === null && policy.mastered(state, index + 1)) firstMasteredAt = index + 1;
  });
  return { state, observations: history.length, firstMasteredAt };
}
