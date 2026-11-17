import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { BffClaims } from '../auth/bff-claims';
import { EnrichmentContentResultHandler } from '../content-generation/enrichment-content-result.handler';
import type { WorkerResultEnvelope } from '../messaging/worker-results/worker-result-envelope';
import type { WorkerResultKind } from '../messaging/worker-results/worker-results.constants';
import { DocumentProcessingResultHandler } from './document-processing-result.handler';
import {
  DocumentService,
  NEXT_PROCESSING_GENERATION,
} from './document.service';

/**
 * Chạy thật trên PostgreSQL đã áp đủ migration: trạng thái tài liệu và học liệu
 * enrichment do core-api ghi từ kết quả worker, kèm CHECK constraint thật.
 * Bỏ qua khi không đặt DOCUMENT_RESULT_IT_DATABASE_URL.
 *
 *   DOCUMENT_RESULT_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_d \
 *     npx jest src/document/document-processing-result.handler.integration.spec.ts
 *
 * Test tạo khoá học riêng và xoá khi xong; chỉ trỏ vào DB tạm.
 *
 * chunks/chunk_lo_mappings là bảng của worker: chạy handler bằng role
 * lms_core_app (deploy/postgres/roles.sql) thì mồi/dọn chúng bằng URL quản trị
 * DOCUMENT_RESULT_IT_SEED_DATABASE_URL; không đặt thì dùng chung URL trên.
 */
const url = process.env.DOCUMENT_RESULT_IT_DATABASE_URL;
const seedUrl = process.env.DOCUMENT_RESULT_IT_SEED_DATABASE_URL || url;
const describeDb = url ? describe : describe.skip;

function envelope(
  kind: WorkerResultKind,
  payload: Record<string, unknown>,
): WorkerResultEnvelope<Record<string, unknown>> {
  return {
    result_id: `${kind}.${randomUUID()}`,
    kind,
    source_event_id: null,
    occurred_at: new Date().toISOString(),
    payload,
  };
}

