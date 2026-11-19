import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AuthzService } from '../../auth/authz.service';
import type { BffClaims } from '../../auth/bff-claims';
import type { WorkerResultEnvelope } from '../../messaging/worker-results/worker-result-envelope';
import { ContentGenerationResultHandler } from '../content-generation/handlers/content-generation-result.handler';
import { EnrichmentContentResultHandler } from '../content-generation/handlers/enrichment-content-result.handler';
import { QuizSetService } from '../quiz/services/quiz-set.service';
import { ReviewService } from '../review/review.service';
import { BankAccessService } from './bank-access.service';
import { QuestionBankService } from './question-bank.service';

/**
 * Spec tích hợp Postgres 18 cho ngân hàng câu hỏi (P1):
 *   - Trigger BEFORE INSERT (gán ngân hàng mặc định, đánh dấu duplicate_of)
 *   - Trigger AFTER INSERT/UPDATE (phiên bản bất biến, bỏ qua khi chỉ đổi status
 *     hoặc nội dung y hệt, hoặc bị WHERE status = 'GENERATED_DRAFT' chặn)
 *   - Đường ghi AI sinh câu (generation_request_id, author_id, provenance, quiz_ids)
 *   - Đường ghi enrichment (chỉ xoá mềm GENERATED_DRAFT, giữ REVIEWING/CHANGES_REQUESTED)
 *   - ReviewService.updateQuizItem (updated_by, provenance = {}, đọc lại version)
 *   - Backfill dữ liệu mô phỏng §1.4 trên DB tạm
 *
 * Chỉ chạy khi đặt QUESTION_BANK_IT_DATABASE_URL (trỏ tới Postgres 18 tạm đã
 * migrate deploy). Không bao giờ dùng DATABASE_URL dev.
 */
const url = process.env.QUESTION_BANK_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

type PgQueryResult<T = Record<string, unknown>> = { rows: T[] };
type PgClient = {
  connect(): Promise<void>;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<PgQueryResult<T>>;
  end(): Promise<void>;
};
type PgModule = {
  Client: new (config: { connectionString: string }) => PgClient;
};

function createPgClient(connectionString: string): PgClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require('pg') as PgModule;
  return new Client({ connectionString });
}

const MIGRATIONS_DIR = resolve(__dirname, '../../../prisma/migrations');
const QB_MIGRATION_NAME = '20261119120000_question_bank';

