import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'node:path';
import {
  COURSE_ROLES,
  STAFF_ROLES,
} from '../../../common/constants/course-roles';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuthzService } from '../../../auth/authz.service';
import { DocumentStorageService } from '../../../infra/storage/document-storage.service';
import type { BffClaims } from '../../../auth/bff-claims';

const MC_STAFF_ROLES = [...STAFF_ROLES, 'admin'];
const MC_CLAIM_STAFF_ROLES = [...MC_STAFF_ROLES, 'teacher'];

@Injectable()
export class MicroContentVideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly storage: DocumentStorageService,
  ) {}

  /**
   * Tạo presigned URL để web tải video lên MinIO.
   */
  async createUpload(
    claims: BffClaims,
    input: { microContentId: string; filename: string; mimeType?: string },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, MC_STAFF_ROLES);

    const ext = extname(input.filename || '').toLowerCase();
    if (!['.mp4', '.webm'].includes(ext)) {
      throw new BadRequestException(
        'Chỉ chấp nhận video định dạng .mp4 hoặc .webm.',
      );
    }

    const objectKey = `micro-content/${item.course_id}/${item.micro_content_id}/video${ext}`;
    const uploadUrl = await this.storage.createPresignedUploadUrl(
      objectKey,
      15 * 60,
    );

    const asset = await this.prisma.video_assets.create({
      data: {
        title: input.filename || item.title,
        course_id: item.course_id,
        owner_id: claims.sub,
        object_key: objectKey,
        visibility: 'COURSE',
        source_type: 'USER_UPLOAD',
        status: 'UPLOADING',
        transcript_status: 'PENDING',
        mime_type:
          input.mimeType || (ext === '.webm' ? 'video/webm' : 'video/mp4'),
        usage_count: 1,
      },
    });

    await this.prisma.micro_contents.update({
      where: { micro_content_id: item.micro_content_id },
      data: {
        video_asset_id: asset.asset_id,
        video_source: 'UPLOAD',
        video_status: 'UPLOADING',
        video_object_key: objectKey,
        video_mime_type:
          input.mimeType || (ext === '.webm' ? 'video/webm' : 'video/mp4'),
        video_error: null,
        updated_at: new Date(),
      },
    });

    return { uploadUrl, objectKey };
  }

  /**
   * Xác nhận video đã được tải lên thành công.
   */
  async confirmUpload(
    claims: BffClaims,
    input: { microContentId: string; sizeBytes?: number; durationMs?: number },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, MC_STAFF_ROLES);

    if (!item.video_object_key) {
      throw new BadRequestException(
        'Chưa khởi tạo upload session cho video này.',
      );
    }

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: item.micro_content_id },
      data: {
        video_status: 'READY',
        video_size_bytes: input.sizeBytes ? BigInt(input.sizeBytes) : undefined,
        video_duration_ms:
          input.durationMs && input.durationMs > 0 ? input.durationMs : 60000,
        video_error: null,
        updated_at: new Date(),
      },
    });

    if (item.video_asset_id) {
      await this.prisma.video_assets.update({
        where: { asset_id: item.video_asset_id },
        data: {
          status: 'READY',
          size_bytes: input.sizeBytes ? BigInt(input.sizeBytes) : undefined,
          duration_ms:
            input.durationMs && input.durationMs > 0 ? input.durationMs : 60000,
          error_message: null,
          updated_at: new Date(),
        },
      });
    }

    return {
      id: updated.micro_content_id,
      videoStatus: updated.video_status,
      videoDurationMs: updated.video_duration_ms,
    };
  }

  private async findAuthorizedItem(claims: BffClaims, microContentId: string) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: microContentId, deleted_at: null },
      include: {
        video_asset: {
          select: {
            vtt_subtitles_key: true,
            transcript_text: true,
            scene_timeline: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }

    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => MC_CLAIM_STAFF_ROLES.includes(r));

    if (!isStaff) {
      if (item.status !== 'PUBLISHED') {
        throw new NotFoundException('Micro content not found');
      }
      await this.authz.assertCourseAccess(claims, item.course_id, [
        COURSE_ROLES.LEARNER,
      ]);
    } else {
      await this.authz.assertCourseAccess(
        claims,
        item.course_id,
        MC_STAFF_ROLES,
      );
    }
    return item;
  }

  /**
   * Lấy presigned GET URL ngắn hạn để stream video.
   * Kiểm tra quyền truy cập theo vai trò (Learner chỉ xem được nội dung PUBLISHED).
   */
  async getVideoUrl(claims: BffClaims, input: { microContentId: string }) {
    const item = await this.findAuthorizedItem(claims, input.microContentId);

    if (!item.video_object_key || item.video_status !== 'READY') {
      throw new BadRequestException('Video chưa sẵn sàng để phát.');
    }

    const url = await this.storage.createPresignedDownloadUrl(
      item.video_object_key,
      5 * 60,
    );

    return {
      url,
      mimeType: item.video_mime_type || 'video/mp4',
      durationMs: item.video_duration_ms,
      title: item.title,
    };
  }

  /**
   * Lấy presigned URL tệp phụ đề WebVTT (nếu có) cùng timeline chuyển cảnh.
   */
  async getSubtitlesUrl(claims: BffClaims, input: { microContentId: string }) {
    const item = await this.findAuthorizedItem(claims, input.microContentId);
    const vttKey = item.video_asset?.vtt_subtitles_key;
    const url = vttKey
      ? await this.storage.createPresignedDownloadUrl(vttKey, 5 * 60)
      : null;

    return {
      url,
      mimeType: 'text/vtt',
      transcriptText: item.video_asset?.transcript_text ?? null,
      sceneTimeline: Array.isArray(item.video_asset?.scene_timeline)
        ? item.video_asset.scene_timeline
        : [],
    };
  }
}