describeDb('document results on PostgreSQL', () => {
  let prisma: PrismaClient;
  let seed: PrismaClient;
  let statusHandler: DocumentProcessingResultHandler;
  let contentHandler: EnrichmentContentResultHandler;
  let courseId: string;
  let loHigh: string;
  let loLow: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
    seed =
      seedUrl === url ? prisma : new PrismaClient({ adapter: new PrismaPg(seedUrl!) });
    await seed.$connect();
    statusHandler = new DocumentProcessingResultHandler(prisma as never);
    contentHandler = new EnrichmentContentResultHandler(prisma as never);
    const course = await prisma.courses.create({
      data: {
        code: `IT-DOC-${randomUUID().slice(0, 8)}`,
        name: 'IT document results',
      },
    });
    courseId = course.course_id;
    loHigh = (
      await prisma.learning_outcomes.create({
        data: {
          course_id: courseId,
          code: 'L.O.1',
          statement_vi: 'Hiểu đạo hàm',
        },
      })
    ).lo_id;
    loLow = (
      await prisma.learning_outcomes.create({
        data: {
          course_id: courseId,
          code: 'L.O.2',
          statement_vi: 'Biết giới hạn',
        },
      })
    ).lo_id;
  });

  afterAll(async () => {
    if (prisma && courseId) {
      const where = { course_id: courseId };
      await prisma.quiz_items.deleteMany({ where });
      await prisma.lesson_cards.deleteMany({ where });
      await prisma.lessons.deleteMany({ where });
      await seed.chunk_lo_mappings.deleteMany({ where: { chunks: where } });
      await seed.chunks.deleteMany({ where });
      await prisma.documents.deleteMany({ where });
      await prisma.learning_outcomes.deleteMany({ where });
      await prisma.courses.delete({ where: { course_id: courseId } });
    }
    if (seed && seed !== prisma) await seed.$disconnect();
    await prisma?.$disconnect();
  });

  async function newDocument(data: Record<string, unknown> = {}) {
    const doc = await prisma.documents.create({
      data: {
        course_id: courseId,
        title: 'Chương 1.pdf',
        file_path: `documents/${courseId}/${randomUUID()}/ch1.pdf`,
        status: 'QUEUED',
        processing_generation: 1,
        ...data,
      },
    });
    return doc.document_id;
  }

  async function addChunk(
    documentId: string,
    sortOrder: number,
    los: Array<[string, number]>,
  ) {
    const chunk = await seed.chunks.create({
      data: {
        document_id: documentId,
        course_id: courseId,
        content: `chunk ${sortOrder}`,
        heading_path: ['Giải tích'],
        sort_order: sortOrder,
      },
    });
    for (const [lo, confidence] of los) {
      await seed.chunk_lo_mappings.create({
        data: { chunk_id: chunk.chunk_id, lo_id: lo, confidence },
      });
    }
    return chunk.chunk_id;
  }

  function status(
    documentId: string,
    value: string,
    {
      stage = 'processing',
      generation = 1,
      attempt = 1,
      error,
    }: {
      stage?: string;
      generation?: number;
      attempt?: number;
      error?: string;
    } = {},
  ) {
    return statusHandler.handle(
      envelope('DOCUMENT_PROCESSING_RESULT', {
        document_id: documentId,
        status: {
          value,
          stage,
          processing_generation: generation,
          attempt,
          ...(error ? { error } : {}),
        },
      }),
    );
  }

  async function row(documentId: string) {
    return prisma.documents.findUniqueOrThrow({
      where: { document_id: documentId },
    });
  }

  describe('DOCUMENT_PROCESSING_RESULT status', () => {
    describe('onFinalFailure', () => {
      function report(
        documentId: string,
        value: string,
        options: { stage?: string; generation?: number; attempt?: number } = {},
      ) {
        return envelope('DOCUMENT_PROCESSING_RESULT', {
          document_id: documentId,
          status: {
            value,
            stage: options.stage ?? 'processing',
            processing_generation: options.generation ?? 1,
            attempt: options.attempt ?? 1,
          },
        });
      }
      const fail = (
        e: ReturnType<typeof report>,
        message = 'không áp dụng được',
      ) => statusHandler.onFinalFailure(e, new Error(message));

      it('a report that can never be applied turns a still-running document into ERROR', async () => {
        const id = await newDocument();
        await status(id, 'PARSING');

        await fail(report(id, 'CHUNKING'));

        expect((await row(id)).status).toBe('ERROR');
      });

      it('lets later progress of the same run recover the document, and a retry always wins', async () => {
        const id = await newDocument();
        await status(id, 'PARSING');
        // Báo cáo CHUNKING hỏng nhưng job vẫn chạy: báo cáo EMBEDDING sau đó đè ERROR.
        await fail(report(id, 'CHUNKING'));
        expect((await row(id)).status).toBe('ERROR');
        await expect(status(id, 'EMBEDDING')).resolves.toMatchObject({
          status: { applied: true },
        });
        await status(id, 'INDEXED');
        expect((await row(id)).status).toBe('INDEXED');

        // Job chết thật: ERROR giữ nguyên tới khi lần chạy sau (attempt 2) bắt đầu.
        const dead = await newDocument();
        await fail(report(dead, 'PARSING'));
        expect((await row(dead)).status).toBe('ERROR');
        await expect(status(dead, 'PARSING', { attempt: 2 })).resolves.toMatchObject({
          status: { applied: true },
        });
      });

      it.each(['INDEXED', 'GENERATED_DRAFT', 'ERROR'])(
        'never touches a document that is already %s',
        async (finished) => {
          const id = await newDocument({ status: finished });
          const before = await row(id);

          await fail(report(id, 'PARSING'));

          const after = await row(id);
          expect([after.status, after.processing_seq]).toEqual([
            finished,
            before.processing_seq,
          ]);
        },
      );

      it('ignores a failed report of an older generation or older than the progress already applied', async () => {
        const id = await newDocument({ processing_generation: 2 });
        await status(id, 'CHUNKING', { generation: 2 });

        await fail(report(id, 'PARSING', { generation: 1 })); // lượt cũ
        await fail(report(id, 'PARSING', { generation: 2 })); // đã có tiến độ mới hơn

        expect((await row(id)).status).toBe('CHUNKING');
      });

      it('ignores a deleted document', async () => {
        const id = await newDocument({ deleted_at: new Date() });

        await fail(report(id, 'PARSING'));

        expect((await row(id)).status).toBe('QUEUED');
      });

      it('enrichment: a document stuck in ENRICHING goes back to INDEXED; processing stays untouched', async () => {
        const id = await newDocument();
        await status(id, 'INDEXED');
        await status(id, 'ENRICHING', { stage: 'enrichment' });

        await fail(report(id, 'GENERATED_DRAFT', { stage: 'enrichment' }));

        expect((await row(id)).status).toBe('INDEXED');
        // Lần enrichment sau (attempt 2) chạy lại được.
        await expect(
          status(id, 'ENRICHING', { stage: 'enrichment', attempt: 2 }),
        ).resolves.toMatchObject({ status: { applied: true } });
      });
    });

    it('walks the whole lifecycle in order', async () => {
      const id = await newDocument();
      for (const value of ['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXED']) {
        await expect(status(id, value)).resolves.toEqual({
          status: { applied: true, status: value },
        });
      }
      await status(id, 'ENRICHING', { stage: 'enrichment' });
      await status(id, 'GENERATED_DRAFT', { stage: 'enrichment' });
      expect((await row(id)).status).toBe('GENERATED_DRAFT');
    });

    it('drops a late result instead of moving the status back', async () => {
      const id = await newDocument();
      await status(id, 'PARSING');
      await status(id, 'CHUNKING');
      await expect(status(id, 'PARSING')).resolves.toEqual({
        status: { applied: false, reason: 'out_of_order' },
      });
      // INDEXED của processing đến trễ sau khi enrichment đã bắt đầu.
      await status(id, 'ENRICHING', { stage: 'enrichment' });
      await expect(status(id, 'INDEXED')).resolves.toMatchObject({
        status: { applied: false, reason: 'out_of_order' },
      });
      expect((await row(id)).status).toBe('ENRICHING');
    });

    it('lets a job retry win over the ERROR of the previous attempt, but not a late PARSING', async () => {
      const id = await newDocument();
      await status(id, 'PARSING', { attempt: 1 });
      await status(id, 'ERROR', { attempt: 1, error: 'docling crashed' });
      await expect(
        status(id, 'PARSING', { attempt: 1 }),
      ).resolves.toMatchObject({
        status: { applied: false, reason: 'out_of_order' },
      });
      expect((await row(id)).status).toBe('ERROR');

      await expect(
        status(id, 'PARSING', { attempt: 2 }),
      ).resolves.toMatchObject({
        status: { applied: true },
      });
      await status(id, 'INDEXED', { attempt: 2 });
      expect((await row(id)).status).toBe('INDEXED');
    });

    it('falls back to INDEXED when enrichment fails and a retry of enrichment can start again', async () => {
      const id = await newDocument();
      await status(id, 'INDEXED');
      await status(id, 'ENRICHING', { stage: 'enrichment', attempt: 1 });
      await status(id, 'INDEXED', {
        stage: 'enrichment',
        attempt: 1,
        error: 'llm down',
      });
      expect((await row(id)).status).toBe('INDEXED');
      await expect(
        status(id, 'ENRICHING', { stage: 'enrichment', attempt: 1 }),
      ).resolves.toMatchObject({ status: { applied: false } });
      await status(id, 'ENRICHING', { stage: 'enrichment', attempt: 2 });
      expect((await row(id)).status).toBe('ENRICHING');
    });

    it('applies the same result once even when delivered twice', async () => {
      const id = await newDocument();
      await status(id, 'PARSING');
      const before = await row(id);
      await expect(status(id, 'PARSING')).resolves.toMatchObject({
        status: { applied: false, reason: 'out_of_order' },
      });
      const after = await row(id);
      expect([after.status, after.processing_seq]).toEqual([
        before.status,
        before.processing_seq,
      ]);
    });

    it('reprocessing starts a new generation: results of the old run are ignored', async () => {
      const id = await newDocument();
      await status(id, 'PARSING');
      await status(id, 'ERROR', { error: 'parser' });
      // Đồng bộ Canvas đưa tài liệu ERROR vào hàng đợi lại (cùng câu UPDATE với code thật).
      const requeued = await prisma.documents.update({
        where: { document_id: id },
        data: { status: 'QUEUED', ...NEXT_PROCESSING_GENERATION },
      });
      expect([requeued.processing_generation, requeued.processing_seq]).toEqual(
        [2, 0],
      );

      // Kết quả của lượt 1 (retry muộn của job cũ) không đè QUEUED của lượt 2.
      await expect(status(id, 'PARSING', { attempt: 3 })).resolves.toEqual({
        status: { applied: false, reason: 'stale_generation' },
      });
      expect((await row(id)).status).toBe('QUEUED');

      // Lượt 2 chạy từ đầu, kể cả "lần 1" của job mới.
      await status(id, 'PARSING', { generation: 2, attempt: 1 });
      await status(id, 'INDEXED', { generation: 2, attempt: 1 });
      expect((await row(id)).status).toBe('INDEXED');
    });

    it('confirmUpload opens generation 1 and sends it with the job', async () => {
      const id = await newDocument({
        status: 'UPLOADING',
        processing_generation: 0,
      });
      const queue = {
        add: jest
          .fn<
            Promise<{ id: string }>,
            [string, Record<string, unknown>, unknown]
          >()
          .mockResolvedValue({ id: 'job-1' }),
      };
      const authz = {
        assertCourseAccess: jest.fn().mockResolvedValue(undefined),
      };
      const service = new DocumentService(
        prisma as never,
        authz as never,
        queue as never,
        {} as never,
      );

      await service.confirmUpload({ sub: randomUUID() } as BffClaims, id);

      expect(queue.add.mock.calls[0][1]).toMatchObject({
        processing_generation: 1,
      });
      await status(id, 'PARSING', { generation: 1 });
      expect((await row(id)).status).toBe('PARSING');
    });

    it('accepts results of jobs queued before the migration (generation 0)', async () => {
      const id = await newDocument({ processing_generation: 0 });
      await status(id, 'PARSING', { generation: 0 });
      expect((await row(id)).status).toBe('PARSING');
    });

    it('ignores a deleted document', async () => {
      const id = await newDocument({ deleted_at: new Date() });
      await expect(status(id, 'PARSING')).resolves.toEqual({
        status: { applied: false, reason: 'document_missing' },
      });
      await expect(status(randomUUID(), 'PARSING')).resolves.toEqual({
        status: { applied: false, reason: 'document_missing' },
      });
    });
  });

  describe('DOCUMENT_PROCESSING_RESULT chapter', () => {
    function chapter(documentId: string, code: string, confidence = 0.8765) {
      return statusHandler.handle(
        envelope('DOCUMENT_PROCESSING_RESULT', {
          document_id: documentId,
          chapter: {
            chapter_code: code,
            provenance: 'content',
            confidence,
            reason: `Khớp nội dung với chương ${code}`,
          },
        }),
      );
    }

    it('sets an unknown chapter and replaces an earlier content inference', async () => {
      const id = await newDocument();
      await expect(chapter(id, '2')).resolves.toEqual({
        chapter: { applied: true, chapter_code: '2' },
      });
      let doc = await row(id);
      expect([
        doc.chapter_code,
        doc.chapter_provenance,
        Number(doc.chapter_confidence),
      ]).toEqual(['2', 'content', 0.88]);
      await chapter(id, '3', 0.7);
      doc = await row(id);
      expect([doc.chapter_code, doc.chapter_reason]).toEqual([
        '3',
        'Khớp nội dung với chương 3',
      ]);
    });

    it.each(['confirmed', 'module', 'file_name'])(
      'never overwrites a %s chapter',
      async (provenance) => {
        const id = await newDocument({
          chapter_code: '1',
          chapter_provenance: provenance,
          chapter_confidence: 1,
          chapter_reason: 'Giảng viên chọn',
        });
        await expect(chapter(id, '2')).resolves.toEqual({
          chapter: { applied: false, reason: 'chapter_kept' },
        });
        const doc = await row(id);
        expect([doc.chapter_code, doc.chapter_provenance]).toEqual([
          '1',
          provenance,
        ]);
      },
    );

    it('ignores a deleted document', async () => {
      const id = await newDocument({ deleted_at: new Date() });
      await expect(chapter(id, '2')).resolves.toEqual({
        chapter: { applied: false, reason: 'document_missing' },
      });
    });
  });

  describe('ENRICHMENT_CONTENT_RESULT', () => {
    function content(
      documentId: string,
      generation: number,
      cards: Array<{ primary: string; title: string }>,
      quiz: Array<{ primary: string; question: string }>,
    ) {
      return contentHandler.handle(
        envelope('ENRICHMENT_CONTENT_RESULT', {
          document_id: documentId,
          processing_generation: generation,
          model_id: 'gemini-test',
          lesson_cards: cards.map((card, i) => ({
            card_id: randomUUID(),
            primary_chunk_id: card.primary,
            source_chunk_ids: [card.primary],
            heading_path: ['Giải tích'],
            title: card.title,
            bullets: ['a', 'b'],
            key_insight: 'k',
            card_index: i,
          })),
          quiz_items: quiz.map((item) => ({
            quiz_id: randomUUID(),
            primary_chunk_id: item.primary,
            source_chunk_ids: [item.primary],
            question: item.question,
            choices: ['A', 'B', 'C', 'D'],
            correct_index: 2,
            explanation: 'vì C',
          })),
        }),
      );
    }

    async function liveCards(documentChunk: string) {
      return prisma.lesson_cards.findMany({
        where: { deleted_at: null, source_chunk_ids: { has: documentChunk } },
        orderBy: { title: 'asc' },
      });
    }

    it('replaces the drafts of the document, keeps reviewed items and other documents', async () => {
      const id = await newDocument();
      const mapped = await addChunk(id, 0, [
        [loLow, 0.4],
        [loHigh, 0.9],
      ]);
      const unmapped = await addChunk(id, 1, []);
      const otherDoc = await newDocument();
      const otherChunk = await addChunk(otherDoc, 0, [[loHigh, 0.9]]);

      const lesson = await prisma.lessons.create({
        data: { course_id: courseId, lo_id: loHigh, title: 'Hiểu đạo hàm' },
      });
      const oldDraft = await prisma.lesson_cards.create({
        data: {
          lesson_id: lesson.lesson_id,
          course_id: courseId,
          lo_id: loHigh,
          title: 'cũ',
          content: {},
          source_chunk_ids: [mapped],
          status: 'REVIEWING',
        },
      });
      const approvedQuiz = await prisma.quiz_items.create({
        data: {
          lesson_id: lesson.lesson_id,
          course_id: courseId,
          lo_id: loHigh,
          type: 'MCQ_SINGLE',
          question: 'đã duyệt',
          options: ['x', 'y'],
          correct_answer: 'x',
          source_chunk_ids: [mapped],
          status: 'APPROVED',
        },
      });
      const otherDraft = await prisma.lesson_cards.create({
        data: {
          lesson_id: lesson.lesson_id,
          course_id: courseId,
          lo_id: loHigh,
          title: 'tài liệu khác',
          content: {},
          source_chunk_ids: [otherChunk],
        },
      });

      const outcome = await content(
        id,
        1,
        [
          { primary: mapped, title: 'Đạo hàm' },
          { primary: unmapped, title: 'Không LO' },
        ],
        [{ primary: mapped, question: 'Chọn C?' }],
      );

      expect(outcome).toEqual({
        applied: true,
        cards: 1,
        quizItems: 1,
        skippedCards: 1,
        skippedQuizItems: 0,
        retiredCards: 1,
        retiredQuizItems: 0,
      });
      expect(
        (
          await prisma.lesson_cards.findUniqueOrThrow({
            where: { card_id: oldDraft.card_id },
          })
        ).deleted_at,
      ).not.toBeNull();
      expect(
        (
          await prisma.quiz_items.findUniqueOrThrow({
            where: { quiz_id: approvedQuiz.quiz_id },
          })
        ).deleted_at,
      ).toBeNull();
      expect(
        (
          await prisma.lesson_cards.findUniqueOrThrow({
            where: { card_id: otherDraft.card_id },
          })
        ).deleted_at,
      ).toBeNull();

      const [card] = await liveCards(mapped);
      // LO có confidence cao nhất của chunk chính; lesson đã có thì dùng lại.
      expect([card.lo_id, card.lesson_id, card.status, card.title]).toEqual([
        loHigh,
        lesson.lesson_id,
        'GENERATED_DRAFT',
        'Đạo hàm',
      ]);
      expect(card.content).toEqual({
        key_insight: 'k',
        bullets: ['a', 'b'],
        heading_path: ['Giải tích'],
        model_id: 'gemini-test',
        card_index: 0,
      });
      const quiz = await prisma.quiz_items.findFirstOrThrow({
        where: {
          deleted_at: null,
          status: 'GENERATED_DRAFT',
          source_chunk_ids: { has: mapped },
        },
      });
      expect([quiz.type, quiz.options, quiz.correct_answer]).toEqual([
        'MCQ_SINGLE',
        ['A', 'B', 'C', 'D'],
        'C',
      ]);
      expect((await row(id)).enrichment_generation).toBe(1);
    });

    it('applies a generation once: a replay or a late older result changes nothing', async () => {
      const id = await newDocument();
      const chunk = await addChunk(id, 0, [[loHigh, 0.9]]);
      await content(id, 1, [{ primary: chunk, title: 'Một' }], []);
      const before = await liveCards(chunk);

      await expect(
        content(id, 1, [{ primary: chunk, title: 'Gửi lại' }], []),
      ).resolves.toEqual({
        applied: false,
        reason: 'already_applied',
      });
      await prisma.documents.update({
        where: { document_id: id },
        data: { status: 'QUEUED', ...NEXT_PROCESSING_GENERATION },
      });
      await expect(
        content(id, 1, [{ primary: chunk, title: 'Cũ' }], []),
      ).resolves.toEqual({
        applied: false,
        reason: 'stale_generation',
      });
      expect((await liveCards(chunk)).map((c) => c.card_id)).toEqual(
        before.map((c) => c.card_id),
      );

      // Lượt mới thì thay được.
      await content(id, 2, [{ primary: chunk, title: 'Hai' }], []);
      expect((await liveCards(chunk)).map((c) => c.title)).toEqual(['Hai']);
    });

    it('an empty result clears the drafts of the document', async () => {
      const id = await newDocument();
      const chunk = await addChunk(id, 0, [[loHigh, 0.9]]);
      await content(
        id,
        1,
        [{ primary: chunk, title: 'Một' }],
        [{ primary: chunk, question: 'q?' }],
      );
      await prisma.documents.update({
        where: { document_id: id },
        data: { status: 'QUEUED', ...NEXT_PROCESSING_GENERATION },
      });

      await expect(content(id, 2, [], [])).resolves.toMatchObject({
        applied: true,
        retiredCards: 1,
        retiredQuizItems: 1,
      });
      expect(await liveCards(chunk)).toEqual([]);
    });

    it('ignores a deleted document', async () => {
      const id = await newDocument({ deleted_at: new Date() });
      await expect(content(id, 1, [], [])).resolves.toEqual({
        applied: false,
        reason: 'document_missing',
      });
    });
  });
});
