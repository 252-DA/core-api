-- The AGS publisher claims pending submissions before contacting Canvas.
-- Keep the database constraint aligned with that existing POSTING state.
BEGIN;
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_ags_status_check";
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_ags_status_check"
  CHECK ("ags_status" IN ('NOT_REQUIRED', 'PENDING', 'POSTING', 'POSTED', 'FAILED'));
COMMIT;
