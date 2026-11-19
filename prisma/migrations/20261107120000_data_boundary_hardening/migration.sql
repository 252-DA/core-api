-- Cứng hoá ranh giới dữ liệu (đợt 0, docs/ke-hoach-ranh-gioi-du-lieu.md).
--
-- 1. outbox_events: giành sự kiện theo thời điểm NHẶT (locked_at/locked_by),
--    không theo occurred_at; queue.add lỗi thì thử lại có backoff
--    (next_retry_at), quá 10 lần thì DEAD_LETTER thay vì FAILED vĩnh viễn.
--    retry_count từ nay = số lần relay LỖI (trước đây tăng cả khi thành công).
-- 2. Trigger NOTIFY 'outbox_channel' sau mỗi câu INSERT vào outbox_events, để
--    OutboxService (LISTEN) relay ngay thay vì chờ vòng poll. Worker Python
--    cũng INSERT vào bảng này nên cũng đánh thức được core-api.
-- 3. quiz_items, lesson_cards: verification_status + verification_evidence để
--    lưu kết luận của judge thay vì chỉ bỏ câu không đạt.
-- 4. CHECK theo giá trị THẬT mà code TS/Python ghi (đối chiếu 2026-11-07):
--    quiz_items/lesson_cards/lessons.status bỏ UNPUBLISHED/ARCHIVED (không chỗ
--    nào ghi); thêm CHECK cho video_assets, micro_content_questions.type; hình
--    dạng correct_answer theo type (core-api/src/quiz/question-types.ts).
--    outbox_events.status GIỮ 'FAILED' (giá trị legacy, code mới không ghi).
--
-- Dữ liệu kiểu cũ không được làm migration fail: dòng suy ra được thì chuẩn hoá
-- (FILL_BLANK lưu chuỗi → mảng một phần tử), dòng không suy ra được thì CHECK
-- vẫn được thêm nhưng ở dạng NOT VALID (dòng mới sai vẫn bị chặn) và chỉ
-- VALIDATE khi không còn dòng vi phạm (mục 7); còn dòng vi phạm thì
-- RAISE WARNING kèm số dòng để người vận hành sửa rồi tự VALIDATE.
--
-- Triển khai: dừng MỌI core-api bản cũ trước khi áp migration này (kể cả bản
-- của thành viên khác trên DB chung). Bản cũ giành lại sự kiện PROCESSING theo
-- occurred_at nên sẽ relay trùng những sự kiện bản mới đang giữ — xem
-- docs/phan-quyen-postgres.md, mục 4.
--
-- Các CHECK trạng thái khác (ags_status, grading_status, essay_submissions,
-- documents, curriculum_imports, content_generation_requests, micro_contents)
-- đã có từ các migration trước và khớp code, nên không đụng tới.

BEGIN;

-- 1. outbox_events ------------------------------------------------------------

-- transaction_timestamp() chính là now(), nhưng viết khác để schema.prisma khai
-- được @default(dbgenerated(...)) mà không lệch với DB: với @default(now())
-- Prisma tự điền giờ máy core-api, lệch giờ với DB thì sự kiện vừa tạo chưa
-- "đến hạn" ở lượt poll do NOTIFY gọi. Giá trị lấy lúc bắt đầu transaction nên
-- luôn sớm hơn lúc COMMIT: sự kiện đã đến hạn khi listener nhận được NOTIFY.
ALTER TABLE "outbox_events"
  ADD COLUMN "locked_at"     TIMESTAMPTZ(6),
  ADD COLUMN "locked_by"     VARCHAR(64),
  ADD COLUMN "next_retry_at" TIMESTAMPTZ(6) NOT NULL DEFAULT transaction_timestamp();

-- FAILED cũ = queue.add lỗi một lần rồi bỏ luôn. Không đưa về PENDING: phát lại
-- sự kiện cũ có thể chấm lại bài, sinh lại câu hỏi đã sinh tay. DEAD_LETTER giữ
-- dòng để người vận hành xem và tự đẩy lại từng dòng nếu cần.
UPDATE "outbox_events" SET "status" = 'DEAD_LETTER' WHERE "status" = 'FAILED';

-- Code cũ tăng retry_count cả ở lần thành công, nên dòng PROCESSED có
-- retry_count = số lần thử = số lần lỗi + 1. Đưa về đúng nghĩa mới.
UPDATE "outbox_events"
   SET "retry_count" = GREATEST(COALESCE("retry_count", 0) - 1, 0)
 WHERE "status" = 'PROCESSED';

