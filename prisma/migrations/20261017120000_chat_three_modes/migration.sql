-- Chatbot với ba chế độ truy xuất (docs/chatbot-ba-che-do-ke-hoach.md).
--
-- chat_settings         cài đặt chatbot toàn hệ thống, dạng khóa–giá trị. Khóa
--                       'retrieval_mode' nhận 'vector' | 'tools' | 'graph'; không
--                       có dòng nào = 'vector'. Chỉ admin LMS ghi (qua core-api).
-- chat_runs             mỗi lượt hỏi đáp một dòng: chế độ, câu hỏi, câu trả lời,
--                       trích dẫn, vết gọi công cụ, token, độ trễ, đánh giá của
--                       người dùng. Đây là nguồn số liệu báo cáo; source='eval'
--                       là lượt chạy từ script đánh giá.
-- knowledge_relations   đồ thị quan hệ giữa các ý, trích từ chunk bằng LLM và chỉ
--                       giữ quan hệ có evidence_quote là chuỗi con của chunk.
--                       Mỗi dòng là một cạnh (source_key) -[relation_type]->
--                       (target_key); *_key là nhãn đã bỏ dấu, hạ chữ thường để
--                       nối cạnh thành đồ thị.
--
-- content_generation_requests.type nhận thêm 'relations' để dựng đồ thị quan hệ
-- qua đúng đường request → outbox → hàng đợi content_generation đã có.

CREATE TABLE "chat_settings" (
  "key"        VARCHAR(50) PRIMARY KEY,
  "value"      VARCHAR(50) NOT NULL,
  "updated_by" UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "chat_runs" (
  "run_id"        UUID PRIMARY KEY DEFAULT uuidv7(),
  "course_id"     UUID REFERENCES "courses"("course_id") ON DELETE SET NULL,
  "user_id"       UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE SET NULL,
  "mode"          VARCHAR(10) NOT NULL CHECK ("mode" IN ('vector', 'tools', 'graph')),
  "source"        VARCHAR(10) NOT NULL DEFAULT 'web' CHECK ("source" IN ('web', 'eval')),
  "question_type" VARCHAR(20),
  "question"      TEXT NOT NULL,
  "answer"        TEXT,
  "citations"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "tool_calls"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "model"         VARCHAR(100),
  "steps"         INTEGER NOT NULL DEFAULT 0,
  "input_tokens"  INTEGER,
  "output_tokens" INTEGER,
  "latency_ms"    INTEGER,
  "status"        VARCHAR(10) NOT NULL DEFAULT 'OK' CHECK ("status" IN ('OK', 'ERROR')),
  "error"         TEXT,
  "rating"        SMALLINT CHECK ("rating" IN (-1, 1)),
  "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "chat_runs_mode_created_at_idx" ON "chat_runs" ("mode", "created_at");
CREATE INDEX "chat_runs_course_id_created_at_idx" ON "chat_runs" ("course_id", "created_at");

CREATE TABLE "knowledge_relations" (
  "relation_id"        UUID PRIMARY KEY DEFAULT uuidv7(),
  "course_id"          UUID NOT NULL REFERENCES "courses"("course_id") ON DELETE CASCADE,
  "document_id"        UUID NOT NULL REFERENCES "documents"("document_id") ON DELETE CASCADE,
  "chunk_id"           UUID NOT NULL REFERENCES "chunks"("chunk_id") ON DELETE CASCADE,
  "source_label"       VARCHAR(255) NOT NULL,
  "source_key"         VARCHAR(255) NOT NULL,
  "relation_type"      VARCHAR(20) NOT NULL
    CHECK ("relation_type" IN ('cause', 'part_of', 'contrast', 'prerequisite', 'example_of', 'defines', 'related')),
  "target_label"       VARCHAR(255) NOT NULL,
  "target_key"         VARCHAR(255) NOT NULL,
  "evidence_quote"     TEXT NOT NULL,
  "page_number"        INTEGER,
  "extraction_version" VARCHAR(30) NOT NULL,
  "model"              VARCHAR(100),
  "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  UNIQUE ("chunk_id", "source_key", "relation_type", "target_key", "extraction_version")
);
CREATE INDEX "knowledge_relations_course_source_idx" ON "knowledge_relations" ("course_id", "source_key");
CREATE INDEX "knowledge_relations_course_target_idx" ON "knowledge_relations" ("course_id", "target_key");
CREATE INDEX "knowledge_relations_chunk_id_idx" ON "knowledge_relations" ("chunk_id");
CREATE INDEX "knowledge_relations_document_id_idx" ON "knowledge_relations" ("document_id");

ALTER TABLE "content_generation_requests"
  DROP CONSTRAINT IF EXISTS "content_generation_requests_type_check";
ALTER TABLE "content_generation_requests"
  ADD CONSTRAINT "content_generation_requests_type_check"
  CHECK ("type" IN ('card', 'quiz', 'relations'));
