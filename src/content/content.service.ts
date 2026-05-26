import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonCards(documentId: string) {
    // Check if document exists
    const doc = await this.prisma.documents_metadata.findUnique({
      where: { document_id: documentId },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    return this.prisma.lesson_cards.findMany({
      where: { document_id: documentId },
      orderBy: { card_index: 'asc' },
    });
  }

  async getQuizItems(documentId: string) {
    // Check if document exists
    const doc = await this.prisma.documents_metadata.findUnique({
      where: { document_id: documentId },
    });
    if (!doc) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    return this.prisma.quiz_items.findMany({
      where: { document_id: documentId },
      orderBy: { question_index: 'asc' },
      include: {
        learning_outcomes: true,
        assessments: true,
      },
    });
  }
}