-- Dòng đang PROCESSING lúc áp migration không có locked_at; tính từ bây giờ để
-- được giành lại sau đúng 10 phút như mọi dòng khác.
UPDATE "outbox_events" SET "locked_at" = now() WHERE "status" = 'PROCESSING';

-- FAILED vẫn được phép dù code mới không còn ghi nó (UPDATE trên chỉ dọn dòng
-- đang có): core-api bản cũ còn chạy trên DB chung (thành viên khác, hoặc lúc
-- rolling deploy) ghi FAILED khi queue.add lỗi, mà CHECK không cho thì
-- câu UPDATE đó bị Postgres từ chối và bản cũ ném lỗi giữa vòng relay. Dòng
-- FAILED do bản cũ để lại không được relay lại; xử lý như dead letter bằng tay.
ALTER TABLE "outbox_events" DROP CONSTRAINT "outbox_events_status_check";
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_status_check"
  CHECK ("status" IN ('PENDING', 'PROCESSING', 'PROCESSED', 'DEAD_LETTER', 'FAILED'));

-- Poller lọc cả PENDING đến hạn lẫn PROCESSING quá hạn khoá, sắp theo
-- (next_retry_at, occurred_at): index cũ chỉ phủ PENDING theo occurred_at.
DROP INDEX IF EXISTS "idx_outbox_pending_poller";
CREATE INDEX "idx_outbox_poller" ON "outbox_events" ("next_retry_at", "occurred_at")
  WHERE "status" IN ('PENDING', 'PROCESSING');

-- FAILED không còn; index cho trang/cảnh báo đọc dead letter thay vào chỗ đó.
DROP INDEX IF EXISTS "idx_outbox_failed";
CREATE INDEX "idx_outbox_dead_letter" ON "outbox_events" ("occurred_at")
  WHERE "status" = 'DEAD_LETTER';

