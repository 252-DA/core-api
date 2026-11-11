/** Hàng đợi document worker nghe (worker/worker/runners/document_worker.py). */
export const DOCUMENT_PROCESSING_QUEUE = 'document_processing';

/** Job xếp thẳng (không qua outbox) khi tạo một lần nạp đề cương. */
export const CURRICULUM_PREVIEW_JOB = 'curriculum_preview';

/**
 * Lệnh outbox phát cùng transaction ghi đề cương: worker map lại chunk → LO của
 * học phần. OutboxService chuyển nó sang DOCUMENT_PROCESSING_QUEUE.
 * contracts/integration-events/v1/course-chunk-lo-remap-requested.json
 */
export const COURSE_CHUNK_LO_REMAP_REQUESTED =
  'COURSE_CHUNK_LO_REMAP_REQUESTED';
