import { BadRequestException } from '@nestjs/common';
import { CurriculumImportService } from './curriculum-import.service';

describe('CurriculumImportService', () => {
  const courseId = '01900000-0000-7000-8000-000000000001';
  const importId = '01900000-0000-7000-8000-000000000002';
  const claims = {
    sub: '01900000-0000-7000-8000-000000000003',
    roles: ['instructor'],
    scope: 'course' as const,
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const syllabusPdf = {
    id: 42,
    display_name: 'DCMH.CO3137.pdf',
    'content-type': 'application/pdf',
    size: 3,
    url: 'https://canvas.example/files/42/download',
  };

  function setup() {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: importId }]),
      curriculum_imports: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
        updateMany: jest.fn(),
      },
    };
    const authz = { assertCourseAccess: jest.fn().mockResolvedValue(undefined) };
    const canvas = {
      getCourseByLtiContext: jest.fn().mockResolvedValue({
        id: 1,
        name: 'CO3137',
        syllabus_body: '<a href="/courses/1/files/7">Ch1.pdf</a> <a href="/courses/1/files/42">DCMH</a>',
      }),
      getFile: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(
          id === '42'
            ? syllabusPdf
            : { id: 7, display_name: 'Ch1_Big Data Intro.pdf', 'content-type': 'application/pdf' },
        ),
      ),
      downloadFile: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    const canvasCourses = { contextId: jest.fn().mockResolvedValue('ctx-1') };
    const storage = { putObject: jest.fn().mockResolvedValue(undefined) };
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const service = new CurriculumImportService(
      prisma as never,
      authz as never,
      canvas as never,
      canvasCourses as never,
      storage as never,
      queue as never,
    );
    return { service, prisma, authz, canvas, canvasCourses, storage, queue };
  }

  describe('syncFromCanvas', () => {
    it('stores the syllabus file and queues a preview, not an apply', async () => {
      const { service, canvas, storage, queue, prisma, authz } = setup();

      const result = await service.syncFromCanvas(claims, courseId);

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId, ['instructor', 'ta']);
      expect(canvas.getCourseByLtiContext).toHaveBeenCalledWith('ctx-1');
      expect(canvas.downloadFile).toHaveBeenCalledWith(syllabusPdf);
      expect(storage.putObject).toHaveBeenCalledWith(
        `curricula/${courseId}/${importId}/DCMH.CO3137.pdf`,
        Buffer.from('pdf'),
        'application/pdf',
      );
      expect(prisma.curriculum_imports.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ source: 'canvas', source_ref: '42', status: 'QUEUED' }),
      });
      expect(queue.add).toHaveBeenCalledWith(
        'curriculum_preview',
        { import_id: importId },
        expect.anything(),
      );
      expect(result.reused).toBe(false);
    });

    it('reuses the previous import when the same file has not changed', async () => {
      const { service, prisma, storage, queue } = setup();
      prisma.curriculum_imports.findFirst.mockResolvedValue({ import_id: 'old', status: 'APPLIED' });

      const result = await service.syncFromCanvas(claims, courseId);

      expect(result).toEqual({ import_id: 'old', status: 'APPLIED', reused: true });
      expect(storage.putObject).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('retries an unchanged file whose previous import failed', async () => {
      const { service, prisma, queue } = setup();
      prisma.curriculum_imports.findFirst.mockResolvedValue({ import_id: 'old', status: 'FAILED' });

      await service.syncFromCanvas(claims, courseId);

      expect(queue.add).toHaveBeenCalledTimes(1);
    });

    it('stops before calling Canvas when the course was not launched from Canvas', async () => {
      const { service, canvasCourses, canvas } = setup();
      canvasCourses.contextId.mockRejectedValue(new BadRequestException('not canvas'));

      await expect(service.syncFromCanvas(claims, courseId)).rejects.toBeInstanceOf(BadRequestException);
      expect(canvas.getCourseByLtiContext).not.toHaveBeenCalled();
    });

    it('explains when the Canvas syllabus page has no attached file', async () => {
      const { service, canvas } = setup();
      canvas.getCourseByLtiContext.mockResolvedValue({ id: 1, name: 'CO3137', syllabus_body: '<p>TBA</p>' });

      await expect(service.syncFromCanvas(claims, courseId)).rejects.toThrow(/chưa đính kèm file đề cương/);
    });
  });

  describe('applyImport', () => {
    it('queues the apply job only when the preview is ready', async () => {
      const { service, prisma, queue } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue({ import_id: importId, course_id: courseId, status: 'READY' });
      prisma.curriculum_imports.updateMany.mockResolvedValue({ count: 1 });

      await service.applyImport(claims, importId);

      expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledWith({
        where: { import_id: importId, status: 'READY' },
        data: expect.objectContaining({ status: 'APPLYING', applied_by: claims.sub }),
      });
      expect(queue.add).toHaveBeenCalledWith('curriculum_apply', { import_id: importId }, expect.anything());
    });

    it('does not queue a second apply for an import already being applied', async () => {
      const { service, prisma, queue } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue({ import_id: importId, course_id: courseId, status: 'APPLYING' });
      prisma.curriculum_imports.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.applyImport(claims, importId)).rejects.toBeInstanceOf(BadRequestException);
      expect(queue.add).not.toHaveBeenCalled();
    });
  });
});