-- 2. NOTIFY sau INSERT --------------------------------------------------------
-- FOR EACH STATEMENT, payload rỗng: listener chỉ cần biết "có việc", còn việc
-- gì thì câu giành sự kiện tự đọc. Một INSERT nhiều dòng chỉ bắn một lần, và
-- PostgreSQL gộp các NOTIFY trùng kênh + payload trong cùng transaction, nên
-- một transaction ghi nhiều sự kiện chỉ đánh thức listener một lần, lúc COMMIT.
CREATE OR REPLACE FUNCTION "outbox_events_notify"() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('outbox_channel', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "outbox_events_notify_insert"
  AFTER INSERT ON "outbox_events"
  FOR EACH STATEMENT EXECUTE FUNCTION "outbox_events_notify"();

-- 3. Hồ sơ kiểm chứng ---------------------------------------------------------
--   UNVERIFIED    chưa qua judge (mọi dòng cũ, và câu giảng viên tự soạn)
--   VERIFIED      judge xác nhận đạt
--   INCONCLUSIVE  judge không kết luận được (lỗi gọi model, trả lời mơ hồ)
--   FLAGGED       judge chỉ ra lỗi; câu vẫn được lưu để giảng viên xem bằng chứng
ALTER TABLE "quiz_items"
  ADD COLUMN "verification_status"   VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "verification_evidence" JSONB,
  ADD CONSTRAINT "quiz_items_verification_status_check"
    CHECK ("verification_status" IN ('UNVERIFIED', 'VERIFIED', 'INCONCLUSIVE', 'FLAGGED'));

ALTER TABLE "lesson_cards"
  ADD COLUMN "verification_status"   VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "verification_evidence" JSONB,
  ADD CONSTRAINT "lesson_cards_verification_status_check"
    CHECK ("verification_status" IN ('UNVERIFIED', 'VERIFIED', 'INCONCLUSIVE', 'FLAGGED'));

-- 4. Trạng thái nội dung theo giá trị thật ------------------------------------
-- review.service.ts / lesson.service.ts / worker chỉ ghi năm giá trị này;
-- UNPUBLISHED, ARCHIVED có trong 0_init nhưng không chỗ nào ghi hay đọc.
-- NOT VALID (rồi VALIDATE ở mục 7 nếu dữ liệu sạch): dòng nhập tay ở dev có thể
-- còn mang UNPUBLISHED/ARCHIVED, và không có cách nào suy ra trạng thái đúng.
ALTER TABLE "quiz_items" DROP CONSTRAINT "quiz_items_status_check";
ALTER TABLE "quiz_items" ADD CONSTRAINT "quiz_items_status_check"
  CHECK ("status" IN ('GENERATED_DRAFT', 'REVIEWING', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
  NOT VALID;

ALTER TABLE "lesson_cards" DROP CONSTRAINT "lesson_cards_status_check";
ALTER TABLE "lesson_cards" ADD CONSTRAINT "lesson_cards_status_check"
  CHECK ("status" IN ('GENERATED_DRAFT', 'REVIEWING', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED'))
  NOT VALID;

-- Worker tạo lesson ở DRAFT, lesson.service.ts publish thành PUBLISHED.
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_status_check";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_status_check"
  CHECK ("status" IN ('DRAFT', 'PUBLISHED'))
  NOT VALID;

-- 5. Hình dạng đáp án theo kiểu câu (question-types.ts) ----------------------
--   MCQ_SINGLE, TRUE_FALSE  chuỗi
--   MCQ_MULTI, FILL_BLANK   mảng không rỗng
--   SHORT_ANSWER            object có model_answer là chuỗi
--
-- Dữ liệu cũ: 0_init quy ước FILL_BLANK lưu một chuỗi. gradeAnswer,
-- normalizeAnswerKey và web (acceptedAnswers) coi chuỗi và mảng một phần tử là
-- một, nên chuẩn hoá sang mảng không đổi nghĩa gì. Làm cho MỌI dòng kể cả đã
-- xoá mềm (không lọc deleted_at), và không đụng updated_at. grading_input của
-- bài đã nộp không sửa: gradeAnswer vẫn đọc được dạng chuỗi.
UPDATE "quiz_items"
   SET "correct_answer" = jsonb_build_array("correct_answer")
 WHERE "type" = 'FILL_BLANK' AND jsonb_typeof("correct_answer") = 'string';

UPDATE "micro_content_questions"
   SET "correct_answer" = jsonb_build_array("correct_answer")
 WHERE "type" = 'FILL_BLANK' AND jsonb_typeof("correct_answer") = 'string';

-- Còn lại không suy ra được (vd. MCQ_SINGLE có correct_answer = 'null'::jsonb do
-- code Python cũ ghi khi correct_index sai) nên không sửa. CHECK đi kèm NOT
-- VALID: Postgres kiểm dòng MỚI và dòng bị UPDATE, không kiểm dòng cũ.
--
-- Dòng đã xoá mềm (deleted_at) được miễn: nó không còn hiện với ai, và nếu
-- không miễn thì dòng hỏng cũ không xoá mềm được (UPDATE nào cũng bị CHECK từ
-- chối) trong khi đó là cách gỡ hợp lý nhất. Upsert của worker đặt lại
-- deleted_at = NULL cùng lúc ghi nội dung mới nên vẫn bị kiểm.
--
-- CASE lồng nhau vì AND trong SQL không bảo đảm thứ tự tính:
-- jsonb_array_length trên giá trị không phải mảng sẽ báo lỗi thay vì trả false.
-- COALESCE vì thiếu khoá thì -> trả NULL, mà CHECK ra NULL được coi là đạt.
ALTER TABLE "quiz_items" ADD CONSTRAINT "quiz_items_correct_answer_shape_check" CHECK (
  "deleted_at" IS NOT NULL OR CASE "type"
    WHEN 'MCQ_SINGLE' THEN jsonb_typeof("correct_answer") = 'string'
    WHEN 'TRUE_FALSE' THEN jsonb_typeof("correct_answer") = 'string'
    WHEN 'MCQ_MULTI' THEN CASE WHEN jsonb_typeof("correct_answer") = 'array'
                               THEN jsonb_array_length("correct_answer") > 0 ELSE FALSE END
    WHEN 'FILL_BLANK' THEN CASE WHEN jsonb_typeof("correct_answer") = 'array'
                                THEN jsonb_array_length("correct_answer") > 0 ELSE FALSE END
    WHEN 'SHORT_ANSWER' THEN CASE WHEN jsonb_typeof("correct_answer") = 'object'
                                  THEN COALESCE(jsonb_typeof("correct_answer" -> 'model_answer') = 'string', FALSE)
                                  ELSE FALSE END
    ELSE FALSE
  END
) NOT VALID;

-- micro_content_questions dùng chung normalizeAnswerKey với quiz_items.
-- correct_answer ở đây nullable từ đầu; giữ nguyên tính nullable, chỉ ràng
-- buộc hình dạng khi có giá trị.
ALTER TABLE "micro_content_questions" ADD CONSTRAINT "micro_content_questions_type_check"
  CHECK ("type" IN ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'))
  NOT VALID;

ALTER TABLE "micro_content_questions" ADD CONSTRAINT "micro_content_questions_correct_answer_shape_check" CHECK (
  "deleted_at" IS NOT NULL OR "correct_answer" IS NULL OR CASE "type"
    WHEN 'MCQ_SINGLE' THEN jsonb_typeof("correct_answer") = 'string'
    WHEN 'TRUE_FALSE' THEN jsonb_typeof("correct_answer") = 'string'
    WHEN 'MCQ_MULTI' THEN CASE WHEN jsonb_typeof("correct_answer") = 'array'
                               THEN jsonb_array_length("correct_answer") > 0 ELSE FALSE END
    WHEN 'FILL_BLANK' THEN CASE WHEN jsonb_typeof("correct_answer") = 'array'
                                THEN jsonb_array_length("correct_answer") > 0 ELSE FALSE END
    WHEN 'SHORT_ANSWER' THEN CASE WHEN jsonb_typeof("correct_answer") = 'object'
                                  THEN COALESCE(jsonb_typeof("correct_answer" -> 'model_answer') = 'string', FALSE)
                                  ELSE FALSE END
    ELSE FALSE
  END
) NOT VALID;

-- 6. video_assets (migration 20261021201500 chưa có CHECK nào) ---------------
--   status       core-api: UPLOADING, PROCESSING, READY; worker video: READY, FAILED
--   source_type  USER_UPLOAD (tải lên), AI_STUDIO (worker render)
--   visibility   PRIVATE, COURSE, PUBLIC (VISIBILITIES trong video-asset.service.ts)
-- transcript_status chưa có CHECK: chưa có pipeline phiên âm, mới chỉ ghi
-- PENDING, chưa chốt được tập giá trị.
ALTER TABLE "video_assets"
  ADD CONSTRAINT "video_assets_status_check"
    CHECK ("status" IN ('UPLOADING', 'PROCESSING', 'READY', 'FAILED')) NOT VALID,
  ADD CONSTRAINT "video_assets_source_type_check"
    CHECK ("source_type" IN ('USER_UPLOAD', 'AI_STUDIO')) NOT VALID,
  ADD CONSTRAINT "video_assets_visibility_check"
    CHECK ("visibility" IN ('PRIVATE', 'COURSE', 'PUBLIC')) NOT VALID;

-- 7. VALIDATE các CHECK NOT VALID khi dữ liệu sạch --------------------------
-- Đếm dòng vi phạm bằng chính biểu thức của constraint (pg_get_expr): CHECK chỉ
-- bị vi phạm khi biểu thức ra FALSE, NULL vẫn đạt. Sạch thì VALIDATE (constraint
-- thành đầy đủ như thêm bình thường); còn dòng vi phạm thì giữ NOT VALID và báo.
-- Sau khi sửa dữ liệu, chạy lại: ALTER TABLE <bảng> VALIDATE CONSTRAINT <tên>;
DO $$
DECLARE
  c record;
  violations bigint;
BEGIN
  FOR c IN
    SELECT con.conname,
           con.conrelid::regclass AS tbl,
           pg_get_expr(con.conbin, con.conrelid) AS expr
      FROM pg_constraint con
     WHERE con.contype = 'c'
       AND NOT con.convalidated
       AND con.connamespace = current_schema()::regnamespace
       AND con.conname IN (
         'quiz_items_status_check',
         'lesson_cards_status_check',
         'lessons_status_check',
         'quiz_items_correct_answer_shape_check',
         'micro_content_questions_type_check',
         'micro_content_questions_correct_answer_shape_check',
         'video_assets_status_check',
         'video_assets_source_type_check',
         'video_assets_visibility_check'
       )
     ORDER BY con.conname
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE (%s) IS FALSE', c.tbl, c.expr)
       INTO violations;
    IF violations = 0 THEN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', c.tbl, c.conname);
    ELSE
      RAISE WARNING
        'CHECK % trên % còn % dòng vi phạm dữ liệu cũ: giữ NOT VALID (dòng mới vẫn bị chặn). '
        'Biểu thức: SELECT pg_get_expr(conbin, conrelid) FROM pg_constraint WHERE conname = ''%''; '
        'sửa dữ liệu xong chạy ALTER TABLE % VALIDATE CONSTRAINT %;',
        c.conname, c.tbl, violations, c.conname, c.tbl, c.conname;
    END IF;
  END LOOP;
END
$$;

COMMIT;
