import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CurriculumImportResultHandler } from '../handlers/curriculum-import-result.handler';
import { CurriculumImportService } from './curriculum-import.service';
import type { NormalizedCurriculum } from '../handlers/curriculum-payload';
import { writeCurriculum } from './curriculum-writer';
import { curriculumIds } from '../domain/stable-uuid';
import {
  CO3011_CURRICULUM,
  CO3011_ENVELOPE,
  DUMP_SQL,
  GOLDEN_COURSE_ID,
  PYTHON_ROWS,
  sortDump,
  type TableDump,
} from '../testdata/co3011';

/**
 * Chạy thật trên PostgreSQL đã áp đủ migration. Bỏ qua khi không đặt
 * CURRICULUM_IT_DATABASE_URL, để `npx jest` mặc định không cần DB.
 *
 *   CURRICULUM_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_i \
 *     npx jest src/modules/curriculum/services/curriculum-import.integration.spec.ts
 *
 * Test XOÁ đề cương của học phần GOLDEN_COURSE_ID và tạo học phần/lần nạp mới:
 * chỉ trỏ vào DB tạm.
 */
const url = process.env.CURRICULUM_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

const CURRICULUM_TABLES = [
  'chapters',
  'learning_outcomes',
  'chapter_los',
  'course_goals',
  'course_sessions',
  'assessments',
  'lo_assessments',
  'curriculum_extraction_issues',
] as const;

