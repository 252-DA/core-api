-- Chế độ Kiểm tra cho quiz set: giới hạn lượt, thời gian, khung giờ mở bài và
-- ẩn đáp án tới khi đóng bài. Chế độ Luyện tập giữ hành vi cũ (mặc định).
ALTER TABLE "quiz_sets"
  ADD COLUMN "mode" VARCHAR(20) NOT NULL DEFAULT 'practice',
  ADD COLUMN "points_possible" DECIMAL(7,2) NOT NULL DEFAULT 100,
  ADD COLUMN "max_attempts" INTEGER,
  ADD COLUMN "time_limit_minutes" INTEGER,
  ADD COLUMN "shuffle" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "available_from" TIMESTAMPTZ(6),
  ADD COLUMN "available_until" TIMESTAMPTZ(6),
  ADD COLUMN "due_at" TIMESTAMPTZ(6),
  ADD CONSTRAINT "quiz_sets_mode_check" CHECK ("mode" IN ('practice', 'exam')),
  ADD CONSTRAINT "quiz_sets_points_possible_check" CHECK ("points_possible" > 0 AND "points_possible" <= 1000),
  ADD CONSTRAINT "quiz_sets_max_attempts_check" CHECK ("max_attempts" IS NULL OR "max_attempts" BETWEEN 1 AND 20),
  ADD CONSTRAINT "quiz_sets_time_limit_check" CHECK ("time_limit_minutes" IS NULL OR "time_limit_minutes" BETWEEN 1 AND 600),
  ADD CONSTRAINT "quiz_sets_window_check" CHECK ("available_from" IS NULL OR "available_until" IS NULL OR "available_from" < "available_until"),
  -- Bài kiểm tra phải có hạn nộp: đáp án chỉ mở cho sinh viên sau khi đóng bài.
  ADD CONSTRAINT "quiz_sets_exam_due_check" CHECK ("mode" <> 'exam' OR "due_at" IS NOT NULL);

-- Một phiên = một lượt làm bài kiểm tra. Bấm "Bắt đầu" là đã dùng lượt; phiên
-- giữ thứ tự câu/phương án đã xáo và mốc hết giờ do server tính.
CREATE TABLE "quiz_set_sessions" (
  "session_id" UUID NOT NULL DEFAULT uuidv7(),
  "quiz_set_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "resource_link_id" UUID NOT NULL,
  "item_order" JSONB NOT NULL,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6),
  "ended_at" TIMESTAMPTZ(6),
  "submission_id" UUID,
  CONSTRAINT "quiz_set_sessions_pkey" PRIMARY KEY ("session_id"),
  CONSTRAINT "quiz_set_sessions_quiz_set_id_fkey" FOREIGN KEY ("quiz_set_id") REFERENCES "quiz_sets"("quiz_set_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "quiz_set_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "quiz_set_sessions_resource_link_id_fkey" FOREIGN KEY ("resource_link_id") REFERENCES "lti_resource_links"("resource_link_id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
CREATE INDEX "quiz_set_sessions_quiz_set_id_user_id_idx" ON "quiz_set_sessions"("quiz_set_id", "user_id");
-- Mỗi sinh viên chỉ có một phiên đang mở trên một bài tập.
CREATE UNIQUE INDEX "quiz_set_sessions_open_key" ON "quiz_set_sessions"("quiz_set_id", "user_id", "resource_link_id") WHERE "ended_at" IS NULL;
