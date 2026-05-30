import { Injectable } from '@nestjs/common';
import { LessonService } from '../lesson/lesson.service';
import type { BffClaims } from '../auth/bff-claims';

@Injectable()
export class ContentService {
  constructor(private readonly lessonService: LessonService) {}

  async getLessonCards(claims: BffClaims, lessonId: string) {
    return this.lessonService.cards(claims, lessonId, 'PUBLISHED');
  }

  async getQuizItems(claims: BffClaims, lessonId: string) {
    return this.lessonService.quiz(claims, lessonId, 'PUBLISHED');
  }
}
