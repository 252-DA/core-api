import { BadRequestException } from '@nestjs/common';
import { CanvasDocumentSyncService, MAP_DOCUMENT_LOS_JOB } from './canvas-document-sync.service';

describe('CanvasDocumentSyncService', () => {
  const courseId = '01900000-0000-7000-8000-000000000001';
  const claims = {
    sub: '01900000-0000-7000-8000-000000000003',
    roles: ['instructor'],
    scope: 'course' as const,
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const updatedAt = '2026-09-27T02:00:00Z';

  const canvasFile = (id: number, name: string, mime = 'application/pdf', updated = updatedAt) => ({
    id,
    display_name: name,
    'content-type': mime,
    size: 3,
    url: `https://canvas.example/files/${id}/download`,
    updated_at: updated,
  });

  function setup(options: {
    modules: Array<{ name: string; files: number[] }>;
    files: Record<number, ReturnType<typeof canvasFile>>;
    existing?: Array<Record<string, unknown>>;
  }) {
    let nextId = 100;
    const prisma = {
      $queryRaw: jest.fn().mockImplementation(() => Promise.resolve([{ id: `doc-${nextId++}` }])),
      course_sessions: {
        findMany: jest.fn().mockResolvedValue([
          { session_no: 1, chapters: { code: '1' } },
          { session_no: 2, chapters: { code: '2' } },
          { session_no: 3, chapters: { code: '3' } },
        ]),
      },
      chapters: {
        findMany: jest.fn().mockResolvedValue([{ code: '1' }, { code: '2' }, { code: '3' }]),
        findFirst: jest.fn(),
      },
      documents: {
        findMany: jest.fn().mockResolvedValue(options.existing ?? []),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const authz = { assertCourseAccess: jest.fn().mockResolvedValue(undefined) };
    const canvas = {
      listModules: jest.fn().mockResolvedValue(
        options.modules.map((m, i) => ({
          id: i + 1,
          name: m.name,
          position: i + 1,
          published: true,
          items: m.files.map((fileId) => ({ id: fileId, title: `f${fileId}`, type: 'File', content_id: fileId, published: true })),
        })),
      ),
      listCourseFiles: jest.fn().mockResolvedValue(Object.values(options.files)),
      getFile: jest.fn(),
      downloadFile: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    const canvasCourses = { contextId: jest.fn().mockResolvedValue('ctx-1') };
    const storage = { putObject: jest.fn().mockResolvedValue(undefined) };
    const documents = {
      deleteCanvasDocument: jest.fn().mockResolvedValue({ success: true }),
      getDocument: jest.fn().mockResolvedValue({}),
    };
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job' }) };
    const syncJobs = { enqueue: jest.fn().mockResolvedValue({ job_id: `canvas-sync-${courseId}`, status: 'QUEUED' }) };
    const service = new CanvasDocumentSyncService(
      prisma as never,
      authz as never,
      canvas as never,
      canvasCourses as never,
      storage as never,
      documents as never,
      queue as never,
      syncJobs as never,
    );
    return { service, prisma, canvas, storage, documents, queue, authz, syncJobs };
  }

  describe('manual sync', () => {
    it('authorizes and enqueues without making Canvas API calls', async () => {
      const { service, authz, syncJobs, canvas } = setup({ modules: [], files: {} });
      await expect(service.syncFromCanvas(claims, courseId)).resolves.toMatchObject({ status: 'QUEUED' });
      expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId, ['instructor', 'ta']);
      expect(syncJobs.enqueue).toHaveBeenCalledWith(courseId, { kind: 'user', userId: claims.sub }, 'manual');
      expect(canvas.listModules).not.toHaveBeenCalled();
    });

    it('does not enqueue an unauthorized request', async () => {
      const { service, authz, syncJobs } = setup({ modules: [], files: {} });
      authz.assertCourseAccess.mockRejectedValue(new Error('Forbidden'));
      await expect(service.syncFromCanvas(claims, courseId)).rejects.toThrow('Forbidden');
      expect(syncJobs.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('syncCourse', () => {
    it('imports as system without claims and batches file metadata, retaining module scope', async () => {
      const { service, prisma, canvas, authz } = setup({
        modules: [{ name: 'Slides', files: [11, 12] }],
        files: { 11: canvasFile(11, 'one.pdf'), 12: canvasFile(12, 'two.pdf'), 13: canvasFile(13, 'unattached.pdf') },
      });
      await service.syncCourse(courseId, { kind: 'system' });
      expect(authz.assertCourseAccess).not.toHaveBeenCalled();
      expect(canvas.listCourseFiles).toHaveBeenCalledTimes(1);
      expect(canvas.getFile).not.toHaveBeenCalled();
      expect(prisma.documents.create).toHaveBeenCalledTimes(2);
      expect(prisma.documents.create.mock.calls[0][0].data.created_by).toBeNull();
    });

    it('does not delete existing documents if listing fails or is incomplete', async () => {
      const { service, canvas, documents } = setup({
        modules: [], files: {},
        existing: [{ document_id: 'doc-9', lms_file_id: '99', title: 'Keep.pdf' }],
      });
      canvas.listCourseFiles.mockRejectedValue(new Error('incomplete listing'));
      await expect(service.syncCourse(courseId, { kind: 'system' })).rejects.toThrow('incomplete listing');
      expect(documents.deleteCanvasDocument).not.toHaveBeenCalled();
    });

    it('marks an import ERROR when enqueue fails so the next sync can retry it', async () => {
      const { service, queue, prisma } = setup({
        modules: [{ name: 'Slides', files: [11] }], files: { 11: canvasFile(11, 'one.pdf') },
      });
      queue.add.mockRejectedValue(new Error('Redis unavailable'));
      const summary = await service.syncCourse(courseId, { kind: 'system' });
      expect(summary.skipped).toEqual([{ name: 'one.pdf', reason: 'Redis unavailable' }]);
      expect(prisma.documents.update).toHaveBeenCalledWith({ where: { document_id: 'doc-100' }, data: { status: 'ERROR' } });
    });

    it('imports slides from a flat "Slides" module, placing each by its file name', async () => {
      const { service, prisma, storage, queue } = setup({
        modules: [{ name: 'Slides', files: [11, 12] }],
        files: { 11: canvasFile(11, 'Ch1_Big Data Intro.pdf'), 12: canvasFile(12, 'Overview.pdf') },
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.created).toEqual(['Ch1_Big Data Intro.pdf', 'Overview.pdf']);
      const [first, second] = prisma.documents.create.mock.calls.map(([arg]) => arg.data);
      expect(first).toMatchObject({
        source: 'canvas',
        lms_file_id: '11',
        lms_module: 'Slides',
        role: 'lecture',
        chapter_code: '1',
        chapter_provenance: 'file_name',
      });
      // Không có tín hiệu tên → để worker khớp nội dung.
      expect(second).toMatchObject({ role: 'lecture', chapter_code: null, chapter_provenance: null });
      expect(storage.putObject).toHaveBeenCalledTimes(2);
      expect(queue.add.mock.calls.map(([name]) => name)).toEqual(['process_document', 'process_document']);
    });

    it('marks files in a References module as reference without a single chapter', async () => {
      const { service, prisma } = setup({
        modules: [{ name: 'References', files: [21] }],
        files: { 21: canvasFile(21, 'MMDS_ch3.pdf') },
      });

      await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(prisma.documents.create.mock.calls[0][0].data).toMatchObject({
        role: 'reference',
        chapter_code: null,
      });
    });

    it('takes the chapter from a chapter module, mapping weeks through the syllabus schedule', async () => {
      const { service, prisma } = setup({
        modules: [{ name: 'Tuần 2', files: [31] }],
        files: { 31: canvasFile(31, 'slides.pdf') },
      });

      await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(prisma.documents.create.mock.calls[0][0].data).toMatchObject({
        chapter_code: '2',
        chapter_provenance: 'module',
        chapter_reason: 'Module "Tuần 2" ghi tuần 2',
      });
    });

    it('skips formats the pipeline cannot parse', async () => {
      const { service, prisma } = setup({
        modules: [{ name: 'Slides', files: [41] }],
        files: { 41: canvasFile(41, 'lecture.mp4', 'video/mp4') },
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.skipped).toEqual([{ name: 'lecture.mp4', reason: expect.stringContaining('chưa hỗ trợ') }]);
      expect(prisma.documents.create).not.toHaveBeenCalled();
    });

    it('leaves an unchanged file alone and keeps the chapter the teacher confirmed', async () => {
      const { service, prisma, canvas, queue } = setup({
        modules: [{ name: 'Chương 3', files: [11] }],
        files: { 11: canvasFile(11, 'Ch1.pdf') },
        existing: [{
          document_id: 'doc-1', course_id: courseId, title: 'Ch1.pdf', lms_file_id: '11',
          lms_module: 'Chương 3', lms_published: true, lms_updated_at: new Date(updatedAt),
          role: 'lecture', role_provenance: 'inferred',
          chapter_code: '1', chapter_provenance: 'confirmed',
        }],
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.unchanged).toBe(1);
      expect(canvas.downloadFile).not.toHaveBeenCalled();
      expect(prisma.documents.update).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('re-queues an unchanged file whose previous processing failed', async () => {
      const { service, prisma, canvas, queue } = setup({
        modules: [{ name: 'Slides', files: [11] }],
        files: { 11: canvasFile(11, 'Ch1.pdf') },
        existing: [{
          document_id: 'doc-1', course_id: courseId, title: 'Ch1.pdf', lms_file_id: '11',
          lms_module: 'Slides', lms_published: true, lms_updated_at: new Date(updatedAt),
          role: 'lecture', role_provenance: 'inferred', chapter_code: '1', chapter_provenance: 'file_name',
          status: 'ERROR', created_by: claims.sub, file_path: `documents/${courseId}/doc-1/Ch1.pdf`,
        }],
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.retried).toEqual(['Ch1.pdf']);
      expect(canvas.downloadFile).not.toHaveBeenCalled();
      expect(prisma.documents.update).toHaveBeenCalledWith({
        where: { document_id: 'doc-1' },
        data: { status: 'QUEUED' },
      });
      expect(queue.add).toHaveBeenCalledWith(
        'process_document',
        expect.objectContaining({ document_id: 'doc-1', file_name: 'Ch1.pdf' }),
        expect.anything(),
      );
    });

    it('re-maps LOs when a moved file now sits in a chapter module', async () => {
      const { service, prisma, queue } = setup({
        modules: [{ name: 'Chương 2', files: [11] }],
        files: { 11: canvasFile(11, 'Overview.pdf') },
        existing: [{
          document_id: 'doc-1', course_id: courseId, title: 'Overview.pdf', lms_file_id: '11',
          lms_module: 'Slides', lms_published: true, lms_updated_at: new Date(updatedAt),
          role: 'lecture', role_provenance: 'inferred',
          chapter_code: '3', chapter_provenance: 'content',
        }],
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.updated).toEqual(['Overview.pdf']);
      expect(prisma.documents.update.mock.calls[0][0].data).toMatchObject({
        lms_module: 'Chương 2',
        chapter_code: '2',
        chapter_provenance: 'module',
      });
      expect(queue.add).toHaveBeenCalledWith(
        MAP_DOCUMENT_LOS_JOB,
        { document_id: 'doc-1', course_id: courseId },
        expect.anything(),
      );
    });

    it('replaces a file whose Canvas version changed, keeping teacher choices', async () => {
      const { service, prisma, documents } = setup({
        modules: [{ name: 'Slides', files: [11] }],
        files: { 11: canvasFile(11, 'Ch1.pdf', 'application/pdf', '2026-09-28T00:00:00Z') },
        existing: [{
          document_id: 'doc-1', course_id: courseId, title: 'Ch1.pdf', lms_file_id: '11',
          lms_module: 'Slides', lms_updated_at: new Date(updatedAt),
          role: 'exercise', role_provenance: 'confirmed',
          chapter_code: '2', chapter_provenance: 'confirmed', chapter_confidence: 1, chapter_reason: 'Giảng viên chọn',
        }],
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.updated).toEqual(['Ch1.pdf']);
      const deleteOrder = documents.deleteCanvasDocument.mock.invocationCallOrder[0];
      const createOrder = prisma.documents.create.mock.invocationCallOrder[0];
      expect(deleteOrder).toBeLessThan(createOrder);
      expect(prisma.documents.create.mock.calls[0][0].data).toMatchObject({
        role: 'exercise',
        role_provenance: 'confirmed',
        chapter_code: '2',
        chapter_provenance: 'confirmed',
      });
    });

    it('hides documents whose file was removed from every module', async () => {
      const { service, documents } = setup({
        modules: [{ name: 'Slides', files: [] }],
        files: {},
        existing: [{ document_id: 'doc-9', course_id: courseId, title: 'Old.pdf', lms_file_id: '99' }],
      });

      const summary = await service.syncCourse(courseId, { kind: 'user', userId: claims.sub });

      expect(summary.removed).toEqual(['Old.pdf']);
      expect(documents.deleteCanvasDocument).toHaveBeenCalledWith(courseId, 'doc-9');
    });
  });

  describe('updatePlacement', () => {
    const doc = {
      document_id: 'doc-1', course_id: courseId, role: 'lecture',
      chapter_code: null, chapter_provenance: null,
    };

    it('records the teacher choice as confirmed and re-maps LOs', async () => {
      const { service, prisma, queue } = setup({ modules: [], files: {} });
      prisma.documents.findFirst.mockResolvedValue(doc);
      prisma.chapters.findFirst.mockResolvedValue({ code: '2' });

      await service.updatePlacement(claims, 'doc-1', { role: 'lecture', chapterCode: '2' });

      expect(prisma.documents.update).toHaveBeenCalledWith({
        where: { document_id: 'doc-1' },
        data: expect.objectContaining({ chapter_code: '2', chapter_provenance: 'confirmed' }),
      });
      expect(queue.add).toHaveBeenCalledWith(MAP_DOCUMENT_LOS_JOB, expect.anything(), expect.anything());
    });

    it('rejects a chapter the syllabus does not have', async () => {
      const { service, prisma, queue } = setup({ modules: [], files: {} });
      prisma.documents.findFirst.mockResolvedValue(doc);
      prisma.chapters.findFirst.mockResolvedValue(null);

      await expect(service.updatePlacement(claims, 'doc-1', { chapterCode: '42' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('hands the chapter back to the system when the teacher picks "auto"', async () => {
      const { service, prisma } = setup({ modules: [], files: {} });
      prisma.documents.findFirst.mockResolvedValue({ ...doc, chapter_code: '2', chapter_provenance: 'confirmed' });

      await service.updatePlacement(claims, 'doc-1', { chapterCode: '' });

      expect(prisma.documents.update.mock.calls[0][0].data).toMatchObject({
        chapter_code: null,
        chapter_provenance: null,
      });
    });
  });
});
