import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LaunchSyncDto } from './dto/launch-sync.dto';
import { CanvasSyncJobsService } from '../canvas-sync/jobs/canvas-sync-jobs.service';
import { CanvasApiClient } from '../../integrations/canvas/canvas-api.client';
import { describeCanvasError } from '../../integrations/canvas/canvas-errors';
import {
  assignmentSettingsFromClaims,
  type CanvasAssignmentSettings as AssignmentSettings,
} from './canvas-assignment-settings';
import {
  CourseRosterRepository,
  canvasNumericId,
} from '../roster/course-roster.repository';

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

/**
 * Cột cài đặt Assignment của resource link. Ngày/lần làm null là giá trị thật
 * ("Canvas không đặt"), nên ghi cả khi null; assignment_synced_at đánh dấu từ
 * đây Canvas là nguồn của hạn, giờ mở/đóng và số lần làm. `syncedAt` null nghĩa
 * là chưa chốt (đang chờ đẩy số lần làm sang Canvas): không ghi cột đó, cài đặt
 * của DA vẫn còn hiệu lực.
 */
function assignmentColumns(
  assignment: AssignmentSettings | null,
  syncedAt: Date | null,
) {
  if (!assignment) return {};
  return {
    canvas_assignment_id: assignment.canvasAssignmentId,
    assignment_due_at: assignment.dueAt,
    assignment_unlock_at: assignment.unlockAt,
    assignment_lock_at: assignment.lockAt,
    assignment_allowed_attempts: assignment.allowedAttempts,
    ...(syncedAt ? { assignment_synced_at: syncedAt } : {}),
  };
}

/** Giới hạn lần làm của DA cần đẩy sang Canvas sau khi giao dịch launch commit. */
interface AttemptsSeed {
  resourceLinkId: string;
  canvasAssignmentId: string;
  attempts: number;
}

/** Body LaunchSync đã qua LaunchSyncDto (class-validator); hàm này kiểm thêm dạng URL http(s). */
function nrpsUrl(value: unknown) {
  const url = typeof value === 'string' ? value.trim() : '';
  return /^https?:\/\/\S+$/.test(url) && url.length <= 2048 ? url : undefined;
}

@Injectable()
export class LtiService {
  private readonly logger = new Logger(LtiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly canvasSyncJobs: CanvasSyncJobsService,
    private readonly roster: CourseRosterRepository,
    private readonly canvas: CanvasApiClient,
  ) {}

