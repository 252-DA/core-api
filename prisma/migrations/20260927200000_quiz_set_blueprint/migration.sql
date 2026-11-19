-- Đề soạn từ trang "Soạn đề" có thể gồm nhiều chương (giữa kỳ/cuối kỳ): chapter_id
-- chỉ còn là chương chính khi đề thuộc đúng một chương; chapter_ids liệt kê mọi
-- chương, blueprint lưu ma trận LO × Bloom và tài liệu nguồn đã chọn.
ALTER TABLE "quiz_sets" ALTER COLUMN "chapter_id" DROP NOT NULL;
ALTER TABLE "quiz_sets"
  ADD COLUMN "chapter_ids" UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN "blueprint" JSONB;
UPDATE "quiz_sets" SET "chapter_ids" = ARRAY["chapter_id"] WHERE "chapter_id" IS NOT NULL AND "chapter_ids" = '{}';
ALTER TABLE "quiz_sets"
  ADD CONSTRAINT "quiz_sets_chapters_check" CHECK (cardinality("chapter_ids") >= 1),
  ADD CONSTRAINT "quiz_sets_primary_chapter_check" CHECK ("chapter_id" IS NULL OR "chapter_id" = ANY ("chapter_ids"));
CREATE INDEX "quiz_sets_chapter_ids_idx" ON "quiz_sets" USING GIN ("chapter_ids");
