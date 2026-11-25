import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { video_assets } from '@prisma/client';
import type { BffClaims } from '../../auth/bff-claims';
import { VideoAssetService } from './video-asset.service';

const owner = '00000000-0000-0000-0000-00000000000a';
const other = '00000000-0000-0000-0000-00000000000b';
const courseA = '11111111-1111-1111-1111-111111111111';
const courseB = '22222222-2222-2222-2222-222222222222';
const microContentId = '33333333-3333-3333-3333-333333333333';

function claims(sub: string, scope: BffClaims['scope'] = 'course'): BffClaims {
  return { sub, roles: [], scope, jti: 'jti', iat: 0, exp: 1 };
}

function asset(over: Partial<video_assets> = {}): video_assets {
  return {
    asset_id: 'asset-1',
    title: 'Video',
    description: null,
    tags: [],
    source_type: 'AI_STUDIO',
    status: 'READY',
    transcript_status: 'PENDING',
    error_message: null,
    object_key: 'video-assets/a/asset-1/video.mp4',
    thumbnail_key: null,
    vtt_subtitles_key: null,
    file_hash: null,
    duration_ms: 1000,
    size_bytes: null,
    mime_type: 'video/mp4',
    visibility: 'PRIVATE',
    share_slug: null,
    allow_fork: true,
    ai_prompt: null,
    ai_options: null,
    ai_script: null,
    transcript_text: null,
    owner_id: owner,
    course_id: courseA,
    forked_from_id: null,
    usage_count: 0,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    ...over,
  } as video_assets;
}

type Membership = { sub: string; courseId: string; role: string };

function setup(memberships: Membership[] = []) {
  const prisma = {
    video_assets: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(async ({ data }: { data: object }) => ({
        asset_id: 'fork-1',
        ...data,
      })),
      update: jest.fn(async ({ data }: { data: object }) => ({
        ...asset(),
        ...data,
      })),
      updateMany: jest.fn(),
    },
    micro_contents: { findFirst: jest.fn(), update: jest.fn() },
    chunks: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) =>
    fn(prisma),
  );
  // Giống AuthzService: admin nền tảng qua luôn, còn lại phải có membership đúng vai trò.
  const authz = {
    assertCourseAccess: jest.fn(
      async (c: BffClaims, courseId: string, roles?: string[]) => {
        if (c.scope === 'admin') return;
        const ok = memberships.some(
          (m) =>
            m.sub === c.sub &&
            m.courseId === courseId &&
            (!roles?.length || roles.includes(m.role)),
        );
        if (!ok) throw new ForbiddenException('No membership for this course');
      },
    ),
  };
  const storage = {
    createPresignedDownloadUrl: jest
      .fn()
      .mockResolvedValue('https://storage/get'),
  };
  const service = new VideoAssetService(
    prisma as never,
    authz as never,
    storage as never,
  );
  return { service, prisma, authz, storage };
}

