/**
 * Lịch ôn kiểu Leitner theo LO: docs/bao-cao-learning-agent.md §6.5.
 *
 * Tách khỏi BKT vì BKT đang dùng không có quên: P(L) cao chưa có nghĩa kiến
 * thức còn nhớ ở thời điểm hiện tại. Sau này thay bằng mô hình trí nhớ khác chỉ
 * cần thay module này.
 */
export interface ReviewConfig {
  version: string;
  /** Khoảng cách (ngày) của từng hộp, hộp 0 trước. */
  intervalsDays: number[];
  /** Múi giờ tính "ngày": Việt Nam không đổi giờ nên dùng độ lệch cố định. */
  utcOffsetMinutes: number;
}

export const REVIEW_DEFAULTS: ReviewConfig = {
  version: 'leitner-v1',
  intervalsDays: [1, 3, 7, 14, 30],
  utcOffsetMinutes: 7 * 60,
};

export interface ReviewEntry {
  loId: string;
  box: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  /** Ôn sai: cần câu chưa gặp hoặc giảng viên xác nhận lại, kể cả khi P(L) còn cao. */
  needsRecheck: boolean;
}

const DAY_MS = 86_400_000;

/** 00:00 giờ địa phương của ngày `at` cộng `days` ngày, trả về mốc UTC. */
export function localDayStart(at: Date, days: number, config: ReviewConfig = REVIEW_DEFAULTS): Date {
  const offset = config.utcOffsetMinutes * 60_000;
  const localMidnight = Math.floor((at.getTime() + offset) / DAY_MS) * DAY_MS;
  return new Date(localMidnight + days * DAY_MS - offset);
}

/** LO vừa đạt tiêu chí: vào hộp đầu. */
export function enterReview(loId: string, masteredAt: Date, config: ReviewConfig = REVIEW_DEFAULTS): ReviewEntry {
  return {
    loId,
    box: 0,
    dueAt: localDayStart(masteredAt, config.intervalsDays[0], config),
    lastReviewedAt: null,
    needsRecheck: false,
  };
}

/** Ôn đúng lên tối đa một hộp; ôn sai về hộp đầu và đánh dấu cần xác nhận lại. */
export function applyReview(
  entry: ReviewEntry,
  correct: boolean,
  at: Date,
  config: ReviewConfig = REVIEW_DEFAULTS,
): ReviewEntry {
  const box = correct ? Math.min(entry.box + 1, config.intervalsDays.length - 1) : 0;
  return {
    loId: entry.loId,
    box,
    dueAt: localDayStart(at, config.intervalsDays[box], config),
    lastReviewedAt: at,
    needsRecheck: !correct,
  };
}

export function isDue(entry: ReviewEntry, now: Date): boolean {
  return entry.needsRecheck || now.getTime() >= entry.dueAt.getTime();
}
