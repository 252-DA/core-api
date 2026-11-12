-- Bước 1 của docs/ke-hoach-tich-hop-canvas.md: DA biết cả lớp, không chỉ người
-- đã mở DA. Chỉ thêm cột/chỉ mục, chạy lại được (IF NOT EXISTS).
--
--   lms_user_mappings.lms_platform_user_id        id người dùng trong Canvas (custom claim canvas_user_id)
--   lms_course_ref.lms_platform_course_id         id khóa học trong Canvas (custom claim canvas_course_id)
--   lms_course_ref.nrps_context_memberships_url   URL NRPS Canvas gửi trong claim namesroleservice
--   lms_course_ref.nrps_synced_at                 lần đồng bộ danh sách lớp thành công gần nhất
--   course_memberships.source                     launch (sinh viên mở DA) | nrps (đọc từ danh sách lớp Canvas)
--   course_memberships.status                     active | inactive (Inactive ở NRPS, hoặc không còn trong danh sách)
--   course_memberships.updated_at                 lần ghi gần nhất của dòng
--   canvas_sync_runs.kind                         documents | roster
--
-- Khóa chính của course_memberships giữ nguyên (user_id, course_id, role).

ALTER TABLE "lms_user_mappings"
  ADD COLUMN IF NOT EXISTS "lms_platform_user_id" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "idx_lms_user_mappings_platform_user"
  ON "lms_user_mappings" ("lms_type", "lms_platform_user_id");

ALTER TABLE "lms_course_ref"
  ADD COLUMN IF NOT EXISTS "lms_platform_course_id" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "nrps_context_memberships_url" TEXT,
  ADD COLUMN IF NOT EXISTS "nrps_synced_at" TIMESTAMPTZ(6);

ALTER TABLE "course_memberships"
  ADD COLUMN IF NOT EXISTS "source" VARCHAR(20) NOT NULL DEFAULT 'launch',
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) DEFAULT now();

CREATE INDEX IF NOT EXISTS "idx_course_memberships_course_status"
  ON "course_memberships" ("course_id", "role", "status");

ALTER TABLE "canvas_sync_runs"
  ADD COLUMN IF NOT EXISTS "kind" VARCHAR(20) NOT NULL DEFAULT 'documents';
