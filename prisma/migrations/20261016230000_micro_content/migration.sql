-- Micro Content: video ngắn + câu hỏi củng cố (không đẩy điểm về Canvas)

CREATE TABLE "micro_contents" (
  "micro_content_id"       UUID PRIMARY KEY DEFAULT uuidv7(),
  "course_id"              UUID NOT NULL REFERENCES "courses"("course_id") ON DELETE CASCADE,
  "title"                  VARCHAR(255) NOT NULL,
  "description"            TEXT,
  "video_source"           VARCHAR(10) NOT NULL DEFAULT 'UPLOAD'
    CHECK ("video_source" IN ('UPLOAD', 'AI')),
  "video_status"           VARCHAR(20) NOT NULL DEFAULT 'NONE'
    CHECK ("video_status" IN ('NONE', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED')),
  "video_object_key"       VARCHAR(512),
  "video_mime_type"        VARCHAR(100),
  "video_size_bytes"       BIGINT,
  "video_duration_ms"      INTEGER,
  "video_error"            TEXT,
  "ai_prompt"              TEXT,
  "ai_options"             JSONB,
  "ai_script"              JSONB,
  "passing_score"          INTEGER NOT NULL DEFAULT 70
    CHECK ("passing_score" BETWEEN 0 AND 100),
  "required_watch_percent" INTEGER NOT NULL DEFAULT 90
    CHECK ("required_watch_percent" BETWEEN 0 AND 100),
  "status"                 VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK ("status" IN ('DRAFT', 'PUBLISHED')),
  "created_by"             UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "created_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"             TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"             TIMESTAMPTZ(6)
);

CREATE INDEX "micro_contents_course_id_deleted_at_idx"
  ON "micro_contents" ("course_id", "deleted_at");

CREATE TABLE "micro_content_questions" (
  "question_id"      UUID PRIMARY KEY DEFAULT uuidv7(),
  "micro_content_id" UUID NOT NULL REFERENCES "micro_contents"("micro_content_id") ON DELETE CASCADE,
  "position"         INTEGER NOT NULL,
  "type"             VARCHAR(50) NOT NULL,
  "question"         TEXT NOT NULL,
  "options"          JSONB,
  "correct_answer"   JSONB,
  "explanation"      TEXT,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"       TIMESTAMPTZ(6)
);

CREATE INDEX "micro_content_questions_micro_content_id_deleted_at_idx"
  ON "micro_content_questions" ("micro_content_id", "deleted_at");

CREATE TABLE "micro_content_progress" (
  "micro_content_id" UUID NOT NULL REFERENCES "micro_contents"("micro_content_id") ON DELETE CASCADE,
  "user_id"          UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE CASCADE,
  "max_position_ms"  INTEGER NOT NULL DEFAULT 0,
  "watched_ms"       INTEGER NOT NULL DEFAULT 0,
  "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("micro_content_id", "user_id")
);

CREATE TABLE "micro_content_attempts" (
  "attempt_id"       UUID PRIMARY KEY DEFAULT uuidv7(),
  "micro_content_id" UUID NOT NULL REFERENCES "micro_contents"("micro_content_id") ON DELETE CASCADE,
  "user_id"          UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE CASCADE,
  "score"            INTEGER NOT NULL DEFAULT 0,
  "passed"           BOOLEAN NOT NULL DEFAULT FALSE,
  "grading_status"   VARCHAR(20) NOT NULL DEFAULT 'GRADED'
    CHECK ("grading_status" IN ('GRADED', 'PENDING', 'NEEDS_REVIEW')),
  "submitted_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "micro_content_attempts_micro_content_id_user_id_idx"
  ON "micro_content_attempts" ("micro_content_id", "user_id");

CREATE TABLE "micro_content_answers" (
  "answer_id"      UUID PRIMARY KEY DEFAULT uuidv7(),
  "attempt_id"     UUID NOT NULL REFERENCES "micro_content_attempts"("attempt_id") ON DELETE CASCADE,
  "question_id"    UUID NOT NULL REFERENCES "micro_content_questions"("question_id") ON DELETE RESTRICT,
  "chosen_answer"  JSONB,
  "score"          INTEGER NOT NULL DEFAULT 0,
  "is_correct"     BOOLEAN NOT NULL DEFAULT FALSE,
  "grading_status" VARCHAR(20) NOT NULL DEFAULT 'GRADED'
    CHECK ("grading_status" IN ('GRADED', 'PENDING', 'NEEDS_REVIEW')),
  "grading_input"  JSONB,
  "feedback"       TEXT,
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "micro_content_answers_attempt_id_idx"
  ON "micro_content_answers" ("attempt_id");

