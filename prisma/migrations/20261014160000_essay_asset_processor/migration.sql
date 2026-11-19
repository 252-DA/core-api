-- Chấm bài luận nộp file qua LTI Asset Processor (Canvas gọi là Document
-- Processor). Xem docs/essay-asset-processor.md.
--
-- essay_processors   một dòng mỗi lần giảng viên gắn công cụ vào một
--                    Assignment của Canvas: đề bài và rubric dùng để chấm.
--                    Canvas giữ lại processor_id trong custom của content item
--                    và gửi kèm mỗi thông báo bài nộp.
-- essay_submissions  một dòng mỗi thông báo LtiAssetProcessorSubmissionNotice
--                    (một lần nộp × một processor). Vòng đời:
--                      RECEIVED  vừa nhận, chưa tải file
--                      QUEUED    file đã nằm trong MinIO, đã giao worker chấm
--                      GRADED    worker chấm xong, chờ gửi báo cáo về Canvas
--                      REPORTED  Canvas đã nhận báo cáo
--                      FAILED    không chấm được; reported_at ghi khi Canvas đã
--                                nhận báo cáo lỗi
--
-- lti_client_id: nhiều thành viên dùng chung DB nhưng mỗi người một tool LTI.
-- Chỉ core-api có đúng client_id mới gọi được dịch vụ của processor đó, nên
-- poller chỉ nhặt dòng của chính mình.
CREATE TABLE "essay_processors" (
  "processor_id"     UUID PRIMARY KEY DEFAULT uuidv7(),
  "course_id"        UUID NOT NULL REFERENCES "courses"("course_id") ON DELETE CASCADE,
  "lti_client_id"    VARCHAR(64) NOT NULL,
  "lms_activity_id"  VARCHAR(255),
  "title"            VARCHAR(255) NOT NULL,
  "instructions"     TEXT NOT NULL DEFAULT '',
  "rubric"           JSONB NOT NULL,
  "max_score"        NUMERIC(7, 2) NOT NULL,
  "visible_to_owner" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_by"       UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE TABLE "essay_submissions" (
  "essay_submission_id" UUID PRIMARY KEY DEFAULT uuidv7(),
  "processor_id"        UUID NOT NULL REFERENCES "essay_processors"("processor_id") ON DELETE CASCADE,
  "notice_id"           VARCHAR(255) NOT NULL UNIQUE,
  "lms_submission_id"   VARCHAR(255) NOT NULL,
  "lms_user_sub"        VARCHAR(255) NOT NULL,
  "user_id"             UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE SET NULL,
  "report_url"          TEXT NOT NULL,
  "assets"              JSONB NOT NULL,
  "status"              VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
    CHECK ("status" IN ('RECEIVED', 'QUEUED', 'GRADED', 'REPORTED', 'FAILED')),
  "error_code"          VARCHAR(50),
  "error"               TEXT,
  "attempts"            INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at"     TIMESTAMPTZ(6),
  "result"              JSONB,
  "received_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "reported_at"         TIMESTAMPTZ(6)
);

CREATE INDEX "essay_submissions_status_next_attempt_at_idx"
  ON "essay_submissions" ("status", "next_attempt_at");
CREATE INDEX "essay_submissions_lms_submission_id_idx"
  ON "essay_submissions" ("lms_submission_id");
