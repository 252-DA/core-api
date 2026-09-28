import { QuizSetService } from './quiz-set.service';
import type { BffClaims } from '../auth/bff-claims';

const COURSE = '00000000-0000-0000-0000-000000000001';
const USER = '00000000-0000-0000-0000-000000000002';
const SET = '00000000-0000-0000-0000-000000000003';
const CHAPTER = '00000000-0000-0000-0000-000000000004';
const LINK = '00000000-0000-0000-0000-000000000005';
const Q1 = '00000000-0000-0000-0000-000000000006';
const Q2 = '00000000-0000-0000-0000-000000000007';
const CHAPTER2 = '00000000-0000-0000-0000-000000000008';
const LO = '00000000-0000-0000-0000-000000000009';
const claims: BffClaims = {
  sub: USER,
  courseId: COURSE,
  scope: 'course',
  roles: ['learner'],
  jti: 't',
  iat: 0,
  exp: 1,
};

function setup() {
  const items = [Q1, Q2].map((quiz_id) => ({
    quiz_id,
    question: 'Q',
    type: 'MCQ',
    options: ['yes', 'no'],
    correct_answer: 'yes',
    explanation: 'Because',
    lo_id: null,
    bloom_level: 2,
    source_chunk_ids: [],
  }));
  const snapshot = {
    quiz_set_id: SET,
    chapter_id: CHAPTER,
    course_id: COURSE,
    created_by: USER,
    title: 'Quiz',
    items,
  };
  const prisma = {
    quiz_sets: {
      findFirst: jest.fn().mockResolvedValue(snapshot),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(snapshot),
    },
    chapters: {
      findFirst: jest.fn().mockResolvedValue({ chapter_id: CHAPTER }),
      findMany: jest.fn().mockResolvedValue([
        { chapter_id: CHAPTER, chapter_los: [{ lo_id: LO }] },
      ]),
    },
    quiz_items: { findMany: jest.fn().mockResolvedValue(items) },
    lti_resource_links: {
      findFirst: jest.fn().mockResolvedValue({ resource_link_id: LINK }),
      findMany: jest.fn().mockResolvedValue([{ resource_link_id: LINK }]),
    },
    course_memberships: { count: jest.fn().mockResolvedValue(0) },
    lms_user_mappings: {
      findMany: jest.fn().mockResolvedValue([
        { internal_user_id: USER, display_name: 'Test Student' },
      ]),
    },
    learning_outcomes: { findMany: jest.fn().mockResolvedValue([]) },
    quiz_attempts: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([
        { submission_id: 'earlier', _avg: { score: 100 } },
        { submission_id: 'now', _avg: { score: 50 } },
      ]),
    },
    quiz_set_sessions: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    review_audit_logs: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) =>
    fn(prisma),
  );
  const authz = { assertCourseAccess: jest.fn() };
  const ags = { isWaitingForPublish: jest.fn().mockReturnValue(false) };
  const service = new QuizSetService(
    prisma as never,
    authz as never,
    {} as never,
    {} as never,
    ags as never,
  );
  return { service, prisma, authz, ags, snapshot };
}

