/** Hàng đợi kết quả worker → core-api: consumer duy nhất ghi bảng nghiệp vụ. */
export const WORKER_RESULTS_QUEUE = 'worker_results';
/** Hàng đợi document worker nghe (worker/worker/runners/document_worker.py). */
export const DOCUMENT_PROCESSING_QUEUE = 'document_processing';
export const DOCUMENT_ENRICHMENT_QUEUE = 'document_enrichment';
export const CONTENT_GENERATION_QUEUE = 'content_generation';
export const ANSWER_GRADING_QUEUE = 'answer_grading';
export const ESSAY_GRADING_QUEUE = 'essay_grading';
export const CANVAS_SYNC_QUEUE = 'canvas_sync';
export const MICRO_CONTENT_VIDEO_QUEUE = 'micro_content_video';
export const OUTBOX_RELAY_QUEUE = 'outbox_relay';
