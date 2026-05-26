"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineExtension = exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.SortOrder = exports.Quiz_itemsScalarFieldEnum = exports.Outbox_eventsScalarFieldEnum = exports.Lo_assessmentsScalarFieldEnum = exports.Lms_user_mappingsScalarFieldEnum = exports.Lms_course_refScalarFieldEnum = exports.Lesson_cardsScalarFieldEnum = exports.Learning_outcomesScalarFieldEnum = exports.Documents_metadataScalarFieldEnum = exports.CoursesScalarFieldEnum = exports.ConceptsScalarFieldEnum = exports.Chunks_metadataScalarFieldEnum = exports.Chunk_lo_mappingsScalarFieldEnum = exports.Chunk_contentsScalarFieldEnum = exports.Chunk_conceptsScalarFieldEnum = exports.ChaptersScalarFieldEnum = exports.AssessmentsScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = __importStar(require("@prisma/client/runtime/client"));
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.8.0",
    engine: "3c6e192761c0362d496ed980de936e2f3cebcd3a"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    assessments: 'assessments',
    chapters: 'chapters',
    chunk_concepts: 'chunk_concepts',
    chunk_contents: 'chunk_contents',
    chunk_lo_mappings: 'chunk_lo_mappings',
    chunks_metadata: 'chunks_metadata',
    concepts: 'concepts',
    courses: 'courses',
    documents_metadata: 'documents_metadata',
    learning_outcomes: 'learning_outcomes',
    lesson_cards: 'lesson_cards',
    lms_course_ref: 'lms_course_ref',
    lms_user_mappings: 'lms_user_mappings',
    lo_assessments: 'lo_assessments',
    outbox_events: 'outbox_events',
    quiz_items: 'quiz_items'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.AssessmentsScalarFieldEnum = {
    assessment_id: 'assessment_id',
    course_id: 'course_id',
    code: 'code',
    name_vi: 'name_vi',
    name_en: 'name_en',
    category: 'category',
    weight: 'weight'
};
exports.ChaptersScalarFieldEnum = {
    chapter_id: 'chapter_id',
    course_id: 'course_id',
    code: 'code',
    title: 'title',
    order_index: 'order_index'
};
exports.Chunk_conceptsScalarFieldEnum = {
    chunk_id: 'chunk_id',
    concept_id: 'concept_id',
    confidence: 'confidence',
    source: 'source',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Chunk_contentsScalarFieldEnum = {
    chunk_id: 'chunk_id',
    document_id: 'document_id',
    content_text: 'content_text',
    embedding_input: 'embedding_input',
    updated_at: 'updated_at'
};
exports.Chunk_lo_mappingsScalarFieldEnum = {
    chunk_id: 'chunk_id',
    lo_id: 'lo_id',
    confidence: 'confidence',
    source: 'source',
    created_at: 'created_at'
};
exports.Chunks_metadataScalarFieldEnum = {
    chunk_id: 'chunk_id',
    document_id: 'document_id',
    chunk_index: 'chunk_index',
    heading_path: 'heading_path',
    heading_level: 'heading_level',
    page_number: 'page_number',
    content_length: 'content_length',
    language: 'language',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.ConceptsScalarFieldEnum = {
    id: 'id',
    name: 'name',
    canonical_name: 'canonical_name',
    slug: 'slug',
    domain: 'domain',
    category: 'category',
    language: 'language',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.CoursesScalarFieldEnum = {
    course_id: 'course_id',
    code: 'code',
    title_vi: 'title_vi',
    title_en: 'title_en',
    credits: 'credits',
    semester: 'semester',
    source_document_id: 'source_document_id',
    extraction_confidence: 'extraction_confidence',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Documents_metadataScalarFieldEnum = {
    document_id: 'document_id',
    document_name: 'document_name',
    doc_type: 'doc_type',
    mime_type: 'mime_type',
    size_bytes: 'size_bytes',
    storage_key: 'storage_key',
    course_id: 'course_id',
    owner_id: 'owner_id',
    language: 'language',
    status: 'status',
    error_msg: 'error_msg',
    metadata_json: 'metadata_json',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Learning_outcomesScalarFieldEnum = {
    lo_id: 'lo_id',
    course_id: 'course_id',
    code: 'code',
    parent_code: 'parent_code',
    statement_vi: 'statement_vi',
    statement_en: 'statement_en',
    bloom_level: 'bloom_level',
    cdio_level: 'cdio_level'
};
exports.Lesson_cardsScalarFieldEnum = {
    id: 'id',
    document_id: 'document_id',
    primary_chunk_id: 'primary_chunk_id',
    source_chunk_ids: 'source_chunk_ids',
    heading_path: 'heading_path',
    title: 'title',
    bullets: 'bullets',
    key_insight: 'key_insight',
    card_index: 'card_index',
    model_id: 'model_id',
    created_at: 'created_at'
};
exports.Lms_course_refScalarFieldEnum = {
    id: 'id',
    lms_type: 'lms_type',
    lms_course_id: 'lms_course_id',
    course_id: 'course_id',
    created_at: 'created_at'
};
exports.Lms_user_mappingsScalarFieldEnum = {
    id: 'id',
    lms_type: 'lms_type',
    lms_user_id: 'lms_user_id',
    internal_user_id: 'internal_user_id',
    email: 'email',
    display_name: 'display_name',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Lo_assessmentsScalarFieldEnum = {
    lo_id: 'lo_id',
    assessment_id: 'assessment_id'
};
exports.Outbox_eventsScalarFieldEnum = {
    id: 'id',
    event_type: 'event_type',
    aggregate_id: 'aggregate_id',
    payload_json: 'payload_json',
    status: 'status',
    attempts: 'attempts',
    error_msg: 'error_msg',
    created_at: 'created_at',
    updated_at: 'updated_at'
};
exports.Quiz_itemsScalarFieldEnum = {
    id: 'id',
    document_id: 'document_id',
    primary_chunk_id: 'primary_chunk_id',
    source_chunk_ids: 'source_chunk_ids',
    heading_path: 'heading_path',
    question: 'question',
    choices: 'choices',
    correct_index: 'correct_index',
    explanation: 'explanation',
    difficulty: 'difficulty',
    question_index: 'question_index',
    model_id: 'model_id',
    created_at: 'created_at',
    lo_id: 'lo_id',
    assessment_id: 'assessment_id',
    bloom_level: 'bloom_level'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
exports.defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map