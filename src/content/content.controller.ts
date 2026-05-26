import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('api/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('documents/:documentId/cards')
  async getLessonCards(@Param('documentId') documentId: string) {
    return this.contentService.getLessonCards(documentId);
  }

  @Get('documents/:documentId/quiz')
  async getQuizItems(@Param('documentId') documentId: string) {
    return this.contentService.getQuizItems(documentId);
  }
}
