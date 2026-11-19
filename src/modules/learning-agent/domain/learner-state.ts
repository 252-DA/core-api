import {
  BKT_DEFAULTS,
  MASTERY_DEFAULTS,
  type BktParams,
  type MasteryCriterion,
} from './bkt';
import { bktPolicy, replay } from './mastery-policy';
import type { NormalizedEvidence, PendingReason } from './observations';

/**
 * Trạng thái một LO của một người học (§6.4). Hai trạng thái còn lại của thiết
 * kế, "cần ôn" và "cần hỗ trợ", cần lịch ôn và planner nên chưa có ở đây.
 *
 *   insufficient_evidence  chưa có quan sát, hoặc P(L) đã cao nhưng chưa đủ số quan sát
 *   practicing             có quan sát, P(L) dưới ngưỡng
 *   mastered               P(L) ≥ ngưỡng và đủ số quan sát
 */
export type LoStatus = 'insufficient_evidence' | 'practicing' | 'mastered';

export interface LoState {
  loId: string;
  /** P(L) hiện tại; bằng P(L₀) khi chưa có quan sát. */
  mastery: number;
  observations: number;
  correct: number;
  /** Số câu chưa đạt liên tiếp tính từ cuối lịch sử. */
  consecutiveWrong: number;
  status: LoStatus;
  /** Lúc LO lần đầu đạt tiêu chí. Không mất đi khi P(L) tụt lại sau đó. */
  firstMasteredAt: Date | null;
  lastObservedAt: Date | null;
  pending: Record<PendingReason, number>;
  /** Lần làm lại câu đã gặp: không là bằng chứng mới. */
  repeats: number;
}

export function learnerLoStates(
  loIds: string[],
  evidence: NormalizedEvidence,
  params: BktParams = BKT_DEFAULTS,
  criterion: MasteryCriterion = MASTERY_DEFAULTS,
): LoState[] {
  const policy = bktPolicy(params, criterion);
  return loIds.map((loId) => {
    const history = evidence.observations.filter((o) => o.loId === loId);
    const result = replay(policy, history);
    const mastery = result.state;
    let consecutiveWrong = 0;
    for (let i = history.length - 1; i >= 0 && !history[i].correct; i--)
      consecutiveWrong++;
    const mastered = policy.mastered(result.state, history.length);
    const pending: Record<PendingReason, number> = {
      grading: 0,
      review: 0,
      not_revealed: 0,
    };
    for (const p of evidence.pending) if (p.loId === loId) pending[p.reason]++;
    return {
      loId,
      mastery,
      observations: history.length,
      correct: history.filter((o) => o.correct).length,
      consecutiveWrong,
      status: mastered
        ? 'mastered'
        : history.length === 0 || mastery >= criterion.threshold
          ? 'insufficient_evidence'
          : 'practicing',
      firstMasteredAt: result.firstMasteredAt
        ? history[result.firstMasteredAt - 1].at
        : null,
      lastObservedAt: history.length ? history[history.length - 1].at : null,
      pending,
      repeats: evidence.repeats.get(loId) ?? 0,
    };
  });
}
