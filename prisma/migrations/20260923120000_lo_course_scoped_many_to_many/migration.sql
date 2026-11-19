-- Chuẩn đầu ra thuộc học phần, không thuộc chương.
--
-- Trước: learning_outcomes.chapter_id NOT NULL + UNIQUE(chapter_id, code, ...).
-- Số chương được suy từ mã LO ("L.O.2.2" → chương 2), nên L.O.2.2 — thực tế
-- được dạy ở chương 4, 5, 7 và 12 — chỉ gắn được vào một chương, và nếu gắn đủ
-- bốn chương thì khoá unique sinh ra BỐN lo_id khác nhau cho cùng một LO, làm
-- vỡ lo_assessments / chunk_lo_mappings / lessons / quiz_items.
--
-- Sau: LO định danh theo (course_id, code, academic_year, version); quan hệ
-- chương ↔ LO chuyển sang bảng nối chapter_los.

BEGIN;

-- 0. View phụ thuộc chapter_id; dựng lại ở cuối theo hình dạng mới.
DROP VIEW IF EXISTS v_current_learning_outcomes;

-- 1. chapters: mã chương thành cột riêng -----------------------------------
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS code           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS title_en       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_section VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source_page    INTEGER;

-- Bản ghi cũ lưu "<code> <title>" trong title; tách lại phần số dẫn đầu.
UPDATE chapters
   SET code = COALESCE(NULLIF(substring(title FROM '^([0-9]+)'), ''), sort_order::text)
 WHERE code IS NULL;
UPDATE chapters
   SET title = btrim(regexp_replace(title, '^[0-9]+[ .:-]*', ''))
 WHERE title ~ '^[0-9]+[ .:-]';

ALTER TABLE chapters ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_chapters_course_code ON chapters (course_id, code);

-- 2. learning_outcomes: gắn vào học phần ------------------------------------
ALTER TABLE learning_outcomes
  ADD COLUMN IF NOT EXISTS course_id        UUID,
  ADD COLUMN IF NOT EXISTS parent_code      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bloom_provenance VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS cdio_provenance  VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS source_section   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source_page      INTEGER;

UPDATE learning_outcomes lo
   SET course_id = ch.course_id
  FROM chapters ch
 WHERE ch.chapter_id = lo.chapter_id
   AND lo.course_id IS NULL;

-- LO mồ côi (chương đã bị xoá cứng) không có học phần để gắn vào.
DELETE FROM learning_outcomes WHERE course_id IS NULL;

ALTER TABLE learning_outcomes ALTER COLUMN course_id SET NOT NULL;

-- parent_code suy từ chính mã LO: "L.O.2.2" → "L.O.2". Đây là cây LO mà tài
-- liệu ghi, không phải số chương.
UPDATE learning_outcomes
   SET parent_code = substring(code FROM '^(.*)\.[^.]+$')
 WHERE parent_code IS NULL
   AND code ~ '^L\.O\.[0-9]+(\.[0-9]+)+$';

-- Bloom/CDIO không có trong đề cương ⇒ cho phép NULL thay vì bịa mặc định.
ALTER TABLE learning_outcomes ALTER COLUMN bloom_level DROP NOT NULL;
ALTER TABLE learning_outcomes ALTER COLUMN cdio_level  DROP NOT NULL;

-- 3. chapter_los: quan hệ nhiều–nhiều ---------------------------------------
CREATE TABLE IF NOT EXISTS chapter_los (
    chapter_id     UUID        NOT NULL REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    lo_id          UUID        NOT NULL REFERENCES learning_outcomes(lo_id) ON DELETE CASCADE,
    provenance     VARCHAR(20) NOT NULL DEFAULT 'extracted',
    source_section VARCHAR(20),
    source_page    INTEGER,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chapter_id, lo_id)
);
CREATE INDEX IF NOT EXISTS idx_chapter_los_lo ON chapter_los (lo_id);

-- Chuyển quan hệ 1-n cũ sang bảng nối. Đánh dấu 'inferred': cạnh cũ được suy ra
-- từ mã LO chứ không đọc từ bảng mục 6, nên phải chờ giảng viên xác nhận.
INSERT INTO chapter_los (chapter_id, lo_id, provenance)
SELECT lo.chapter_id, lo.lo_id, 'inferred'
  FROM learning_outcomes lo
 WHERE lo.chapter_id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS idx_lo_chapter;
DROP INDEX IF EXISTS idx_lo_current;
ALTER TABLE learning_outcomes DROP CONSTRAINT IF EXISTS uq_lo_code_versioned;
DROP INDEX IF EXISTS uq_lo_code_versioned;
ALTER TABLE learning_outcomes DROP COLUMN IF EXISTS chapter_id;

ALTER TABLE learning_outcomes
  ADD CONSTRAINT learning_outcomes_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS uq_lo_code_versioned
    ON learning_outcomes (course_id, code, academic_year, version);
CREATE INDEX IF NOT EXISTS idx_lo_course  ON learning_outcomes (course_id);
CREATE INDEX IF NOT EXISTS idx_lo_current ON learning_outcomes (course_id, code);
CREATE INDEX IF NOT EXISTS idx_lo_parent  ON learning_outcomes (course_id, parent_code);

-- 4. assessments: mã và cây cha–con ------------------------------------------
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS code              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_code       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS title_en          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS activity_type     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS weight            DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS weight_provenance VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS source_section    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source_page       INTEGER;

UPDATE assessments
   SET code = COALESCE(NULLIF(substring(title FROM '^(A\.O\.[0-9]+(?:\.[0-9]+)*)'), ''),
                       'A.O.' || sort_order::text)
 WHERE code IS NULL;
