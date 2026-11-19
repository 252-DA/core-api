/**
 * Cài đặt Assignment Canvas gửi trong custom claim của mỗi launch từ một bài tập
 * (scripts/setup_canvas_lti.rb khai các biến $Canvas.assignment.*).
 *
 * Canvas để nguyên chuỗi biến ("$Canvas.assignment.dueAt.iso8601") khi không có
 * giá trị: launch không đi từ Assignment, hoặc Assignment không đặt hạn/giờ mở/
 * giờ đóng. Vì vậy chuỗi bắt đầu bằng "$" nghĩa là "không có", và chỉ launch có
 * `canvas_assignment_id` là số mới đại diện cho một Assignment (khi đó "không có"
 * là giá trị thật: Canvas không đặt hạn).
 */
export interface CanvasAssignmentSettings {
  canvasAssignmentId: string;
  /** Điểm tối đa; null khi Canvas không gửi giá trị dùng được (0, âm, quá lớn). */
  pointsPossible: number | null;
  dueAt: Date | null;
  unlockAt: Date | null;
  lockAt: Date | null;
  /** null = không giới hạn số lần làm. */
  allowedAttempts: number | null;
}

/** Cột lti_line_items.score_maximum là DECIMAL(7,2). */
const MAX_POINTS = 99_999.99;
const MAX_ATTEMPTS = 1000;

function present(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value).trim();
  return text && !text.startsWith('$') ? text : undefined;
}

function dateOf(value: unknown): Date | null {
  const text = present(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Canvas lưu số lần làm là NULL hoặc -1 khi không giới hạn; các giá trị không
 * dương hoặc không phải số nguyên đều coi là không giới hạn để không khóa nhầm
 * sinh viên.
 */
function attemptsOf(value: unknown): number | null {
  const text = present(value);
  if (!text) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_ATTEMPTS) : null;
}

function pointsOf(value: unknown): number | null {
  const text = present(value);
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 && n <= MAX_POINTS
    ? Math.round(n * 100) / 100
    : null;
}

/**
 * Trả null khi launch không đến từ một Assignment (không có canvas_assignment_id
 * dạng số): khi đó không được đụng vào cài đặt đã lưu.
 */
export function assignmentSettingsFromClaims(
  claims: Record<string, unknown> | null | undefined,
): CanvasAssignmentSettings | null {
  const id = present(claims?.canvas_assignment_id);
  if (!id || !/^[1-9]\d{0,31}$/.test(id)) return null;
  return {
    canvasAssignmentId: id,
    pointsPossible: pointsOf(claims?.assignment_points),
    dueAt: dateOf(claims?.assignment_due),
    unlockAt: dateOf(claims?.assignment_unlock),
    lockAt: dateOf(claims?.assignment_lock),
    allowedAttempts: attemptsOf(claims?.assignment_attempts),
  };
}