  async syncLaunch(dto: LaunchSyncDto) {
    if (!dto.lmsContextId?.trim()) {
      throw new BadRequestException('lmsContextId is required');
    }

    const lmsContextId = dto.lmsContextId.trim();
    const lmsCourseKey = `${dto.lmsType}:${lmsContextId}`;
    const displayName = dto.displayName?.trim() || dto.lmsSub;
    const contextTitle =
      dto.contextTitle?.trim() || `LMS Course ${lmsContextId}`;
    const customClaims = (dto.customClaims || {}) as Prisma.InputJsonValue;
    // Chỉ Canvas mới có biến $Canvas.assignment.*; launch không đi từ Assignment
    // cho null và không đụng tới cài đặt đã lưu.
    const assignment =
      dto.lmsType === 'canvas'
        ? assignmentSettingsFromClaims(dto.customClaims)
        : null;
    const launchedAt = new Date();

    const { seed, ...result } = await this.prisma.$transaction(async (tx) => {
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
      let examTimeLimitMinutes: number | undefined;
      let examMaxAttempts: number | null = null;
      let attemptsSeed: AttemptsSeed | undefined;
      if (dto.targetKind === 'quiz_set') {
        const target = nullableUuid(dto.targetId);
        const quizSet = target
          ? await tx.quiz_sets.findFirst({
              where: {
                quiz_set_id: target,
                course_id: course.course_id,
                deleted_at: null,
              },
              select: {
                quiz_set_id: true,
                mode: true,
                time_limit_minutes: true,
                max_attempts: true,
              },
            })
          : null;
        if (!quizSet) {
          throw new BadRequestException(
            'Quiz không thuộc khóa học Canvas hiện tại.',
          );
        }
        // Web dùng để cho phiên thi sống đủ lâu (thời gian làm + 10 phút).
        if (quizSet.mode === 'exam' && quizSet.time_limit_minutes) {
          examTimeLimitMinutes = quizSet.time_limit_minutes;
        }
        // Chỉ bài kiểm tra mới có giới hạn lần làm; luyện tập bỏ qua cài đặt này.
        if (quizSet.mode === 'exam')
          examMaxAttempts = quizSet.max_attempts ?? null;
      }
      if (dto.resourceLinkId && dto.targetKind) {
        // Deep Linking không mang số lần làm nên Canvas tạo Assignment không giới
        // hạn. Lần đọc đầu của một bài kiểm tra có giới hạn mà Canvas báo không
        // giới hạn thì chưa chốt Canvas làm chủ: chờ đẩy giới hạn của DA sang.
        let seedPending = false;
        if (
          assignment &&
          examMaxAttempts !== null &&
          assignment.allowedAttempts === null
        ) {
          const previous = await tx.lti_resource_links.findUnique({
            where: {
              course_ref_id_lms_resource_link_id: {
                course_ref_id: courseRef.course_ref_id,
                lms_resource_link_id: dto.resourceLinkId,
              },
            },
            select: { assignment_synced_at: true },
          });
          seedPending = !previous?.assignment_synced_at;
        }
        const linkColumns = assignmentColumns(
          assignment,
          seedPending ? null : launchedAt,
        );
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
            ...linkColumns,
          },
          update: {
            target_kind: dto.targetKind,
            target_id: nullableUuid(dto.targetId),
            custom_claims: customClaims,
            deleted_at: null,
            ...linkColumns,
          },
        });
        internalResourceLinkId = resourceLink.resource_link_id;
        if (seedPending && assignment && examMaxAttempts !== null) {
          attemptsSeed = {
            resourceLinkId: resourceLink.resource_link_id,
            canvasAssignmentId: assignment.canvasAssignmentId,
            attempts: examMaxAttempts,
          };
        }

        if (dto.agsLineItemUrl) {
          // Điểm tối đa do Canvas làm chủ: launch từ Assignment mang điểm hiện tại
          // và ghi đè giá trị chốt lúc Deep Linking. Launch không có điểm (không
          // đi từ Assignment) giữ nguyên giá trị đã lưu; ags_score_maximum chỉ là
          // giá trị khởi tạo cho dòng mới.
          const canvasPoints = assignment?.pointsPossible ?? null;
          await tx.lti_line_items.upsert({
            where: { resource_link_id: resourceLink.resource_link_id },
            create: {
              resource_link_id: resourceLink.resource_link_id,
              lms_line_item_url: dto.agsLineItemUrl,
              score_maximum: canvasPoints ?? (dto.agsScoreMaximum || 100),
              label: dto.agsLabel || contextTitle,
            },
            update: {
              lms_line_item_url: dto.agsLineItemUrl,
              ...(canvasPoints !== null ? { score_maximum: canvasPoints } : {}),
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
        ...(internalResourceLinkId && {
          resourceLinkId: internalResourceLinkId,
        }),
        ...(examTimeLimitMinutes && { examTimeLimitMinutes }),
        // Chỉ để LtiService dùng sau giao dịch; không trả về cho web.
        seed: attemptsSeed,
      };
    });
    // Id Canvas và URL NRPS nằm ở cột mới, ghi sau khi giao dịch launch đã commit
    // và không làm launch hỏng nếu lỗi (xem CourseRosterRepository).
    if (dto.lmsType === 'canvas') {
      await this.roster.recordLaunch({
        internalUserId: result.internalUserId,
        courseId: result.internalCourseId,
        courseRefId: result.lmsCourseRefId,
        courseRole: dto.courseRole,
        platformUserId: canvasNumericId(dto.customClaims?.canvas_user_id),
        platformCourseId: canvasNumericId(dto.customClaims?.canvas_course_id),
        nrpsUrl: nrpsUrl(dto.nrps?.contextMembershipsUrl),
      });
    }
    // Only enqueue after the course/reference transaction has committed. Do not
    // await Redis here: an unavailable queue must never delay the LTI launch.
    void this.canvasSyncJobs.triggerLaunch(
      result.internalCourseId,
      dto.lmsType,
      dto.courseRole,
    );
    void this.canvasSyncJobs.triggerRosterLaunch(
      result.internalCourseId,
      dto.lmsType,
      dto.courseRole,
      dto.role,
    );
    // Khe hẹp chấp nhận: launch song song mang claim cũ vào sau có thể ghi lại "không giới hạn"; launch kế tự sửa.
    if (seed) {
      await this.seedAttempts(
        seed,
        canvasNumericId(dto.customClaims?.canvas_course_id) ??
          `lti_context_id:${lmsContextId}`,
      );
    }
    return result;
  }

  /**
   * Đẩy số lần làm của quiz sang Assignment Canvas rồi mới chốt
   * assignment_synced_at (từ đó Canvas làm chủ). Lỗi bất kỳ chỉ ghi cảnh báo:
   * launch vẫn vào được, cột chưa chốt nên cài đặt của DA còn hiệu lực và launch
   * sau sẽ thử lại.
   */
  private async seedAttempts(seed: AttemptsSeed, course: string) {
    const target = `Assignment ${seed.canvasAssignmentId}`;
    try {
      await this.canvas.setAssignmentAllowedAttempts(
        course,
        seed.canvasAssignmentId,
        seed.attempts,
      );
    } catch (error) {
      this.logger.warn(
        `Không đẩy được số lần làm sang Canvas cho ${target}; giữ cài đặt của DA và thử lại ở lần launch sau: ${describeCanvasError(error)}`,
      );
      return;
    }
    try {
      await this.prisma.lti_resource_links.updateMany({
        where: {
          resource_link_id: seed.resourceLinkId,
          assignment_synced_at: null,
        },
        data: {
          assignment_allowed_attempts: seed.attempts,
          assignment_synced_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Đã đẩy số lần làm sang ${target} nhưng chưa ghi được vào DB; launch sau sẽ đọc lại từ Canvas: ${String(error)}`,
      );
    }
  }
}