describe('Canvas quiz sets', () => {
  it('never exposes the snapshot answer or feedback to a learner', async () => {
    const { service } = setup();
    const result = await service.get(claims, SET);
    expect(result.items[0]).toEqual({
      quiz_id: Q1,
      question: 'Q',
      type: 'MCQ',
      options: ['yes', 'no'],
    });
    expect(JSON.stringify(result)).not.toContain('correct_answer');
    expect(JSON.stringify(result)).not.toContain('Because');
  });
  it('rejects access using a session for another course', async () => {
    const { service } = setup();
    await expect(
      service.get({ ...claims, courseId: CHAPTER }, SET),
    ).rejects.toThrow('không khớp');
  });
  it('does not publish unapproved or out-of-chapter questions', async () => {
    const { service, prisma } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([]);
    await expect(
      service.create(claims, {
        courseId: COURSE,
        chapterId: CHAPTER,
        title: 'Quiz',
        quizIds: [Q1],
        selectionId: SET,
      }),
    ).rejects.toThrow('đã duyệt');
    expect(prisma.quiz_sets.create).not.toHaveBeenCalled();
    expect(prisma.quiz_items.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          course_id: COURSE,
          status: { in: ['APPROVED', 'PUBLISHED'] },
          learning_outcomes: expect.objectContaining({
            chapter_los: { some: { chapter_id: { in: [CHAPTER] } } },
          }),
        }),
      }),
    );
  });
  it('reuses a snapshot on retry of the same deep linking selection', async () => {
    const { service, prisma, snapshot } = setup();
    prisma.quiz_sets.findUnique.mockResolvedValue(snapshot);
    await service.create(claims, {
      courseId: COURSE,
      chapterId: CHAPTER,
      title: 'New title',
      quizIds: [Q1],
      selectionId: SET,
    });
    expect(prisma.quiz_sets.create).not.toHaveBeenCalled();
  });
  it('rejects a partial or duplicate submission before recording a grade', async () => {
    const { service, prisma } = setup();
    for (const answers of [
      [{ quizId: Q1, chosenAnswer: 'yes' }],
      [
        { quizId: Q1, chosenAnswer: 'yes' },
        { quizId: Q1, chosenAnswer: 'yes' },
      ],
    ]) {
      await expect(
        service.submit(claims, {
          quizSetId: SET,
          resourceLinkId: LINK,
          answers,
        }),
      ).rejects.toThrow('đầy đủ');
    }
    expect(prisma.quiz_attempts.createMany).not.toHaveBeenCalled();
  });
  it('rejects a grade attached to a different Canvas resource link', async () => {
    const { service, prisma } = setup();
    prisma.lti_resource_links.findFirst.mockResolvedValue(null);
    await expect(
      service.submit(claims, {
        quizSetId: SET,
        resourceLinkId: LINK,
        answers: [],
      }),
    ).rejects.toThrow('không khớp');
    expect(prisma.quiz_attempts.createMany).not.toHaveBeenCalled();
  });
  it('grades the snapshot and atomically queues all answers under one submission', async () => {
    const { service, prisma, authz } = setup();
    const result = await service.submit(claims, {
      quizSetId: SET,
      resourceLinkId: LINK,
      answers: [
        { quizId: Q1, chosenAnswer: 'yes' },
        { quizId: Q2, chosenAnswer: 'no' },
      ],
    });
    expect(result.score).toBe(50);
    // Lượt trước đạt 100 → sổ điểm Canvas giữ 100, không bị lượt này kéo xuống.
    expect(result.bestScore).toBe(100);
    expect(result.attemptCount).toBe(2);
    expect(result.agsStatus).toBe('PENDING');
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(claims, COURSE, [
      'learner',
    ]);
    const rows = prisma.quiz_attempts.createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows[0].submission_id).toBe(rows[1].submission_id);
    expect(
      rows.every(
        (r: { resource_link_id: string }) => r.resource_link_id === LINK,
      ),
    ).toBe(true);
  });

  describe('results', () => {
    const row = (
      submission: string,
      quiz: string,
      correct: boolean,
      at: string,
      status = 'POSTED',
    ) => ({
      submission_id: submission,
      user_id: USER,
      quiz_id: quiz,
      is_correct: correct,
      score: correct ? 100 : 0,
      attempted_at: new Date(at),
      ags_status: status,
      resource_link_id: LINK,
    });

    it('người học chỉ thấy lượt nộp của mình, không kèm đáp án', async () => {
      const { service, prisma } = setup();
      prisma.quiz_attempts.findMany.mockResolvedValue([
        row('s1', Q1, true, '2026-09-27T07:00:00Z'),
        row('s1', Q2, true, '2026-09-27T07:00:00Z'),
        row('s2', Q1, false, '2026-09-27T08:00:00Z', 'PENDING'),
        row('s2', Q2, true, '2026-09-27T08:00:00Z', 'PENDING'),
      ]);
      const result = await service.results(claims, { quizSetId: SET });
      expect(prisma.quiz_attempts.findMany.mock.calls[0][0].where.user_id).toBe(USER);
      expect(result).toMatchObject({
        view: 'learner',
        attempts: [
          expect.objectContaining({ submissionId: 's1', score: 100, sync: 'POSTED' }),
          expect.objectContaining({ submissionId: 's2', score: 50, sync: 'SENDING' }),
        ],
        bestScore: 100,
        sync: 'SENDING',
      });
      expect(JSON.stringify(result)).not.toContain('correct_answer');
    });

    it('báo chờ publish khi poller AGS đang bị Canvas từ chối vì bài tập chưa publish', async () => {
      const { service, prisma, ags } = setup();
      ags.isWaitingForPublish.mockReturnValue(true);
      prisma.quiz_attempts.findMany.mockResolvedValue([
        row('s1', Q1, true, '2026-09-27T07:00:00Z', 'PENDING'),
      ]);
      const result = await service.results(claims, { quizSetId: SET });
      expect(result).toMatchObject({ sync: 'WAITING_PUBLISH' });
    });

    it('giảng viên thấy từng sinh viên, điểm cao nhất và tỉ lệ đúng theo lượt gần nhất', async () => {
      const { service, prisma } = setup();
      prisma.course_memberships.count.mockResolvedValue(1);
      prisma.quiz_attempts.findMany.mockResolvedValue([
        row('s1', Q1, true, '2026-09-27T07:00:00Z'),
        row('s1', Q2, true, '2026-09-27T07:00:00Z'),
        row('s2', Q1, false, '2026-09-27T08:00:00Z'),
        row('s2', Q2, true, '2026-09-27T08:00:00Z'),
      ]);
      const result = await service.results(
        { ...claims, roles: ['instructor'] },
        { quizSetId: SET },
      );
      expect(prisma.quiz_attempts.findMany.mock.calls[0][0].where.user_id).toBeUndefined();
      expect(result).toMatchObject({
        view: 'staff',
        summary: { students: 1, submissions: 2, averageBest: 100 },
        students: [
          { name: 'Test Student', attempts: 2, bestScore: 100, latestScore: 50, sync: 'POSTED' },
        ],
      });
      const items = (result as { items: Array<{ quiz_id: string; correct: number; answered: number }> }).items;
      expect(items.find((i) => i.quiz_id === Q1)).toMatchObject({ answered: 1, correct: 0 });
      expect(items.find((i) => i.quiz_id === Q2)).toMatchObject({ answered: 1, correct: 1 });
    });
  });

  describe('chế độ Kiểm tra', () => {
    const SESSION = '00000000-0000-0000-0000-0000000000e1';
    const future = (h: number) => new Date(Date.now() + h * 3_600_000);
    const exam = (overrides: Record<string, unknown> = {}) => ({
      mode: 'exam',
      points_possible: 10,
      max_attempts: 1,
      time_limit_minutes: 30,
      shuffle: false,
      available_from: null,
      available_until: null,
      due_at: future(24),
      ...overrides,
    });
    function examSetup(overrides: Record<string, unknown> = {}) {
      const ctx = setup();
      ctx.prisma.quiz_sets.findFirst.mockResolvedValue({
        ...ctx.snapshot,
        ...exam(overrides),
      });
      return ctx;
    }
    const openSession = (overrides: Record<string, unknown> = {}) => ({
      session_id: SESSION,
      item_order: [
        { quiz_id: Q2, options: ['no', 'yes'] },
        { quiz_id: Q1, options: ['yes', 'no'] },
      ],
      started_at: new Date(),
      expires_at: future(0.5),
      ended_at: null,
      ...overrides,
    });

    it('mở trang chưa trả đề, chỉ trả cài đặt', async () => {
      const { service } = examSetup();
      const result = await service.get(claims, SET);
      expect(result.items).toEqual([]);
      expect(result.settings).toMatchObject({ mode: 'exam', maxAttempts: 1 });
    });

    it('bắt đầu tạo phiên có hạn giờ, trả đề theo thứ tự phiên và không kèm đáp án', async () => {
      const { service, prisma } = examSetup();
      prisma.quiz_set_sessions.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...openSession(), ...data, session_id: SESSION }),
      );
      const result = await service.start(claims, {
        quizSetId: SET,
        resourceLinkId: LINK,
      });
      const data = prisma.quiz_set_sessions.create.mock.calls[0][0].data;
      expect(data.expires_at.getTime() - data.started_at.getTime()).toBe(30 * 60_000);
      expect(result).toMatchObject({ sessionId: SESSION, attemptNumber: 1, maxAttempts: 1 });
      expect(JSON.stringify(result)).not.toContain('correct_answer');
      expect(JSON.stringify(result)).not.toContain('Because');
    });

    it('tiếp tục phiên đang mở thay vì tính thêm lượt', async () => {
      const { service, prisma } = examSetup();
      prisma.quiz_set_sessions.findFirst.mockResolvedValue(openSession());
      prisma.quiz_set_sessions.count.mockResolvedValue(1);
      const result = await service.start(claims, { quizSetId: SET, resourceLinkId: LINK });
      expect(prisma.quiz_set_sessions.create).not.toHaveBeenCalled();
      expect(result.items.map((i) => i.quiz_id)).toEqual([Q2, Q1]);
      expect(result.items[0].options).toEqual(['no', 'yes']);
    });

    it('phiên hết giờ chưa nộp vẫn tính là đã dùng lượt', async () => {
      const { service, prisma } = examSetup();
      prisma.quiz_set_sessions.findFirst.mockResolvedValue(
        openSession({ expires_at: new Date(Date.now() - 10 * 60_000) }),
      );
      prisma.quiz_set_sessions.count.mockResolvedValue(1);
      await expect(
        service.start(claims, { quizSetId: SET, resourceLinkId: LINK }),
      ).rejects.toThrow('hết số lần');
      expect(prisma.quiz_set_sessions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { session_id: SESSION, ended_at: null } }),
      );
    });

    it.each([
      [{ available_from: future(2) }, 'chưa tới giờ'],
      [{ available_until: new Date(Date.now() - 1000), due_at: new Date(Date.now() - 2000) }, 'đã đóng'],
    ])('không cho bắt đầu ngoài khung giờ %#', async (overrides, message) => {
      const { service, prisma } = examSetup(overrides);
      await expect(
        service.start(claims, { quizSetId: SET, resourceLinkId: LINK }),
      ).rejects.toThrow(message);
      expect(prisma.quiz_set_sessions.create).not.toHaveBeenCalled();
    });

    it('nộp thiếu câu vẫn nhận, câu bỏ trống tính sai, chưa đóng bài thì không lộ đáp án', async () => {
      const { service, prisma } = examSetup();
      prisma.quiz_set_sessions.findFirst.mockResolvedValue(openSession());
      prisma.quiz_attempts.groupBy.mockResolvedValue([]);
      const result = await service.submit(claims, {
        quizSetId: SET,
        resourceLinkId: LINK,
        sessionId: SESSION,
        answers: [{ quizId: Q1, chosenAnswer: 'yes' }],
      });
      expect(result).toMatchObject({ score: 50, totalCorrect: 1, perItem: [], revealed: false });
      const rows = prisma.quiz_attempts.createMany.mock.calls[0][0].data;
      expect(rows.find((r: { quiz_id: string }) => r.quiz_id === Q2)).toMatchObject({
        is_correct: false,
        score: 0,
      });
      expect(prisma.quiz_set_sessions.updateMany).toHaveBeenCalledWith({
        where: { session_id: SESSION, ended_at: null },
        data: expect.objectContaining({ submission_id: rows[0].submission_id }),
      });
    });

    it('không nhận bài khi thiếu phiên, phiên đã nộp, hoặc quá giờ', async () => {
      const { service, prisma } = examSetup();
      const submit = (sessionId?: string) =>
        service.submit(claims, {
          quizSetId: SET,
          resourceLinkId: LINK,
          sessionId,
          answers: [{ quizId: Q1, chosenAnswer: 'yes' }],
        });
      await expect(submit()).rejects.toThrow('Bắt đầu');
      await expect(submit(SESSION)).rejects.toThrow('đã nộp');
      prisma.quiz_set_sessions.findFirst.mockResolvedValue(
        openSession({ expires_at: new Date(Date.now() - 5 * 60_000) }),
      );
      await expect(submit(SESSION)).rejects.toThrow('hết giờ');
      prisma.quiz_set_sessions.findFirst.mockResolvedValue(openSession());
      prisma.quiz_set_sessions.updateMany.mockResolvedValue({ count: 0 });
      await expect(submit(SESSION)).rejects.toThrow('đã được nộp');
      expect(prisma.quiz_attempts.createMany).not.toHaveBeenCalled();
    });

    it('sinh viên chỉ xem được bài làm và đáp án sau khi bài đóng', async () => {
      const row = {
        submission_id: 's1',
        user_id: USER,
        quiz_id: Q1,
        is_correct: false,
        score: 0,
        attempted_at: new Date(),
        ags_status: 'POSTED',
        resource_link_id: LINK,
        chosen_answer: 'no',
      };
      const open = examSetup();
      open.prisma.quiz_attempts.findMany.mockResolvedValue([row]);
      open.prisma.quiz_set_sessions.findMany.mockResolvedValue([openSession({ ended_at: new Date() })]);
      expect(await open.service.results(claims, { quizSetId: SET })).toMatchObject({
        revealed: false,
        review: null,
        attemptsUsed: 1,
        openSession: null,
      });

      const closed = examSetup({ due_at: new Date(Date.now() - 2 * 60_000) });
      closed.prisma.quiz_attempts.findMany.mockResolvedValue([row]);
      const result = (await closed.service.results(claims, { quizSetId: SET })) as {
        review: Array<{ quiz_id: string; chosen: unknown; correct_answer: unknown }>;
      };
      expect(result.review.find((r) => r.quiz_id === Q1)).toMatchObject({
        chosen: 'no',
        correct_answer: 'yes',
      });
    });
  });

  describe('đề nhiều chương từ trang Soạn đề', () => {
    const create = (service: QuizSetService, extra: Record<string, unknown> = {}) =>
      service.create(claims, {
        courseId: COURSE,
        chapterIds: [CHAPTER, CHAPTER2],
        title: 'Giữa kỳ',
        quizIds: [Q1, Q2],
        selectionId: SET,
        ...extra,
      });

    it('lưu mọi chương, bỏ trống chương chính, kèm ma trận đề', async () => {
      const { service, prisma } = setup();
      prisma.chapters.findMany.mockResolvedValue([
        { chapter_id: CHAPTER, chapter_los: [{ lo_id: LO }] },
        { chapter_id: CHAPTER2, chapter_los: [] },
      ]);
      await create(service, {
        blueprint: {
          cells: [{ lo_id: LO, bloom_level: 3, count: 2 }],
          source_document_ids: [SET],
        },
      });
      const data = prisma.quiz_sets.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        chapter_id: null,
        chapter_ids: [CHAPTER, CHAPTER2],
        blueprint: { cells: [{ lo_id: LO, bloom_level: 3, count: 2 }] },
      });
      expect(prisma.quiz_items.findMany.mock.calls[0][0].where.learning_outcomes).toEqual({
        deleted_at: null,
        chapter_los: { some: { chapter_id: { in: [CHAPTER, CHAPTER2] } } },
      });
    });

    it('từ chối chương của khóa khác và ô ma trận có LO ngoài các chương đã chọn', async () => {
      const { service, prisma } = setup();
      prisma.chapters.findMany.mockResolvedValueOnce([
        { chapter_id: CHAPTER, chapter_los: [{ lo_id: LO }] },
      ]);
      await expect(create(service)).rejects.toThrow('Chương không thuộc');
      prisma.chapters.findMany.mockResolvedValueOnce([
        { chapter_id: CHAPTER, chapter_los: [{ lo_id: LO }] },
        { chapter_id: CHAPTER2, chapter_los: [] },
      ]);
      await expect(
        create(service, {
          blueprint: { cells: [{ lo_id: Q1, bloom_level: 2, count: 1 }], source_document_ids: [] },
        }),
      ).rejects.toThrow('LO không thuộc');
      expect(prisma.quiz_sets.create).not.toHaveBeenCalled();
    });

    it('hộp thoại module vẫn tạo đề một chương như trước', async () => {
      const { service, prisma } = setup();
      await service.create(claims, {
        courseId: COURSE,
        chapterId: CHAPTER,
        title: 'Quiz',
        quizIds: [Q1, Q2],
        selectionId: SET,
      });
      expect(prisma.quiz_sets.create.mock.calls[0][0].data).toMatchObject({
        chapter_id: CHAPTER,
        chapter_ids: [CHAPTER],
      });
    });
  });
});
