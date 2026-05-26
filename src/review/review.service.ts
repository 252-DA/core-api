import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async publishDocument(documentId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch document and verify status
      const doc = await tx.documents_metadata.findUnique({
        where: { document_id: documentId },
      });

      if (!doc) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      // Allow publishing if document is in processing COMPLETED or ENRICHED (which serves as draft states)
      if (doc.status !== 'COMPLETED' && doc.status !== 'ENRICHED' && doc.status !== 'GENERATED_DRAFT') {
        throw new BadRequestException(`Document in status '${doc.status}' cannot be published.`);
      }

      // 2. Flip status to PUBLISHED
      const updatedDoc = await tx.documents_metadata.update({
        where: { document_id: documentId },
        data: {
          status: 'PUBLISHED',
          updated_at: new Date(),
        },
      });

      // 3. Atomically write CardPublishedEvent / QuizPublishedEvent outbox event
      const eventId = randomUUID();
      await tx.outbox_events.create({
        data: {
          id: eventId,
          event_type: 'document_published',
          aggregate_id: documentId,
          payload_json: {
            document_id: documentId,
            course_id: doc.course_id,
            owner_id: doc.owner_id,
            status: 'PUBLISHED',
          },
          status: 'PENDING',
        },
      });

      return {
        document_id: documentId,
        status: 'PUBLISHED',
        outbox_event_id: eventId,
      };
    });
  }

  async archiveDocument(documentId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch document and verify status
      const doc = await tx.documents_metadata.findUnique({
        where: { document_id: documentId },
      });

      if (!doc) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      if (doc.status !== 'PUBLISHED') {
        throw new BadRequestException(`Only PUBLISHED documents can be archived. Current status: ${doc.status}`);
      }

      // 2. Flip status to ARCHIVED
      const updatedDoc = await tx.documents_metadata.update({
        where: { document_id: documentId },
        data: {
          status: 'ARCHIVED',
          updated_at: new Date(),
        },
      });

      // 3. Atomically write outbox event
      const eventId = randomUUID();
      await tx.outbox_events.create({
        data: {
          id: eventId,
          event_type: 'document_archived',
          aggregate_id: documentId,
          payload_json: {
            document_id: documentId,
            course_id: doc.course_id,
            owner_id: doc.owner_id,
            status: 'ARCHIVED',
          },
          status: 'PENDING',
        },
      });

      return {
        document_id: documentId,
        status: 'ARCHIVED',
        outbox_event_id: eventId,
      };
    });
  }
}
