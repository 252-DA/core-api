import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LaunchSyncDto } from './dto/launch-sync.dto';

function stableCourseCode(lmsType: string, lmsContextId: string) {
  const hash = createHash('sha256')
    .update(`${lmsType}:${lmsContextId}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
  return `LMS-${hash}`;
}

function nullableUuid(value?: string) {
  return value && /^[0-9a-fA-F-]{36}$/.test(value) ? value : null;
}

@Injectable()
export class LtiService {
  constructor(private readonly prisma: PrismaService) {}

  async syncLaunch(dto: LaunchSyncDto) {
    if (!dto.lmsContextId?.trim()) {
      throw new BadRequestException('lmsContextId is required');
    }

    const lmsContextId = dto.lmsContextId.trim();
    const lmsCourseKey = `${dto.lmsType}:${lmsContextId}`;
    const displayName = dto.displayName?.trim() || dto.lmsSub;
    const contextTitle = dto.contextTitle?.trim() || `LMS Course ${lmsContextId}`;
    const customClaims = (dto.customClaims || {}) as Prisma.InputJsonValue;

    return this.prisma.$transaction(async (tx) => {
      const userMapping = await tx.lms_user_mappings.upsert({
        where: {
          lms_type_lms_sub: {
            lms_type: dto.lmsType,
            lms_sub: dto.lmsSub,
          },
        },
        create: {
          lms_type: dto.lmsType,
          lms_sub: dto.lmsSub,
          display_name: displayName,
          role: dto.role,
        },
        update: {
          display_name: displayName,
          role: dto.role,
          updated_at: new Date(),
          deleted_at: null,
        },
      });

      const course = await tx.courses.upsert({
        where: { lms_id: lmsCourseKey },
        create: {
          lms_id: lmsCourseKey,
          code: stableCourseCode(dto.lmsType, lmsContextId),
          name: contextTitle,
        },
        update: {
          name: contextTitle,
          updated_at: new Date(),
          deleted_at: null,
        },
      });

      let courseRef = await tx.lms_course_ref.findFirst({
        where: {
          course_id: course.course_id,
          lms_context_id: lmsContextId,
          deleted_at: null,
        },
      });

      if (!courseRef) {
        courseRef = await tx.lms_course_ref.create({
          data: {
            course_id: course.course_id,
            lms_context_id: lmsContextId,
            lms_custom_settings: customClaims,
          },
        });
      } else {
        courseRef = await tx.lms_course_ref.update({
          where: { course_ref_id: courseRef.course_ref_id },
          data: {
            lms_custom_settings: customClaims,
            synced_at: new Date(),
          },
        });
      }

      await tx.course_memberships.upsert({
        where: {
          user_id_course_id_role: {
            user_id: userMapping.internal_user_id,
            course_id: course.course_id,
            role: dto.courseRole,
          },
        },
        create: {
          user_id: userMapping.internal_user_id,
          course_id: course.course_id,
          role: dto.courseRole,
        },
        update: {
          last_seen_at: new Date(),
        },
      });

      let internalResourceLinkId: string | undefined;
      if (dto.resourceLinkId && dto.targetKind) {
        const resourceLink = await tx.lti_resource_links.upsert({
          where: {
            course_ref_id_lms_resource_link_id: {
              course_ref_id: courseRef.course_ref_id,
              lms_resource_link_id: dto.resourceLinkId,
            },
          },
          create: {
            course_ref_id: courseRef.course_ref_id,
            lms_resource_link_id: dto.resourceLinkId,
            target_kind: dto.targetKind,
            target_id: nullableUuid(dto.targetId),
            custom_claims: customClaims,
          },
          update: {
            target_kind: dto.targetKind,
            target_id: nullableUuid(dto.targetId),
            custom_claims: customClaims,
            deleted_at: null,
          },
        });
        internalResourceLinkId = resourceLink.resource_link_id;

        if (dto.agsLineItemUrl) {
          await tx.lti_line_items.upsert({
            where: { resource_link_id: resourceLink.resource_link_id },
            create: {
              resource_link_id: resourceLink.resource_link_id,
              lms_line_item_url: dto.agsLineItemUrl,
              score_maximum: dto.agsScoreMaximum || 100,
              label: dto.agsLabel || contextTitle,
            },
            update: {
              lms_line_item_url: dto.agsLineItemUrl,
              score_maximum: dto.agsScoreMaximum || 100,
              label: dto.agsLabel || contextTitle,
              deleted_at: null,
            },
          });
        }
      }

      return {
        internalUserId: userMapping.internal_user_id,
        internalCourseId: course.course_id,
        courseRole: dto.courseRole,
        lmsCourseRefId: courseRef.course_ref_id,
        ...(internalResourceLinkId && { resourceLinkId: internalResourceLinkId }),
      };
    });
  }
}
