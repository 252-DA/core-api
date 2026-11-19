-- Đồng bộ tài liệu từ Module Canvas và gắn tài liệu với chương.
--
-- Giảng viên không nhất thiết xếp module theo chương: có lớp dồn hết slide vào
-- một module "Slides", tài liệu tham khảo vào "References". Vì vậy chương được
-- xác định cho TỪNG tài liệu, kèm nguồn gốc của quyết định:
--   module    — tên module ghi chương/tuần/buổi
--   file_name — tên file ghi chương ("Ch1_…", "Lecture 3")
--   content   — khớp nội dung với tên chương + mục con trong đề cương
--   confirmed — giảng viên chọn; đồng bộ sau không ghi đè
-- Tài liệu tham khảo (role = reference) không gắn cả file vào một chương mà
-- gắn theo từng phần lúc map chunk → LO.

BEGIN;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source             VARCHAR(20) NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS lms_file_id        VARCHAR(64),
  ADD COLUMN IF NOT EXISTS lms_module         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lms_published      BOOLEAN,
  ADD COLUMN IF NOT EXISTS lms_updated_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role               VARCHAR(20) NOT NULL DEFAULT 'lecture',
  ADD COLUMN IF NOT EXISTS role_provenance    VARCHAR(20) NOT NULL DEFAULT 'inferred',
  ADD COLUMN IF NOT EXISTS chapter_code       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS chapter_provenance VARCHAR(20),
  ADD COLUMN IF NOT EXISTS chapter_confidence NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS chapter_reason     VARCHAR(255);

ALTER TABLE documents
  ADD CONSTRAINT documents_source_check
    CHECK (source IN ('upload', 'canvas')),
  ADD CONSTRAINT documents_role_check
    CHECK (role IN ('lecture', 'reference', 'exercise')),
  ADD CONSTRAINT documents_role_provenance_check
    CHECK (role_provenance IN ('inferred', 'confirmed')),
  ADD CONSTRAINT documents_chapter_provenance_check
    CHECK (chapter_provenance IS NULL
           OR chapter_provenance IN ('module', 'file_name', 'content', 'confirmed'));

-- Một file Canvas ứng với tối đa một tài liệu còn sống trong học phần.
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_course_lms_file
    ON documents (course_id, lms_file_id)
 WHERE source = 'canvas' AND deleted_at IS NULL;

-- Mục con của chương trong bảng mục 6 ("2.3 Min-hashing", "2.4 LSH"), dùng để
-- khớp nội dung tài liệu với chương.
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS topics TEXT;

COMMIT;
