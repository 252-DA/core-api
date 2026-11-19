-- Thêm kiểu câu tự luận ngắn (SHORT_ANSWER) và trạng thái chấm của từng câu.
--
-- Bốn kiểu MCQ_SINGLE/MCQ_MULTI/TRUE_FALSE/FILL_BLANK đã có trong CHECK từ
-- 0_init. Tự luận ngắn do LLM chấm bất đồng bộ trong worker, nên một câu trả
-- lời có thể chưa có điểm lúc nộp:
--   grading_status  GRADED  có điểm (mọi kiểu chấm ngay, và tự luận đã chấm xong)
--                   PENDING tự luận đang chờ worker chấm
--                   FAILED  worker không chấm được sau mọi lượt thử
--   ags_status      AWAITING_GRADE: cả lượt nộp chờ chấm xong mới được
--                   AgsPublisherService nhặt, để không gửi lên LMS một điểm
--                   tính khi tự luận còn là 0.
ALTER TABLE "quiz_items" DROP CONSTRAINT "quiz_items_type_check";
ALTER TABLE "quiz_items" ADD CONSTRAINT "quiz_items_type_check"
  CHECK ("type" IN ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'));

ALTER TABLE "quiz_attempts" ADD COLUMN "grading_status" VARCHAR(20) NOT NULL DEFAULT 'GRADED';
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_grading_status_check"
  CHECK ("grading_status" IN ('GRADED', 'PENDING', 'FAILED'));

ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_ags_status_check";
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_ags_status_check"
  CHECK ("ags_status" IN ('NOT_REQUIRED', 'AWAITING_GRADE', 'PENDING', 'POSTING', 'POSTED', 'FAILED'));
