import { Controller, Post, Param } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('api/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('documents/:id/publish')
  async publishDocument(@Param('id') id: string) {
    return this.reviewService.publishDocument(id);
  }

  @Post('documents/:id/archive')
  async archiveDocument(@Param('id') id: string) {
    return this.reviewService.archiveDocument(id);
  }
}