ALTER TABLE assessments ALTER COLUMN code SET NOT NULL;

UPDATE assessments
   SET parent_code = substring(code FROM '^(.*)\.[^.]+$')
 WHERE parent_code IS NULL
   AND code ~ '^A\.O\.[0-9]+(\.[0-9]+)+$';

CREATE UNIQUE INDEX IF NOT EXISTS uq_assessments_course_code ON assessments (course_id, code);
CREATE INDEX IF NOT EXISTS idx_assessments_parent ON assessments (course_id, parent_code);

-- 5. lo_assessments: giữ ngữ cảnh hàng của mục 6 ------------------------------
ALTER TABLE lo_assessments
  ADD COLUMN IF NOT EXISTS session_order     INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scope             VARCHAR(20) NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS chapter_id        UUID,
  ADD COLUMN IF NOT EXISTS weight_provenance VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS provenance        VARCHAR(20) NOT NULL DEFAULT 'extracted',
  ADD COLUMN IF NOT EXISTS source_section    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS source_page       INTEGER;

ALTER TABLE lo_assessments ALTER COLUMN weight DROP DEFAULT;
ALTER TABLE lo_assessments ALTER COLUMN weight DROP NOT NULL;
ALTER TABLE lo_assessments ALTER COLUMN weight TYPE DECIMAL(5,4);
-- Trọng số cũ mặc định 1.00 không đến từ đề cương; xoá để không bị đọc là dữ kiện.
UPDATE lo_assessments SET weight = NULL WHERE weight = 1.0000;

ALTER TABLE lo_assessments DROP CONSTRAINT IF EXISTS lo_assessments_pkey;
ALTER TABLE lo_assessments ADD PRIMARY KEY (lo_id, assessment_id, session_order);
CREATE INDEX IF NOT EXISTS idx_lo_assessments_ao ON lo_assessments (assessment_id);

ALTER TABLE lo_assessments
  ADD CONSTRAINT lo_assessments_chapter_id_fkey
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE SET NULL ON UPDATE NO ACTION;

-- 6. chunk_lo_mappings: nguồn tín hiệu và trạng thái --------------------------
ALTER TABLE chunk_lo_mappings
  ADD COLUMN IF NOT EXISTS source     VARCHAR(30) NOT NULL DEFAULT 'heading',
  ADD COLUMN IF NOT EXISTS provenance VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 7. Bảng mới ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_goals (
    goal_id        UUID PRIMARY KEY DEFAULT uuidv7(),
    course_id      UUID NOT NULL REFERENCES courses(course_id) ON DELETE RESTRICT,
    code           VARCHAR(50) NOT NULL,
    statement_vi   TEXT NOT NULL,
    statement_en   TEXT,
    source_section VARCHAR(20),
    source_page    INTEGER,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_goals_code ON course_goals (course_id, code);

CREATE TABLE IF NOT EXISTS course_sessions (
    session_id     UUID PRIMARY KEY DEFAULT uuidv7(),
    course_id      UUID NOT NULL REFERENCES courses(course_id) ON DELETE RESTRICT,
    order_index    INTEGER NOT NULL,
    session_no     INTEGER,
    chapter_id     UUID REFERENCES chapters(chapter_id) ON DELETE SET NULL,
    title_vi       VARCHAR(500) NOT NULL,
    title_en       VARCHAR(500),
    source_section VARCHAR(20),
    source_page    INTEGER,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_sessions_order ON course_sessions (course_id, order_index);

CREATE TABLE IF NOT EXISTS curriculum_extraction_issues (
    issue_id       UUID PRIMARY KEY DEFAULT uuidv7(),
    course_id      UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    document_id    UUID,
    code           VARCHAR(60) NOT NULL,
    severity       VARCHAR(10) NOT NULL,
    message        TEXT NOT NULL,
    source_section VARCHAR(20),
    source_page    INTEGER,
    source_locator VARCHAR(120),
    resolved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_curriculum_issues_course
    ON curriculum_extraction_issues (course_id, severity);

-- 8. Dựng lại view ----------------------------------------------------------
-- LEFT JOIN, không INNER JOIN: LO chưa gắn chương nào (ví dụ L.O.3.1 và L.O.3.2
-- của CO3011 — được định nghĩa ở mục 4.2 nhưng không hàng nào của mục 6 nhắc
-- tới) vẫn phải xuất hiện, để chỗ thiếu được nhìn thấy thay vì biến mất.
CREATE VIEW v_current_learning_outcomes AS
SELECT lo.lo_id,
       lo.course_id,
       lo.code,
       lo.parent_code,
       lo.statement_vi,
       lo.statement_en,
       lo.bloom_level,
       lo.bloom_provenance,
       lo.cdio_level,
       lo.cdio_provenance,
       lo.source_section,
       lo.source_page,
       lo.academic_year,
       lo.version,
       lo.is_current,
       lo.created_at,
       lo.deleted_at,
       COALESCE(ch.chapter_ids,   ARRAY[]::uuid[])              AS chapter_ids,
       COALESCE(ch.chapter_codes, ARRAY[]::character varying[]) AS chapter_codes
  FROM learning_outcomes lo
  LEFT JOIN LATERAL (
      SELECT array_agg(c.chapter_id ORDER BY c.sort_order) AS chapter_ids,
             array_agg(c.code       ORDER BY c.sort_order) AS chapter_codes
        FROM chapter_los cl
        JOIN chapters c ON c.chapter_id = cl.chapter_id
       WHERE cl.lo_id = lo.lo_id
         AND c.deleted_at IS NULL
  ) ch ON TRUE
 WHERE lo.is_current = TRUE
   AND lo.deleted_at IS NULL;

COMMIT;