describeDb('Curriculum import on PostgreSQL', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function dump(courseId: string): Promise<TableDump> {
    const [{ dump }] = await prisma.$queryRawUnsafe<Array<{ dump: string }>>(
      DUMP_SQL,
      courseId,
    );
    return sortDump(JSON.parse(dump));
  }

  async function courseRow(courseId: string) {
    const [row] = await prisma.$queryRawUnsafe<
      Array<{
        code: string;
        subject_code: string | null;
        name: string;
        description: string | null;
      }>
    >(
      'SELECT code, subject_code, name, description FROM courses WHERE course_id = $1::uuid',
      courseId,
    );
    return row;
  }

  function expectMatchesPython(
    actual: TableDump,
    expectedCourseCode = `canvas-it-${GOLDEN_COURSE_ID}`,
  ) {
    const expected = sortDump(PYTHON_ROWS);
    expect(actual.courses).toEqual([
      {
        ...expected.courses[0],
        code: expectedCourseCode,
      },
    ]);
    const { courses: _actualCourses, ...actualRest } = actual;
    const { courses: _expectedCourses, ...expectedRest } = expected;
    expect(actualRest).toEqual(expectedRest);
  }

  async function createCourse(courseId: string = randomUUID()) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO courses (course_id, lms_id, code, name) VALUES ($1::uuid, $2, $3, 'LMS course')
       ON CONFLICT (course_id) DO NOTHING`,
      courseId,
      `canvas:it-${courseId}`,
      `canvas-it-${courseId}`,
    );
    return courseId;
  }

  async function clearCurriculum(courseId: string) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM lo_assessments WHERE assessment_id IN
         (SELECT assessment_id FROM assessments WHERE course_id = $1::uuid)`,
      courseId,
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM chapter_los WHERE chapter_id IN
         (SELECT chapter_id FROM chapters WHERE course_id = $1::uuid)`,
      courseId,
    );
    for (const table of [
      'course_sessions',
      'curriculum_extraction_issues',
      'course_goals',
      'assessments',
      'learning_outcomes',
      'chapters',
    ]) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM ${table} WHERE course_id = $1::uuid`,
        courseId,
      );
    }
  }

  /** Dựng lại trạng thái SQL Python cũ để lại (PYTHON_ROWS) làm dữ liệu có sẵn. */
  async function seedPythonRows(rows: TableDump) {
    const [course] = rows.courses;
    await prisma.$executeRawUnsafe(
      'UPDATE courses SET code = $2, name = $3, description = $4 WHERE course_id = $1::uuid',
      course.course_id,
      course.code,
      course.name,
      course.description,
    );
    for (const table of CURRICULUM_TABLES) {
      if (!rows[table].length) continue;
      const columns = Object.keys(rows[table][0]).filter(
        (c) => c !== 'live' && c !== 'open',
      );
      const list = columns.join(', ');
      await prisma.$executeRawUnsafe(
        `INSERT INTO ${table} (${list})
         SELECT ${list} FROM json_populate_recordset(NULL::${table}, $1::json)`,
        JSON.stringify(rows[table]),
      );
    }
  }

  async function write(courseId: string, curriculum: NormalizedCurriculum) {
    return prisma.$transaction(
      (tx) => writeCurriculum(tx, courseId, curriculum),
      {
        timeout: 30_000,
      },
    );
  }

  async function countRows(courseId: string) {
    const d = await dump(courseId);
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.length]));
  }

  describe('writer vs the old Python SQL', () => {
    beforeEach(async () => {
      await createCourse(GOLDEN_COURSE_ID);
      await clearCurriculum(GOLDEN_COURSE_ID);
    });

    it('writes the same nine tables as upsert_curriculum did, and again without duplicates', async () => {
      await write(GOLDEN_COURSE_ID, CO3011_CURRICULUM);
      expectMatchesPython(await dump(GOLDEN_COURSE_ID));
      expect(await courseRow(GOLDEN_COURSE_ID)).toEqual({
        code: `canvas-it-${GOLDEN_COURSE_ID}`,
        subject_code: 'CO3011',
        name: CO3011_CURRICULUM.course.title_vi,
        description: CO3011_CURRICULUM.course.title_en,
      });

      await write(GOLDEN_COURSE_ID, CO3011_CURRICULUM);
      expectMatchesPython(await dump(GOLDEN_COURSE_ID));
    });

    it('updates rows the Python writer left behind instead of adding new ones', async () => {
      await seedPythonRows(PYTHON_ROWS);
      const lo = PYTHON_ROWS.learning_outcomes[0];
      await prisma.$executeRawUnsafe(
        `UPDATE learning_outcomes SET statement_vi = 'bản cũ', deleted_at = now() WHERE lo_id = $1::uuid`,
        lo.lo_id,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO curriculum_extraction_issues (course_id, code, severity, message, resolved_at)
         VALUES ($1::uuid, 'old.open', 'warning', 'chưa xử lý', NULL),
                ($1::uuid, 'old.resolved', 'warning', 'đã xử lý', now())`,
        GOLDEN_COURSE_ID,
      );

      await write(GOLDEN_COURSE_ID, CO3011_CURRICULUM);

      const after = await dump(GOLDEN_COURSE_ID);
      // Issue đã xử lý được giữ; issue chưa xử lý của lần trước bị thay.
      const resolved = after.curriculum_extraction_issues.filter(
        (i) => i.code === 'old.resolved',
      );
      expect(resolved).toHaveLength(1);
      after.curriculum_extraction_issues =
        after.curriculum_extraction_issues.filter(
          (i) => i.code !== 'old.resolved',
        );
      expectMatchesPython(after, 'CO3011');
      expect((await courseRow(GOLDEN_COURSE_ID)).subject_code).toBe('CO3011');
    });
  });

  describe('result handler + apply', () => {
    const storage = { putObject: jest.fn() };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const claims = {
      sub: '01900000-0000-7000-8000-000000000003',
      roles: ['instructor'],
      scope: 'course' as const,
      jti: 'it',
      iat: 0,
      exp: 1,
    };

    function services() {
      const queue = { add: jest.fn().mockResolvedValue({ id: 'job' }) };
      const service = new CurriculumImportService(
        prisma as never,
        authz as never,
        {} as never,
        {} as never,
        storage as never,
        queue as never,
      );
      const handler = new CurriculumImportResultHandler(prisma as never);
      return { service, handler, queue };
    }

    async function createImport(
      courseId: string,
      status = 'QUEUED',
      extra = '',
    ) {
      const importId = randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO curriculum_imports (import_id, course_id, source, file_name, storage_key, status${extra ? ', preview' : ''})
         VALUES ($1::uuid, $2::uuid, 'canvas', 'DCMH.CO3011.pdf', 'curricula/x.pdf', $3${extra ? `, ${extra}` : ''})`,
        importId,
        courseId,
        status,
      );
      return importId;
    }

    function envelopeFor(importId: string, code: string) {
      const envelope = JSON.parse(JSON.stringify(CO3011_ENVELOPE));
      envelope.result_id = `CURRICULUM_IMPORT_RESULT.${importId}`;
      envelope.payload.import_id = importId;
      // courses.code là unique: mỗi lần chạy một mã riêng.
      envelope.payload.curriculum.course.code = code;
      return envelope;
    }

    async function importRow(importId: string) {
      const [row] = await prisma.$queryRawUnsafe<
        Array<{
          status: string;
          curriculum: unknown;
          preview: unknown;
          error: string | null;
          applied_at: Date | null;
        }>
      >(
        'SELECT status, curriculum, preview, error, applied_at FROM curriculum_imports WHERE import_id = $1::uuid',
        importId,
      );
      return row;
    }

    async function remapEvents(importId: string) {
      return prisma.$queryRawUnsafe<
        Array<{ aggregate_id: string; payload: Record<string, string> }>
      >(
        `SELECT aggregate_id::text, payload FROM outbox_events
          WHERE event_type = 'COURSE_CHUNK_LO_REMAP_REQUESTED' AND payload->>'import_id' = $1`,
        importId,
      );
    }

    it('stores the preview result once, then applies exactly the stored curriculum once', async () => {
      const { service, handler } = services();
      const courseId = await createCourse();
      const importId = await createImport(courseId);
      const code = `CO3011-IT-${courseId.slice(0, 8)}`;
      const envelope = envelopeFor(importId, code);

      await expect(handler.handle(envelope)).resolves.toEqual({
        applied: true,
        status: 'READY',
      });
      await expect(handler.handle(envelope)).resolves.toMatchObject({
        applied: false,
        reason: 'not_awaiting',
      });
      const ready = await importRow(importId);
      expect(ready.status).toBe('READY');
      expect(ready.curriculum).toEqual(envelope.payload.curriculum);
      expect(ready.preview).toEqual(envelope.payload.preview);

      const applied = await service.applyImport(claims, importId);
      expect(applied).toMatchObject({
        status: 'APPLIED',
        applied_by: claims.sub,
      });
      expect(applied).not.toHaveProperty('curriculum');

      const counts = await countRows(courseId);
      expect(counts).toEqual({
        courses: 1,
        chapters: 12,
        learning_outcomes: 9,
        chapter_los: 12,
        course_goals: 2,
        course_sessions: 15,
        assessments: 3,
        lo_assessments: 38,
        curriculum_extraction_issues: 7,
      });
      const written = await dump(courseId);
      expect(written.courses[0].code).toBe(`canvas-it-${courseId}`);
      expect(await courseRow(courseId)).toMatchObject({
        code: `canvas-it-${courseId}`,
        subject_code: code,
      });
      expect(written.learning_outcomes.map((lo) => lo.lo_id).sort()).toEqual(
        CO3011_CURRICULUM.learning_outcomes
          .map((lo) => curriculumIds.learningOutcome(courseId, lo.code))
          .sort(),
      );
      const events = await remapEvents(importId);
      expect(events).toEqual([
        {
          aggregate_id: courseId,
          payload: { course_id: courseId, import_id: importId },
        },
      ]);

      // Áp lại: dừng ở trạng thái, không ghi gì thêm, không phát lệnh thứ hai.
      await expect(
        service.applyImport(claims, importId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(await countRows(courseId)).toEqual(counts);
      expect(await remapEvents(importId)).toHaveLength(1);
      // Kết quả xem trước đến muộn cũng không kéo lần nạp về READY.
      await handler.handle(envelope);
      expect((await importRow(importId)).status).toBe('APPLIED');
    });

    it('allows multiple courses to import the same subject code without violating courses_code_key', async () => {
      const { service, handler } = services();
      const firstCourse = await createCourse();
      const secondCourse = await createCourse();
      const sharedSubjectCode = `CO3137-IT-${firstCourse.slice(0, 6)}`;

      const firstImport = await createImport(firstCourse);
      await handler.handle(envelopeFor(firstImport, sharedSubjectCode));
      await expect(
        service.applyImport(claims, firstImport),
      ).resolves.toMatchObject({
        status: 'APPLIED',
      });

      const secondImport = await createImport(secondCourse);
      await handler.handle(envelopeFor(secondImport, sharedSubjectCode));
      await expect(
        service.applyImport(claims, secondImport),
      ).resolves.toMatchObject({
        status: 'APPLIED',
      });

      expect(await courseRow(firstCourse)).toMatchObject({
        code: `canvas-it-${firstCourse}`,
        subject_code: sharedSubjectCode,
      });
      expect(await courseRow(secondCourse)).toMatchObject({
        code: `canvas-it-${secondCourse}`,
        subject_code: sharedSubjectCode,
      });
    });

    it('rolls everything back and keeps the import ready when writing curriculum fails in DB', async () => {
      const { service, handler } = services();
      const courseId = await createCourse();
      const importId = await createImport(courseId);
      const code = `CO3011-ERR-${courseId.slice(0, 8)}`;
      const broken = envelopeFor(importId, code);
      // Vượt quá VARCHAR(20) của chapters.code sau khi UPDATE courses đã chạy.
      broken.payload.curriculum.chapters[0].code = 'CH-' + 'X'.repeat(25);
      await handler.handle(broken);

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        InternalServerErrorException,
      );

      const row = await importRow(importId);
      expect(row.status).toBe('READY');
      expect(row.error).toMatch(/Không ghi được đề cương/);
      expect(await courseRow(courseId)).toMatchObject({
        code: `canvas-it-${courseId}`,
        subject_code: null,
      });
      const counts = await countRows(courseId);
      expect(
        counts.chapters + counts.learning_outcomes + counts.assessments,
      ).toBe(0);
      expect(await remapEvents(importId)).toHaveLength(0);
    });

    it('re-extracts a legacy READY import that has no stored curriculum', async () => {
      const { service, queue } = services();
      const courseId = await createCourse();
      const importId = await createImport(
        courseId,
        'READY',
        `'{"blocking": false}'::jsonb`,
      );

      await expect(service.applyImport(claims, importId)).rejects.toThrow(
        /trích xuất lại/,
      );

      const row = await importRow(importId);
      expect(row).toMatchObject({
        status: 'QUEUED',
        preview: null,
        curriculum: null,
      });
      expect(queue.add).toHaveBeenCalledWith(
        'curriculum_preview',
        expect.objectContaining({ import_id: importId, course_id: courseId }),
        expect.anything(),
      );
      expect((await countRows(courseId)).chapters).toBe(0);
    });

    it('onFinalFailure: an import still awaiting its preview → FAILED, any other state is left alone', async () => {
      const { handler } = services();
      const courseId = await createCourse();
      const queued = await createImport(courseId, 'QUEUED');
      const extracting = await createImport(courseId, 'EXTRACTING');
      const ready = await createImport(courseId, 'READY');
      const applying = await createImport(courseId, 'APPLYING');
      const failing = (importId: string) => ({
        result_id: `CURRICULUM_IMPORT_RESULT.${importId}`,
        kind: 'CURRICULUM_IMPORT_RESULT' as const,
        source_event_id: null,
        occurred_at: '2026-11-07T10:30:15.123Z',
        payload: { import_id: importId, status: 'READY', preview: 'sai dạng' },
      });

      for (const id of [queued, extracting, ready, applying]) {
        await handler.onFinalFailure(failing(id), new Error('payload sai'));
      }

      expect(await importRow(queued)).toMatchObject({
        status: 'FAILED',
        error: expect.stringContaining('payload sai') as string,
      });
      expect((await importRow(extracting)).status).toBe('FAILED');
      expect((await importRow(ready)).status).toBe('READY');
      expect((await importRow(applying)).status).toBe('APPLYING');
    });

    describe('syncing the same syllabus again', () => {
      const content = Buffer.from('pdf');
      const checksum = createHash('sha256').update(content).digest('hex');

      function syncService() {
        const queue = { add: jest.fn().mockResolvedValue({ id: 'job' }) };
        const canvas = {
          getCourseByLtiContext: jest.fn().mockResolvedValue({
            syllabus_body: '<a href="/courses/1/files/42">DCMH</a>',
          }),
          getFile: jest.fn().mockResolvedValue({
            id: 42,
            display_name: 'DCMH.pdf',
            'content-type': 'application/pdf',
          }),
          downloadFile: jest.fn().mockResolvedValue(content),
        };
        const service = new CurriculumImportService(
          prisma as never,
          authz as never,
          canvas as never,
          { contextId: jest.fn().mockResolvedValue('ctx') } as never,
          { putObject: jest.fn().mockResolvedValue(undefined) } as never,
          queue as never,
        );
        return { service, queue };
      }

      async function previousImport(
        courseId: string,
        status: string,
        minutesAgo: number,
      ) {
        const importId = randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO curriculum_imports (import_id, course_id, source, source_ref, checksum, file_name, storage_key, status, created_at, updated_at)
           VALUES ($1::uuid, $2::uuid, 'canvas', '42', $3, 'DCMH.pdf', 'curricula/x.pdf', $4,
                   now() - make_interval(mins => $5), now() - make_interval(mins => $5))`,
          importId,
          courseId,
          checksum,
          status,
          minutesAgo,
        );
        return importId;
      }

      it('is no longer stuck on a QUEUED import that never got its result', async () => {
        const { service, queue } = syncService();
        const courseId = await createCourse();
        const stale = await previousImport(courseId, 'QUEUED', 31);

        const result = await service.syncFromCanvas(claims, courseId);

        expect(result.reused).toBe(false);
        expect(result.import_id).not.toBe(stale);
        expect(queue.add).toHaveBeenCalledTimes(1);
        expect(await importRow(stale)).toMatchObject({
          status: 'FAILED',
          error: expect.stringContaining('30 phút') as string,
        });
        // Kết quả muộn của lần nạp cũ không sống lại.
        const { handler } = services();
        await expect(
          handler.handle(envelopeFor(stale, `CO-STALE-${stale.slice(0, 8)}`)),
        ).resolves.toMatchObject({ applied: false, reason: 'not_awaiting' });
        expect((await importRow(stale)).status).toBe('FAILED');
        // Lần đồng bộ kế tiếp dùng lại lần nạp mới (còn chờ, chưa quá hạn).
        const again = await syncService().service.syncFromCanvas(
          claims,
          courseId,
        );
        expect(again).toMatchObject({
          import_id: result.import_id,
          reused: true,
        });
      });

      it('still reuses a recent QUEUED import and a READY one of any age', async () => {
        const { service, queue } = syncService();
        const recentCourse = await createCourse();
        const recent = await previousImport(recentCourse, 'QUEUED', 5);
        const readyCourse = await createCourse();
        const ready = await previousImport(readyCourse, 'READY', 60 * 24 * 30);

        await expect(
          service.syncFromCanvas(claims, recentCourse),
        ).resolves.toMatchObject({
          import_id: recent,
          reused: true,
        });
        await expect(
          service.syncFromCanvas(claims, readyCourse),
        ).resolves.toMatchObject({
          import_id: ready,
          reused: true,
        });
        expect(queue.add).not.toHaveBeenCalled();
      });
    });

    it('records a legacy apply job failure on an APPLYING import', async () => {
      const { handler } = services();
      const courseId = await createCourse();
      const importId = await createImport(courseId, 'APPLYING');

      await handler.handle({
        result_id: `CURRICULUM_IMPORT_RESULT.${importId}.legacy-apply`,
        kind: 'CURRICULUM_IMPORT_RESULT',
        source_event_id: null,
        occurred_at: '2026-11-07T10:30:15.123Z',
        payload: {
          import_id: importId,
          status: 'FAILED',
          preview: null,
          curriculum: null,
          error: 'job cũ',
        },
      });

      expect(await importRow(importId)).toMatchObject({
        status: 'FAILED',
        error: 'job cũ',
      });
    });
  });
});
