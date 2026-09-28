-- Mỗi lần nạp đề cương là một hàng: file nguồn, bản xem trước worker trích ra,
-- và bước giảng viên duyệt. Đề cương chỉ được ghi vào chapters /
-- learning_outcomes / ... khi giảng viên bấm áp dụng (status APPLIED), vì nạp
-- lại sẽ upsert đè lên đề cương đang dùng.
--
-- Vòng đời: QUEUED → EXTRACTING → READY | BLOCKED | FAILED
--           READY → APPLYING → APPLIED | FAILED

BEGIN;

CREATE TABLE IF NOT EXISTS curriculum_imports (
    import_id    UUID PRIMARY KEY DEFAULT uuidv7(),
    course_id    UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    source       VARCHAR(20)  NOT NULL CHECK (source IN ('canvas', 'upload')),
    -- Canvas: id của file trong khoá học; dùng để biết lần đồng bộ sau có
    -- đổi file hay không.
    source_ref   VARCHAR(255),
    file_name    VARCHAR(255) NOT NULL,
    storage_key  VARCHAR(512) NOT NULL,
    mime_type    VARCHAR(100),
    checksum     VARCHAR(64),
    size_bytes   INTEGER,
    status       VARCHAR(20)  NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
                     'QUEUED', 'EXTRACTING', 'READY', 'BLOCKED',
                     'FAILED', 'APPLYING', 'APPLIED')),
    preview      JSONB,
    error        TEXT,
    requested_by UUID,
    applied_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_curriculum_imports_course
    ON curriculum_imports (course_id, created_at DESC);

COMMIT;
