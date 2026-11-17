import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';
import { QuizGradingResultHandler } from './handlers/quiz-grading-result.handler';
import { MicroContentGradingResultHandler } from '../micro-content/handlers/micro-content-grading-result.handler';
import { EssayGradingResultHandler } from '../essay-processor/essay-grading-result.handler';
import { EssayGradingService } from './services/essay-grading.service';

/**
 * Ba handler kết quả chấm chạy thật trên PostgreSQL đã áp đủ migration (CHECK
 * trạng thái, FOR UPDATE, Decimal). Bỏ qua khi không đặt GRADING_IT_DATABASE_URL,
 * để `npx jest` mặc định không cần DB.
 *
 *   GRADING_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_g \
 *     npx jest src/quiz/grading-results.integration.spec.ts
 *
 * Mỗi test tạo khoá học riêng và xoá dữ liệu của nó khi xong; vẫn chỉ trỏ vào DB tạm.
 */
const url = process.env.GRADING_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;
const REVIEW = 'AI chưa chấm được câu này. Giảng viên sẽ chấm, điểm cập nhật sau.';
const INPUT = {
  type: 'SHORT_ANSWER',
  question: 'Vì sao?',
  correct_answer: { model_answer: 'Vì vậy.', rubric: ['Ý 1', 'Ý 2'] },
};

function envelope(kind: string, payload: Record<string, unknown>) {
  const eventId = randomUUID();
  return {
    result_id: `${kind}.${eventId}`,
    kind: kind as never,
    source_event_id: eventId,
    occurred_at: new Date().toISOString(),
    payload,
  };
}

