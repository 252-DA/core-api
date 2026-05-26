import { ContentService } from './content.service';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    getLessonCards(documentId: string): Promise<{
        title: string;
        created_at: Date;
        document_id: string;
        heading_path: string[];
        id: string;
        primary_chunk_id: string;
        source_chunk_ids: string[];
        bullets: string[];
        key_insight: string | null;
        card_index: number;
        model_id: string | null;
    }[]>;
    getQuizItems(documentId: string): Promise<({
        assessments: {
            assessment_id: string;
            course_id: string;
            code: string;
            name_vi: string;
            name_en: string | null;
            category: string;
            weight: number | null;
        } | null;
        learning_outcomes: {
            course_id: string;
            code: string;
            lo_id: string;
            parent_code: string | null;
            statement_vi: string;
            statement_en: string | null;
            bloom_level: string | null;
            cdio_level: number | null;
        } | null;
    } & {
        assessment_id: string | null;
        created_at: Date;
        document_id: string;
        lo_id: string | null;
        heading_path: string[];
        id: string;
        bloom_level: string | null;
        primary_chunk_id: string;
        source_chunk_ids: string[];
        model_id: string | null;
        question: string;
        choices: string[];
        correct_index: number;
        explanation: string | null;
        difficulty: string;
        question_index: number;
    })[]>;
}
