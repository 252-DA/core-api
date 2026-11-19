-- Ngân hàng câu hỏi (docs/question-bank-design.md §5, §6.4, §11;
-- docs/ke-hoach-trien-khai-question-bank.md §3, §4 P1).
--
-- Mỗi câu trong quiz_items thuộc đúng một ngân hàng. Câu nào ghi vào mà chưa
-- chỉ định ngân hàng thì trigger tự gán ngân hàng mặc định của khoá, nên mọi
-- chỗ ghi câu AI hay cũ không phải tự tìm ngân hàng.
-- Mỗi lần nội dung câu đổi (kể cả lúc tạo) thì trigger AFTER ghi một dòng
-- quiz_item_versions bất biến; chi tiết vì sao là AFTER ở mục 5.

-- 1. Mã môn tách khỏi mã khoá ----------------------------------------------
-- courses.code là UNIQUE và trước đây bị import đề cương ghi đè thành mã môn,
-- nên hai lớp Canvas cùng môn không thể cùng tồn tại. Mã môn nay nằm ở cột riêng.
ALTER TABLE "courses" ADD COLUMN "subject_code" VARCHAR(50);
CREATE INDEX "idx_courses_subject_code" ON "courses" ("subject_code") WHERE "deleted_at" IS NULL;

-- Backfill mã môn cho các khoá thật đã nạp LO; loại trừ mã do LTI tạo (LMS-...),
-- khoá kiểu canvas* và khoá thử nghiệm essay-smoke-*.
UPDATE "courses" c
SET "subject_code" = c."code"
WHERE c."subject_code" IS NULL
  AND c."code" NOT LIKE 'LMS-%'
  AND c."code" NOT ILIKE 'canvas%'
  AND c."code" NOT LIKE 'essay-smoke-%'
  AND EXISTS (
    SELECT 1 FROM "learning_outcomes" lo
    WHERE lo."course_id" = c."course_id" AND lo."deleted_at" IS NULL
  );

-- 2. Ngân hàng và chia sẻ ----------------------------------------------------
CREATE TABLE "question_banks" (
  "bank_id"           UUID PRIMARY KEY DEFAULT uuidv7(),
  "title"             VARCHAR(255) NOT NULL,
  "description"       TEXT,
  -- NULL: ngân hàng mặc định của khoá, mọi instructor của khoá cùng quản lý.
  "owner_id"          UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "home_course_id"    UUID NOT NULL REFERENCES "courses"("course_id") ON DELETE RESTRICT,
  "subject_code"      VARCHAR(50),
  "visibility"        VARCHAR(20) NOT NULL DEFAULT 'COURSE'
                      CHECK ("visibility" IN ('PRIVATE', 'COURSE', 'SUBJECT')),
  "is_course_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deleted_at"        TIMESTAMPTZ(6)
);
CREATE UNIQUE INDEX "uq_question_bank_course_default"
  ON "question_banks" ("home_course_id") WHERE "is_course_default" AND "deleted_at" IS NULL;
CREATE INDEX "idx_question_banks_course" ON "question_banks" ("home_course_id") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_question_banks_subject" ON "question_banks" ("subject_code")
  WHERE "visibility" = 'SUBJECT' AND "deleted_at" IS NULL;

CREATE TABLE "question_bank_shares" (
  "bank_id"      UUID NOT NULL REFERENCES "question_banks"("bank_id") ON DELETE CASCADE,
  "grantee_type" VARCHAR(10) NOT NULL CHECK ("grantee_type" IN ('USER', 'COURSE')),
  "grantee_id"   UUID NOT NULL,
  "role"         VARCHAR(10) NOT NULL CHECK ("role" IN ('VIEW', 'USE', 'EDIT')),
  "granted_by"   UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("bank_id", "grantee_type", "grantee_id")
);
CREATE INDEX "idx_question_bank_shares_grantee" ON "question_bank_shares" ("grantee_type", "grantee_id");

-- Lấy (hoặc tạo) ngân hàng mặc định của một khoá. Dùng chung cho trigger và
-- core-api; an toàn khi hai phiên cùng tạo nhờ chỉ mục unique ở trên.
CREATE FUNCTION ensure_default_question_bank(p_course_id UUID) RETURNS UUID AS $$
DECLARE
  b UUID;
