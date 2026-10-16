-- Chọn model cho từng task trên web, không cần restart worker.
--
--   task     khoá task trong catalog của ai-sdk (quiz_generation,
--            quiz_verification, enrichment), trùng llm_usage_logs.use_case.
--   profile  TÊN profile trong catalog, không phải model id; core-api chỉ nhận
--            tên có trong contracts/proto/llm_model_catalog.json. API key không
--            bao giờ nằm ở đây.
--
-- Worker đọc bảng này mỗi 30 giây và ưu tiên nó hơn LLM_PROFILE__<TASK>. Bảng
-- rỗng = mọi task chạy như trước migration. Mỗi lần đổi ghi một dòng
-- review_audit_logs (entity_type 'llm_model_binding').
CREATE TABLE "llm_model_bindings" (
  "task"       VARCHAR(50) PRIMARY KEY,
  "profile"    VARCHAR(50) NOT NULL,
  "updated_by" UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