describeDb('kết quả chấm trên PostgreSQL', () => {
  let prisma: PrismaClient;
  const courses: string[] = [];
  const users: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
  });

  afterAll(async () => {
    for (const course of courses) {
      await prisma.$executeRawUnsafe(`DELETE FROM quiz_attempts WHERE course_id = $1::uuid`, course);
      // Câu trả lời giữ khoá RESTRICT tới câu hỏi: xoá lượt nộp (cascade câu trả lời) trước.
      await prisma.$executeRawUnsafe(
        `DELETE FROM micro_content_attempts WHERE micro_content_id IN (SELECT micro_content_id FROM micro_contents WHERE course_id = $1::uuid)`,
        course,
      );
      await prisma.$executeRawUnsafe(`DELETE FROM quiz_items WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(`DELETE FROM lessons WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(`DELETE FROM learning_outcomes WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(
        `DELETE FROM lti_resource_links WHERE course_ref_id IN (SELECT course_ref_id FROM lms_course_ref WHERE course_id = $1::uuid)`,
        course,
      );
      await prisma.$executeRawUnsafe(`DELETE FROM lms_course_ref WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(`DELETE FROM micro_contents WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(`DELETE FROM essay_processors WHERE course_id = $1::uuid`, course);
      await prisma.$executeRawUnsafe(`DELETE FROM courses WHERE course_id = $1::uuid`, course);
    }
    for (const user of users) {
      // Nhật ký chấm tay/chấm lại của EssayGradingService giữ khoá tới người dùng.
      await prisma.$executeRawUnsafe(`DELETE FROM review_audit_logs WHERE performed_by = $1::uuid`, user);
      await prisma.$executeRawUnsafe(`DELETE FROM lms_user_mappings WHERE internal_user_id = $1::uuid`, user);
    }
    await prisma?.$disconnect();
  });

  async function one<T>(sql: string, ...params: unknown[]): Promise<T> {
    const rows = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
    return rows[0];
  }

  async function seedCourse() {
    const { course_id } = await one<{ course_id: string }>(
      `INSERT INTO courses (code, name) VALUES ($1, 'IT') RETURNING course_id::text`,
      `IT-${randomUUID().slice(0, 8)}`,
    );
    courses.push(course_id);
    const { user_id } = await one<{ user_id: string }>(
      `INSERT INTO lms_user_mappings (lms_sub, display_name, role) VALUES ($1, 'SV', 'learner')
       RETURNING internal_user_id::text AS user_id`,
      `sub-${randomUUID()}`,
    );
    users.push(user_id);
    const { lo_id } = await one<{ lo_id: string }>(
      `INSERT INTO learning_outcomes (course_id, code, statement_vi) VALUES ($1::uuid, 'LO1', 'Hiểu') RETURNING lo_id::text`,
      course_id,
    );
    const { lesson_id } = await one<{ lesson_id: string }>(
      `INSERT INTO lessons (course_id, lo_id, title) VALUES ($1::uuid, $2::uuid, 'Bài 1') RETURNING lesson_id::text`,
      course_id,
      lo_id,
    );
    const quiz = async (type: string, answer: unknown) =>
      (
        await one<{ quiz_id: string }>(
          `INSERT INTO quiz_items (course_id, lesson_id, question, type, correct_answer)
           VALUES ($1::uuid, $2::uuid, 'Câu', $3, $4::jsonb) RETURNING quiz_id::text`,
          course_id,
          lesson_id,
          type,
          JSON.stringify(answer),
        )
      ).quiz_id;
    return {
      course_id,
      user_id,
      mcq: await quiz('MCQ_SINGLE', 'A'),
      essay: await quiz('SHORT_ANSWER', INPUT.correct_answer),
    };
  }

  async function attempt(
    seed: Awaited<ReturnType<typeof seedCourse>>,
    opts: {
      submission: string | null;
      link?: string | null;
      pending: boolean;
      score?: number;
      ags?: string;
    },
  ) {
    const { attempt_id } = await one<{ attempt_id: string }>(
      `INSERT INTO quiz_attempts (submission_id, user_id, quiz_id, course_id, resource_link_id, score,
                                  chosen_answer, is_correct, grading_status, grading_input, ags_status, feedback)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7::jsonb, $8, $9, $10::jsonb, $11, 'giải thích')
       RETURNING attempt_id::text`,
      opts.submission,
      seed.user_id,
      opts.pending ? seed.essay : seed.mcq,
      seed.course_id,
      opts.link ?? null,
      opts.score ?? 0,
      JSON.stringify(opts.pending ? 'Bài làm' : 'A'),
      (opts.score ?? 0) === 100,
      opts.pending ? 'PENDING' : 'GRADED',
      opts.pending ? JSON.stringify(INPUT) : null,
      opts.ags ?? 'AWAITING_GRADE',
    );
    return attempt_id;
  }

  async function quizRows(ids: string[]) {
    return prisma.quiz_attempts.findMany({
      where: { attempt_id: { in: ids } },
      orderBy: { attempt_id: 'asc' },
      select: {
        attempt_id: true,
        score: true,
        is_correct: true,
        feedback: true,
        grading_status: true,
        ags_status: true,
      },
    });
  }

  const graded = (id: string, score: number) => ({
    attempt_id: id,
    status: 'GRADED',
    score,
    is_correct: score === 100,
    feedback: `Điểm ${score}`,
    grader_model: 'gemini-test',
  });

  it('quiz set: ghi điểm, NEEDS_REVIEW giữ cả lượt, chấm lại câu cuối thì mở AGS; nhận lại không đổi gì', async () => {
    const seed = await seedCourse();
    const submission = randomUUID();
    const mcq = await attempt(seed, { submission, pending: false, score: 100 });
    const e1 = await attempt(seed, { submission, pending: true });
    const e2 = await attempt(seed, { submission, pending: true });
    const handler = new QuizGradingResultHandler(prisma as never);
    const payload = (answers: unknown[]) => ({ submission_id: submission, course_id: seed.course_id, answers });

    await handler.handle(
      envelope('QUIZ_GRADING_RESULT', payload([
        graded(e1, 75),
        { attempt_id: e2, status: 'NEEDS_REVIEW', reason: 'MODEL_ERROR', feedback: REVIEW, grader_model: null },
      ]))
    );
    let rows = await quizRows([mcq, e1, e2]);
    expect(rows.find((r) => r.attempt_id === e1)).toMatchObject({ grading_status: 'GRADED', is_correct: false, feedback: 'Điểm 75' });
    expect(Number(rows.find((r) => r.attempt_id === e1)!.score)).toBe(75);
    expect(rows.find((r) => r.attempt_id === e2)).toMatchObject({ grading_status: 'NEEDS_REVIEW', feedback: REVIEW });
    expect(Number(rows.find((r) => r.attempt_id === e2)!.score)).toBe(0);
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);

    // Giảng viên cho AI chấm lại câu 2 (EssayGradingService.retry): về PENDING.
    await prisma.quiz_attempts.update({ where: { attempt_id: e2 }, data: { grading_status: 'PENDING' } });
    const retry = envelope('QUIZ_GRADING_RESULT', payload([graded(e2, 100)]));
    const out = await handler.handle(retry);
    expect(out).toMatchObject({ graded: 1, released: 3 });
    rows = await quizRows([mcq, e1, e2]);
    expect(rows.every((r) => r.ags_status === 'PENDING' && r.grading_status === 'GRADED')).toBe(true);

    const again = await handler.handle(retry);
    expect(again).toMatchObject({ graded: 0, needsReview: 0, skipped: 1, released: 0 });
    expect(await quizRows([mcq, e1, e2])).toEqual(rows);
  });

  it('hai kết quả của cùng lượt nộp chạy song song: không deadlock, lượt nộp không kẹt AWAITING_GRADE', async () => {
    const seed = await seedCourse();
    const submission = randomUUID();
    const e1 = await attempt(seed, { submission, pending: true });
    const e2 = await attempt(seed, { submission, pending: true });
    const handler = new QuizGradingResultHandler(prisma as never);
    const result = (id: string) =>
      envelope('QUIZ_GRADING_RESULT', { submission_id: submission, course_id: seed.course_id, answers: [graded(id, 50)] });

    const outs = await Promise.all([handler.handle(result(e1)), handler.handle(result(e2))]);

    expect(outs.map((o) => o.released).sort()).toEqual([0, 2]);
    const rows = await quizRows([e1, e2]);
    expect(rows.every((r) => r.ags_status === 'PENDING')).toBe(true);
  });

  it('lesson quiz (không submission_id): gom theo người học + bài tập để mở AGS', async () => {
    const seed = await seedCourse();
    const { course_ref_id } = await one<{ course_ref_id: string }>(
      `INSERT INTO lms_course_ref (course_id, lms_context_id) VALUES ($1::uuid, $2) RETURNING course_ref_id::text`,
      seed.course_id,
      `ctx-${randomUUID()}`,
    );
    const { resource_link_id: link } = await one<{ resource_link_id: string }>(
      `INSERT INTO lti_resource_links (course_ref_id, lms_resource_link_id, target_kind)
       VALUES ($1::uuid, $2, 'lesson') RETURNING resource_link_id::text`,
      course_ref_id,
      `rl-${randomUUID()}`,
    );
    const mcq = await attempt(seed, { submission: null, link, pending: false, score: 100 });
    const essay = await attempt(seed, { submission: null, link, pending: true });

    const out = await new QuizGradingResultHandler(prisma as never).handle(
      envelope('QUIZ_GRADING_RESULT', {
        submission_id: randomUUID(),
        course_id: seed.course_id,
        answers: [graded(essay, 100)],
      })
    );

    expect(out.released).toBe(2);
    expect((await quizRows([mcq, essay])).every((r) => r.ags_status === 'PENDING')).toBe(true);
  });

  it('câu không thuộc lượt nộp: từ chối và không ghi gì (rollback)', async () => {
    const seed = await seedCourse();
    const e1 = await attempt(seed, { submission: randomUUID(), pending: true });
    const e2 = await attempt(seed, { submission: randomUUID(), pending: true });

    await expect(
      new QuizGradingResultHandler(prisma as never).handle(
        envelope('QUIZ_GRADING_RESULT', {
          submission_id: randomUUID(),
          course_id: seed.course_id,
          answers: [graded(e1, 100), graded(e2, 100)],
        })
      ),
    ).rejects.toBeInstanceOf(InvalidWorkerResultError);
    expect((await quizRows([e1, e2])).every((r) => r.grading_status === 'PENDING')).toBe(true);
  });

  it('kết quả quiz thất bại vĩnh viễn: câu PENDING → NEEDS_REVIEW, giảng viên chấm tay rồi AGS mở', async () => {
    const seed = await seedCourse();
    const submission = randomUUID();
    const mcq = await attempt(seed, { submission, pending: false, score: 100 });
    const e1 = await attempt(seed, { submission, pending: true });
    const e2 = await attempt(seed, { submission, pending: true });
    const handler = new QuizGradingResultHandler(prisma as never);
    // Điểm 101: handle() từ chối cả kết quả (InvalidWorkerResultError, không retry).
    const bad = envelope('QUIZ_GRADING_RESULT', {
      submission_id: submission,
      course_id: seed.course_id,
      answers: [graded(e1, 101), graded(e2, 50)],
    });
    const failure = await handler.handle(bad).catch((e: Error) => e);
    expect(failure).toBeInstanceOf(InvalidWorkerResultError);
    expect((await quizRows([e1, e2])).every((r) => r.grading_status === 'PENDING')).toBe(true);

    await handler.onFinalFailure(bad, failure as Error);

    const rows = await quizRows([mcq, e1, e2]);
    expect(rows.find((r) => r.attempt_id === mcq)).toMatchObject({ grading_status: 'GRADED', feedback: 'giải thích' });
    for (const id of [e1, e2]) {
      expect(rows.find((r) => r.attempt_id === id)).toMatchObject({
        grading_status: 'NEEDS_REVIEW',
        feedback: expect.stringContaining('Giảng viên sẽ chấm') as string,
      });
    }
    // Cả lượt vẫn chờ: chưa có điểm giả nào lên LMS.
    expect(rows.every((r) => r.ags_status === 'AWAITING_GRADE')).toBe(true);

    // Lối ra có thật: giảng viên chấm tay từng câu (EssayGradingService.grade nhận
    // NEEDS_REVIEW), câu cuối có điểm thì lượt nộp mở khoá AGS.
    const staff = { sub: seed.user_id, roles: ['instructor'] } as never;
    const service = new EssayGradingService(prisma as never, { assertCourseAccess: () => Promise.resolve() } as never);
    expect(await service.grade(staff, { attemptId: e1, score: 80 })).toMatchObject({ released: 0 });
    expect(await service.grade(staff, { attemptId: e2, score: 100 })).toMatchObject({ released: 3 });
    expect((await quizRows([mcq, e1, e2])).every((r) => r.ags_status === 'PENDING' && r.grading_status === 'GRADED')).toBe(true);
  });

  it('kết quả quiz thất bại vĩnh viễn: giảng viên cũng cho AI chấm lại được (retry nhận NEEDS_REVIEW)', async () => {
    const seed = await seedCourse();
    const submission = randomUUID();
    const e1 = await attempt(seed, { submission, pending: true });
    const handler = new QuizGradingResultHandler(prisma as never);
    const failed = envelope('QUIZ_GRADING_RESULT', {
      submission_id: submission,
      course_id: seed.course_id,
      answers: [graded(e1, 50)],
    });
    await handler.onFinalFailure(failed, new Error('hết lượt thử'));
    expect((await quizRows([e1]))[0].grading_status).toBe('NEEDS_REVIEW');

    const service = new EssayGradingService(prisma as never, { assertCourseAccess: () => Promise.resolve() } as never);
    await expect(service.retry({ sub: seed.user_id, roles: ['instructor'] } as never, { attemptId: e1 })).resolves.toMatchObject({
      gradingStatus: 'PENDING',
    });
    expect((await quizRows([e1]))[0].grading_status).toBe('PENDING');
    // retry() ghi một sự kiện outbox cho worker; dọn để khỏi tồn đọng trong DB tạm.
    await prisma.$executeRawUnsafe(`DELETE FROM outbox_events WHERE aggregate_id = $1::uuid`, submission);
  });

  it('kết quả quiz thất bại vĩnh viễn: không đè câu đã chấm hay lượt nộp khác, chạy lại không đổi gì', async () => {
    const seed = await seedCourse();
    const submission = randomUUID();
    const done = await attempt(seed, { submission, pending: true });
    await prisma.quiz_attempts.update({ where: { attempt_id: done }, data: { grading_status: 'GRADED', score: 70 } });
    const other = await attempt(seed, { submission: randomUUID(), pending: true });
    const handler = new QuizGradingResultHandler(prisma as never);
    const failed = envelope('QUIZ_GRADING_RESULT', {
      submission_id: submission,
      course_id: seed.course_id,
      answers: [graded(done, 50), graded(other, 50)],
    });

    await handler.onFinalFailure(failed, new Error('x'));
    await handler.onFinalFailure(failed, new Error('x'));

    const rows = await quizRows([done, other]);
    expect(rows.find((r) => r.attempt_id === done)).toMatchObject({ grading_status: 'GRADED' });
    expect(Number(rows.find((r) => r.attempt_id === done)!.score)).toBe(70);
    expect(rows.find((r) => r.attempt_id === other)).toMatchObject({ grading_status: 'PENDING' });
  });

  it('micro content: điểm tổng theo Math.round (50.5 → 51), passed và trạng thái lượt nộp; nhận lại không đổi gì', async () => {
    const seed = await seedCourse();
    const { micro_content_id } = await one<{ micro_content_id: string }>(
      `INSERT INTO micro_contents (course_id, title, created_by, passing_score, status)
       VALUES ($1::uuid, 'MC', $2::uuid, 51, 'PUBLISHED') RETURNING micro_content_id::text`,
      seed.course_id,
      seed.user_id,
    );
    const question = async (position: number, type: string, answer: unknown) =>
      (
        await one<{ question_id: string }>(
          `INSERT INTO micro_content_questions (micro_content_id, position, question, type, correct_answer)
           VALUES ($1::uuid, $2, 'Câu', $3, $4::jsonb) RETURNING question_id::text`,
          micro_content_id,
          position,
          type,
          JSON.stringify(answer),
        )
      ).question_id;
    const q1 = await question(1, 'FILL_BLANK', ['x']);
    const q2 = await question(2, 'SHORT_ANSWER', INPUT.correct_answer);
    const { attempt_id } = await one<{ attempt_id: string }>(
      `INSERT INTO micro_content_attempts (micro_content_id, user_id, score, passed, grading_status)
       VALUES ($1::uuid, $2::uuid, 1, false, 'PENDING') RETURNING attempt_id::text`,
      micro_content_id,
      seed.user_id,
    );
    // Câu 1 có điểm lẻ 1 (dữ liệu dựng để trung bình ra đúng 50.5).
    await prisma.$executeRawUnsafe(
      `INSERT INTO micro_content_answers (attempt_id, question_id, chosen_answer, score, is_correct, grading_status)
       VALUES ($1::uuid, $2::uuid, '"y"', 1, false, 'GRADED')`,
      attempt_id,
      q1,
    );
    const { answer_id } = await one<{ answer_id: string }>(
      `INSERT INTO micro_content_answers (attempt_id, question_id, chosen_answer, score, is_correct, grading_status, grading_input)
       VALUES ($1::uuid, $2::uuid, '"Bài làm"', 0, false, 'PENDING', $3::jsonb) RETURNING answer_id::text`,
      attempt_id,
      q2,
      JSON.stringify(INPUT),
    );
    const handler = new MicroContentGradingResultHandler(prisma as never);
    const result = envelope('MICRO_CONTENT_GRADING_RESULT', {
      attempt_id,
      course_id: seed.course_id,
      micro_content_id,
      answers: [{ answer_id, status: 'GRADED', score: 100, is_correct: true, feedback: 'Đủ ý', grader_model: null }],
    });

    await handler.handle(result);
    const read = () =>
      prisma.micro_content_attempts.findUnique({
        where: { attempt_id },
        select: { score: true, passed: true, grading_status: true, answers: { select: { score: true, grading_status: true, feedback: true } } },
      });
    const after = await read();
    expect(after).toMatchObject({ score: 51, passed: true, grading_status: 'GRADED' });
    expect(after!.answers).toEqual(
      expect.arrayContaining([{ score: 100, grading_status: 'GRADED', feedback: 'Đủ ý' }]),
    );

    await handler.handle(result);
    expect(await read()).toEqual(after);
  });

  it('kết quả micro content thất bại vĩnh viễn: câu PENDING → NEEDS_REVIEW, lượt nộp tính lại như handle()', async () => {
    const seed = await seedCourse();
    const { micro_content_id } = await one<{ micro_content_id: string }>(
      `INSERT INTO micro_contents (course_id, title, created_by, passing_score, status)
       VALUES ($1::uuid, 'MC', $2::uuid, 60, 'PUBLISHED') RETURNING micro_content_id::text`,
      seed.course_id,
      seed.user_id,
    );
    const question = async (position: number, type: string, answer: unknown) =>
      (
        await one<{ question_id: string }>(
          `INSERT INTO micro_content_questions (micro_content_id, position, question, type, correct_answer)
           VALUES ($1::uuid, $2, 'Câu', $3, $4::jsonb) RETURNING question_id::text`,
          micro_content_id,
          position,
          type,
          JSON.stringify(answer),
        )
      ).question_id;
    const q1 = await question(1, 'FILL_BLANK', ['x']);
    const q2 = await question(2, 'SHORT_ANSWER', INPUT.correct_answer);
    const { attempt_id } = await one<{ attempt_id: string }>(
      `INSERT INTO micro_content_attempts (micro_content_id, user_id, score, passed, grading_status)
       VALUES ($1::uuid, $2::uuid, 50, false, 'PENDING') RETURNING attempt_id::text`,
      micro_content_id,
      seed.user_id,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO micro_content_answers (attempt_id, question_id, chosen_answer, score, is_correct, grading_status)
       VALUES ($1::uuid, $2::uuid, '"x"', 100, true, 'GRADED')`,
      attempt_id,
      q1,
    );
    const { answer_id } = await one<{ answer_id: string }>(
      `INSERT INTO micro_content_answers (attempt_id, question_id, chosen_answer, score, is_correct, grading_status, grading_input)
       VALUES ($1::uuid, $2::uuid, '"Bài làm"', 0, false, 'PENDING', $3::jsonb) RETURNING answer_id::text`,
      attempt_id,
      q2,
      JSON.stringify(INPUT),
    );
    const handler = new MicroContentGradingResultHandler(prisma as never);
    const failed = envelope('MICRO_CONTENT_GRADING_RESULT', {
      attempt_id,
      course_id: seed.course_id,
      micro_content_id,
      answers: [{ answer_id, status: 'GRADED', score: 999, is_correct: true, feedback: null, grader_model: null }],
    });
    await expect(handler.handle(failed)).rejects.toBeInstanceOf(InvalidWorkerResultError);

    await handler.onFinalFailure(failed, new InvalidWorkerResultError('score'));

    const read = () =>
      prisma.micro_content_attempts.findUnique({
        where: { attempt_id },
        select: { score: true, passed: true, grading_status: true, answers: { select: { answer_id: true, grading_status: true, feedback: true } } },
      });
    const after = await read();
    expect(after).toMatchObject({ score: 50, passed: false, grading_status: 'NEEDS_REVIEW' });
    expect(after!.answers.find((a) => a.answer_id === answer_id)).toMatchObject({
      grading_status: 'NEEDS_REVIEW',
      feedback: expect.stringContaining('Giảng viên sẽ chấm') as string,
    });
    expect(after!.answers.filter((a) => a.grading_status === 'GRADED')).toHaveLength(1);

    await handler.onFinalFailure(failed, new Error('x'));
    expect(await read()).toEqual(after);
  });

  it('essay: QUEUED → GRADED rồi nhận lại thì bỏ qua; FAILED mở cờ báo cáo', async () => {
    const seed = await seedCourse();
    const { processor_id } = await one<{ processor_id: string }>(
      `INSERT INTO essay_processors (course_id, lti_client_id, title, rubric, max_score, created_by)
       VALUES ($1::uuid, 'client', 'Tiểu luận', '[]'::jsonb, 10, $2::uuid) RETURNING processor_id::text`,
      seed.course_id,
      seed.user_id,
    );
    const submission = async () =>
      (
        await one<{ id: string }>(
          `INSERT INTO essay_submissions (processor_id, notice_id, lms_submission_id, lms_user_sub, report_url, assets, status, reported_at)
           VALUES ($1::uuid, $2, 'sub', 'sv', 'https://lms/report', '[]'::jsonb, 'QUEUED', now())
           RETURNING essay_submission_id::text AS id`,
          processor_id,
          `notice-${randomUUID()}`,
        )
      ).id;
    const okId = await submission();
    const failId = await submission();
    const handler = new EssayGradingResultHandler(prisma as never);
    const result = {
      score: 8.5,
      max_score: 10,
      criteria: [{ criterion: 'Nội dung', points: 8.5, max_points: 10, comment: 'Khá' }],
      feedback: 'Bài khá.',
      truncated: false,
      model: 'gemini-test',
    };

    const graded = envelope('ESSAY_GRADING_RESULT', { essay_submission_id: okId, status: 'GRADED', result });
    expect(await handler.handle(graded)).toEqual({ applied: true, status: 'GRADED' });
    const row = await prisma.essay_submissions.findUnique({ where: { essay_submission_id: okId } });
    expect(row).toMatchObject({ status: 'GRADED', result, error: null, attempts: 0 });
    expect(await handler.handle(graded)).toEqual({ applied: false, status: 'GRADED' });

    await handler.handle(
      envelope('ESSAY_GRADING_RESULT', {
        essay_submission_id: failId,
        status: 'FAILED',
        error_code: 'UNSUPPORTED_ASSET_TYPE',
        error: 'File .zip',
      })
    );
    expect(await prisma.essay_submissions.findUnique({ where: { essay_submission_id: failId } })).toMatchObject({
      status: 'FAILED',
      error_code: 'UNSUPPORTED_ASSET_TYPE',
      error: 'File .zip',
      reported_at: null,
    });
  });

  it('kết quả essay thất bại vĩnh viễn: QUEUED → FAILED mở cờ báo cáo; bài đã chấm giữ nguyên', async () => {
    const seed = await seedCourse();
    const { processor_id } = await one<{ processor_id: string }>(
      `INSERT INTO essay_processors (course_id, lti_client_id, title, rubric, max_score, created_by)
       VALUES ($1::uuid, 'client', 'Tiểu luận', '[]'::jsonb, 10, $2::uuid) RETURNING processor_id::text`,
      seed.course_id,
      seed.user_id,
    );
    const submission = async (status: string) =>
      (
        await one<{ id: string }>(
          `INSERT INTO essay_submissions (processor_id, notice_id, lms_submission_id, lms_user_sub, report_url, assets, status, reported_at)
           VALUES ($1::uuid, $2, 'sub', 'sv', 'https://lms/report', '[]'::jsonb, $3, now())
           RETURNING essay_submission_id::text AS id`,
          processor_id,
          `notice-${randomUUID()}`,
          status,
        )
      ).id;
    const queued = await submission('QUEUED');
    const gradedAlready = await submission('GRADED');
    const handler = new EssayGradingResultHandler(prisma as never);
    const failedFor = (id: string) =>
      envelope('ESSAY_GRADING_RESULT', { essay_submission_id: id, status: 'GRADED', result: { score: 99 } });

    await handler.onFinalFailure(failedFor(queued), new Error('x'));
    await handler.onFinalFailure(failedFor(gradedAlready), new Error('x'));

    expect(await prisma.essay_submissions.findUnique({ where: { essay_submission_id: queued } })).toMatchObject({
      status: 'FAILED',
      error_code: 'PROCESSING_FAILED',
      reported_at: null,
    });
    expect(await prisma.essay_submissions.findUnique({ where: { essay_submission_id: gradedAlready } })).toMatchObject({
      status: 'GRADED',
      error_code: null,
    });
  });
});
