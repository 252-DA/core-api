import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: import("@prisma/client/runtime/client").DbNullClass;
export declare const JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
export declare const AnyNull: import("@prisma/client/runtime/client").AnyNullClass;
export declare const ModelName: {
    readonly assessments: "assessments";
    readonly chapters: "chapters";
    readonly chunk_concepts: "chunk_concepts";
    readonly chunk_contents: "chunk_contents";
    readonly chunk_lo_mappings: "chunk_lo_mappings";
    readonly chunks_metadata: "chunks_metadata";
    readonly concepts: "concepts";
    readonly courses: "courses";
    readonly documents_metadata: "documents_metadata";
    readonly learning_outcomes: "learning_outcomes";
    readonly lesson_cards: "lesson_cards";
    readonly lms_course_ref: "lms_course_ref";
    readonly lms_user_mappings: "lms_user_mappings";
    readonly lo_assessments: "lo_assessments";
    readonly outbox_events: "outbox_events";
    readonly quiz_items: "quiz_items";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const AssessmentsScalarFieldEnum: {
    readonly assessment_id: "assessment_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly name_vi: "name_vi";
    readonly name_en: "name_en";
    readonly category: "category";
    readonly weight: "weight";
};
export type AssessmentsScalarFieldEnum = (typeof AssessmentsScalarFieldEnum)[keyof typeof AssessmentsScalarFieldEnum];
export declare const ChaptersScalarFieldEnum: {
    readonly chapter_id: "chapter_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly title: "title";
    readonly order_index: "order_index";
};
export type ChaptersScalarFieldEnum = (typeof ChaptersScalarFieldEnum)[keyof typeof ChaptersScalarFieldEnum];
export declare const Chunk_conceptsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly concept_id: "concept_id";
    readonly confidence: "confidence";
    readonly source: "source";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Chunk_conceptsScalarFieldEnum = (typeof Chunk_conceptsScalarFieldEnum)[keyof typeof Chunk_conceptsScalarFieldEnum];
export declare const Chunk_contentsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly document_id: "document_id";
    readonly content_text: "content_text";
    readonly embedding_input: "embedding_input";
    readonly updated_at: "updated_at";
};
export type Chunk_contentsScalarFieldEnum = (typeof Chunk_contentsScalarFieldEnum)[keyof typeof Chunk_contentsScalarFieldEnum];
export declare const Chunk_lo_mappingsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly lo_id: "lo_id";
    readonly confidence: "confidence";
    readonly source: "source";
    readonly created_at: "created_at";
};
export type Chunk_lo_mappingsScalarFieldEnum = (typeof Chunk_lo_mappingsScalarFieldEnum)[keyof typeof Chunk_lo_mappingsScalarFieldEnum];
export declare const Chunks_metadataScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly document_id: "document_id";
    readonly chunk_index: "chunk_index";
    readonly heading_path: "heading_path";
    readonly heading_level: "heading_level";
    readonly page_number: "page_number";
    readonly content_length: "content_length";
    readonly language: "language";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Chunks_metadataScalarFieldEnum = (typeof Chunks_metadataScalarFieldEnum)[keyof typeof Chunks_metadataScalarFieldEnum];
export declare const ConceptsScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly canonical_name: "canonical_name";
    readonly slug: "slug";
    readonly domain: "domain";
    readonly category: "category";
    readonly language: "language";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type ConceptsScalarFieldEnum = (typeof ConceptsScalarFieldEnum)[keyof typeof ConceptsScalarFieldEnum];
