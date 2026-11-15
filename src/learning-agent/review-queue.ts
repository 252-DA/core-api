import type { LoState } from './learner-state';
import type { NormalizedEvidence } from './observations';
import { applyReview, enterReview, isDue, type ReviewEntry } from './review-schedule';

export interface ReviewQueueEntry extends ReviewEntry {
  /** Đến hạn tại thời điểm hỏi (hoặc bị đánh dấu cần kiểm tra lại). */
  due: boolean;
}

/**
 * Lịch ôn dẫn xuất từ bằng chứng, không cần bảng riêng: LO vào hộp đầu lúc
 * lần đầu đạt tiêu chí; mỗi quan sát SAU mốc đó được coi là một lần ôn —
 * đúng lên một hộp, sai về hộp đầu và đánh dấu cần kiểm tra lại (§6.5).
 * Câu gặp lại nguyên văn không phải bằng chứng nên không nằm trong
 * `observations`; lượt ôn kiểu đó chưa được ghi nhận ở giai đoạn này.
 */
export function reviewQueue(
  states: LoState[],
  evidence: NormalizedEvidence,
  now: Date,
): Map<string, ReviewQueueEntry> {
  const masteredAt = new Map<string, Date>();
  for (const state of states) {
    if (state.firstMasteredAt) masteredAt.set(state.loId, state.firstMasteredAt);
  }
  const queue = new Map<string, ReviewQueueEntry>();
  for (const [loId, at] of masteredAt) {
    queue.set(loId, { ...enterReview(loId, at), due: false });
  }
  // Quan sát đã xếp theo thời gian; bỏ qua các quan sát tới và gồm mốc đạt.
  for (const obs of evidence.observations) {
    const entry = queue.get(obs.loId);
    if (!entry || obs.at.getTime() <= masteredAt.get(obs.loId)!.getTime()) continue;
    queue.set(obs.loId, { ...applyReview(entry, obs.correct, obs.at), due: false });
  }
  for (const [loId, entry] of queue) {
    queue.set(loId, { ...entry, due: isDue(entry, now) });
  }
  return queue;
}

/** LO đến hạn ôn, quá hạn lâu nhất trước — đúng thứ tự planner R1 mong đợi. */
export function dueLoIds(queue: Map<string, ReviewQueueEntry>): string[] {
  return [...queue.values()]
    .filter((entry) => entry.due)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .map((entry) => entry.loId);
}
