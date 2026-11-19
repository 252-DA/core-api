import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurriculumImportService } from './curriculum-import.service';
import { CO3011_CURRICULUM } from '../testdata/co3011';

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
  const storageKey = `curricula/${courseId}/${importId}/DCMH.CO3137.pdf`;

  function readyImport(overrides: Record<string, unknown> = {}) {
    return {
      import_id: importId,
      course_id: courseId,
      file_name: 'DCMH.CO3137.pdf',
      storage_key: storageKey,
      status: 'READY',
      curriculum: CO3011_CURRICULUM,
      ...overrides,
    };
  }

  function setup() {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      curriculum_imports: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      outbox_events: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: importId }]),
      $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
      curriculum_imports: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve(data)),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const canvas = {
      getCourseByLtiContext: jest.fn().mockResolvedValue({
        id: 1,
        name: 'CO3137',
        syllabus_body:
          '<a href="/courses/1/files/7">Ch1.pdf</a> <a href="/courses/1/files/42">DCMH</a>',
      }),
      getFile: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(
            id === '42'
              ? syllabusPdf
              : {
                  id: 7,
                  display_name: 'Ch1_Big Data Intro.pdf',
                  'content-type': 'application/pdf',
                },
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
    return {
      service,
      prisma,
      tx,
      authz,
      canvas,
      canvasCourses,
      storage,
      queue,
    };
  }

  describe('syncFromCanvas', () => {
    it('stores the syllabus file and queues a preview that carries everything the worker needs', async () => {
      const { service, canvas, storage, queue, prisma, authz } = setup();

      const result = await service.syncFromCanvas(claims, courseId);

      expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, courseId, [
        'instructor',
        'ta',
      ]);
      expect(canvas.getCourseByLtiContext).toHaveBeenCalledWith('ctx-1');
      expect(canvas.downloadFile).toHaveBeenCalledWith(syllabusPdf);
      expect(storage.putObject).toHaveBeenCalledWith(
        storageKey,
        Buffer.from('pdf'),
        'application/pdf',
      );
      expect(prisma.curriculum_imports.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'canvas',
            source_ref: '42',
            status: 'QUEUED',
          }),
        }),
      );
      // Worker không đọc curriculum_imports: job mang đủ dữ liệu.
      expect(queue.add).toHaveBeenCalledWith(
        'curriculum_preview',
        {
          import_id: importId,
          course_id: courseId,
          file_name: 'DCMH.CO3137.pdf',
          storage_key: storageKey,
        },
        expect.objectContaining({ attempts: 3 }),
      );
      expect(result.reused).toBe(false);
    });

    it('never returns the full curriculum column to the web', async () => {
      const { service, prisma } = setup();

      await service.syncFromCanvas(claims, courseId);
      await service.listImports(claims, courseId);

      for (const call of [
        prisma.curriculum_imports.findFirst.mock.calls[0][0],
        prisma.curriculum_imports.create.mock.calls[0][0],
        prisma.curriculum_imports.findMany.mock.calls[0][0],
      ]) {
        expect(call.select.preview).toBe(true);
        expect(call.select.curriculum).toBeUndefined();
      }
    });

    it('reuses the previous import when the same file has not changed', async () => {
      const { service, prisma, storage, queue } = setup();
      prisma.curriculum_imports.findFirst.mockResolvedValue({
        import_id: 'old',
        status: 'APPLIED',
      });

      const result = await service.syncFromCanvas(claims, courseId);

      expect(result).toEqual({
        import_id: 'old',
        status: 'APPLIED',
        reused: true,
      });
      expect(storage.putObject).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    describe('an import that never got its preview', () => {
      const minutesAgo = (minutes: number) =>
        new Date(Date.now() - minutes * 60_000);

      it.each(['QUEUED', 'EXTRACTING'])(
        'keeps reusing a %s import that is still recent',
        async (status) => {
          const { service, prisma, queue } = setup();
          prisma.curriculum_imports.findFirst.mockResolvedValue({
            import_id: 'old',
            status,
            updated_at: minutesAgo(5),
          });

          const result = await service.syncFromCanvas(claims, courseId);

          expect(result).toMatchObject({ import_id: 'old', reused: true });
          expect(prisma.curriculum_imports.updateMany).not.toHaveBeenCalled();
          expect(queue.add).not.toHaveBeenCalled();
        },
      );

      it.each(['QUEUED', 'EXTRACTING'])(
        'abandons a %s import that waited more than 30 minutes and queues a new one',
        async (status) => {
          const { service, prisma, queue, storage } = setup();
          prisma.curriculum_imports.findFirst.mockResolvedValue({
            import_id: 'old',
            status,
            updated_at: minutesAgo(31),
          });

          const result = await service.syncFromCanvas(claims, courseId);

          // Lần nạp cũ → FAILED bằng UPDATE có điều kiện (kết quả vừa tới thì không đè).
          const [args] = prisma.curriculum_imports.updateMany.mock.calls[0];
          expect(args.where).toMatchObject({
            import_id: 'old',
            status: { in: ['QUEUED', 'EXTRACTING'] },
          });
          expect(args.where.updated_at.lt).toBeInstanceOf(Date);
          expect(args.data).toMatchObject({
            status: 'FAILED',
            error: expect.stringContaining('30 phút') as string,
          });
          // Rồi nạp lại file như lần đầu.
          expect(storage.putObject).toHaveBeenCalledTimes(1);
          expect(queue.add).toHaveBeenCalledTimes(1);
          expect(result.reused).toBe(false);
        },
      );

      it('reuses the import when its result landed between the read and the update', async () => {
        const { service, prisma, queue } = setup();
        prisma.curriculum_imports.findFirst.mockResolvedValue({
          import_id: 'old',
          status: 'QUEUED',
          updated_at: minutesAgo(45),
        });
        prisma.curriculum_imports.updateMany.mockResolvedValue({ count: 0 });

        const result = await service.syncFromCanvas(claims, courseId);

        expect(result).toMatchObject({ import_id: 'old', reused: true });
        expect(queue.add).not.toHaveBeenCalled();
      });

      it.each(['READY', 'BLOCKED', 'APPLYING', 'APPLIED'])(
        'never abandons a %s import however old it is',
        async (status) => {
          const { service, prisma, queue } = setup();
          prisma.curriculum_imports.findFirst.mockResolvedValue({
            import_id: 'old',
            status,
            updated_at: minutesAgo(60 * 24 * 30),
          });

          const result = await service.syncFromCanvas(claims, courseId);

          expect(result).toMatchObject({ import_id: 'old', reused: true });
          expect(prisma.curriculum_imports.updateMany).not.toHaveBeenCalled();
          expect(queue.add).not.toHaveBeenCalled();
        },
      );
    });

    it('retries an unchanged file whose previous import failed', async () => {
      const { service, prisma, queue } = setup();
      prisma.curriculum_imports.findFirst.mockResolvedValue({
        import_id: 'old',
        status: 'FAILED',
      });

      await service.syncFromCanvas(claims, courseId);

      expect(queue.add).toHaveBeenCalledTimes(1);
    });

    it('stops before calling Canvas when the course was not launched from Canvas', async () => {
      const { service, canvasCourses, canvas } = setup();
      canvasCourses.contextId.mockRejectedValue(
        new BadRequestException('not canvas'),
      );

      await expect(
        service.syncFromCanvas(claims, courseId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(canvas.getCourseByLtiContext).not.toHaveBeenCalled();
    });

    it('explains when the Canvas syllabus page has no attached file', async () => {
      const { service, canvas } = setup();
      canvas.getCourseByLtiContext.mockResolvedValue({
        id: 1,
        name: 'CO3137',
        syllabus_body: '<p>TBA</p>',
      });

      await expect(service.syncFromCanvas(claims, courseId)).rejects.toThrow(
        /chưa đính kèm file đề cương/,
      );
    });
  });

  describe('applyImport', () => {
    it('writes the stored curriculum, marks the import applied and asks for a remap in one transaction', async () => {
      const { service, prisma, tx, queue } = setup();
      prisma.curriculum_imports.findUnique
        .mockResolvedValueOnce(readyImport())
        .mockResolvedValueOnce({ import_id: importId, status: 'APPLIED' });

      const result = await service.applyImport(claims, importId);

      expect(result).toEqual({ import_id: importId, status: 'APPLIED' });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.curriculum_imports.updateMany).toHaveBeenCalledWith({
        where: { import_id: importId, status: 'READY' },
        data: expect.objectContaining({
          status: 'APPLIED',
          applied_by: claims.sub,
          error: null,
        }),
      });
      // courses + 8 bảng + DELETE issue cũ.
      expect(tx.$executeRaw).toHaveBeenCalledTimes(10);
      expect(tx.outbox_events.create).toHaveBeenCalledWith({
        data: {
          event_type: 'COURSE_CHUNK_LO_REMAP_REQUESTED',
          aggregate_type: 'course',
          aggregate_id: courseId,
          payload: { course_id: courseId, import_id: importId },
        },
      });
      // Không còn job áp dụng cho worker: worker không ghi đề cương.
      expect(queue.add).not.toHaveBeenCalled();
      // Kết quả trả web không kèm bản đề cương đầy đủ.
      expect(
        prisma.curriculum_imports.findUnique.mock.calls[1][0].select.curriculum,
      ).toBeUndefined();
    });

    it('refuses an import that is not ready, without touching the curriculum', async () => {
      const { service, prisma } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(
        readyImport({ status: 'APPLIED' }),
      );

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /đang ở trạng thái APPLIED/,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('stops a second concurrent apply before writing anything', async () => {
      const { service, prisma, tx } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(readyImport());
      tx.curriculum_imports.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.applyImport(claims, importId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.$executeRaw).not.toHaveBeenCalled();
      expect(tx.outbox_events.create).not.toHaveBeenCalled();
    });

    it('re-extracts a legacy import that has no stored curriculum instead of parsing and writing silently', async () => {
      const { service, prisma, queue } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(
        readyImport({ curriculum: null }),
      );

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /trích xuất lại/,
      );

      expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledWith({
        where: {
          import_id: importId,
          status: 'READY',
          curriculum: { equals: Prisma.DbNull },
        },
        data: expect.objectContaining({
          status: 'QUEUED',
          preview: Prisma.DbNull,
        }),
      });
      expect(queue.add).toHaveBeenCalledWith(
        'curriculum_preview',
        {
          import_id: importId,
          course_id: courseId,
          file_name: 'DCMH.CO3137.pdf',
          storage_key: storageKey,
        },
        expect.anything(),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses a stored curriculum that still has blocking issues', async () => {
      const { service, prisma } = setup();
      const blocked = JSON.parse(JSON.stringify(CO3011_CURRICULUM));
      blocked.issues[0].severity = 'error';
      prisma.curriculum_imports.findUnique.mockResolvedValue(
        readyImport({ curriculum: blocked }),
      );

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /lỗi cấu trúc/,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses a stored curriculum that is not in the contract shape', async () => {
      const { service, prisma } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(
        readyImport({ curriculum: { course: {} } }),
      );

      await expect(
        service.applyImport(claims, importId),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('keeps the import ready and records the error when the write fails', async () => {
      const { service, prisma, tx } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(readyImport());
      tx.$executeRaw
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error('value too long'));

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /Không ghi được đề cương/,
      );
      expect(prisma.curriculum_imports.updateMany).toHaveBeenCalledWith({
        where: { import_id: importId, status: 'READY' },
        data: expect.objectContaining({
          error: expect.stringContaining('value too long'),
        }),
      });
    });

    it('explains a course code that already belongs to another course', async () => {
      const { service, prisma, tx } = setup();
      prisma.curriculum_imports.findUnique.mockResolvedValue(readyImport());
      tx.$executeRaw.mockRejectedValueOnce(
        new Error(
          'duplicate key value violates unique constraint "courses_code_key"',
        ),
      );

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /Mã học phần CO3011 .* khoá học khác/,
      );
    });
  });
});