BEGIN
  SELECT "bank_id" INTO b FROM "question_banks"
  WHERE "home_course_id" = p_course_id AND "is_course_default" AND "deleted_at" IS NULL;
  IF b IS NOT NULL THEN
    RETURN b;
  END IF;

  INSERT INTO "question_banks" ("title", "home_course_id", "subject_code", "visibility", "is_course_default")
  SELECT LEFT('Ngân hàng chung · ' || COALESCE(c."subject_code", c."name"), 255),
         c."course_id", c."subject_code", 'COURSE', true
  FROM "courses" c
  WHERE c."course_id" = p_course_id
  ON CONFLICT ("home_course_id") WHERE "is_course_default" AND "deleted_at" IS NULL DO NOTHING
  RETURNING "bank_id" INTO b;

  IF b IS NULL THEN
    SELECT "bank_id" INTO b FROM "question_banks"
    WHERE "home_course_id" = p_course_id AND "is_course_default" AND "deleted_at" IS NULL;
  END IF;
  RETURN b;
END;
$$ LANGUAGE plpgsql;

-- 3. Câu hỏi: nguồn gốc, tác giả, phiên bản ---------------------------------
CREATE TABLE "quiz_item_versions" (
  "version_id"       UUID PRIMARY KEY DEFAULT uuidv7(),
  "quiz_id"          UUID NOT NULL REFERENCES "quiz_items"("quiz_id") ON DELETE RESTRICT,
  "version_no"       INTEGER NOT NULL,
  "type"             VARCHAR(30) NOT NULL,
  "question"         TEXT NOT NULL,
  "options"          JSONB,
  "correct_answer"   JSONB NOT NULL,
  "explanation"      TEXT,
  "lo_id"            UUID,
  "bloom_level"      INTEGER,
  "source_chunk_ids" UUID[] NOT NULL DEFAULT '{}',
  -- AI: {writer_model, judge_model, judge_is_writer} hoặc {model_id};
  -- người sửa: {} ; nhập từ LMS: {lms, ext_bank_id, ext_question_id}.
  "provenance"       JSONB NOT NULL DEFAULT '{}',
  -- NULL: do hệ thống/AI ghi.
  "created_by"       UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "uq_quiz_item_version_no" UNIQUE ("quiz_id", "version_no")
);

ALTER TABLE "quiz_items"
  ADD COLUMN "bank_id"                UUID REFERENCES "question_banks"("bank_id") ON DELETE RESTRICT,
  ADD COLUMN "origin"                 VARCHAR(20) NOT NULL DEFAULT 'AI_GENERATED'
             CHECK ("origin" IN ('AI_GENERATED', 'MANUAL', 'CANVAS_IMPORT', 'FORK')),
  ADD COLUMN "author_id"              UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  ADD COLUMN "updated_by"             UUID REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  ADD COLUMN "generation_request_id"  UUID REFERENCES "content_generation_requests"("request_id") ON DELETE SET NULL,
  ADD COLUMN "provenance"             JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "forked_from_version_id" UUID REFERENCES "quiz_item_versions"("version_id") ON DELETE SET NULL,
  ADD COLUMN "current_version_id"     UUID REFERENCES "quiz_item_versions"("version_id") ON DELETE SET NULL,
  ADD COLUMN "bloom_assessed"         INTEGER,
  ALTER COLUMN "lesson_id" DROP NOT NULL;

-- RETIRED: câu ngừng dùng, ẩn khỏi ngân hàng và trang soạn đề; đề đã giao vẫn
-- chạy nhờ snapshot. Giữ đúng tập trạng thái của 20261107120000 + RETIRED.
ALTER TABLE "quiz_items" DROP CONSTRAINT "quiz_items_status_check";
ALTER TABLE "quiz_items" ADD CONSTRAINT "quiz_items_status_check" CHECK ("status" IN (
  'GENERATED_DRAFT', 'REVIEWING', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'RETIRED'
));

CREATE INDEX "idx_quiz_items_bank" ON "quiz_items" ("bank_id", "status") WHERE "deleted_at" IS NULL;
CREATE INDEX "idx_quiz_items_generation_request" ON "quiz_items" ("generation_request_id");

ALTER TABLE "quiz_attempts"
  ADD COLUMN "quiz_version_id" UUID REFERENCES "quiz_item_versions"("version_id") ON DELETE SET NULL;

ALTER TABLE "content_generation_requests"
  ADD COLUMN "quiz_ids" UUID[] NOT NULL DEFAULT '{}';

