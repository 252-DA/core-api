import { ReviewService } from './review.service';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    publishDocument(id: string): Promise<{
        document_id: string;
        status: string;
        outbox_event_id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    archiveDocument(id: string): Promise<{
        document_id: string;
        status: string;
        outbox_event_id: `${string}-${string}-${string}-${string}-${string}`;
    }>;
}
