/**
 * Khớp WORKER_RESULT_KINDS ở worker/worker/services/result_publisher.py và enum
 * `kind` của contracts/integration-events/v1/worker-result-envelope.json; test
 * hai phía đối chiếu với schema.
 */
export const WORKER_RESULT_KINDS = [
  'QUIZ_GRADING_RESULT',
  'MICRO_CONTENT_GRADING_RESULT',
  'ESSAY_GRADING_RESULT',
  'CONTENT_GENERATION_RESULT',
  'ENRICHMENT_CONTENT_RESULT',
  'CURRICULUM_IMPORT_RESULT',
  'MICRO_CONTENT_VIDEO_RESULT',
  'DOCUMENT_PROCESSING_RESULT',
] as const;

export type WorkerResultKind = (typeof WORKER_RESULT_KINDS)[number];

export function isWorkerResultKind(value: unknown): value is WorkerResultKind {
  return (
    typeof value === 'string' &&
    (WORKER_RESULT_KINDS as readonly string[]).includes(value)
  );
}
