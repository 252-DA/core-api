import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../worker-results/worker-result-envelope';
import { ContentGenerationResultHandler } from './content-generation-result.handler';

/**
 * Chạy thật trên PostgreSQL đã áp đủ migration: ON CONFLICT thật, CHECK thật
 * (đặc biệt quiz_items_correct_answer_shape_check với đúng dạng đáp án worker
 * sinh ra cho cả 5 kiểu câu), khoá dòng thật. Bỏ qua khi không đặt
 * CONTENT_GENERATION_IT_DATABASE_URL.
 *
 *   CONTENT_GENERATION_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_c \
 *     npx jest src/content-generation/content-generation-result.handler.integration.spec.ts
 *
 * Test tạo khoá học riêng và xoá khi xong; chỉ trỏ vào DB tạm.
 */
const url = process.env.CONTENT_GENERATION_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

const CHUNK_A = randomUUID();
const CHUNK_B = randomUUID();

function evidence(verdict: string | null, extra: Record<string, unknown> = {}) {
  return {
    criterion: 'source_grounding',
    judge_verdict: verdict,
    judge_reason: verdict ? 'Khớp slide.' : null,
    inconclusive_reason: verdict ? null : 'judge_failed',
    regeneration_attempts: 0,
    regenerations_applied: 0,
    history: [],
    writer_model: 'writer-model',
    judge_model: 'judge-model',
    judge_is_writer: false,
    source_chunk_ids: [CHUNK_A],
    requested_bloom_level: 3,
    ...extra,
  };
}

/** Đúng dạng worker gửi (worker/worker/use_cases/generated_content.py) cho từng kiểu câu. */
function workerQuizItems() {
  const base = {
    explanation: 'Theo slide.',
    bloom_level: 3,
    source_chunk_ids: [CHUNK_A],
    verification_status: 'VERIFIED',
    verification_evidence: evidence('supported'),
  };
  return [
    {
      ...base,
      quiz_id: randomUUID(),
      type: 'MCQ_SINGLE',
      question: 'Dijkstra cần gì?',
      options: ['Âm', 'Không âm', 'Bằng 0', 'Tuỳ ý'],
      correct_answer: 'Không âm',
    },
    {
      ...base,
      quiz_id: randomUUID(),
      type: 'MCQ_MULTI',
      question: 'Chọn tính chất của cây.',
      options: ['Có chu trình', 'Liên thông', 'Có 2 đỉnh', 'Không chu trình'],
      correct_answer: ['Liên thông', 'Không chu trình'],
    },
    {
      ...base,
      quiz_id: randomUUID(),
      type: 'TRUE_FALSE',
      question: 'Cây n đỉnh có n cạnh.',
      options: ['Đúng', 'Sai'],
      correct_answer: 'Sai',
    },
    {
      ...base,
      quiz_id: randomUUID(),
      type: 'FILL_BLANK',
      question: 'Cây n đỉnh có ____ cạnh.',
      options: null,
      correct_answer: ['n-1', 'n − 1'],
      source_chunk_ids: [CHUNK_A, CHUNK_B],
    },
    {
      ...base,
      quiz_id: randomUUID(),
      type: 'SHORT_ANSWER',
      question: 'Vì sao cây n đỉnh có n-1 cạnh?',
      options: null,
      correct_answer: {
        model_answer: 'Quy nạp theo số đỉnh.',
        rubric: ['Nêu quy nạp'],
      },
      explanation: null,
      verification_status: 'INCONCLUSIVE',
      verification_evidence: evidence(null),
    },
  ];
}

function card(cardId: string, title: string, status = 'VERIFIED') {
  return {
    card_id: cardId,
    title,
    content: {
      key_insight: `${title}: ý chính.`,
      bullets: ['Ý một'],
      example: null,
      misconception: null,
      check_question: 'Hỏi?',
      check_answer: 'Đáp.',
      model_id: 'writer-model',
    },
    source_chunk_ids: [CHUNK_A],
    verification_status: status,
    verification_evidence: evidence(status === 'VERIFIED' ? 'supported' : null),
  };
}

