-- Nạp đề cương theo mô hình "worker parse, core-api ghi" (đợt 1,
-- docs/ke-hoach-ranh-gioi-du-lieu.md).
--
-- curriculum: bản đề cương chuẩn hoá worker parse ra ở bước xem trước
-- (CURRICULUM_IMPORT_RESULT, contracts/integration-events/v1/
-- curriculum-import-result.json). Khi giảng viên áp dụng, core-api ghi đúng bản
-- này vào chapters / learning_outcomes / ... — không parse lại, nên bản được
-- duyệt chính là bản được ghi. NULL với lần nạp tạo trước thay đổi này: áp dụng
-- những lần đó sẽ trích xuất lại để giảng viên duyệt lần nữa.
--
-- Trạng thái giữ nguyên tập giá trị: APPLYING không còn được ghi (core-api áp
-- dụng trong một transaction) nhưng còn có thể nằm ở dòng cũ.

ALTER TABLE "curriculum_imports" ADD COLUMN "curriculum" JSONB;
