-- Giai đoạn B (§4 docs/ke-hoach-video-micro-content.md):
--   1. Gắn micro_contents với tài liệu nguồn, dải trang, LO chính, thứ tự và
--      trạng thái sinh kịch bản bất đồng bộ.
--   2. Lưu timeline từng cảnh (scene_timeline) trong video_assets để player nhảy cảnh.
--   3. Mở rộng CHECK content_generation_requests.type cho micro_outline,
--      video_script, micro_quiz.
--   4. Mở rộng CHECK lti_resource_links.target_kind cho micro_content để mở từ
--      Canvas không bị DB chặn.

ALTER TABLE "micro_contents"
  ADD COLUMN IF NOT EXISTS "source_document_id" UUID,
  ADD COLUMN IF NOT EXISTS "source_page_from" INTEGER,
  ADD COLUMN IF NOT EXISTS "source_page_to" INTEGER,
  ADD COLUMN IF NOT EXISTS "lo_id" UUID,
  ADD COLUMN IF NOT EXISTS "position" INTEGER,
  ADD COLUMN IF NOT EXISTS "script_status" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "script_request_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'micro_contents_source_document_id_fkey'
  ) THEN
    ALTER TABLE "micro_contents"
      ADD CONSTRAINT "micro_contents_source_document_id_fkey"
      FOREIGN KEY ("source_document_id") REFERENCES "documents"("document_id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'micro_contents_lo_id_fkey'
  ) THEN
    ALTER TABLE "micro_contents"
      ADD CONSTRAINT "micro_contents_lo_id_fkey"
      FOREIGN KEY ("lo_id") REFERENCES "learning_outcomes"("lo_id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

ALTER TABLE "micro_contents" DROP CONSTRAINT IF EXISTS "micro_contents_source_pages_check";
ALTER TABLE "micro_contents" ADD CONSTRAINT "micro_contents_source_pages_check" CHECK (
  ("source_page_from" IS NULL OR "source_page_from" >= 1)
  AND ("source_page_to" IS NULL OR "source_page_to" >= 1)
  AND ("source_page_from" IS NULL OR "source_page_to" IS NULL OR "source_page_to" >= "source_page_from")
) NOT VALID;
ALTER TABLE "micro_contents" VALIDATE CONSTRAINT "micro_contents_source_pages_check";

ALTER TABLE "micro_contents" DROP CONSTRAINT IF EXISTS "micro_contents_script_status_check";
ALTER TABLE "micro_contents" ADD CONSTRAINT "micro_contents_script_status_check" CHECK (
  "script_status" IS NULL OR "script_status" IN ('NONE', 'GENERATING', 'READY', 'FAILED')
) NOT VALID;
ALTER TABLE "micro_contents" VALIDATE CONSTRAINT "micro_contents_script_status_check";

CREATE INDEX IF NOT EXISTS "idx_micro_contents_source_document"
  ON "micro_contents"("source_document_id");
CREATE INDEX IF NOT EXISTS "idx_micro_contents_lo"
  ON "micro_contents"("lo_id");

ALTER TABLE "video_assets"
  ADD COLUMN IF NOT EXISTS "scene_timeline" JSONB;

ALTER TABLE "content_generation_requests"
  DROP CONSTRAINT IF EXISTS "content_generation_requests_type_check";
ALTER TABLE "content_generation_requests"
  ADD CONSTRAINT "content_generation_requests_type_check"
  CHECK ("type" IN ('quiz', 'card', 'relations', 'micro_outline', 'video_script', 'micro_quiz'));

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'lti_resource_links'::regclass
      AND c.contype = 'c'
      AND a.attname = 'target_kind'
  LOOP
    EXECUTE format('ALTER TABLE "lti_resource_links" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE "lti_resource_links"
  ADD CONSTRAINT "lti_resource_links_target_kind_check"
  CHECK ("target_kind" IN ('lesson', 'card', 'quiz_set', 'chat', 'video', 'micro_content'));
