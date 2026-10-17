import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
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
    };

    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };

    const storage = {
      createPresignedUploadUrl: jest.fn().mockResolvedValue('https://storage/upload-url'),
      createPresignedDownloadUrl: jest.fn().mockResolvedValue('https://storage/download-url'),
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
      expect(res.objectKey).toBe(`micro-content/${courseId}/${microContentId}/video.mp4`);
      expect(prisma.micro_contents.update).toHaveBeenCalledWith({
        where: { micro_content_id: microContentId },
        data: expect.objectContaining({
          video_status: 'UPLOADING',
          video_object_key: `micro-content/${courseId}/${microContentId}/video.mp4`,
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

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(learnerClaims, courseId, ['learner']);
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

      await expect(service.getVideoUrl(learnerClaims, { microContentId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects request when video is not READY', async () => {
      const { service, prisma } = setup();
      prisma.micro_contents.findFirst.mockResolvedValue({
        micro_content_id: microContentId,
        course_id: courseId,
        status: 'PUBLISHED',
        video_status: 'PROCESSING',
      });

      await expect(service.getVideoUrl(instructorClaims, { microContentId })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

