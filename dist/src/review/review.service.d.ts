import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    publishDocument(documentId: string): Promise<{
        document_id: string;
        status: string;
        outbox_event_id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    archiveDocument(documentId: string): Promise<{
        document_id: string;
        status: string;
        outbox_event_id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
}
