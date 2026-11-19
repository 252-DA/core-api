-- Hồ sơ kiểm chứng ở mức yêu cầu sinh học liệu (đợt 1 C, docs/ke-hoach-ranh-gioi-du-lieu.md).
--
-- Câu/card giữ lại mang kết luận riêng ở quiz_items/lesson_cards.verification_*
-- (migration 20261107120000). Câu/card judge loại sau lượt sửa cuối thì không
-- được lưu thành dòng nào, nên số đó chỉ còn ở đây:
--   {criterion, verified, inconclusive, flagged, unverified, rejected, rejected_reasons[]}
-- core-api ghi khi áp CONTENT_GENERATION_RESULT SUCCEEDED; NULL với request cũ,
-- request lỗi và request dựng đồ thị quan hệ.

ALTER TABLE "content_generation_requests" ADD COLUMN "verification_summary" JSONB;
