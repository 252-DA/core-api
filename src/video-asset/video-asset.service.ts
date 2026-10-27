import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import { DocumentStorageService } from '../document/document-storage.service';
import type { BffClaims } from '../auth/bff-claims';
import { video_assets } from '@prisma/client';

export function serializeVideoAsset(asset: video_assets) {
  return {
    ...asset,
    size_bytes: asset.size_bytes ? Number(asset.size_bytes) : null,
  };
}

@Injectable()
export class VideoAssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
    private readonly storage: DocumentStorageService,
  ) {}

  /**
   * Kiểm tra mã băm SHA-256 để chống upload trùng lặp file.
   */
  async checkHash(claims: BffClaims, input: { fileHash: string }) {
    if (!input.fileHash) {
      return { found: false };
    }

    const existing = await this.prisma.video_assets.findFirst({
      where: {
        file_hash: input.fileHash,
        deleted_at: null,
        OR: [
          { owner_id: claims.sub },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        creator: { select: { display_name: true } },
      },
    });

    if (!existing) {
      return { found: false };
    }

    return {
      found: true,
      asset: {
        ...serializeVideoAsset(existing),
        creatorName: existing.creator?.display_name,
      },
    };
  }

  /**
   * Khởi tạo phiên upload video: tạo bản ghi video_assets (UPLOADING) và cấp presigned URL.
   */
  async createUpload(
    claims: BffClaims,
    input: {
      title: string;
      description?: string;
      tags?: string[];
      filename: string;
      mimeType?: string;
      fileHash?: string;
      sizeBytes?: number;
      courseId?: string;
    },
  ) {
    if (input.courseId) {
      await this.authz.assertCourseAccess(claims, input.courseId, ['instructor', 'ta', 'admin']);
    }

    const ext = extname(input.filename || '').toLowerCase();
    if (!['.mp4', '.webm'].includes(ext)) {
      throw new BadRequestException('Chỉ chấp nhận video định dạng .mp4 hoặc .webm.');
    }

    const asset = await this.prisma.video_assets.create({
      data: {
        title: input.title || input.filename,
        description: input.description,
        tags: input.tags || [],
        source_type: 'USER_UPLOAD',
        status: 'UPLOADING',
        transcript_status: 'PENDING',
        file_hash: input.fileHash,
        size_bytes: input.sizeBytes ? BigInt(input.sizeBytes) : undefined,
        mime_type: input.mimeType || (ext === '.webm' ? 'video/webm' : 'video/mp4'),
        visibility: input.courseId ? 'COURSE' : 'PRIVATE',
        owner_id: claims.sub,
        course_id: input.courseId || null,
      },
    });

    const objectKey = `video-assets/${claims.sub}/${asset.asset_id}/video${ext}`;
    const uploadUrl = await this.storage.createPresignedUploadUrl(objectKey, 15 * 60);

    await this.prisma.video_assets.update({
      where: { asset_id: asset.asset_id },
      data: { object_key: objectKey },
    });

    return {
      assetId: asset.asset_id,
      uploadUrl,
      objectKey,
    };
  }

  /**
   * Xác nhận video đã tải lên thành công và cập nhật metadata.
   */
  async confirmUpload(
    claims: BffClaims,
    input: { assetId: string; sizeBytes?: number; durationMs?: number },
  ) {
    const asset = await this.prisma.video_assets.findFirst({
      where: { asset_id: input.assetId, deleted_at: null },
    });
    if (!asset) {
      throw new NotFoundException('Video asset not found');
    }
    if (asset.owner_id !== claims.sub) {
      await this.authz.assertCourseAccess(claims, asset.course_id || '', ['admin']);
    }

    const updated = await this.prisma.video_assets.update({
      where: { asset_id: asset.asset_id },
      data: {
        status: 'READY',
        size_bytes: input.sizeBytes ? BigInt(input.sizeBytes) : asset.size_bytes,
        duration_ms: input.durationMs && input.durationMs > 0 ? input.durationMs : 60000,
        updated_at: new Date(),
      },
    });

    return serializeVideoAsset(updated);
  }

  /**
   * Danh sách video trong Kho học liệu có phân trang và bộ lọc.
   */
  async listAssets(
    claims: BffClaims,
    input: {
      scope?: 'mine' | 'course' | 'public';
      courseId?: string;
      sourceType?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { deleted_at: null };

    if (input.scope === 'mine') {
      where.owner_id = claims.sub;
    } else if (input.scope === 'course' && input.courseId) {
      await this.authz.assertCourseAccess(claims, input.courseId);
      where.course_id = input.courseId;
      where.OR = [{ visibility: { in: ['COURSE', 'PUBLIC'] } }, { owner_id: claims.sub }];
    } else if (input.scope === 'public') {
      where.visibility = 'PUBLIC';
    } else {
      // Mặc định: hiện các video công khai hoặc của chính người dùng
      where.OR = [
        { owner_id: claims.sub },
        { visibility: 'PUBLIC' },
      ];
      if (input.courseId) {
        where.OR.push({ course_id: input.courseId, visibility: 'COURSE' });
      }
    }

    if (input.sourceType) {
      where.source_type = input.sourceType;
    }

    if (input.search && input.search.trim()) {
      const q = input.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ],
        },
      ];
    }

    const take = Math.min(Math.max(input.limit || 20, 1), 100);
    const skip = Math.max(input.offset || 0, 0);

    const [items, total] = await Promise.all([
      this.prisma.video_assets.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          creator: { select: { display_name: true } },
          courses: { select: { code: true, name: true } },
        },
      }),
      this.prisma.video_assets.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...serializeVideoAsset(item),
        creatorName: item.creator?.display_name,
        courseName: item.courses?.name,
        courseCode: item.courses?.code,
      })),
      total,
      limit: take,
      offset: skip,
    };
  }

  /**
   * Lấy chi tiết một video asset.
   */
  async getAsset(claims: BffClaims, input: { assetId: string }) {
    const asset = await this.prisma.video_assets.findFirst({
      where: { asset_id: input.assetId },
      include: {
        creator: { select: { display_name: true } },
        courses: { select: { code: true, name: true } },
      },
    });
    if (!asset || asset.deleted_at) {
      throw new NotFoundException('Video asset not found');
    }

    return {
      ...serializeVideoAsset(asset),
      creatorName: asset.creator?.display_name,
      courseName: asset.courses?.name,
      courseCode: asset.courses?.code,
    };
  }

  /**
   * Lấy Presigned GET URL kèm kiểm tra Quyền truy cập bắc cầu (Transitive Access).
   */
  async getStreamUrl(claims: BffClaims, input: { assetId: string; microContentId?: string }) {
    const asset = await this.prisma.video_assets.findUnique({
      where: { asset_id: input.assetId },
    });
    if (!asset) {
      throw new NotFoundException('Video asset not found');
    }

    let authorized = false;

    // 1. Công khai toàn hệ thống
    if (asset.visibility === 'PUBLIC') {
      authorized = true;
    }

    // 2. Tác giả sở hữu video
    if (asset.owner_id === claims.sub) {
      authorized = true;
    }

    // 3. Trong cùng khoá học và có quyền COURSE
    if (!authorized && asset.visibility === 'COURSE' && asset.course_id) {
      try {
        await this.authz.assertCourseAccess(claims, asset.course_id);
        authorized = true;
      } catch {}
    }

    // 4. Quyền truy cập bắc cầu (Transitive Permission qua microContentId)
    if (!authorized && input.microContentId) {
      const mc = await this.prisma.micro_contents.findFirst({
        where: { micro_content_id: input.microContentId, video_asset_id: asset.asset_id },
      });
      if (mc) {
        try {
          await this.authz.assertCourseAccess(claims, mc.course_id);
          authorized = true;
        } catch {}
      }
    }

    if (!authorized) {
      throw new ForbiddenException('Bạn không có quyền truy cập video này.');
    }

    if (!asset.object_key) {
      throw new BadRequestException('Video chưa sẵn sàng để phát.');
    }

    const url = await this.storage.createPresignedDownloadUrl(asset.object_key, 2 * 3600);

    return {
      url,
      mimeType: asset.mime_type || 'video/mp4',
      durationMs: asset.duration_ms || 0,
      title: asset.title,
    };
  }

  /**
   * Cập nhật thông tin và quyền riêng tư (visibility) của video.
   */
  async updateAsset(
    claims: BffClaims,
    input: {
      assetId: string;
      title?: string;
      description?: string;
      tags?: string[];
      visibility?: string;
      allowFork?: boolean;
    },
  ) {
    const asset = await this.prisma.video_assets.findFirst({
      where: { asset_id: input.assetId, deleted_at: null },
    });
    if (!asset) {
      throw new NotFoundException('Video asset not found');
    }
    if (asset.owner_id !== claims.sub) {
      await this.authz.assertCourseAccess(claims, asset.course_id || '', ['admin']);
    }

    const updated = await this.prisma.video_assets.update({
      where: { asset_id: asset.asset_id },
      data: {
        title: input.title !== undefined ? input.title : asset.title,
        description: input.description !== undefined ? input.description : asset.description,
        tags: input.tags !== undefined ? input.tags : asset.tags,
        visibility: input.visibility !== undefined ? input.visibility : asset.visibility,
        allow_fork: input.allowFork !== undefined ? input.allowFork : asset.allow_fork,
        updated_at: new Date(),
      },
    });

    return serializeVideoAsset(updated);
  }

  /**
   * Xóa video an toàn: nếu đang được bài học sử dụng (usage_count > 0) thì Soft Delete.
   */
  async deleteAsset(claims: BffClaims, input: { assetId: string }) {
    const asset = await this.prisma.video_assets.findFirst({
      where: { asset_id: input.assetId, deleted_at: null },
    });
    if (!asset) {
      throw new NotFoundException('Video asset not found');
    }
    if (asset.owner_id !== claims.sub) {
      await this.authz.assertCourseAccess(claims, asset.course_id || '', ['admin']);
    }

    // Luôn Soft Delete để bảo toàn liên kết của các bài học cũ
    await this.prisma.video_assets.update({
      where: { asset_id: asset.asset_id },
      data: {
        deleted_at: new Date(),
        visibility: 'PRIVATE',
      },
    });

    return {
      success: true,
      softDeleted: true,
      inUse: asset.usage_count > 0,
      message:
        asset.usage_count > 0
          ? 'Video đang được sử dụng trong bài học nên đã được chuyển sang chế độ ẩn khỏi thư viện.'
          : 'Đã xóa video khỏi thư viện.',
    };
  }

  /**
   * Fork AI Video: sao chép kịch bản sư phạm để giảng viên khác tùy biến.
   */
  async forkAsset(
    claims: BffClaims,
    input: { assetId: string; targetCourseId?: string; newTitle?: string },
  ) {
    const source = await this.prisma.video_assets.findFirst({
      where: { asset_id: input.assetId, deleted_at: null },
    });
    if (!source) {
      throw new NotFoundException('Video asset not found');
    }
    if (!source.allow_fork && source.owner_id !== claims.sub) {
      throw new BadRequestException('Video này không cho phép nhân bản kịch bản.');
    }

    const forked = await this.prisma.video_assets.create({
      data: {
        title: input.newTitle || `${source.title} (Bản sao)`,
        description: source.description,
        tags: source.tags,
        source_type: source.source_type,
        status: source.status,
        transcript_status: source.transcript_status,
        object_key: source.object_key,
        thumbnail_key: source.thumbnail_key,
        duration_ms: source.duration_ms,
        size_bytes: source.size_bytes,
        mime_type: source.mime_type,
        visibility: input.targetCourseId ? 'COURSE' : 'PRIVATE',
        ai_prompt: source.ai_prompt,
        ai_options: source.ai_options as any,
        ai_script: source.ai_script as any,
        transcript_text: source.transcript_text,
        owner_id: claims.sub,
        course_id: input.targetCourseId || source.course_id,
        forked_from_id: source.asset_id,
        usage_count: 0,
      },
    });

    return serializeVideoAsset(forked);
  }

  /**
   * Gắn video asset vào bài học micro_contents, đồng bộ usage_count bằng Transaction.
   */
  async attachToMicroContent(
    claims: BffClaims,
    input: { microContentId: string; newVideoAssetId?: string | null },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const currentLesson = await tx.micro_contents.findFirst({
        where: { micro_content_id: input.microContentId, deleted_at: null },
        select: { micro_content_id: true, video_asset_id: true, course_id: true },
      });
      if (!currentLesson) {
        throw new NotFoundException('Micro content not found');
      }
      await this.authz.assertCourseAccess(claims, currentLesson.course_id, ['instructor', 'ta', 'admin']);

      if (currentLesson.video_asset_id === input.newVideoAssetId) {
        return { success: true, unchanged: true };
      }

      // Giảm usage_count của video cũ
      if (currentLesson.video_asset_id) {
        await tx.video_assets.updateMany({
          where: { asset_id: currentLesson.video_asset_id },
          data: { usage_count: { decrement: 1 } },
        });
      }

      let assetRecord = null;
      // Tăng usage_count của video mới
      if (input.newVideoAssetId) {
        assetRecord = await tx.video_assets.findFirst({
          where: { asset_id: input.newVideoAssetId, deleted_at: null },
        });
        if (!assetRecord) {
          throw new NotFoundException('Video asset not found');
        }

        await tx.video_assets.update({
          where: { asset_id: input.newVideoAssetId },
          data: { usage_count: { increment: 1 } },
        });
      }

      // Cập nhật liên kết trên bài học
      await tx.micro_contents.update({
        where: { micro_content_id: input.microContentId },
        data: {
          video_asset_id: input.newVideoAssetId || null,
          video_object_key: assetRecord?.object_key || null,
          video_duration_ms: assetRecord?.duration_ms || null,
          video_size_bytes: assetRecord?.size_bytes || null,
          video_status: assetRecord?.status || 'NONE',
          video_source: assetRecord?.source_type === 'AI_STUDIO' ? 'AI' : 'UPLOAD',
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        videoAssetId: input.newVideoAssetId,
        videoStatus: assetRecord?.status || 'NONE',
      };
    });
  }
}

