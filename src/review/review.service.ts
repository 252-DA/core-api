import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';

const DRAFT_STATUSES = ['GENERATED_DRAFT', 'REVIEWING', 'CHANGES_REQUESTED'];

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async listDrafts(claims: BffClaims, courseId: string, kind?: 'card' | 'quiz') {
    await this.authz.assertCourseAccess(claims, courseId, [
      'instructor',
      'ta',
    ]);

    const [cards, quizItems] = await Promise.all([
      kind === 'quiz'
        ? Promise.resolve([])
        : this.prisma.lesson_cards.findMany({
            where: {
              course_id: courseId,
              status: { in: DRAFT_STATUSES },
              deleted_at: null,
            },
            include: { lessons: true, learning_outcomes: true },
            orderBy: { created_at: 'asc' },
          }),
      kind === 'card'
        ? Promise.resolve([])
        : this.prisma.quiz_items.findMany({
            where: {
              course_id: courseId,
              status: { in: DRAFT_STATUSES },
              deleted_at: null,
            },
            include: { lessons: true, learning_outcomes: true },
            orderBy: { created_at: 'asc' },
          }),
    ]);

    return { cards, quizItems };
  }

  async approveCard(claims: BffClaims, cardId: string) {
    const card = await this.getCardForReview(claims, cardId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lesson_cards.update({
        where: { card_id: cardId },
        data: { status: 'APPROVED', updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'APPROVE_CARD',
          entity_type: 'lesson_card',
          entity_id: cardId,
          performed_by: claims.sub,
          raw_changes: { before: card.status, after: 'APPROVED' },
        },
      });
      return updated;
    });
  }

  async rejectCard(claims: BffClaims, cardId: string, reason?: string) {
    const card = await this.getCardForReview(claims, cardId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lesson_cards.update({
        where: { card_id: cardId },
        data: { status: 'CHANGES_REQUESTED', updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'REJECT_CARD',
          entity_type: 'lesson_card',
          entity_id: cardId,
          performed_by: claims.sub,
          raw_changes: { before: card.status, after: 'CHANGES_REQUESTED', reason },
        },
      });
      return updated;
    });
  }

  async updateCard(claims: BffClaims, cardId: string, content: unknown) {
    const card = await this.getCardForReview(claims, cardId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lesson_cards.update({
        where: { card_id: cardId },
        data: { content: content as any, status: 'REVIEWING', updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'EDIT_CARD',
          entity_type: 'lesson_card',
          entity_id: cardId,
          performed_by: claims.sub,
          raw_changes: {
            before: card.content,
            after: content,
          } as Prisma.InputJsonValue,
        },
      });
      return updated;
    });
  }

  async approveQuizItem(claims: BffClaims, quizId: string) {
    const quiz = await this.getQuizForReview(claims, quizId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quiz_items.update({
        where: { quiz_id: quizId },
        data: { status: 'APPROVED', updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'APPROVE_QUIZ',
          entity_type: 'quiz_item',
          entity_id: quizId,
          performed_by: claims.sub,
          raw_changes: { before: quiz.status, after: 'APPROVED' },
        },
      });
      return updated;
    });
  }

  async rejectQuizItem(claims: BffClaims, quizId: string, reason?: string) {
    const quiz = await this.getQuizForReview(claims, quizId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quiz_items.update({
        where: { quiz_id: quizId },
        data: { status: 'CHANGES_REQUESTED', updated_at: new Date() },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'REJECT_QUIZ',
          entity_type: 'quiz_item',
          entity_id: quizId,
          performed_by: claims.sub,
          raw_changes: { before: quiz.status, after: 'CHANGES_REQUESTED', reason },
        },
      });
      return updated;
    });
  }

  async updateQuizItem(
    claims: BffClaims,
    quizId: string,
    data: { question?: string; options?: unknown; correct_answer?: unknown; explanation?: string },
  ) {
    const quiz = await this.getQuizForReview(claims, quizId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quiz_items.update({
        where: { quiz_id: quizId },
        data: {
          question: data.question,
          options: data.options as any,
          correct_answer: data.correct_answer as any,
          explanation: data.explanation,
          status: 'REVIEWING',
          updated_at: new Date(),
        },
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'EDIT_QUIZ',
          entity_type: 'quiz_item',
          entity_id: quizId,
          performed_by: claims.sub,
          raw_changes: {
            before: quiz,
            after: data,
          } as Prisma.InputJsonValue,
        },
      });
      return updated;
    });
  }

  private async getCardForReview(claims: BffClaims, cardId: string) {
    const card = await this.prisma.lesson_cards.findFirst({
      where: { card_id: cardId, deleted_at: null },
    });
    if (!card) {
      throw new NotFoundException(`Card not found: ${cardId}`);
    }
    await this.authz.assertCourseAccess(claims, card.course_id, [
      'instructor',
      'ta',
    ]);
    return card;
  }

  private async getQuizForReview(claims: BffClaims, quizId: string) {
    const quiz = await this.prisma.quiz_items.findFirst({
      where: { quiz_id: quizId, deleted_at: null },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz item not found: ${quizId}`);
    }
    await this.authz.assertCourseAccess(claims, quiz.course_id, [
      'instructor',
      'ta',
    ]);
    return quiz;
  }
}
