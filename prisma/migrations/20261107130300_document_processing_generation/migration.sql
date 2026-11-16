-- Trạng thái tài liệu do core-api ghi từ kết quả worker (đợt 1,
-- docs/ke-hoach-ranh-gioi-du-lieu.md). Kết quả đi qua hàng đợi worker_results
-- nên có thể đến trễ hoặc lệch thứ tự (handler retry); ba cột dưới đây để kết
-- quả cũ không đè trạng thái mới.
--
--   processing_generation  lượt xử lý: core-api tăng mỗi lần đưa tài liệu vào
--                          hàng đợi (tải lên xong, đồng bộ Canvas xử lý lại tài
--                          liệu ERROR) và gửi kèm job process_document. Kết quả
--                          của lượt khác lượt hiện tại bị bỏ.
--   processing_seq         thứ tự của kết quả trạng thái mới nhất đã áp dụng trong
--                          lượt hiện tại, tính từ (giai đoạn, lần chạy job, trạng
--                          thái) — xem document-processing-result.handler.ts. Về 0
--                          khi sang lượt mới.
--   enrichment_generation  lượt đã áp dụng học liệu nháp của enrichment
--                          (ENRICHMENT_CONTENT_RESULT); NULL = chưa lượt nào.
--
-- Dòng cũ ở lượt 0: job đang chờ trong hàng đợi lúc deploy không mang lượt
-- (worker coi là 0) nên vẫn khớp.

BEGIN;

ALTER TABLE "documents"
  ADD COLUMN "processing_generation" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "processing_seq"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "enrichment_generation" INTEGER,
  ADD CONSTRAINT "documents_processing_generation_check" CHECK ("processing_generation" >= 0),
  ADD CONSTRAINT "documents_processing_seq_check" CHECK ("processing_seq" >= 0),
  ADD CONSTRAINT "documents_enrichment_generation_check"
    CHECK ("enrichment_generation" IS NULL OR "enrichment_generation" >= 0);

COMMIT;
