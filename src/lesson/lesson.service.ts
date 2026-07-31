import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { OUTBOX_EVENT_TYPES } from '../outbox/outbox-event.constants';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(claims: BffClaims, courseId: string, status?: string) {
    await this.authz.assertCourseAccess(claims, courseId);
    return this.prisma.lessons.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
        ...(status ? { status } : {}),
      },
      include: { learning_outcomes: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async get(claims: BffClaims, lessonId: string) {
    const lesson = await this.prisma.lessons.findFirst({
      where: { lesson_id: lessonId, deleted_at: null },
      include: { learning_outcomes: { include: { chapters: true } } },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson not found: ${lessonId}`);
    }
    await this.authz.assertCourseAccess(claims, lesson.course_id);
    return lesson;
  }

  async cards(claims: BffClaims, lessonId: string, status?: string) {
    const lesson = await this.get(claims, lessonId);
    return this.prisma.lesson_cards.findMany({
      where: {
        lesson_id: lesson.lesson_id,
        deleted_at: null,
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async quiz(claims: BffClaims, lessonId: string, status?: string) {
    const lesson = await this.get(claims, lessonId);
    return this.prisma.quiz_items.findMany({
      where: {
        lesson_id: lesson.lesson_id,
        deleted_at: null,
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async publish(claims: BffClaims, lessonId: string) {
    const lesson = await this.get(claims, lessonId);
    await this.authz.assertCourseAccess(claims, lesson.course_id, [
      'instructor',
      'ta',
    ]);

    return this.prisma.$transaction(async (tx) => {
      const [cards, quizzes] = await Promise.all([
        tx.lesson_cards.findMany({
          where: { lesson_id: lessonId, status: 'APPROVED', deleted_at: null },
        }),
        tx.quiz_items.findMany({
          where: { lesson_id: lessonId, status: 'APPROVED', deleted_at: null },
        }),
      ]);

      if (cards.length + quizzes.length === 0) {
        throw new BadRequestException('no approved content');
      }

      await tx.lesson_cards.updateMany({
        where: { lesson_id: lessonId, status: 'APPROVED', deleted_at: null },
        data: { status: 'PUBLISHED', published_at: new Date(), updated_at: new Date() },
      });
      await tx.quiz_items.updateMany({
        where: { lesson_id: lessonId, status: 'APPROVED', deleted_at: null },
        data: { status: 'PUBLISHED', published_at: new Date(), updated_at: new Date() },
      });

      const updatedLesson = await tx.lessons.update({
        where: { lesson_id: lessonId },
        data: { status: 'PUBLISHED', published_at: new Date(), updated_at: new Date() },
      });

      await tx.review_audit_logs.create({
        data: {
          action: 'PUBLISH_LESSON',
          entity_type: 'lesson',
          entity_id: lessonId,
          performed_by: claims.sub,
          raw_changes: {
            cards_published: cards.map((card) => card.card_id),
            quiz_items_published: quizzes.map((quiz) => quiz.quiz_id),
          },
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: OUTBOX_EVENT_TYPES.LESSON_PUBLISHED,
          aggregate_type: 'lesson',
          aggregate_id: lessonId,
          payload: {
            lesson_id: lessonId,
            course_id: lesson.course_id,
            card_ids: cards.map((card) => card.card_id),
            quiz_ids: quizzes.map((quiz) => quiz.quiz_id),
          },
        },
      });

      return updatedLesson;
    });
  }
}
