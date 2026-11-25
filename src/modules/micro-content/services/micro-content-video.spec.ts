import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../../../auth/bff-claims';
import { MicroContentVideoService } from './micro-content-video.service';

describe('MicroContentVideoService', () => {
  const instructorClaims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000001',
    roles: ['instructor'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };

  const learnerClaims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['learner'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };

  const courseId = '11111111-1111-1111-1111-111111111111';
  const microContentId = '22222222-2222-2222-2222-222222222222';

  function setup() {
    const prisma = {
      micro_contents: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      video_assets: {
        create: jest.fn().mockResolvedValue({ asset_id: 'asset-1' }),
        update: jest.fn(),
      },
    };

    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };

    const storage = {
      createPresignedUploadUrl: jest
        .fn()
        .mockResolvedValue('https://storage/upload-url'),
      createPresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://storage/download-url'),
    };

    const service = new MicroContentVideoService(
      prisma as never,
      authz as never,
      storage as never,
    );

    return { service, prisma, authz, storage };
  }

  describe('createUpload', () => {
    it('rejects unsupported file formats', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
      });

      await expect(
        service.createUpload(instructorClaims, {
          microContentId,
          filename: 'document.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates presigned upload URL for valid mp4 file', async () => {
      const { service, prisma, storage } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
      });

      const res = await service.createUpload(instructorClaims, {
        microContentId,
        filename: 'intro.mp4',
        mimeType: 'video/mp4',
      });

      expect(res.uploadUrl).toBe('https://storage/upload-url');
      expect(res.objectKey).toBe(
        `micro-content/${courseId}/${microContentId}/video.mp4`,
      );
      expect(prisma.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_asset_id: 'asset-1',
          video_status: 'UPLOADING',
          video_object_key: `micro-content/${courseId}/${microContentId}/video.mp4`,
        }),
      });
      // Video tải lên cho bài cũng vào kho video của khoá học.
      expect(prisma.video_assets.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          course_id: courseId,
          owner_id: instructorClaims.sub,
          visibility: 'COURSE',
          status: 'UPLOADING',
          usage_count: 1,
        }),
      });
    });
  });

  describe('confirmUpload', () => {
    it('sets video status to READY and stores duration', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        video_object_key: `micro-content/${courseId}/${microContentId}/video.mp4`,
      });
      prisma.micro_contents.update.mockResolvedValue({
        micro_content_id: microContentId,
        video_status: 'READY',
        video_duration_ms: 125000,
      });

      const res = await service.confirmUpload(instructorClaims, {
        microContentId,
        sizeBytes: 10485760,
        durationMs: 125000,
      });

      expect(res.videoStatus).toBe('READY');
      expect(res.videoDurationMs).toBe(125000);
      expect(prisma.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_status: 'READY',
          video_duration_ms: 125000,
        }),
      });
    });
  });

  describe('getVideoUrl', () => {
    it('allows learner to get presigned download URL when published and ready', async () => {
      const { service, prisma, storage, authz } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Video Demo',
        status: 'PUBLISHED',
        video_status: 'READY',
        video_object_key: `micro-content/${courseId}/${microContentId}/video.mp4`,
        video_mime_type: 'video/mp4',
        video_duration_ms: 60000,
      });

      const res = await service.getVideoUrl(learnerClaims, { microContentId });

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(
        learnerClaims,
        courseId,
        ['learner'],
      );
      expect(storage.createPresignedDownloadUrl).toHaveBeenCalledWith(
        `micro-content/${courseId}/${microContentId}/video.mp4`,
        300,
      );
      expect(res.url).toBe('https://storage/download-url');
    });

    it('rejects learner when video is not PUBLISHED', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'DRAFT',
        video_status: 'READY',
      });

      await expect(
        service.getVideoUrl(learnerClaims, { microContentId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects request when video is not READY', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        video_status: 'PROCESSING',
      });

      await expect(
        service.getVideoUrl(instructorClaims, { microContentId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns YouTube embed URL without calling storage when video_source is YOUTUBE', async () => {
      const { service, prisma, storage } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        title: 'Merge Sort YT',
        status: 'PUBLISHED',
        video_source: 'YOUTUBE',
        video_status: 'READY',
        video_object_key: 'youtube:4VqmGXwpLqc',
        video_mime_type: 'video/youtube',
        video_duration_ms: 180000,
        video_asset: {
          source_type: 'YOUTUBE',
          object_key: 'youtube:4VqmGXwpLqc',
          ai_options: {
            youtubeVideoId: '4VqmGXwpLqc',
            channelTitle: 'Michael Sambol',
            startSec: 15,
            endSec: 120,
          },
        },
      });

      const res = await service.getVideoUrl(learnerClaims, { microContentId });

      expect(storage.createPresignedDownloadUrl).not.toHaveBeenCalled();
      expect(res.mimeType).toBe('video/youtube');
      expect(res.url).toContain('https://www.youtube.com/embed/4VqmGXwpLqc');
    });
  });

  describe('getSubtitlesUrl', () => {
    it('returns presigned VTT URL, timeline, and transcript for learner when published', async () => {
      const { service, prisma, storage, authz } = setup();
      const timeline = [
        { scene_index: 0, title: 'Mở đầu', start_ms: 0, end_ms: 5000 },
      ];
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        video_status: 'READY',
        video_asset: {
          vtt_subtitles_key: `micro-content/${courseId}/${microContentId}/sub.vtt`,
          transcript_text: 'Nội dung phụ đề',
          scene_timeline: timeline,
        },
      });

      const res = await service.getSubtitlesUrl(learnerClaims, {
        microContentId,
      });

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(
        learnerClaims,
        courseId,
        ['learner'],
      );
      expect(storage.createPresignedDownloadUrl).toHaveBeenCalledWith(
        `micro-content/${courseId}/${microContentId}/sub.vtt`,
        300,
      );
      expect(res).toEqual({
        url: 'https://storage/download-url',
        mimeType: 'text/vtt',
        transcriptText: 'Nội dung phụ đề',
        sceneTimeline: timeline,
      });
    });

    it('returns url: null gracefully when vtt_subtitles_key is absent', async () => {
      const { service, prisma, storage } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        video_status: 'READY',
        video_asset: {
          vtt_subtitles_key: null,
          transcript_text: null,
          scene_timeline: null,
        },
      });

      const res = await service.getSubtitlesUrl(learnerClaims, {
        microContentId,
      });

      expect(storage.createPresignedDownloadUrl).not.toHaveBeenCalled();
      expect(res).toEqual({
        url: null,
        mimeType: 'text/vtt',
        transcriptText: null,
        sceneTimeline: [],
      });
    });

    it('rejects learner when micro content is DRAFT', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'DRAFT',
        video_status: 'READY',
        video_asset: null,
      });

      await expect(
        service.getSubtitlesUrl(learnerClaims, { microContentId }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
