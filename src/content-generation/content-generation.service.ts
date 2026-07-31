import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { OUTBOX_EVENT_TYPES } from '../outbox/outbox-event.constants';

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async createRequest(
    claims: BffClaims,
    body: { courseId: string; type: 'card' | 'quiz'; scope: Record<string, unknown> },
  ) {
    await this.authz.assertCourseAccess(claims, body.courseId, [
      'instructor',
      'ta',
    ]);

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.content_generation_requests.create({
        data: {
          course_id: body.courseId,
          requested_by: claims.sub,
          type: body.type,
          scope: body.scope as Prisma.InputJsonValue,
          status: 'QUEUED',
        },
      });

      await tx.outbox_events.create({
        data: {
          event_type: OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED,
          aggregate_type: 'content_generation_request',
          aggregate_id: request.request_id,
          payload: {
            request_id: request.request_id,
            course_id: body.courseId,
            type: body.type,
            scope: body.scope,
          } as Prisma.InputJsonValue,
        },
      });

      return request;
    });
  }
}
