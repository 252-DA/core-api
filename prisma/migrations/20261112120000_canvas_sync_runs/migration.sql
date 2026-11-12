-- Lịch sử các lần đồng bộ tài liệu từ Canvas, để trang quản lý tài liệu hiện
-- "Đồng bộ lần cuối" và lỗi gần nhất thay vì chỉ ghi log. CanvasSyncProcessor
-- ghi một dòng khi job bắt đầu và đóng dòng đó khi job xong hoặc hết lượt thử.
--
--   trigger  launch (giảng viên mở DA từ Canvas) | sweep (quét định kỳ) | manual (nút "Đồng bộ từ Canvas")
--   status   running | success | error
--   summary  kết quả CanvasDocumentSyncService.syncCourse khi success
--   error    thông báo tiếng Việt cho giảng viên khi error
--
-- Chỉ thêm bảng mới, chạy lại được.

CREATE TABLE IF NOT EXISTS "canvas_sync_runs" (
  "run_id"      UUID           NOT NULL DEFAULT uuidv7(),
  "course_id"   UUID           NOT NULL,
  "trigger"     VARCHAR(20)    NOT NULL,
  "started_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "finished_at" TIMESTAMPTZ(6),
  "status"      VARCHAR(20)    NOT NULL,
  "summary"     JSONB,
  "error"       TEXT,
  CONSTRAINT "canvas_sync_runs_pkey" PRIMARY KEY ("run_id"),
  CONSTRAINT "canvas_sync_runs_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "canvas_sync_runs_trigger_check" CHECK ("trigger" IN ('launch', 'sweep', 'manual')),
  CONSTRAINT "canvas_sync_runs_status_check" CHECK ("status" IN ('running', 'success', 'error'))
);

CREATE INDEX IF NOT EXISTS "idx_canvas_sync_runs_course"
  ON "canvas_sync_runs" ("course_id", "started_at" DESC);
