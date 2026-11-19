-- Hội thoại nhiều lượt của chatbot theo từng người học và khóa học.
-- Mỗi lượt hỏi đáp trong chat_runs gắn vào một hội thoại qua conversation_id;
-- các lượt chạy từ script đánh giá (source = 'eval') để conversation_id = NULL.

CREATE TABLE "chat_conversations" (
  "conversation_id" UUID PRIMARY KEY DEFAULT uuidv7(),
  "course_id"       UUID NOT NULL REFERENCES "courses"("course_id") ON DELETE CASCADE,
  "user_id"         UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE CASCADE,
  "title"           VARCHAR(200) NOT NULL,
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"      TIMESTAMPTZ(6)
);

CREATE INDEX "chat_conversations_user_course_updated_idx"
  ON "chat_conversations" ("user_id", "course_id", "updated_at" DESC)
  WHERE "deleted_at" IS NULL;

ALTER TABLE "chat_runs"
  ADD COLUMN "conversation_id" UUID REFERENCES "chat_conversations"("conversation_id") ON DELETE SET NULL;

CREATE INDEX "chat_runs_conversation_created_at_idx"
  ON "chat_runs" ("conversation_id", "created_at");