describeDb('ContentGenerationResultHandler on PostgreSQL', () => {
  let prisma: PrismaClient;
  let handler: ContentGenerationResultHandler;
  let courseId: string;
  let loId: string;
  let retiredLoId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
    handler = new ContentGenerationResultHandler(prisma as never);
    const course = await prisma.courses.create({
      data: {
        code: `IT-GEN-${randomUUID().slice(0, 8)}`,
        name: 'IT content generation',
      },
    });
    courseId = course.course_id;
    const lo = await prisma.learning_outcomes.create({
      data: {
        course_id: courseId,
        code: 'L.O.1',
        statement_vi: 'Hiểu đồ thị và cây',
      },
    });
    loId = lo.lo_id;
    const retired = await prisma.learning_outcomes.create({
      data: {
        course_id: courseId,
        code: 'L.O.9',
        statement_vi: 'LO cũ',
        is_current: false,
      },
    });
    retiredLoId = retired.lo_id;
  });

  afterAll(async () => {
    if (prisma && courseId) {
      await prisma.quiz_items.deleteMany({ where: { course_id: courseId } });
      await prisma.lesson_cards.deleteMany({ where: { course_id: courseId } });
      await prisma.lessons.deleteMany({ where: { course_id: courseId } });
      await prisma.content_generation_requests.deleteMany({
        where: { course_id: courseId },
      });
      await prisma.learning_outcomes.deleteMany({
        where: { course_id: courseId },
      });
      await prisma.courses.delete({ where: { course_id: courseId } });
    }
    await prisma?.$disconnect();
  });

  async function newRequest(
    type: 'quiz' | 'card' | 'relations' = 'quiz',
    status = 'QUEUED',
  ) {
    const request = await prisma.content_generation_requests.create({
      data: {
        course_id: courseId,
        type,
        scope: { target_kind: 'lo', target_code: loId },
        status,
      },
    });
    return request.request_id;
  }

  function envelope(payload: Record<string, unknown>): WorkerResultEnvelope {
    return {
      result_id: `CONTENT_GENERATION_RESULT.${String(payload.request_id)}.${String(payload.status)}`,
      kind: 'CONTENT_GENERATION_RESULT',
      source_event_id: randomUUID(),
      occurred_at: new Date().toISOString(),
      payload,
    };
  }

  function quizSucceeded(
    requestId: string,
    items: unknown[],
    extra: Record<string, unknown> = {},
  ) {
    return envelope({
      request_id: requestId,
      course_id: courseId,
      content_type: 'quiz',
      status: 'SUCCEEDED',
      lo_id: loId,
      generated_count: items.length,
      quiz_items: items,
      rejected: [],
      ...extra,
    });
  }

  function cardSucceeded(requestId: string, cards: unknown[]) {
    return envelope({
      request_id: requestId,
      course_id: courseId,
      content_type: 'card',
      status: 'SUCCEEDED',
      lo_id: loId,
      generated_count: cards.length,
      lesson_cards: cards,
      rejected: [],
    });
  }

  const requestRow = (requestId: string) =>
    prisma.content_generation_requests.findUniqueOrThrow({
      where: { request_id: requestId },
    });

  it('applies the whole lifecycle and stores every question type the worker produces', async () => {
    const requestId = await newRequest();
    const items = workerQuizItems();

    await expect(
      handler.handle(
        envelope({
          request_id: requestId,
          course_id: courseId,
          content_type: 'quiz',
          status: 'RUNNING',
        }),
      ),
    ).resolves.toMatchObject({ applied: true, status: 'RUNNING' });
    expect((await requestRow(requestId)).status).toBe('RUNNING');

    await expect(
      handler.handle(
        quizSucceeded(requestId, items, {
          rejected: [
            {
              reason: 'Nguồn không nhắc tới Bellman-Ford.',
              regeneration_attempts: 2,
            },
          ],
        }),
      ),
    ).resolves.toMatchObject({
      applied: true,
      status: 'SUCCEEDED',
      written: 5,
      skipped: 0,
    });

    const lessons = await prisma.lessons.findMany({
      where: { course_id: courseId, lo_id: loId },
    });
    expect(lessons).toHaveLength(1);
    expect(lessons[0]).toMatchObject({
      title: 'Hiểu đồ thị và cây',
      status: 'DRAFT',
    });

    const rows = await prisma.quiz_items.findMany({
      where: { quiz_id: { in: items.map((i) => i.quiz_id) } },
    });
    const byType = Object.fromEntries(rows.map((r) => [r.type, r]));
    expect(Object.keys(byType).sort()).toEqual([
      'FILL_BLANK',
      'MCQ_MULTI',
      'MCQ_SINGLE',
      'SHORT_ANSWER',
      'TRUE_FALSE',
    ]);
    expect(byType.MCQ_SINGLE).toMatchObject({
      lesson_id: lessons[0].lesson_id,
      lo_id: loId,
      status: 'GENERATED_DRAFT',
      correct_answer: 'Không âm',
      bloom_level: 3,
      verification_status: 'VERIFIED',
      deleted_at: null,
    });
    expect(byType.MCQ_SINGLE.verification_evidence).toMatchObject({
      criterion: 'source_grounding',
      judge_verdict: 'supported',
      requested_bloom_level: 3,
    });
    expect(byType.MCQ_MULTI.correct_answer).toEqual([
      'Liên thông',
      'Không chu trình',
    ]);
    expect(byType.TRUE_FALSE).toMatchObject({
      options: ['Đúng', 'Sai'],
      correct_answer: 'Sai',
    });
    expect(byType.FILL_BLANK).toMatchObject({
      options: null,
      correct_answer: ['n-1', 'n − 1'],
    });
    expect(byType.FILL_BLANK.source_chunk_ids).toEqual([CHUNK_A, CHUNK_B]);
    expect(byType.SHORT_ANSWER).toMatchObject({
      options: null,
      explanation: null,
      verification_status: 'INCONCLUSIVE',
      correct_answer: {
        model_answer: 'Quy nạp theo số đỉnh.',
        rubric: ['Nêu quy nạp'],
      },
    });

    const request = await requestRow(requestId);
    expect(request).toMatchObject({
      status: 'SUCCEEDED',
      generated_count: 5,
      last_error: null,
    });
    expect(request.verification_summary).toEqual({
      criterion: 'source_grounding',
      verified: 4,
      inconclusive: 1,
      flagged: 0,
      unverified: 0,
      rejected: 1,
      rejected_reasons: ['Nguồn không nhắc tới Bellman-Ford.'],
    });
  });

  it('changes nothing when the same result arrives twice, and ignores late results', async () => {
    const requestId = await newRequest('quiz', 'RUNNING');
    const items = workerQuizItems().slice(0, 1);
    await handler.handle(quizSucceeded(requestId, items));
    const before = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: items[0].quiz_id },
    });
    const requestBefore = await requestRow(requestId);

    await expect(
      handler.handle(quizSucceeded(requestId, items)),
    ).resolves.toMatchObject({
      applied: false,
      reason: 'request already SUCCEEDED',
    });
    await expect(
      handler.handle(
        envelope({
          request_id: requestId,
          course_id: courseId,
          content_type: 'quiz',
          status: 'FAILED',
          error: 'late',
        }),
      ),
    ).resolves.toMatchObject({ applied: false });
    await expect(
      handler.handle(
        envelope({
          request_id: requestId,
          course_id: courseId,
          content_type: 'quiz',
          status: 'RUNNING',
        }),
      ),
    ).resolves.toMatchObject({ applied: false });

    expect(
      await prisma.quiz_items.findUniqueOrThrow({
        where: { quiz_id: items[0].quiz_id },
      }),
    ).toEqual(before);
    expect(await requestRow(requestId)).toEqual(requestBefore);
  });

  it('regenerating a draft resets its verification record; reviewed items are left alone', async () => {
    const first = await newRequest('quiz', 'RUNNING');
    const [draft, reviewed] = workerQuizItems();
    await handler.handle(quizSucceeded(first, [draft, reviewed]));
    await prisma.quiz_items.update({
      where: { quiz_id: reviewed.quiz_id },
      data: { status: 'APPROVED' },
    });

    const second = await newRequest('quiz', 'RUNNING');
    const again = (item: typeof draft) => ({
      ...item,
      explanation: 'Lần sinh mới.',
      verification_status: 'INCONCLUSIVE',
      verification_evidence: evidence(null, { regeneration_attempts: 1 }),
    });
    await expect(
      handler.handle(quizSucceeded(second, [again(draft), again(reviewed)])),
    ).resolves.toMatchObject({ applied: true, written: 1, skipped: 1 });

    const redone = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: draft.quiz_id },
    });
    expect(redone).toMatchObject({
      status: 'GENERATED_DRAFT',
      explanation: 'Lần sinh mới.',
      verification_status: 'INCONCLUSIVE',
    });
    expect(redone.verification_evidence).toMatchObject({
      judge_verdict: null,
      regeneration_attempts: 1,
    });
    const kept = await prisma.quiz_items.findUniqueOrThrow({
      where: { quiz_id: reviewed.quiz_id },
    });
    expect(kept).toMatchObject({
      status: 'APPROVED',
      verification_status: 'VERIFIED',
      explanation: 'Theo slide.',
    });
    // Một lesson cho mỗi LO, dùng lại qua các lần sinh.
    expect(
      await prisma.lessons.count({
        where: { course_id: courseId, lo_id: loId },
      }),
    ).toBe(1);
  });

  it('appends new cards after the lesson’s last position and keeps the position of a re-sent card', async () => {
    const [c1, c2, c3] = [randomUUID(), randomUUID(), randomUUID()];
    const first = await newRequest('card', 'RUNNING');
    await handler.handle(
      cardSucceeded(first, [card(c1, 'Cây'), card(c2, 'Đồ thị')]),
    );
    const positionsBefore = await prisma.lesson_cards.findMany({
      where: { card_id: { in: [c1, c2] } },
      select: { card_id: true, position: true },
    });
    const start = Math.min(...positionsBefore.map((p) => p.position));

    const second = await newRequest('card', 'RUNNING');
    await expect(
      handler.handle(
        cardSucceeded(second, [
          card(c2, 'Đồ thị', 'INCONCLUSIVE'),
          card(c3, 'Rừng'),
        ]),
      ),
    ).resolves.toMatchObject({ applied: true, written: 2, skipped: 0 });

    const rows = await prisma.lesson_cards.findMany({
      where: { card_id: { in: [c1, c2, c3] } },
    });
    const at = Object.fromEntries(rows.map((r) => [r.card_id, r]));
    expect([at[c1].position, at[c2].position, at[c3].position]).toEqual([
      start,
      start + 1,
      start + 2,
    ]);
    expect(at[c2]).toMatchObject({
      status: 'GENERATED_DRAFT',
      verification_status: 'INCONCLUSIVE',
    });
    expect(at[c3].content).toMatchObject({
      key_insight: 'Rừng: ý chính.',
      bullets: ['Ý một'],
    });
    expect((await requestRow(second)).generated_count).toBe(2);
  });

  it('fails the request and writes nothing when the LO is no longer current', async () => {
    const requestId = await newRequest('quiz', 'RUNNING');
    const items = workerQuizItems().slice(0, 1);

    await expect(
      handler.handle(quizSucceeded(requestId, items, { lo_id: retiredLoId })),
    ).resolves.toMatchObject({ applied: true, status: 'FAILED' });

    const request = await requestRow(requestId);
    expect(request.status).toBe('FAILED');
    expect(request.last_error).toContain('not current');
    expect(
      await prisma.quiz_items.count({ where: { quiz_id: items[0].quiz_id } }),
    ).toBe(0);
    expect(await prisma.lessons.count({ where: { lo_id: retiredLoId } })).toBe(
      0,
    );
  });

  it('records a FAILED result and keeps generated_count', async () => {
    const requestId = await newRequest('quiz', 'RUNNING');
    await prisma.content_generation_requests.update({
      where: { request_id: requestId },
      data: { generated_count: 3 },
    });

    await handler.handle(
      envelope({
        request_id: requestId,
        course_id: null,
        content_type: null,
        status: 'FAILED',
        error: 'No grounded source chunks',
      }),
    );

    expect(await requestRow(requestId)).toMatchObject({
      status: 'FAILED',
      last_error: 'No grounded source chunks',
      generated_count: 3,
    });
  });

  it('onFinalFailure marks the request FAILED when the result is invalid, and no item is written', async () => {
    const requestId = await newRequest('quiz', 'RUNNING');
    const [item] = workerQuizItems();
    const bad = quizSucceeded(requestId, [
      { ...item, correct_answer: 'Không có trong phương án' },
    ]);

    const failure = await handler.handle(bad).catch((e: Error) => e);
    expect(failure).toBeInstanceOf(InvalidWorkerResultError);
    // Chưa có hook thì request vẫn chờ: handle() không tự đánh dấu nữa.
    expect((await requestRow(requestId)).status).toBe('RUNNING');

    await handler.onFinalFailure(bad, failure as Error);

    const request = await requestRow(requestId);
    expect(request.status).toBe('FAILED');
    expect(request.last_error).toContain('Invalid worker result');
    expect(
      await prisma.quiz_items.count({ where: { quiz_id: item.quiz_id } }),
    ).toBe(0);
  });

  it('onFinalFailure also covers an InvalidWorkerResultError thrown inside the transaction', async () => {
    // Request thuộc khoá học này, kết quả khai course khác: handle() ném lỗi
    // bên trong $transaction (sau khi khoá dòng), transaction rollback.
    const requestId = await newRequest('quiz', 'RUNNING');
    const [item] = workerQuizItems();
    const mismatched = quizSucceeded(requestId, [item], {
      course_id: randomUUID(),
    });

    const failure = await handler.handle(mismatched).catch((e: Error) => e);
    expect(failure).toBeInstanceOf(InvalidWorkerResultError);
    expect((failure as Error).message).toContain('belongs to course');
    expect((await requestRow(requestId)).status).toBe('RUNNING');

    await handler.onFinalFailure(mismatched, failure as Error);

    expect(await requestRow(requestId)).toMatchObject({
      status: 'FAILED',
      last_error: expect.stringContaining('belongs to course') as string,
    });
    expect(
      await prisma.quiz_items.count({ where: { quiz_id: item.quiz_id } }),
    ).toBe(0);
  });

  it('onFinalFailure leaves a request that already finished alone', async () => {
    const requestId = await newRequest('quiz', 'SUCCEEDED');

    await handler.onFinalFailure(
      quizSucceeded(requestId, workerQuizItems().slice(0, 1)),
      new Error('late failure'),
    );

    const request = await requestRow(requestId);
    expect(request.status).toBe('SUCCEEDED');
    expect(request.last_error).toBeNull();
  });

  it('rolls back everything when a write fails half-way through the batch', async () => {
    const requestId = await newRequest('quiz', 'RUNNING');
    const [first, second] = workerQuizItems();
    // jsonb không nhận \u0000: parser cho qua (evidence là object tự do) nhưng
    // câu INSERT thứ hai lỗi, sau khi câu thứ nhất đã ghi trong transaction.
    const broken = {
      ...second,
      verification_evidence: evidence('supported', {
        judge_reason: 'a\u0000b',
      }),
    };

    await expect(
      handler.handle(quizSucceeded(requestId, [first, broken])),
    ).rejects.toThrow();

    expect(
      await prisma.quiz_items.count({
        where: { quiz_id: { in: [first.quiz_id, second.quiz_id] } },
      }),
    ).toBe(0);
    expect((await requestRow(requestId)).status).toBe('RUNNING');

    // Lỗi thường hết lượt thử: hook đánh dấu FAILED để request không kẹt RUNNING.
    await handler.onFinalFailure(
      quizSucceeded(requestId, [first, broken]),
      new Error('invalid input syntax for type json'),
    );
    expect(await requestRow(requestId)).toMatchObject({
      status: 'FAILED',
      last_error: expect.stringContaining('could not be applied') as string,
    });
  });

  it('updates only the request for a relations result', async () => {
    const requestId = await newRequest('relations', 'RUNNING');

    await handler.handle(
      envelope({
        request_id: requestId,
        course_id: courseId,
        content_type: 'relations',
        status: 'SUCCEEDED',
        generated_count: 41,
      }),
    );

    expect(await requestRow(requestId)).toMatchObject({
      status: 'SUCCEEDED',
      generated_count: 41,
      verification_summary: null,
    });
  });
});