-- 4. Liên kết với LMS và job đồng bộ ----------------------------------------
CREATE TABLE "question_lms_links" (
  "link_id"          UUID PRIMARY KEY DEFAULT uuidv7(),
  "quiz_id"          UUID NOT NULL REFERENCES "quiz_items"("quiz_id") ON DELETE CASCADE,
  "version_id"       UUID NOT NULL REFERENCES "quiz_item_versions"("version_id") ON DELETE RESTRICT,
  "direction"        VARCHAR(10) NOT NULL CHECK ("direction" IN ('EXPORT', 'IMPORT')),
  "lms_type"         VARCHAR(20) NOT NULL DEFAULT 'canvas',
  "lms_base_url"     VARCHAR(255) NOT NULL,
  "lms_context_type" VARCHAR(10) NOT NULL CHECK ("lms_context_type" IN ('course', 'account')),
  "lms_context_id"   VARCHAR(64) NOT NULL,
  "ext_bank_id"      VARCHAR(64),
  "ext_bank_title"   VARCHAR(255),
  "ext_question_id"  VARCHAR(64),
  "migration_id"     VARCHAR(255),
  "synced_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "uq_question_lms_link" UNIQUE ("quiz_id", "direction", "lms_base_url", "lms_context_type", "lms_context_id")
);
CREATE INDEX "idx_question_lms_links_ext" ON "question_lms_links" ("lms_base_url", "ext_question_id");