export declare const CoursesScalarFieldEnum: {
    readonly course_id: "course_id";
    readonly code: "code";
    readonly title_vi: "title_vi";
    readonly title_en: "title_en";
    readonly credits: "credits";
    readonly semester: "semester";
    readonly source_document_id: "source_document_id";
    readonly extraction_confidence: "extraction_confidence";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type CoursesScalarFieldEnum = (typeof CoursesScalarFieldEnum)[keyof typeof CoursesScalarFieldEnum];
export declare const Documents_metadataScalarFieldEnum: {
    readonly document_id: "document_id";
    readonly document_name: "document_name";
    readonly doc_type: "doc_type";
    readonly mime_type: "mime_type";
    readonly size_bytes: "size_bytes";
    readonly storage_key: "storage_key";
    readonly course_id: "course_id";
    readonly owner_id: "owner_id";
    readonly language: "language";
    readonly status: "status";
    readonly error_msg: "error_msg";
    readonly metadata_json: "metadata_json";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Documents_metadataScalarFieldEnum = (typeof Documents_metadataScalarFieldEnum)[keyof typeof Documents_metadataScalarFieldEnum];
export declare const Learning_outcomesScalarFieldEnum: {
    readonly lo_id: "lo_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly parent_code: "parent_code";
    readonly statement_vi: "statement_vi";
    readonly statement_en: "statement_en";
    readonly bloom_level: "bloom_level";
    readonly cdio_level: "cdio_level";
};
export type Learning_outcomesScalarFieldEnum = (typeof Learning_outcomesScalarFieldEnum)[keyof typeof Learning_outcomesScalarFieldEnum];
export declare const Lesson_cardsScalarFieldEnum: {
    readonly id: "id";
    readonly document_id: "document_id";
    readonly primary_chunk_id: "primary_chunk_id";
    readonly source_chunk_ids: "source_chunk_ids";
    readonly heading_path: "heading_path";
    readonly title: "title";
    readonly bullets: "bullets";
    readonly key_insight: "key_insight";
    readonly card_index: "card_index";
    readonly model_id: "model_id";
    readonly created_at: "created_at";
};
export type Lesson_cardsScalarFieldEnum = (typeof Lesson_cardsScalarFieldEnum)[keyof typeof Lesson_cardsScalarFieldEnum];
export declare const Lms_course_refScalarFieldEnum: {
    readonly id: "id";
    readonly lms_type: "lms_type";
    readonly lms_course_id: "lms_course_id";
    readonly course_id: "course_id";
    readonly created_at: "created_at";
};
export type Lms_course_refScalarFieldEnum = (typeof Lms_course_refScalarFieldEnum)[keyof typeof Lms_course_refScalarFieldEnum];
export declare const Lms_user_mappingsScalarFieldEnum: {
    readonly id: "id";
    readonly lms_type: "lms_type";
    readonly lms_user_id: "lms_user_id";
    readonly internal_user_id: "internal_user_id";
    readonly email: "email";
    readonly display_name: "display_name";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Lms_user_mappingsScalarFieldEnum = (typeof Lms_user_mappingsScalarFieldEnum)[keyof typeof Lms_user_mappingsScalarFieldEnum];
export declare const Lo_assessmentsScalarFieldEnum: {
    readonly lo_id: "lo_id";
    readonly assessment_id: "assessment_id";
};
export type Lo_assessmentsScalarFieldEnum = (typeof Lo_assessmentsScalarFieldEnum)[keyof typeof Lo_assessmentsScalarFieldEnum];
export declare const Outbox_eventsScalarFieldEnum: {
    readonly id: "id";
    readonly event_type: "event_type";
    readonly aggregate_id: "aggregate_id";
    readonly payload_json: "payload_json";
    readonly status: "status";
    readonly attempts: "attempts";
    readonly error_msg: "error_msg";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Outbox_eventsScalarFieldEnum = (typeof Outbox_eventsScalarFieldEnum)[keyof typeof Outbox_eventsScalarFieldEnum];
export declare const Quiz_itemsScalarFieldEnum: {
    readonly id: "id";
    readonly document_id: "document_id";
    readonly primary_chunk_id: "primary_chunk_id";
    readonly source_chunk_ids: "source_chunk_ids";
    readonly heading_path: "heading_path";
    readonly question: "question";
    readonly choices: "choices";
    readonly correct_index: "correct_index";
    readonly explanation: "explanation";
    readonly difficulty: "difficulty";
    readonly question_index: "question_index";
    readonly model_id: "model_id";
    readonly created_at: "created_at";
    readonly lo_id: "lo_id";
    readonly assessment_id: "assessment_id";
    readonly bloom_level: "bloom_level";
};
export type Quiz_itemsScalarFieldEnum = (typeof Quiz_itemsScalarFieldEnum)[keyof typeof Quiz_itemsScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client/runtime/client").DbNullClass;
    readonly JsonNull: import("@prisma/client/runtime/client").JsonNullClass;
    readonly AnyNull: import("@prisma/client/runtime/client").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
