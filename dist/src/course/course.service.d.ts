import { PrismaService } from '../prisma/prisma.service';
export declare class CourseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listCourses(): Promise<{
        course_id: string;
        code: string;
        created_at: Date;
        updated_at: Date;
        title_vi: string;
        title_en: string | null;
        credits: number | null;
        semester: string | null;
        source_document_id: string | null;
        extraction_confidence: number;
    }[]>;
    getCourse(courseId: string): Promise<{
        course_id: string;
        code: string;
        created_at: Date;
        updated_at: Date;
        title_vi: string;
        title_en: string | null;
        credits: number | null;
        semester: string | null;
        source_document_id: string | null;
        extraction_confidence: number;
    }>;
    createCourse(data: {
        course_id: string;
        code: string;
        title_vi: string;
        title_en?: string;
        credits?: number;
        semester?: string;
    }): Promise<{
        course_id: string;
        code: string;
        created_at: Date;
        updated_at: Date;
        title_vi: string;
        title_en: string | null;
        credits: number | null;
        semester: string | null;
        source_document_id: string | null;
        extraction_confidence: number;
    }>;
    getChapters(courseId: string): Promise<{
        course_id: string;
        code: string;
        chapter_id: string;
        title: string;
        order_index: number;
    }[]>;
    getLearningOutcomes(courseId: string): Promise<{
        course_id: string;
        code: string;
        lo_id: string;
        parent_code: string | null;
        statement_vi: string;
        statement_en: string | null;
        bloom_level: string | null;
        cdio_level: number | null;
    }[]>;
    getAssessments(courseId: string): Promise<{
        assessment_id: string;
        course_id: string;
        code: string;
        name_vi: string;
        name_en: string | null;
        category: string;
        weight: number | null;
    }[]>;
}