CREATE TABLE "question_bank_sync_jobs" (
  "job_id"            UUID PRIMARY KEY DEFAULT uuidv7(),
  "bank_id"           UUID NOT NULL REFERENCES "question_banks"("bank_id") ON DELETE CASCADE,
  "direction"         VARCHAR(10) NOT NULL CHECK ("direction" IN ('EXPORT', 'IMPORT')),
  "requested_by"      UUID NOT NULL REFERENCES "lms_user_mappings"("internal_user_id") ON DELETE RESTRICT,
  "target"            JSONB NOT NULL,
  "status"            VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                      CHECK ("status" IN ('QUEUED', 'RUNNING', 'WAITING_LMS', 'COMPLETED', 'FAILED')),
  "lms_migration_ids" JSONB NOT NULL DEFAULT '[]',
  "counts"            JSONB NOT NULL DEFAULT '{}',
  "report"            JSONB NOT NULL DEFAULT '[]',
  "last_error"        TEXT,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX "idx_question_bank_sync_jobs_bank" ON "question_bank_sync_jobs" ("bank_id", "created_at" DESC);

-- 5. Trigger -----------------------------------------------------------------
-- BEFORE INSERT: gán ngân hàng mặc định khi bank_id NULL và đánh dấu câu trùng
-- nguyên văn trong cùng ngân hàng (chỉ đánh dấu, không chặn).
CREATE FUNCTION quiz_items_before_insert() RETURNS trigger AS $$
DECLARE
  dup UUID;
BEGIN
  IF NEW."bank_id" IS NULL THEN
    NEW."bank_id" := ensure_default_question_bank(NEW."course_id");
  END IF;

  SELECT q."quiz_id" INTO dup FROM "quiz_items" q
  WHERE q."bank_id" = NEW."bank_id"
    AND q."quiz_id" <> NEW."quiz_id"
    AND q."deleted_at" IS NULL
    AND lower(btrim(q."question")) = lower(btrim(NEW."question"))
  LIMIT 1;
  IF dup IS NOT NULL THEN
    NEW."provenance" := COALESCE(NEW."provenance", '{}'::jsonb) || jsonb_build_object('duplicate_of', dup);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_quiz_items_before_insert"
  BEFORE INSERT ON "quiz_items"
  FOR EACH ROW EXECUTE FUNCTION quiz_items_before_insert();

-- AFTER INSERT/UPDATE: ghi phiên bản khi nội dung đổi.
-- Phải là AFTER: chỗ ghi dùng INSERT ... ON CONFLICT DO UPDATE ... WHERE
-- status = 'GENERATED_DRAFT'. Trigger BEFORE INSERT vẫn chạy cho dòng đề xuất
-- trước khi Postgres phát hiện xung đột, nên lần retry hay lần ghi bị mệnh đề
-- WHERE chặn sẽ đẻ ra phiên bản không có thật. AFTER chỉ chạy cho thao tác
-- thực sự xảy ra. Lệnh UPDATE current_version_id bên dưới gọi lại trigger nhưng
-- dừng ngay ở nhánh "nội dung không đổi".
CREATE FUNCTION quiz_items_write_version() RETURNS trigger AS $$
DECLARE
  v UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND
     (NEW."type", NEW."question", NEW."options", NEW."correct_answer", NEW."explanation",
      NEW."lo_id", NEW."bloom_level", NEW."source_chunk_ids")
     IS NOT DISTINCT FROM
     (OLD."type", OLD."question", OLD."options", OLD."correct_answer", OLD."explanation",
      OLD."lo_id", OLD."bloom_level", OLD."source_chunk_ids") THEN
    RETURN NULL;
  END IF;

  INSERT INTO "quiz_item_versions" (
    "quiz_id", "version_no", "type", "question", "options", "correct_answer",
    "explanation", "lo_id", "bloom_level", "source_chunk_ids", "provenance", "created_by"
  )
  SELECT NEW."quiz_id", COALESCE(MAX(v2."version_no"), 0) + 1, NEW."type", NEW."question",
         NEW."options", NEW."correct_answer", NEW."explanation", NEW."lo_id", NEW."bloom_level",
         COALESCE(NEW."source_chunk_ids", '{}'), COALESCE(NEW."provenance", '{}'), NEW."updated_by"
  FROM "quiz_item_versions" v2
  WHERE v2."quiz_id" = NEW."quiz_id"
  RETURNING "version_id" INTO v;

  UPDATE "quiz_items" SET "current_version_id" = v WHERE "quiz_id" = NEW."quiz_id";
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Backfill (trước khi bật trigger phiên bản) ------------------------------
SELECT ensure_default_question_bank(c."course_id")
FROM "courses" c
WHERE EXISTS (SELECT 1 FROM "quiz_items" q WHERE q."course_id" = c."course_id");

UPDATE "quiz_items" q
SET "bank_id" = b."bank_id"
FROM "question_banks" b
WHERE b."home_course_id" = q."course_id" AND b."is_course_default" AND b."deleted_at" IS NULL
  AND q."bank_id" IS NULL;

INSERT INTO "quiz_item_versions" (
  "quiz_id", "version_no", "type", "question", "options", "correct_answer",
  "explanation", "lo_id", "bloom_level", "source_chunk_ids", "provenance", "created_at"
)
SELECT q."quiz_id", 1, q."type", q."question", q."options", q."correct_answer", q."explanation",
       q."lo_id", q."bloom_level", COALESCE(q."source_chunk_ids", '{}'),
       '{"backfilled": true}'::jsonb, COALESCE(q."created_at", now())
FROM "quiz_items" q;

UPDATE "quiz_items" q
SET "current_version_id" = v."version_id"
FROM "quiz_item_versions" v
WHERE v."quiz_id" = q."quiz_id" AND v."version_no" = 1;

-- Snapshot đề: gắn version_id khi nội dung snapshot trùng phiên bản 1;
-- không trùng thì đặt version_id = NULL.
UPDATE "quiz_sets" s
SET "items" = (
  SELECT jsonb_agg(
    e || jsonb_build_object('version_id', v."version_id")
    ORDER BY ord
  )
  FROM jsonb_array_elements(s."items") WITH ORDINALITY AS t(e, ord)
  LEFT JOIN "quiz_item_versions" v
    ON (e->>'quiz_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   AND v."quiz_id" = (e->>'quiz_id')::uuid
   AND v."version_no" = 1
   AND v."question" = e->>'question'
   AND (CASE WHEN jsonb_typeof(v."options") = 'null' THEN NULL ELSE v."options" END)
       IS NOT DISTINCT FROM
       (CASE WHEN jsonb_typeof(e->'options') = 'null' THEN NULL ELSE e->'options' END)
   AND v."correct_answer" IS NOT DISTINCT FROM (e->'correct_answer')
)
WHERE jsonb_typeof(s."items") = 'array' AND jsonb_array_length(s."items") > 0;

ALTER TABLE "quiz_items" ALTER COLUMN "bank_id" SET NOT NULL;

CREATE TRIGGER "trg_quiz_items_version"
  AFTER INSERT OR UPDATE ON "quiz_items"
  FOR EACH ROW EXECUTE FUNCTION quiz_items_write_version();
