-- Cho phép nguồn video 'YOUTUBE' trong micro_contents và video_assets

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'micro_contents'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%video_source%'
  LOOP
    EXECUTE format('ALTER TABLE "micro_contents" DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE "micro_contents"
  ADD CONSTRAINT "micro_contents_video_source_check"
  CHECK ("video_source" IN ('UPLOAD', 'AI', 'YOUTUBE'));

ALTER TABLE "video_assets"
  DROP CONSTRAINT IF EXISTS "video_assets_source_type_check";

ALTER TABLE "video_assets"
  ADD CONSTRAINT "video_assets_source_type_check"
  CHECK ("source_type" IN ('USER_UPLOAD', 'AI_STUDIO', 'YOUTUBE'));
