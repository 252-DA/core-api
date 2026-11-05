/**
 * Planner theo luật: docs/bao-cao-learning-agent.md §7.
 *
 * Hàm thuần nhận trạng thái đã tính sẵn (mô hình người học, lịch ôn, kho câu,
 * nhật ký can thiệp) và trả MỘT đề xuất chính, tối đa hai lựa chọn hợp lệ khác
 * cùng lý do. Nghỉ (A0) luôn được phép nên không nằm trong danh sách lựa chọn.
 * Mọi kiểm tra quyền, khoá học và thời gian mở đã làm trước khi dựng `scope`:
 * LO ngoài phạm vi không bao giờ có mặt ở đây.
 *
 * A2 (chuyển mức Bloom) và A7 (sinh câu nhắm chỗ hụt) là phần mở rộng, chưa có.
 */
export type AgentAction = 'A0' | 'A1' | 'A3' | 'A4' | 'A5' | 'A6' | 'WAIT';

export type DecisionReason =
  | 'daily_limit'
  | 'review_due'
  | 'stuck'
  | 'wrong_streak'
  | 'need_evidence'
  | 'missing_items'
  | 'awaiting_grade'
  | 'lo_mastered_next'
  | 'all_mastered';

export interface PlannerConfig {
  version: string;
  /** Giới hạn câu/ngày do giảng viên đặt; 30 chỉ là giá trị giữ chỗ. */
  maxItemsPerDay: number;
  maxReviewsPerDay: number;
  /** R2: số quan sát trong đợt mà LO vẫn chưa đạt. */
  stuckEpisodeObservations: number;
  /** R2: số lần đã xem lại nguồn mà vẫn sai liên tiếp. */
  stuckSourceViews: number;
  /** R3: số câu chưa đạt liên tiếp thì đề xuất xem lại nguồn. */
  wrongStreakForSource: number;
}

export const PLANNER_DEFAULTS: PlannerConfig = {
  version: 'rules-v1',
  maxItemsPerDay: 30,
  maxReviewsPerDay: 5,
  stuckEpisodeObservations: 10,
  stuckSourceViews: 2,
  wrongStreakForSource: 2,
};

export interface PlannerLo {
  loId: string;
  mastered: boolean;
  /** Quan sát trong đợt luyện hiện tại; đợt mới khi LO được mở lại hoặc giảng viên cho tiếp tục. */
  episodeObservations: number;
  /** Câu chưa đạt liên tiếp tính từ lần xem nguồn gần nhất đã ghi nhận. */
  wrongSinceSource: number;
  /** Số lần xem lại nguồn đã ghi nhận trong đợt. */
  sourceViews: number;
  /** Đã bị tạm dừng bởi R2, chờ giảng viên. */
  paused: boolean;
  /** Còn câu tự luận chờ chấm: kho đã bỏ câu tự luận cùng LO ra khỏi `hasNewItem`. */
  awaitingGrade: boolean;
  hasNewItem: boolean;
  /** Có câu dùng để ôn: ưu tiên câu chưa gặp, hết thì câu gặp lâu nhất. */
  hasReviewItem: boolean;
  hasSource: boolean;
}

export interface PlannerInput {
  /** LO được mở cho Agent, theo thứ tự giảng viên cấu hình. */
  scope: PlannerLo[];
  /** LO của hoạt động vừa có kết quả. */
  currentLoId: string | null;
  /** LO đến hạn ôn, quá hạn lâu nhất trước. LO ngoài phạm vi bị bỏ qua. */
  dueLoIds: string[];
  /** Đếm chung trong khoá học, không đặt lại khi đổi bài luyện. */
  today: { answered: number; reviewsAnswered: number };
}

export type ResourceIssue = 'missing_source' | 'missing_review_item' | 'missing_items';

export interface Decision {
  action: AgentAction;
  loId: string | null;
  rule: 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R6';
  reason: DecisionReason;
  /** Số liệu làm căn cứ cho lý do hiển thị, ví dụ số câu sai liên tiếp. */
  evidence: Record<string, number>;
  alternatives: Array<{ action: AgentAction; loId: string }>;
  /** Thiếu tài nguyên gặp phải khi xét luật: báo giảng viên, không phải lỗi của sinh viên. */
  issues: Array<{ loId: string; issue: ResourceIssue }>;
  policyVersion: string;
}

function isStuck(lo: PlannerLo, config: PlannerConfig) {
  return (
    lo.episodeObservations >= config.stuckEpisodeObservations ||
    (lo.sourceViews >= config.stuckSourceViews && lo.wrongSinceSource >= config.wrongStreakForSource)
  );
}