function listMigrationDirs(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describeDb('QuestionBank P1 triggers, writers & backfill on PostgreSQL', () => {
  let prisma: PrismaClient;
  let genHandler: ContentGenerationResultHandler;
  let enrichHandler: EnrichmentContentResultHandler;
  let reviewService: ReviewService;
  let bankAccess: BankAccessService;
  let bankService: QuestionBankService;
  let quizSetService: QuizSetService;

  const courseIds: string[] = [];
  const userIds: string[] = [];

  const CHUNK_A = randomUUID();
  const CHUNK_B = randomUUID();

  let courseId: string;
  let loId: string;
  let instructorId: string;
  let instructorClaims: BffClaims;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();

    const authz = new AuthzService(prisma as never);
    bankAccess = new BankAccessService(prisma as never);
    bankService = new QuestionBankService(prisma as never, authz, bankAccess);
    genHandler = new ContentGenerationResultHandler(prisma as never);
    enrichHandler = new EnrichmentContentResultHandler(prisma as never);
    reviewService = new ReviewService(prisma as never, authz, bankAccess);
    quizSetService = new QuizSetService(
      prisma as never,
      authz,
      {} as never,
      {} as never,
      { isWaitingForPublish: () => false } as never,
      { activeLearnerIds: async () => [] } as never,
      bankAccess,
    );

    const course = await prisma.courses.create({
      data: {
        code: `IT-QB-${randomUUID().slice(0, 8)}`,
        name: 'IT Question Bank P1',
        subject_code: 'CO3137',
      },
    });
    courseId = course.course_id;
    courseIds.push(courseId);

    const lo = await prisma.learning_outcomes.create({
      data: {
        course_id: courseId,
        code: 'L.O.1.1',
        statement_vi: 'Hiểu ngân hàng câu hỏi',
      },
    });
    loId = lo.lo_id;

    const instructor = await prisma.lms_user_mappings.create({
      data: {
        lms_sub: `it-qb-inst-${randomUUID()}`,
        display_name: 'Giảng viên IT',
        role: 'instructor',
      },
    });
    instructorId = instructor.internal_user_id;
    userIds.push(instructorId);

    await prisma.course_memberships.create({
      data: {
        user_id: instructorId,
        course_id: courseId,
        role: 'instructor',
      },
    });

    instructorClaims = {
      sub: instructorId,
      courseId,
      roles: ['instructor'],
      scope: 'course',
      jti: 'it-qb-jti',
      iat: 0,
      exp: 1,
    };
  });

  afterAll(async () => {
    if (prisma) {
      if (userIds.length) {
        await prisma.review_audit_logs.deleteMany({
          where: { performed_by: { in: userIds } },
        });
      }
      if (courseIds.length) {
        await prisma.quiz_attempts.deleteMany({
          where: { course_id: { in: courseIds } },
        });
        await prisma.quiz_sets.deleteMany({
          where: { course_id: { in: courseIds } },
        });
        await prisma.quiz_item_versions.deleteMany({
          where: { quiz_items: { course_id: { in: courseIds } } },
        });
        await prisma.quiz_items.deleteMany({
          where: { course_id: { in: courseIds } },
        });
        await prisma.question_bank_shares.deleteMany({
          where: { question_banks: { home_course_id: { in: courseIds } } },
        });
        await prisma.question_banks.deleteMany({
          where: { home_course_id: { in: courseIds } },
        });
      }
      for (const cid of courseIds) {
        await prisma.lesson_cards.deleteMany({ where: { course_id: cid } });
        await prisma.lessons.deleteMany({ where: { course_id: cid } });
        await prisma.content_generation_requests.deleteMany({
          where: { course_id: cid },
        });
        await prisma.chunk_lo_mappings.deleteMany({
          where: { chunks: { course_id: cid } },
        });
        await prisma.chunks.deleteMany({ where: { course_id: cid } });
        await prisma.documents.deleteMany({ where: { course_id: cid } });
        await prisma.chapter_los.deleteMany({
          where: { chapters: { course_id: cid } },
        });
        await prisma.chapters.deleteMany({ where: { course_id: cid } });
        await prisma.learning_outcomes.deleteMany({
          where: { course_id: cid },
        });
        await prisma.course_memberships.deleteMany({
          where: { course_id: cid },
        });
        await prisma.courses.delete({ where: { course_id: cid } });
      }
      if (userIds.length) {
        await prisma.lms_user_mappings.deleteMany({
          where: { internal_user_id: { in: userIds } },
        });
      }
      await prisma.$disconnect();
    }
  });

  function genEnvelope(
    requestId: string,
    items: unknown[],
  ): WorkerResultEnvelope {
    return {
      result_id: `CONTENT_GENERATION_RESULT.${requestId}.SUCCEEDED`,
      kind: 'CONTENT_GENERATION_RESULT',
      source_event_id: randomUUID(),
      occurred_at: new Date().toISOString(),
      payload: {
        request_id: requestId,
        course_id: courseId,
        content_type: 'quiz',
        status: 'SUCCEEDED',
        lo_id: loId,
        generated_count: items.length,
        quiz_items: items,
        rejected: [],
      },
    };
  }

  function makeWorkerQuiz(
    quizId: string,
    question: string,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      quiz_id: quizId,
      type: 'MCQ_SINGLE',
      question,
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      explanation: 'Theo slide.',
      bloom_level: 2,
      source_chunk_ids: [CHUNK_A],
      verification_status: 'VERIFIED',
      verification_evidence: {
        criterion: 'source_grounding',
        judge_verdict: 'supported',
        judge_reason: 'Khớp nguồn.',
        inconclusive_reason: null,
        regeneration_attempts: 0,
        regenerations_applied: 0,
        history: [],
        writer_model: 'gemini-2.5-flash',
        judge_model: 'deepseek-chat',
        judge_is_writer: false,
        source_chunk_ids: [CHUNK_A],
      },
      ...overrides,
    };
  }

  it('INSERT không truyền bank_id tự gán ngân hàng mặc định, tạo v1, và ghi nguồn gốc AI + quiz_ids', async () => {
    const request = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    const q1 = randomUUID();
    const q2 = randomUUID();

    await expect(
      genHandler.handle(
        genEnvelope(request.request_id, [
          makeWorkerQuiz(q1, 'Spark dùng mô hình dữ liệu gì?'),
          makeWorkerQuiz(q2, 'MapReduce gồm những pha nào?'),
        ]),
      ),
    ).resolves.toMatchObject({ applied: true, written: 2, skipped: 0 });

    const defaultBank = await prisma.question_banks.findFirstOrThrow({
      where: {
        home_course_id: courseId,
        is_course_default: true,
        deleted_at: null,
      },
    });
    expect(defaultBank).toMatchObject({
      owner_id: null,
      visibility: 'COURSE',
      subject_code: 'CO3137',
    });

    const item1 = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: q1 },
      include: { current_version: true, versions: true },
    });
    expect(item1).toMatchObject({
      bank_id: defaultBank.bank_id,
      origin: 'AI_GENERATED',
      generation_request_id: request.request_id,
      author_id: instructorId,
      updated_by: null,
      provenance: {
        writer_model: 'gemini-2.5-flash',
        judge_model: 'deepseek-chat',
        judge_is_writer: false,
      },
    });
    expect(item1.current_version_id).not.toBeNull();
    expect(item1.versions).toHaveLength(1);
    expect(item1.current_version).toMatchObject({
      version_no: 1,
      question: 'Spark dùng mô hình dữ liệu gì?',
      created_by: null,
      provenance: {
        writer_model: 'gemini-2.5-flash',
        judge_model: 'deepseek-chat',
        judge_is_writer: false,
      },
    });

    const updatedReq =
      await prisma.content_generation_requests.findUniqueOrThrow({
        where: { request_id: request.request_id },
      });
    expect(updatedReq.quiz_ids).toEqual([q1, q2]);

    // INSERT SQL trực tiếp bỏ trống cả bank_id lẫn lesson_id -> trigger gán bank mặc định + v1.
    const rawId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO quiz_items (quiz_id, course_id, lo_id, type, question, options, correct_answer)
      VALUES (${rawId}::uuid, ${courseId}::uuid, ${loId}::uuid, 'MCQ_SINGLE', 'Raw insert không bank_id?', '["Đúng","Sai"]'::jsonb, '"Đúng"'::jsonb)`;
    const rawRow = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: rawId },
      include: { current_version: true },
    });
    expect(rawRow.bank_id).toBe(defaultBank.bank_id);
    expect(rawRow.lesson_id).toBeNull();
    expect(rawRow.current_version?.version_no).toBe(1);
  });

  it('sửa nội dung qua ReviewService tạo v2 + audit log; đổi status thì không thêm phiên bản', async () => {
    const qId = randomUUID();
    const req1 = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    await genHandler.handle(
      genEnvelope(req1.request_id, [
        makeWorkerQuiz(qId, 'HDFS chia khối mặc định bao nhiêu MB?'),
      ]),
    );
    const v1Row = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: qId },
    });

    // Sửa nội dung qua ReviewService -> trigger tạo v2, cập nhật current_version_id.
    const edited = await reviewService.updateQuizItem(instructorClaims, qId, {
      question: 'HDFS mặc định chia mỗi block kích thước bao nhiêu MB?',
      explanation: 'Mặc định 128 MB.',
    });

    expect(edited.current_version_id).not.toBe(v1Row.current_version_id);
    const versionsAfterEdit = await prisma.quiz_item_versions.findMany({
      where: { quiz_id: qId },
      orderBy: { version_no: 'asc' },
    });
    expect(versionsAfterEdit).toHaveLength(2);
    expect(versionsAfterEdit[1]).toMatchObject({
      version_no: 2,
      question: 'HDFS mặc định chia mỗi block kích thước bao nhiêu MB?',
      explanation: 'Mặc định 128 MB.',
      created_by: instructorId,
      provenance: {},
    });
    expect(edited.current_version_id).toBe(versionsAfterEdit[1].version_id);

    const editAudit = await prisma.review_audit_logs.findFirstOrThrow({
      where: { entity_id: qId, action: 'EDIT_QUIZ' },
      orderBy: { logged_at: 'desc' },
    });
    expect(editAudit.raw_changes).toMatchObject({
      before_version_id: v1Row.current_version_id,
      after_version_id: versionsAfterEdit[1].version_id,
    });

    // Chỉ đổi status (APPROVED, RETIRED) -> không tạo phiên bản mới.
    await reviewService.approveQuizItem(instructorClaims, qId);
    await prisma.quiz_items.update({
      where: { quiz_id: qId },
      data: { status: 'RETIRED' },
    });
    const versionsAfterStatus = await prisma.quiz_item_versions.findMany({
      where: { quiz_id: qId },
    });
    expect(versionsAfterStatus).toHaveLength(2);
  });

  it('upsert bị WHERE status = GENERATED_DRAFT chặn không tạo phiên bản và không vào quiz_ids; ghi lại nội dung y hệt không thêm phiên bản', async () => {
    const qDraft = randomUUID();
    const qApproved = randomUUID();

    const req1 = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    await genHandler.handle(
      genEnvelope(req1.request_id, [
        makeWorkerQuiz(qDraft, 'Câu nháp y hệt?'),
        makeWorkerQuiz(qApproved, 'Câu đã duyệt không bị ghi đè?'),
      ]),
    );
    await reviewService.approveQuizItem(instructorClaims, qApproved);

    const req2 = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    const outcome = await genHandler.handle(
      genEnvelope(req2.request_id, [
        // Y hệt nội dung cũ (vẫn GENERATED_DRAFT).
        makeWorkerQuiz(qDraft, 'Câu nháp y hệt?'),
        // Bị WHERE status = 'GENERATED_DRAFT' chặn.
        makeWorkerQuiz(qApproved, 'Nội dung mới cố ghi đè?'),
      ]),
    );

    expect(outcome).toMatchObject({ applied: true, written: 1, skipped: 1 });
    expect(
      await prisma.quiz_item_versions.count({ where: { quiz_id: qDraft } }),
    ).toBe(1);
    expect(
      await prisma.quiz_item_versions.count({ where: { quiz_id: qApproved } }),
    ).toBe(1);
    expect(
      (
        await prisma.quiz_items.findUniqueOrThrow({
          where: { quiz_id: qApproved },
        })
      ).question,
    ).toBe('Câu đã duyệt không bị ghi đè?');
    expect(
      (
        await prisma.content_generation_requests.findUniqueOrThrow({
          where: { request_id: req2.request_id },
        })
      ).quiz_ids,
    ).toEqual([qDraft]);
  });

  it('cập nhật bản nháp đang nằm trong ngân hàng riêng giữ nguyên bank_id', async () => {
    const customBank = await prisma.question_banks.create({
      data: {
        title: 'Ngân hàng riêng để test ON CONFLICT',
        owner_id: instructorId,
        home_course_id: courseId,
        visibility: 'PRIVATE',
      },
    });
    const qId = randomUUID();
    const req1 = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    await genHandler.handle(
      genEnvelope(req1.request_id, [
        makeWorkerQuiz(qId, 'Bản gốc trong bank?'),
      ]),
    );
    await prisma.quiz_items.update({
      where: { quiz_id: qId },
      data: { bank_id: customBank.bank_id },
    });

    const req2 = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        requested_by: instructorId,
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: loId },
        status: 'RUNNING',
      },
    });
    await genHandler.handle(
      genEnvelope(req2.request_id, [
        makeWorkerQuiz(qId, 'Bản cập nhật vẫn giữ bank riêng?'),
      ]),
    );

    const row = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: qId },
      include: { versions: { orderBy: { version_no: 'asc' } } },
    });
    expect(row.bank_id).toBe(customBank.bank_id);
    expect(row.question).toBe('Bản cập nhật vẫn giữ bank riêng?');
    expect(row.versions).toHaveLength(2);
  });

  it('trùng nguyên văn trong cùng ngân hàng được đánh dấu provenance.duplicate_of nhưng không chặn', async () => {
    const bankA = await prisma.question_banks.create({
      data: {
        title: 'Bank A trùng lặp',
        owner_id: instructorId,
        home_course_id: courseId,
      },
    });
    const bankB = await prisma.question_banks.create({
      data: {
        title: 'Bank B khác ngân hàng',
        owner_id: instructorId,
        home_course_id: courseId,
      },
    });

    const first = await prisma.quiz_items.create({
      data: {
        bank_id: bankA.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: '  RDD là viết tắt của gì? ',
        options: ['Resilient Distributed Dataset', 'Khác'],
        correct_answer: 'Resilient Distributed Dataset',
      },
    });
    expect(first.provenance).toEqual({});

    const dupSameBank = await prisma.quiz_items.create({
      data: {
        bank_id: bankA.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: 'rdd LÀ VIẾT TẮT CỦA GÌ?',
        options: ['Resilient Distributed Dataset', 'Khác'],
        correct_answer: 'Resilient Distributed Dataset',
      },
      include: { current_version: true },
    });
    expect(dupSameBank.provenance).toEqual({ duplicate_of: first.quiz_id });
    expect(dupSameBank.current_version?.provenance).toEqual({
      duplicate_of: first.quiz_id,
    });

    const sameTextOtherBank = await prisma.quiz_items.create({
      data: {
        bank_id: bankB.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: 'rdd LÀ VIẾT TẮT CỦA GÌ?',
        options: ['Resilient Distributed Dataset', 'Khác'],
        correct_answer: 'Resilient Distributed Dataset',
      },
    });
    expect(sameTextOtherBank.provenance).toEqual({});
  });

  it('EnrichmentContentResultHandler chỉ xoá mềm câu GENERATED_DRAFT, giữ câu REVIEWING/CHANGES_REQUESTED', async () => {
    const doc = await prisma.documents.create({
      data: {
        course_id: courseId,
        title: 'Enrich.pdf',
        file_path: `documents/${courseId}/${randomUUID()}/enrich.pdf`,
        status: 'ENRICHING',
        processing_generation: 1,
      },
    });
    const chunk = await prisma.chunks.create({
      data: {
        document_id: doc.document_id,
        course_id: courseId,
        content: 'Nội dung chunk enrichment',
        heading_path: ['Chương 1'],
        sort_order: 0,
      },
    });
    await prisma.chunk_lo_mappings.create({
      data: { chunk_id: chunk.chunk_id, lo_id: loId, confidence: 0.95 },
    });

    const bank = await prisma.question_banks.create({
      data: {
        title: 'Bank enrichment test',
        owner_id: instructorId,
        home_course_id: courseId,
      },
    });
    const draftQuiz = await prisma.quiz_items.create({
      data: {
        bank_id: bank.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: 'Enrich nháp cũ?',
        options: ['A', 'B'],
        correct_answer: 'A',
        source_chunk_ids: [chunk.chunk_id],
        status: 'GENERATED_DRAFT',
      },
    });
    const reviewingQuiz = await prisma.quiz_items.create({
      data: {
        bank_id: bank.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: 'Enrich đang sửa?',
        options: ['A', 'B'],
        correct_answer: 'A',
        source_chunk_ids: [chunk.chunk_id],
        status: 'REVIEWING',
      },
    });
    const changesQuiz = await prisma.quiz_items.create({
      data: {
        bank_id: bank.bank_id,
        course_id: courseId,
        lo_id: loId,
        type: 'MCQ_SINGLE',
        question: 'Enrich yêu cầu sửa?',
        options: ['A', 'B'],
        correct_answer: 'A',
        source_chunk_ids: [chunk.chunk_id],
        status: 'CHANGES_REQUESTED',
      },
    });

    const newQuizId = randomUUID();
    const outcome = await enrichHandler.handle({
      result_id: `ENRICHMENT_CONTENT_RESULT.${doc.document_id}`,
      kind: 'ENRICHMENT_CONTENT_RESULT',
      source_event_id: null,
      occurred_at: new Date().toISOString(),
      payload: {
        document_id: doc.document_id,
        processing_generation: 1,
        model_id: 'gemini-2.5-flash',
        lesson_cards: [],
        quiz_items: [
          {
            quiz_id: newQuizId,
            primary_chunk_id: chunk.chunk_id,
            source_chunk_ids: [chunk.chunk_id],
            question: 'Câu mới từ enrichment?',
            choices: ['X', 'Y', 'Z', 'W'],
            correct_index: 1,
            explanation: 'Vì Y.',
          },
          // Trùng quiz_id với câu CHANGES_REQUESTED: không được ghi đè.
          {
            quiz_id: changesQuiz.quiz_id,
            primary_chunk_id: chunk.chunk_id,
            source_chunk_ids: [chunk.chunk_id],
            question: 'Cố ghi đè câu CHANGES_REQUESTED?',
            choices: ['A', 'B'],
            correct_index: 0,
            explanation: 'Không được đè.',
          },
        ],
      },
    });

    expect(outcome).toMatchObject({
      applied: true,
      retiredQuizItems: 1,
      quizItems: 1,
    });
    expect(
      (
        await prisma.quiz_items.findUniqueOrThrow({
          where: { quiz_id: draftQuiz.quiz_id },
        })
      ).deleted_at,
    ).not.toBeNull();
    expect(
      (
        await prisma.quiz_items.findUniqueOrThrow({
          where: { quiz_id: reviewingQuiz.quiz_id },
        })
      ).deleted_at,
    ).toBeNull();
    const keptChanges = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: changesQuiz.quiz_id },
    });
    expect(keptChanges.deleted_at).toBeNull();
    expect(keptChanges.question).toBe('Enrich yêu cầu sửa?');

    const inserted = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: newQuizId },
      include: { current_version: true },
    });
    expect(inserted.provenance).toEqual({ model_id: 'gemini-2.5-flash' });
    expect(inserted.current_version).toMatchObject({
      version_no: 1,
      created_by: null,
      provenance: { model_id: 'gemini-2.5-flash' },
    });
  });

  it('backfill migration trên dữ liệu giống dev (§1.4) giữ nguyên toàn vẹn và bật trigger sau backfill', async () => {
    const tempDbName = `qb_backfill_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const adminUrl = new URL(url!);
    adminUrl.pathname = '/postgres';
    const adminClient = createPgClient(adminUrl.toString());
    await adminClient.connect();

    const targetUrl = new URL(url!);
    targetUrl.pathname = `/${tempDbName}`;
    let targetClient: PgClient | null = null;

    try {
      await adminClient.query(`CREATE DATABASE "${tempDbName}"`);
      targetClient = createPgClient(targetUrl.toString());
      await targetClient.connect();

      const allMigrations = listMigrationDirs();
      const qbIndex = allMigrations.indexOf(QB_MIGRATION_NAME);
      expect(qbIndex).toBeGreaterThan(0);

      for (const dir of allMigrations.slice(0, qbIndex)) {
        const sql = readFileSync(
          join(MIGRATIONS_DIR, dir, 'migration.sql'),
          'utf8',
        );
        await targetClient.query(sql);
      }

      // Mồi dữ liệu giống §1.4 trước khi chạy migration question_bank.
      const co3137Id = randomUUID();
      const smokeCourseId = randomUUID();
      const lmsCourseId = randomUUID();
      const canvasCourseId = randomUUID();
      const userInstId = randomUUID();
      const userLearnerId = randomUUID();
      const loCoId = randomUUID();
      const chapterCoId = randomUUID();
      const lessonCoId = randomUUID();

      await targetClient.query(
        `INSERT INTO courses (course_id, code, name) VALUES
           ($1::uuid, 'CO3137', 'Big Data'),
           ($2::uuid, 'essay-smoke-7de0749eb510', 'Essay smoke'),
           ($3::uuid, 'LMS-6A1804463D08', 'QTI spike B2'),
           ($4::uuid, 'canvas-legacy-01', 'Canvas legacy')`,
        [co3137Id, smokeCourseId, lmsCourseId, canvasCourseId],
      );
      await targetClient.query(
        `INSERT INTO chapters (chapter_id, course_id, code, title, sort_order)
         VALUES ($1::uuid, $2::uuid, '1', 'Chương 1', 1)`,
        [chapterCoId, co3137Id],
      );
      await targetClient.query(
        `INSERT INTO lms_user_mappings (internal_user_id, lms_sub, display_name, role) VALUES
           ($1::uuid, 'inst-sub', 'GV', 'instructor'),
           ($2::uuid, 'sv-sub', 'SV', 'learner')`,
        [userInstId, userLearnerId],
      );
      await targetClient.query(
        `INSERT INTO learning_outcomes (lo_id, course_id, code, statement_vi) VALUES
           ($1::uuid, $2::uuid, 'L.O.1.1', 'Hiểu dữ liệu lớn'),
           ($3::uuid, $4::uuid, 'L.O.1.1', 'Smoke LO'),
           ($5::uuid, $6::uuid, 'L.O.1.1', 'Sandbox LO'),
           ($7::uuid, $8::uuid, 'L.O.1.1', 'Legacy Canvas LO')`,
        [
          loCoId,
          co3137Id,
          randomUUID(),
          smokeCourseId,
          randomUUID(),
          lmsCourseId,
          randomUUID(),
          canvasCourseId,
        ],
      );
      await targetClient.query(
        `INSERT INTO lessons (lesson_id, course_id, lo_id, title)
         VALUES ($1::uuid, $2::uuid, $3::uuid, 'Bài 1')`,
        [lessonCoId, co3137Id, loCoId],
      );

      const qDraft = randomUUID();
      const qChanges = randomUUID();
      const qApproved = randomUUID();
      const qPublished = randomUUID();
      const qDeleted = randomUUID();

      await targetClient.query(
        `INSERT INTO quiz_items (quiz_id, lesson_id, course_id, lo_id, type, question, options, correct_answer, status, deleted_at)
         VALUES
           ($1::uuid, $6::uuid, $7::uuid, $8::uuid, 'MCQ_SINGLE', 'Câu draft?', '["A","B"]'::jsonb, '"A"'::jsonb, 'GENERATED_DRAFT', NULL),
           ($2::uuid, $6::uuid, $7::uuid, $8::uuid, 'MCQ_MULTI', 'Câu sửa?', '["A","B","C"]'::jsonb, '["A","B"]'::jsonb, 'CHANGES_REQUESTED', NULL),
           ($3::uuid, $6::uuid, $7::uuid, $8::uuid, 'TRUE_FALSE', 'Câu đã duyệt?', '["Đúng","Sai"]'::jsonb, '"Đúng"'::jsonb, 'APPROVED', NULL),
           ($4::uuid, $6::uuid, $7::uuid, $8::uuid, 'FILL_BLANK', 'Big ____.', NULL, '["Data"]'::jsonb, 'PUBLISHED', NULL),
           ($5::uuid, $6::uuid, $7::uuid, $8::uuid, 'MCQ_SINGLE', 'Câu đã xoá?', '["1","2"]'::jsonb, '"1"'::jsonb, 'GENERATED_DRAFT', now())`,
        [
          qDraft,
          qChanges,
          qApproved,
          qPublished,
          qDeleted,
          lessonCoId,
          co3137Id,
          loCoId,
        ],
      );

      const quizSetId = randomUUID();
      const snapshotItems = [
        {
          quiz_id: qApproved,
          question: 'Câu đã duyệt?',
          type: 'TRUE_FALSE',
          options: ['Đúng', 'Sai'],
          correct_answer: 'Đúng',
          explanation: null,
          lo_id: loCoId,
          bloom_level: null,
          source_chunk_ids: [],
        },
        {
          quiz_id: qPublished,
          question: 'Big ____.',
          type: 'FILL_BLANK',
          options: null,
          correct_answer: ['Data'],
          explanation: null,
          lo_id: loCoId,
          bloom_level: null,
          source_chunk_ids: [],
        },
        {
          quiz_id: qDraft,
          question: 'Câu draft đã bị sửa sau khi đóng đề',
          type: 'MCQ_SINGLE',
          options: ['A', 'B'],
          correct_answer: 'A',
          explanation: null,
          lo_id: loCoId,
          bloom_level: null,
          source_chunk_ids: [],
        },
      ];
      await targetClient.query(
        `INSERT INTO quiz_sets (quiz_set_id, course_id, chapter_id, chapter_ids, title, items, created_by)
         VALUES ($1::uuid, $2::uuid, $3::uuid, ARRAY[$3::uuid], 'Đề 1', $4::jsonb, $5::uuid)`,
        [
          quizSetId,
          co3137Id,
          chapterCoId,
          JSON.stringify(snapshotItems),
          userInstId,
        ],
      );

      const attemptId = randomUUID();
      await targetClient.query(
        `INSERT INTO quiz_attempts (attempt_id, user_id, quiz_id, course_id, score, chosen_answer, is_correct)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, 100, '"Đúng"'::jsonb, true)`,
        [attemptId, userLearnerId, qApproved, co3137Id],
      );

      // Chạy migration question_bank trong transaction như Prisma.
      const qbSql = readFileSync(
        join(MIGRATIONS_DIR, QB_MIGRATION_NAME, 'migration.sql'),
        'utf8',
      );
      await targetClient.query('BEGIN');
      await targetClient.query(qbSql);
      await targetClient.query('COMMIT');

      // 1. courses.subject_code
      const courseRows = await targetClient.query<{
        code: string;
        subject_code: string | null;
      }>(`SELECT code, subject_code FROM courses`);
      const byCode = Object.fromEntries(
        courseRows.rows.map((r) => [r.code, r.subject_code]),
      );
      expect(byCode['CO3137']).toBe('CO3137');
      expect(byCode['essay-smoke-7de0749eb510']).toBeNull();
      expect(byCode['LMS-6A1804463D08']).toBeNull();
      expect(byCode['canvas-legacy-01']).toBeNull();

      // 2. Chỉ khoá có quiz_items được tạo ngân hàng mặc định.
      const bankRows = await targetClient.query<{
        bank_id: string;
        home_course_id: string;
        owner_id: string | null;
        subject_code: string | null;
        visibility: string;
        is_course_default: boolean;
      }>(
        `SELECT bank_id::text, home_course_id::text, owner_id::text, subject_code, visibility, is_course_default FROM question_banks`,
      );
      expect(bankRows.rows).toHaveLength(1);
      expect(bankRows.rows[0]).toMatchObject({
        home_course_id: co3137Id,
        owner_id: null,
        subject_code: 'CO3137',
        visibility: 'COURSE',
        is_course_default: true,
      });
      const defaultBankId = bankRows.rows[0].bank_id;

      // 3. Tất cả quiz_items đều có bank_id, v1 backfilled, current_version_id.
      const versionRows = await targetClient.query<{
        quiz_id: string;
        version_id: string;
        version_no: number;
        provenance: Record<string, unknown>;
        bank_id: string;
        current_version_id: string;
      }>(
        `SELECT q.quiz_id::text, q.bank_id::text, q.current_version_id::text,
                v.version_id::text, v.version_no, v.provenance
         FROM quiz_items q
         JOIN quiz_item_versions v ON v.quiz_id = q.quiz_id`,
      );
      expect(versionRows.rows).toHaveLength(5);
      for (const row of versionRows.rows) {
        expect(row.bank_id).toBe(defaultBankId);
        expect(row.version_no).toBe(1);
        expect(row.current_version_id).toBe(row.version_id);
        expect(row.provenance).toEqual({ backfilled: true });
      }
      const v1ByQuiz = Object.fromEntries(
        versionRows.rows.map((r) => [r.quiz_id, r.version_id]),
      );

      // 4. quiz_sets.items[*].version_id (kể cả FILL_BLANK options=null và NULL khi lệch nội dung).
      const setRes = await targetClient.query<{
        items: Array<{ quiz_id: string; version_id: string | null }>;
      }>(`SELECT items FROM quiz_sets WHERE quiz_set_id = $1::uuid`, [
        quizSetId,
      ]);
      expect(setRes.rows[0].items.map((i) => i.version_id)).toEqual([
        v1ByQuiz[qApproved],
        v1ByQuiz[qPublished],
        null,
      ]);

      // 5. quiz_attempts.quiz_version_id dữ liệu cũ để NULL.
      const attemptRes = await targetClient.query<{
        quiz_version_id: string | null;
      }>(
        `SELECT quiz_version_id::text FROM quiz_attempts WHERE attempt_id = $1::uuid`,
        [attemptId],
      );
      expect(attemptRes.rows[0].quiz_version_id).toBeNull();

      // 6. lesson_id đã bỏ NOT NULL, bank_id đã đặt NOT NULL.
      const colInfo = await targetClient.query<{
        column_name: string;
        is_nullable: string;
      }>(
        `SELECT column_name, is_nullable FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'quiz_items'
           AND column_name IN ('lesson_id', 'bank_id')`,
      );
      const nullability = Object.fromEntries(
        colInfo.rows.map((r) => [r.column_name, r.is_nullable]),
      );
      expect(nullability.lesson_id).toBe('YES');
      expect(nullability.bank_id).toBe('NO');

      // 7. CHECK trạng thái: nhận RETIRED, từ chối UNPUBLISHED/ARCHIVED.
      await expect(
        targetClient.query(
          `UPDATE quiz_items SET status = 'RETIRED' WHERE quiz_id = $1::uuid`,
          [qDraft],
        ),
      ).resolves.toBeDefined();
      await expect(
        targetClient.query(
          `UPDATE quiz_items SET status = 'UNPUBLISHED' WHERE quiz_id = $1::uuid`,
          [qDraft],
        ),
      ).rejects.toThrow();
      await expect(
        targetClient.query(
          `UPDATE quiz_items SET status = 'ARCHIVED' WHERE quiz_id = $1::uuid`,
          [qDraft],
        ),
      ).rejects.toThrow();

      // 8. Trigger phiên bản đã bật sau backfill: sửa nội dung sinh v2.
      await targetClient.query(
        `UPDATE quiz_items SET question = 'Câu đã duyệt (sửa sau backfill)?' WHERE quiz_id = $1::uuid`,
        [qApproved],
      );
      const afterBackfillVersions = await targetClient.query<{
        version_no: number;
      }>(
        `SELECT version_no FROM quiz_item_versions WHERE quiz_id = $1::uuid ORDER BY version_no`,
        [qApproved],
      );
      expect(afterBackfillVersions.rows.map((r) => r.version_no)).toEqual([
        1, 2,
      ]);
    } finally {
      await targetClient?.end().catch(() => undefined);
      await adminClient
        .query(`DROP DATABASE IF EXISTS "${tempDbName}" WITH (FORCE)`)
        .catch(() => undefined);
      await adminClient.end().catch(() => undefined);
    }
  }, 60_000);

  it('P2: phân quyền ngân hàng (403, USE vào đề kèm version_id, EDIT sửa câu, RETIRED không vào đề mới)', async () => {
    const colleague = await prisma.lms_user_mappings.create({
      data: {
        lms_sub: `it-qb-colleague-${randomUUID()}`,
        display_name: 'Đồng nghiệp IT',
        role: 'instructor',
      },
    });
    userIds.push(colleague.internal_user_id);
    await prisma.course_memberships.create({
      data: {
        user_id: colleague.internal_user_id,
        course_id: courseId,
        role: 'instructor',
      },
    });
    const colleagueClaims: BffClaims = {
      sub: colleague.internal_user_id,
      courseId,
      roles: ['instructor'],
      scope: 'course',
      jti: 'it-qb-colleague-jti',
      iat: 0,
      exp: 1,
    };

    const chapter = await prisma.chapters.create({
      data: {
        course_id: courseId,
        code: `CH-${randomUUID().slice(0, 4)}`,
        title: 'Chương test P2',
        sort_order: 1,
      },
    });
    await prisma.chapter_los.create({
      data: { chapter_id: chapter.chapter_id, lo_id: loId },
    });

    const privateBank = await bankService.createBank(instructorClaims, {
      courseId,
      title: 'Ngân hàng riêng tư P2',
      visibility: 'PRIVATE',
    });
    const manualItem = await bankService.createItem(
      instructorClaims,
      privateBank.bank_id,
      {
        type: 'MCQ_SINGLE',
        question: 'Câu viết tay P2?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'B',
        loId,
      },
    );
    expect(manualItem.current_version_id).not.toBeNull();

    // Chưa chia sẻ: đồng nghiệp cùng khoá bị 403 trên mọi thao tác.
    await expect(
      bankService.listItems(colleagueClaims, privateBank.bank_id, {}),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      reviewService.updateQuizItem(colleagueClaims, manualItem.quiz_id, {
        question: 'Cố sửa?',
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      quizSetService.create(colleagueClaims, {
        courseId,
        chapterId: chapter.chapter_id,
        title: 'Đề chưa được phép',
        quizIds: [manualItem.quiz_id],
        selectionId: randomUUID(),
      }),
    ).rejects.toThrow(ForbiddenException);

    // Chia sẻ USE: thêm được vào đề (snapshot mang version_id), vẫn không sửa được.
    await bankService.share(instructorClaims, privateBank.bank_id, {
      granteeType: 'USER',
      granteeId: colleague.internal_user_id,
      role: 'USE',
    });
    const createdSet = await quizSetService.create(colleagueClaims, {
      courseId,
      chapterId: chapter.chapter_id,
      title: 'Đề dùng câu USE',
      quizIds: [manualItem.quiz_id],
      selectionId: randomUUID(),
    });
    const savedSet = await prisma.quiz_sets.findUniqueOrThrow({
      where: { quiz_set_id: createdSet.quiz_set_id },
    });
    expect(savedSet.items).toEqual([
      expect.objectContaining({
        quiz_id: manualItem.quiz_id,
        version_id: manualItem.current_version_id,
      }),
    ]);
    await expect(
      reviewService.updateQuizItem(colleagueClaims, manualItem.quiz_id, {
        question: 'Vẫn không được sửa?',
      }),
    ).rejects.toThrow(ForbiddenException);

    // Nâng quyền lên EDIT: sửa được câu (tạo v2), và ngừng dùng câu -> không chọn được vào đề mới.
    await bankService.share(instructorClaims, privateBank.bank_id, {
      granteeType: 'USER',
      granteeId: colleague.internal_user_id,
      role: 'EDIT',
    });
    const edited = await reviewService.updateQuizItem(
      colleagueClaims,
      manualItem.quiz_id,
      { question: 'Câu viết tay P2 (đã sửa)?' },
    );
    expect(edited.current_version_id).not.toBe(manualItem.current_version_id);

    await bankService.retireItem(
      instructorClaims,
      privateBank.bank_id,
      manualItem.quiz_id,
      {},
    );
    await expect(
      quizSetService.create(instructorClaims, {
        courseId,
        chapterId: chapter.chapter_id,
        title: 'Đề chứa câu RETIRED',
        quizIds: [manualItem.quiz_id],
        selectionId: randomUUID(),
      }),
    ).rejects.toThrow('đã duyệt');
  });

  it('P3: chia sẻ SUBJECT cùng mã môn, map LO khác khoá khi soạn đề/builderContext, và fork độc lập', async () => {
    const courseB = await prisma.courses.create({
      data: {
        code: `LMS-${randomUUID().slice(0, 12).toUpperCase()}`,
        subject_code: 'CO3137',
        name: 'IT Question Bank Lớp L02',
      },
    });
    courseIds.push(courseB.course_id);

    const loB = await prisma.learning_outcomes.create({
      data: {
        course_id: courseB.course_id,
        code: 'L.O.1.1',
        statement_vi: 'Hiểu sâu về ngân hàng câu hỏi (lớp L02)',
      },
    });
    const chapterB = await prisma.chapters.create({
      data: {
        course_id: courseB.course_id,
        code: '1',
        title: 'Chương 1 L02',
        sort_order: 1,
      },
    });
    await prisma.chapter_los.create({
      data: { chapter_id: chapterB.chapter_id, lo_id: loB.lo_id },
    });

    const loMissingInB = await prisma.learning_outcomes.create({
      data: {
        course_id: courseId,
        code: 'L.O.9.9',
        statement_vi: 'LO chỉ có ở lớp L01',
      },
    });

    const instB = await prisma.lms_user_mappings.create({
      data: {
        lms_sub: `it-qb-inst-b-${randomUUID()}`,
        display_name: 'Giảng viên L02',
        role: 'instructor',
      },
    });
    userIds.push(instB.internal_user_id);
    await prisma.course_memberships.create({
      data: {
        user_id: instB.internal_user_id,
        course_id: courseB.course_id,
        role: 'instructor',
      },
    });
    const instBClaims: BffClaims = {
      sub: instB.internal_user_id,
      courseId: courseB.course_id,
      roles: ['instructor'],
      scope: 'course',
      jti: 'it-qb-inst-b-jti',
      iat: 0,
      exp: 1,
    };

    const subjectBank = await bankService.createBank(instructorClaims, {
      courseId,
      title: 'Ngân hàng cùng môn P3',
      visibility: 'SUBJECT',
    });
    const qMatched = await bankService.createItem(
      instructorClaims,
      subjectBank.bank_id,
      {
        type: 'MCQ_SINGLE',
        question: 'Câu SUBJECT khớp LO P3?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        loId,
      },
    );
    const qMissingLo = await bankService.createItem(
      instructorClaims,
      subjectBank.bank_id,
      {
        type: 'TRUE_FALSE',
        question: 'Câu SUBJECT thiếu LO ở L02?',
        options: ['Đúng', 'Sai'],
        correct_answer: 'Đúng',
        loId: loMissingInB.lo_id,
      },
    );

    // 1. GV lớp B thấy subjectBank qua relation = 'subject' (role = USE) và thấy câu ở Soạn đề kèm cảnh báo.
    const visibleInB = await bankService.listBanks(
      instBClaims,
      courseB.course_id,
    );
    expect(visibleInB).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bank_id: subjectBank.bank_id,
          relation: 'subject',
          role: 'USE',
        }),
      ]),
    );
    const defaultBankB = visibleInB.find(
      (b) => b.is_current_course && b.is_course_default,
    )!;

    const builderCtx = await quizSetService.builderContext(instBClaims, {
      courseId: courseB.course_id,
      loIds: [loB.lo_id],
    });
    const matchedCtxItem = builderCtx.quizItems.find(
      (i) => i.quiz_id === qMatched.quiz_id,
    );
    expect(matchedCtxItem).toMatchObject({
      quiz_id: qMatched.quiz_id,
      lo_id: loB.lo_id,
      source_lo_id: loId,
      foreign: true,
      can_edit: false,
      lo_mapping: { status: 'statement_differs', source_lo_code: 'L.O.1.1' },
    });
    expect(builderCtx.unmappedForeignItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quiz_id: qMissingLo.quiz_id,
          source_lo_code: 'L.O.9.9',
        }),
      ]),
    );

    // 2. Tạo đề ở lớp B dùng câu của lớp A: snapshot ghi lo_id của lớp B; thiếu LO -> báo mã LO thiếu.
    const foreignSet = await quizSetService.create(instBClaims, {
      courseId: courseB.course_id,
      chapterId: chapterB.chapter_id,
      title: 'Đề lớp B dùng câu SUBJECT',
      quizIds: [qMatched.quiz_id],
      selectionId: randomUUID(),
    });
    const savedForeignSet = await prisma.quiz_sets.findUniqueOrThrow({
      where: { quiz_set_id: foreignSet.quiz_set_id },
    });
    expect(savedForeignSet.items).toEqual([
      expect.objectContaining({
        quiz_id: qMatched.quiz_id,
        lo_id: loB.lo_id,
        version_id: qMatched.current_version_id,
      }),
    ]);

    await expect(
      quizSetService.create(instBClaims, {
        courseId: courseB.course_id,
        chapterId: chapterB.chapter_id,
        title: 'Đề thiếu LO',
        quizIds: [qMissingLo.quiz_id],
        selectionId: randomUUID(),
      }),
    ).rejects.toThrow(BadRequestException);

    // 3. Fork câu sang ngân hàng mặc định lớp B rồi sửa bản fork: câu gốc không đổi.
    const forked = await bankService.forkItem(
      instBClaims,
      subjectBank.bank_id,
      qMatched.quiz_id,
      { targetBankId: defaultBankB.bank_id },
    );
    expect(forked.item.quiz_id).not.toBe(qMatched.quiz_id);
    expect(forked).toMatchObject({
      lo_mapped: true,
      lo_statement_differs: true,
    });
    expect(forked.item).toMatchObject({
      origin: 'FORK',
      forked_from_version_id: qMatched.current_version_id,
      course_id: courseB.course_id,
      lo_id: loB.lo_id,
      lesson_id: null,
      status: 'APPROVED',
    });

    const editedFork = await reviewService.updateQuizItem(
      instBClaims,
      forked.item.quiz_id,
      { question: 'Bản fork đã sửa ở lớp B?' },
    );
    expect(editedFork.current_version_id).not.toBe(
      forked.item.current_version_id,
    );

    const originalAfterFork = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: qMatched.quiz_id },
    });
    expect(originalAfterFork.question).toBe('Câu SUBJECT khớp LO P3?');
    expect(originalAfterFork.current_version_id).toBe(
      qMatched.current_version_id,
    );

    const forkAudits = await prisma.review_audit_logs.findMany({
      where: { entity_id: forked.item.quiz_id, action: 'FORK_QUIZ' },
    });
    expect(forkAudits).toHaveLength(1);
  });
});
