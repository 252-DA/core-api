-- Kho tài nguyên Video dùng chung (Video Asset Library / DAM)
-- 1. Tạo bảng video_assets
CREATE TABLE IF NOT EXISTS "video_assets" (
    "asset_id"          UUID PRIMARY KEY DEFAULT uuidv7(),
    "title"             VARCHAR(255) NOT NULL,
    "description"       TEXT,
    "tags"              TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_type"       VARCHAR(20) NOT NULL DEFAULT 'USER_UPLOAD',
    "status"            VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    "transcript_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "error_message"     TEXT,
    "object_key"        VARCHAR(512),
    "thumbnail_key"     VARCHAR(512),
    "vtt_subtitles_key" VARCHAR(512),
    "file_hash"         VARCHAR(64),
    "duration_ms"       INTEGER,
    "size_bytes"        BIGINT,
    "mime_type"         VARCHAR(100) NOT NULL DEFAULT 'video/mp4',
    "visibility"        VARCHAR(20) NOT NULL DEFAULT 'COURSE',
    "share_slug"        VARCHAR(64),
    "allow_fork"        BOOLEAN NOT NULL DEFAULT true,
    "ai_prompt"         TEXT,
    "ai_options"        JSONB,
    "ai_script"         JSONB,
    "transcript_text"   TEXT,
    "owner_id"          UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
    "course_id"         UUID REFERENCES "courses"("course_id") ON DELETE SET NULL,
    "forked_from_id"    UUID REFERENCES "video_assets"("asset_id") ON DELETE SET NULL,
    "usage_count"       INTEGER NOT NULL DEFAULT 0,
    "created_at"        TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at"        TIMESTAMPTZ(6)
);

-- 2. Đánh index tìm kiếm và phân quyền
CREATE UNIQUE INDEX IF NOT EXISTS "video_assets_share_slug_key" ON "video_assets"("share_slug");
CREATE INDEX IF NOT EXISTS "video_assets_owner_id_visibility_status_idx" ON "video_assets"("owner_id", "visibility", "status");
CREATE INDEX IF NOT EXISTS "video_assets_course_id_visibility_status_idx" ON "video_assets"("course_id", "visibility", "status");
CREATE INDEX IF NOT EXISTS "video_assets_file_hash_idx" ON "video_assets"("file_hash");

-- 3. Liên kết video_assets vào bài học micro_contents
ALTER TABLE "micro_contents" ADD COLUMN IF NOT EXISTS "video_asset_id" UUID REFERENCES "video_assets"("asset_id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "micro_contents_video_asset_id_idx" ON "micro_contents"("video_asset_id");

