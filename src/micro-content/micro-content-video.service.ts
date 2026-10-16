import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import { DocumentStorageService } from '../document/document-storage.service';
import type { BffClaims } from '../auth/bff-claims';

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
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    const ext = extname(input.filename || '').toLowerCase();
    if (!['.mp4', '.webm'].includes(ext)) {
      throw new BadRequestException('Chỉ chấp nhận video định dạng .mp4 hoặc .webm.');
    }

    const objectKey = `micro-content/${item.course_id}/${item.micro_content_id}/video${ext}`;
    const uploadUrl = await this.storage.createPresignedUploadUrl(objectKey, 15 * 60);

    await this.prisma.micro_contents.update({
      where: { micro_content_id: item.micro_content_id },
      data: {
        video_source: 'UPLOAD',
        video_status: 'UPLOADING',
        video_object_key: objectKey,
        video_mime_type: input.mimeType || (ext === '.webm' ? 'video/webm' : 'video/mp4'),
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
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    if (!item.video_object_key) {
      throw new BadRequestException('Chưa khởi tạo upload session cho video này.');
    }

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: item.micro_content_id },
      data: {
        video_status: 'READY',
        video_size_bytes: input.sizeBytes ? BigInt(input.sizeBytes) : undefined,
        video_duration_ms: input.durationMs && input.durationMs > 0 ? input.durationMs : 60000,
        video_error: null,
        updated_at: new Date(),
      },
    });

    return {
      id: updated.micro_content_id,
      videoStatus: updated.video_status,
      videoDurationMs: updated.video_duration_ms,
    };
  }

  /**
   * Lấy presigned GET URL ngắn hạn để stream video.
   * Kiểm tra quyền truy cập theo vai trò (Learner chỉ xem được nội dung PUBLISHED).
   */
  async getVideoUrl(claims: BffClaims, input: { microContentId: string }) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }

    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => ['instructor', 'ta', 'admin', 'teacher'].includes(r));

    if (!isStaff) {
      if (item.status !== 'PUBLISHED') {
        throw new NotFoundException('Micro content not found');
      }
      await this.authz.assertCourseAccess(claims, item.course_id, ['learner']);
    } else {
      await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);
    }

    if (!item.video_object_key || item.video_status !== 'READY') {
      throw new BadRequestException('Video chưa sẵn sàng để phát.');
    }

    const url = await this.storage.createPresignedDownloadUrl(item.video_object_key, 5 * 60);

    return {
      url,
      mimeType: item.video_mime_type || 'video/mp4',
      durationMs: item.video_duration_ms,
      title: item.title,
    };
  }
}
