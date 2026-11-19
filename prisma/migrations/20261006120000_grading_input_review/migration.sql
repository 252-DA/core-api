-- Chấm tự luận theo đề đã phát, và lỗi chấm chờ giảng viên thay vì thành 0 điểm.
--
--   grading_input   đề của câu tự luận lúc người học nộp: {type, question,
--                   correct_answer: {model_answer, rubric}}. Worker chỉ chấm
--                   theo bản này, nên giảng viên sửa câu trong ngân hàng sau đó
--                   không đổi cách chấm bài đã nộp. NULL với câu chấm ngay.
--   grading_status  FAILED (ghi 0 điểm rồi đẩy lên sổ điểm) đổi thành
--                   NEEDS_REVIEW: AI không chấm được thì câu chờ giảng viên chấm
--                   tay hoặc cho AI chấm lại; cả lượt nộp giữ AWAITING_GRADE.
ALTER TABLE "quiz_attempts" ADD COLUMN "grading_input" JSONB;

UPDATE "quiz_attempts" SET "grading_status" = 'NEEDS_REVIEW' WHERE "grading_status" = 'FAILED';
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_grading_status_check";
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_grading_status_check"
  CHECK ("grading_status" IN ('GRADED', 'PENDING', 'NEEDS_REVIEW'));
