-- Bước 2 của docs/ke-hoach-tich-hop-canvas.md: Canvas làm chủ bài tập. Mỗi launch
-- từ một Assignment mang các biến $Canvas.assignment.*; DA ghi lại vào resource
-- link để bài kiểm tra theo hạn, giờ mở/đóng và số lần làm của Canvas, thay vì
-- giá trị chốt lúc Deep Linking. Điểm tối đa nằm sẵn ở lti_line_items.score_maximum.
-- Chỉ thêm cột, chạy lại được (IF NOT EXISTS).
--
--   canvas_assignment_id          id Assignment trong Canvas (custom claim canvas_assignment_id)
--   assignment_due_at             hạn nộp ($Canvas.assignment.dueAt.iso8601); NULL = Canvas không đặt
--   assignment_unlock_at          giờ mở bài (unlockAt); NULL = mở ngay
--   assignment_lock_at            giờ đóng bài (lockAt); NULL = không đóng
--   assignment_allowed_attempts   số lần làm (allowedAttempts); NULL = không giới hạn
--   assignment_synced_at          lần cuối đọc cài đặt từ Canvas. NULL = chưa từng launch từ
--                                 Assignment, DA dùng cài đặt của quiz_sets như trước
--
-- Resource link cũ (đã có trên dev) giữ assignment_synced_at = NULL cho tới lần
-- launch kế tiếp, nên không cần backfill.

ALTER TABLE "lti_resource_links"
  ADD COLUMN IF NOT EXISTS "canvas_assignment_id" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "assignment_due_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "assignment_unlock_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "assignment_lock_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "assignment_allowed_attempts" INTEGER,
  ADD COLUMN IF NOT EXISTS "assignment_synced_at" TIMESTAMPTZ(6);
