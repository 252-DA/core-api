CREATE TABLE "quiz_sets" (
  "quiz_set_id" UUID NOT NULL DEFAULT uuidv7(),
  "course_id" UUID NOT NULL,
  "chapter_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "items" JSONB NOT NULL,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "quiz_sets_pkey" PRIMARY KEY ("quiz_set_id"),
  CONSTRAINT "quiz_sets_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT "quiz_sets_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("chapter_id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
CREATE INDEX "quiz_sets_course_id_chapter_id_idx" ON "quiz_sets"("course_id", "chapter_id");
ALTER TABLE "quiz_attempts" ADD COLUMN "submission_id" UUID;
CREATE INDEX "quiz_attempts_submission_id_idx" ON "quiz_attempts"("submission_id");