describe('VideoAssetService', () => {
  describe('getAsset', () => {
    it('video riêng tư của người khác coi như không tồn tại', async () => {
      const { service, prisma } = setup();
      prisma.video_assets.findFirst.mockResolvedValue(asset());
      await expect(
        service.getAsset(claims(other), { assetId: 'asset-1' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getAsset(claims(owner), { assetId: 'asset-1' }),
      ).resolves.toMatchObject({
        asset_id: 'asset-1',
      });
    });

    it('video COURSE chỉ thành viên của khoá đó xem được', async () => {
      const { service, prisma } = setup([
        { sub: other, courseId: courseA, role: 'learner' },
      ]);
      prisma.video_assets.findFirst.mockResolvedValue(
        asset({ visibility: 'COURSE' }),
      );
      await expect(
        service.getAsset(claims(other), { assetId: 'asset-1' }),
      ).resolves.toBeTruthy();
      const outsider = '00000000-0000-0000-0000-00000000000c';
      await expect(
        service.getAsset(claims(outsider), { assetId: 'asset-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('forkAsset', () => {
    it('không fork được video riêng tư của người khác', async () => {
      const { service, prisma } = setup([
        { sub: other, courseId: courseB, role: 'instructor' },
      ]);
      prisma.video_assets.findFirst.mockResolvedValue(asset());
      await expect(
        service.forkAsset(claims(other), {
          assetId: 'asset-1',
          targetCourseId: courseB,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.video_assets.create).not.toHaveBeenCalled();
    });

    it('fork video xem được vào khoá mình dạy: bản sao thuộc khoá đích', async () => {
      const { service, prisma } = setup([
        { sub: other, courseId: courseB, role: 'instructor' },
      ]);
      prisma.video_assets.findFirst.mockResolvedValue(
        asset({ visibility: 'PUBLIC' }),
      );
      const forked = await service.forkAsset(claims(other), {
        assetId: 'asset-1',
        targetCourseId: courseB,
      });
      expect(forked).toMatchObject({
        owner_id: other,
        course_id: courseB,
        visibility: 'COURSE',
      });
    });

    it('khoá đích phải là khoá mình là nhân sự; không đích thì bản sao không gắn khoá nào', async () => {
      const { service, prisma } = setup([
        { sub: other, courseId: courseB, role: 'learner' },
      ]);
      prisma.video_assets.findFirst.mockResolvedValue(
        asset({ visibility: 'PUBLIC' }),
      );
      await expect(
        service.forkAsset(claims(other), {
          assetId: 'asset-1',
          targetCourseId: courseB,
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.forkAsset(claims(other), { assetId: 'asset-1' }),
      ).resolves.toMatchObject({
        course_id: null,
        visibility: 'PRIVATE',
      });
    });
  });

  describe('getStreamUrl', () => {
    it('học viên phát được video riêng tư qua bài micro-content của khoá mình', async () => {
      const { service, prisma } = setup([
        { sub: other, courseId: courseA, role: 'learner' },
      ]);
      prisma.video_assets.findUnique.mockResolvedValue(asset());
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseA,
      });
      await expect(
        service.getStreamUrl(claims(other), { assetId: 'asset-1' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getStreamUrl(claims(other), {
          assetId: 'asset-1',
          microContentId,
        }),
      ).resolves.toMatchObject({ url: 'https://storage/get' });
    });
  });

  describe('attachToMicroContent', () => {
    const staff = [{ sub: other, courseId: courseA, role: 'instructor' }];

    function withLesson(prisma: ReturnType<typeof setup>['prisma']) {
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        video_asset_id: null,
        course_id: courseA,
      });
    }

    it('thiếu assetId thì báo lỗi, không tự hiểu là gỡ video', async () => {
      const { service, prisma } = setup(staff);
      withLesson(prisma);
      await expect(
        service.attachToMicroContent(claims(other), { microContentId }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.micro_contents.update).not.toHaveBeenCalled();
    });

    it('không gắn được video riêng tư của người khác', async () => {
      const { service, prisma } = setup(staff);
      withLesson(prisma);
      prisma.video_assets.findFirst.mockResolvedValue(asset());
      await expect(
        service.attachToMicroContent(claims(other), {
          microContentId,
          assetId: 'asset-1',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.micro_contents.update).not.toHaveBeenCalled();
    });

    it('gắn video xem được vào bài, null thì gỡ', async () => {
      const { service, prisma } = setup(staff);
      withLesson(prisma);
      prisma.video_assets.findFirst.mockResolvedValue(
        asset({ visibility: 'COURSE' }),
      );
      await service.attachToMicroContent(claims(other), {
        microContentId,
        assetId: 'asset-1',
      });
      expect(prisma.micro_contents.update).toHaveBeenLastCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_asset_id: 'asset-1',
          video_status: 'READY',
        }),
      });

      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        video_asset_id: 'asset-1',
        course_id: courseA,
      });
      await service.attachToMicroContent(claims(other), {
        microContentId,
        assetId: null,
      });
      expect(prisma.video_assets.updateMany).toHaveBeenCalledWith({
        where: { asset_id: 'asset-1' },
        data: { usage_count: { decrement: 1 } },
      });
      expect(prisma.micro_contents.update).toHaveBeenLastCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_asset_id: null,
          video_status: 'NONE',
        }),
      });
    });
  });

  describe('updateAsset', () => {
    it('chỉ chủ sở hữu sửa được và visibility phải hợp lệ', async () => {
      const { service, prisma } = setup();
      prisma.video_assets.findFirst.mockResolvedValue(asset());
      await expect(
        service.updateAsset(claims(other), { assetId: 'asset-1', title: 'x' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateAsset(claims(owner), {
          assetId: 'asset-1',
          visibility: 'EVERYONE',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateAsset(claims(owner), {
          assetId: 'asset-1',
          visibility: 'PUBLIC',
        }),
      ).resolves.toMatchObject({ visibility: 'PUBLIC' });
    });
  });

  describe('recommendForMicroContent', () => {
    const staff = [{ sub: other, courseId: courseA, role: 'instructor' }];

    it('xếp hạng cao hơn cho video trùng từ khóa tiếng Việt không dấu/có dấu', async () => {
      const { service, prisma } = setup(staff);
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseA,
        title: 'Thuật toán Merge Sort và Chia để trị',
        description: 'Minh họa chia mảng thành hai nửa rồi trộn có thứ tự.',
        ai_prompt: null,
        ai_script: null,
        source_document_id: null,
        source_page_from: null,
        source_page_to: null,
        video_asset_id: null,
        learning_outcome: {
          code: 'LO2',
          statement_vi: 'Phân tích độ phức tạp O(n log n) của Merge Sort',
        },
        source_document: {
          document_id: 'doc-1',
          title: 'Slide Sắp xếp',
        },
      });
      prisma.video_assets.findMany.mockResolvedValue([
        asset({
          asset_id: 'unrelated',
          title: 'Giới thiệu hệ điều hành Linux',
          description: 'Tiến trình và luồng CPU',
          tags: ['os', 'linux'],
          course_id: courseA,
          visibility: 'COURSE',
        }),
        asset({
          asset_id: 'matched',
          title: 'Trực quan hóa Merge Sort (Chia để trị)',
          description: 'Mô phỏng quá trình trộn hai mảng con trong Merge Sort',
          tags: ['merge-sort', 'sorting'],
          course_id: courseB,
          visibility: 'PUBLIC',
        }),
      ]);

      const res = await service.recommendForMicroContent(claims(other), {
        microContentId,
        limit: 5,
      });

      expect(res.suggestedQuery).toContain('Merge Sort');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].asset_id).toBe('matched');
      expect(res.items[0].matchScore).toBeGreaterThanOrEqual(30);
      expect(res.items[0].matchReasons.length).toBeGreaterThan(0);
    });
  });

  describe('attachYoutubeVideo & YouTube stream/attach', () => {
    const staff = [{ sub: other, courseId: courseA, role: 'instructor' }];

    it('từ chối YouTube ID hoặc khoảng thời gian không hợp lệ', async () => {
      const { service } = setup(staff);
      await expect(
        service.attachYoutubeVideo(claims(other), {
          microContentId,
          youtubeVideoId: 'bad-id',
          title: 'Video',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.attachYoutubeVideo(claims(other), {
          microContentId,
          youtubeVideoId: 'dQw4w9WgXcQ',
          title: 'Video',
          startSec: 120,
          endSec: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tạo video_assets YOUTUBE và gắn vào micro_content', async () => {
      const { service, prisma } = setup(staff);
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        video_asset_id: null,
        course_id: courseA,
      });
      prisma.video_assets.findMany.mockResolvedValue([]);
      prisma.video_assets.create.mockResolvedValue(
        asset({
          asset_id: 'yt-asset-1',
          source_type: 'YOUTUBE',
          mime_type: 'video/youtube',
          object_key: 'youtube:4VqmGXwpLqc',
          visibility: 'COURSE',
          ai_options: {
            youtubeVideoId: '4VqmGXwpLqc',
            channelTitle: 'Michael Sambol',
            startSec: 10,
            endSec: 130,
          },
        }),
      );
      prisma.video_assets.update.mockResolvedValue(
        asset({
          asset_id: 'yt-asset-1',
          source_type: 'YOUTUBE',
          mime_type: 'video/youtube',
          object_key: 'youtube:4VqmGXwpLqc',
          usage_count: 1,
        }),
      );

      const res = await service.attachYoutubeVideo(claims(other), {
        microContentId,
        youtubeVideoId: 'https://www.youtube.com/watch?v=4VqmGXwpLqc',
        title: 'Merge sort in 3 minutes',
        channelTitle: 'Michael Sambol',
        startSec: 10,
        endSec: 130,
      });

      expect(res).toMatchObject({
        success: true,
        videoAssetId: 'yt-asset-1',
        videoSource: 'YOUTUBE',
        youtubeVideoId: '4VqmGXwpLqc',
        youtubeStartSec: 10,
        youtubeEndSec: 130,
      });
      expect(prisma.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_asset_id: 'yt-asset-1',
          video_source: 'YOUTUBE',
          video_mime_type: 'video/youtube',
          video_duration_ms: 120000,
        }),
      });
    });

    it('getStreamUrl trả về embed URL cho YouTube mà không gọi MinIO', async () => {
      const { service, prisma, storage } = setup(staff);
      prisma.video_assets.findUnique.mockResolvedValue(
        asset({
          source_type: 'YOUTUBE',
          mime_type: 'video/youtube',
          object_key: 'youtube:4VqmGXwpLqc',
          visibility: 'COURSE',
          ai_options: {
            youtubeVideoId: '4VqmGXwpLqc',
            startSec: 5,
            endSec: 95,
          },
        }),
      );

      const res = await service.getStreamUrl(claims(other), {
        assetId: 'asset-1',
      });

      expect(storage.createPresignedDownloadUrl).not.toHaveBeenCalled();
      expect(res.mimeType).toBe('video/youtube');
      expect(res.url).toContain('https://www.youtube.com/embed/4VqmGXwpLqc');
    });

    it('attachToMicroContent đặt video_source = YOUTUBE cho asset YOUTUBE', async () => {
      const { service, prisma } = setup(staff);
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        video_asset_id: null,
        course_id: courseA,
      });
      prisma.video_assets.findFirst.mockResolvedValue(
        asset({
          source_type: 'YOUTUBE',
          mime_type: 'video/youtube',
          object_key: 'youtube:4VqmGXwpLqc',
          visibility: 'COURSE',
        }),
      );

      await service.attachToMicroContent(claims(other), {
        microContentId,
        assetId: 'asset-1',
      });

      expect(prisma.micro_contents.update).toHaveBeenLastCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_source: 'YOUTUBE',
          video_mime_type: 'video/youtube',
        }),
      });
    });
  });
});
