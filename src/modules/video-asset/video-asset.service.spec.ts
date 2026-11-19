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

  describe('listAssets & courseCode', () => {
    it('ưu tiên subject_code khi trả courseCode, rỗng thì fallback về courses.code', async () => {
      const { prisma } = setup();
      (prisma.video_assets as Record<string, jest.Mock>).findMany = jest
        .fn()
        .mockResolvedValue([
          {
            ...asset({ asset_id: 'a-1', visibility: 'PUBLIC' }),
            creator: { display_name: 'GV A' },
            courses: {
              code: 'LMS-1234567890AB',
              subject_code: 'CO3137',
              name: 'Big Data A',
            },
          },
          {
            ...asset({ asset_id: 'a-2', visibility: 'PUBLIC' }),
            creator: { display_name: 'GV B' },
            courses: {
              code: 'CO3011',
              subject_code: null,
              name: 'Legacy',
            },
          },
        ]);
      (prisma.video_assets as Record<string, jest.Mock>).count = jest
        .fn()
        .mockResolvedValue(2);
      const service = new VideoAssetService(
        prisma as never,
        { assertCourseAccess: jest.fn() } as never,
        {} as never,
      );
      const listed = await service.listAssets(claims(owner), {});
      expect(listed.items.map((x) => x.courseCode)).toEqual([
        'CO3137',
        'CO3011',
      ]);

      prisma.video_assets.findFirst.mockResolvedValue({
        ...asset({ visibility: 'PUBLIC' }),
        creator: { display_name: 'GV A' },
        courses: {
          code: 'LMS-1234567890AB',
          subject_code: 'CO3137',
          name: 'Big Data A',
        },
      });
      await expect(
        service.getAsset(claims(other), { assetId: 'asset-1' }),
      ).resolves.toMatchObject({ courseCode: 'CO3137' });
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
});
