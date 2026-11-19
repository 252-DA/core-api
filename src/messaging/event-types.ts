/** Outbox chuyển sự kiện này sang hàng đợi `answer_grading` của worker. */
export const ANSWER_GRADING_REQUESTED = 'ANSWER_GRADING_REQUESTED';
/** Outbox chuyển sự kiện này sang hàng đợi `essay_grading` của worker. */
export const ESSAY_GRADING_REQUESTED = 'ESSAY_GRADING_REQUESTED';
/** Outbox chuyển sự kiện này sang hàng đợi `answer_grading` của worker. */
export const MICRO_CONTENT_GRADING_REQUESTED =
  'MICRO_CONTENT_GRADING_REQUESTED';
/**
 * Lệnh outbox phát cùng transaction ghi đề cương: worker map lại chunk → LO của
 * học phần. OutboxService chuyển nó sang DOCUMENT_PROCESSING_QUEUE.
 * contracts/integration-events/v1/course-chunk-lo-remap-requested.json
 */
export const COURSE_CHUNK_LO_REMAP_REQUESTED =
  'COURSE_CHUNK_LO_REMAP_REQUESTED';
export const CONTENT_GENERATION_REQUESTED = 'CONTENT_GENERATION_REQUESTED';
export const MICRO_CONTENT_SCRIPT_REQUESTED = 'MICRO_CONTENT_SCRIPT_REQUESTED';
export const MICRO_CONTENT_RENDER_REQUESTED = 'MICRO_CONTENT_RENDER_REQUESTED';
export const DOCUMENT_DELETED = 'DOCUMENT_DELETED';
export const LESSON_PUBLISHED = 'LESSON_PUBLISHED';