export function plan(input: PlannerInput, config: PlannerConfig = PLANNER_DEFAULTS): Decision {
  const issues: Decision['issues'] = [];
  const active = input.scope.filter((lo) => !lo.paused);
  const byId = new Map(input.scope.map((lo) => [lo.loId, lo]));
  // LO đang xử lý: LO vừa làm nếu còn trong phạm vi, không thì LO chưa đạt đầu tiên.
  const last = input.currentLoId ? (active.find((lo) => lo.loId === input.currentLoId) ?? null) : null;
  const working = last && !last.mastered ? last : (active.find((lo) => !lo.mastered) ?? null);

  const decide = (
    action: AgentAction,
    lo: PlannerLo | null,
    rule: Decision['rule'],
    reason: DecisionReason,
    evidence: Record<string, number> = {},
    // LO mà các lựa chọn khác được phép tiếp tục; null khi LO đó vừa bị tạm dừng.
    continueLo: PlannerLo | null = working,
  ): Decision => ({
    action,
    loId: lo?.loId ?? null,
    rule,
    reason,
    evidence,
    alternatives: rule === 'R0' ? [] : alternatives(active, continueLo, { action, loId: lo?.loId ?? null }),
    issues,
    policyVersion: config.version,
  });

  // R0 — hết hạn mức ngày: chỉ còn nghỉ.
  if (input.today.answered >= config.maxItemsPerDay) {
    return decide('A0', null, 'R0', 'daily_limit', { limit: config.maxItemsPerDay });
  }

  // R1 — ôn LO đến hạn trong phạm vi.
  if (input.today.reviewsAnswered < config.maxReviewsPerDay) {
    for (const loId of input.dueLoIds) {
      const lo = byId.get(loId);
      if (!lo || lo.paused) continue;
      if (lo.hasReviewItem) return decide('A4', lo, 'R1', 'review_due');
      issues.push({ loId, issue: 'missing_review_item' });
    }
  }

  // R6 — LO vừa làm đã đạt: chuyển LO. Lịch ôn đã ghi ở bước cập nhật trạng thái.
  if (last?.mastered) {
    return working
      ? decide('A5', working, 'R6', 'lo_mastered_next', {}, null)
      : decide('A0', null, 'R6', 'all_mastered');
  }
  if (!working) return decide('A0', null, 'R6', 'all_mastered');

  // R2 — dấu hiệu bị kẹt: báo giảng viên, tạm dừng đợt, cho chọn LO khác.
  if (isStuck(working, config)) {
    return decide(
      'A6',
      working,
      'R2',
      'stuck',
      {
        episodeObservations: working.episodeObservations,
        sourceViews: working.sourceViews,
        wrongSinceSource: working.wrongSinceSource,
      },
      null,
    );
  }

  // R3 — sai liên tiếp: xem lại nguồn nếu có.
  if (working.wrongSinceSource >= config.wrongStreakForSource) {
    if (working.hasSource) {
      return decide('A3', working, 'R3', 'wrong_streak', { wrongSinceSource: working.wrongSinceSource });
    }
    issues.push({ loId: working.loId, issue: 'missing_source' });
  }

  // R4 — cần thêm bằng chứng.
  if (working.hasNewItem) return decide('A1', working, 'R4', 'need_evidence');
  // Hết câu chỉ vì câu tự luận đang chờ chấm thì chờ, không coi là thiếu câu.
  if (working.awaitingGrade) return decide('WAIT', working, 'R4', 'awaiting_grade');
  issues.push({ loId: working.loId, issue: 'missing_items' });
  return decide('A6', working, 'R4', 'missing_items', {}, null);
}

/** Tối đa hai hoạt động hợp lệ khác đề xuất chính. */
function alternatives(
  active: PlannerLo[],
  continueLo: PlannerLo | null,
  chosen: { action: AgentAction; loId: string | null },
): Decision['alternatives'] {
  const out: Decision['alternatives'] = [];
  const push = (action: AgentAction, loId: string) => {
    if (out.length < 2 && !(action === chosen.action && loId === chosen.loId)) out.push({ action, loId });
  };
  if (continueLo && continueLo.loId !== chosen.loId) {
    if (continueLo.hasNewItem) push('A1', continueLo.loId);
  } else if (continueLo) {
    if (continueLo.hasNewItem) push('A1', continueLo.loId);
    if (continueLo.hasSource) push('A3', continueLo.loId);
  }
  const other = active.find(
    (lo) => lo.loId !== continueLo?.loId && lo.loId !== chosen.loId && !lo.mastered && lo.hasNewItem,
  );
  if (other) push('A5', other.loId);
  return out;
}
