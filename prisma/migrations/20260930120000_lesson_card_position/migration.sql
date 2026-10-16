-- Thứ tự card trong một lesson. Trước đây trang học và trang sửa sắp theo
-- created_at, nên card sinh theo LO không giữ được trình tự "khái niệm trước,
-- vận dụng sau" mà người viết đặt ra. Card cũ được đánh số theo created_at để
-- thứ tự đang hiển thị không đổi.
ALTER TABLE "lesson_cards" ADD COLUMN "position" INT NOT NULL DEFAULT 0;

UPDATE "lesson_cards" AS lc
SET "position" = ranked.rn
FROM (
  SELECT "card_id",
         ROW_NUMBER() OVER (PARTITION BY "lesson_id" ORDER BY "created_at", "card_id") - 1 AS rn
  FROM "lesson_cards"
) AS ranked
WHERE lc."card_id" = ranked."card_id";

CREATE INDEX "idx_lesson_cards_lesson_position" ON "lesson_cards" ("lesson_id", "position");
