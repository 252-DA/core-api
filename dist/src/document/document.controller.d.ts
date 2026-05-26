import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    listDocuments(courseId?: string, limit?: string, offset?: string): Promise<{
        document_id: string;
        document_name: string;
        doc_type: string;
        mime_type: string;
        size_bytes: number;
        storage_key: string | null;
        course_id: string | null;
        owner_id: string | null;
        language: string | null;
        status: string;
        error_msg: string | null;
        metadata_json: import("@prisma/client/runtime/client").JsonValue;
        created_at: Date;
        updated_at: Date;
        chunks_count: number;
    }[]>;
    getDocument(id: string): Promise<{
        document_id: string;
        document_name: string;
        doc_type: string;
        mime_type: string;
        size_bytes: number;
        storage_key: string | null;
        course_id: string | null;
        owner_id: string | null;
        language: string | null;
        status: string;
        error_msg: string | null;
        metadata_json: import("@prisma/client/runtime/client").JsonValue;
        created_at: Date;
        updated_at: Date;
        chunks_count: number;
    }>;
    getDocumentChunks(id: string): Promise<({
        chunk_contents: {
            chunk_id: string;
            updated_at: Date;
            document_id: string;
            content_text: string;
            embedding_input: string | null;
        } | null;
    } & {
        chunk_id: string;
        created_at: Date;
        updated_at: Date;
        document_id: string;
        chunk_index: number;
        heading_path: string[];
        heading_level: number;
        page_number: number | null;
        content_length: number;
        language: string | null;
    })[]>;
    registerAndProcess(body: {
        document_id?: string;
        document_name: string;
        doc_type: string;
        mime_type: string;
        size_bytes: number;
        storage_key: string;
        course_id?: string;
        owner_id?: string;
        language?: string;
        metadata_json?: any;
    }): Promise<{
        document_id: string;
        status: string;
        job_id: string | undefined;
    }>;
    triggerEnrichment(id: string): Promise<{
        document_id: string;
        status: string;
        enrichment_job_id: string | undefined;
    }>;
    deleteDocument(id: string): Promise<{
        document_id: string;
        success: boolean;
        message: string;
    }>;
}
