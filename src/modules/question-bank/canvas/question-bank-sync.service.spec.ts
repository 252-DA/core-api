import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { BffClaims } from '../../../auth/bff-claims';
import { CanvasApiError } from '../../../integrations/canvas/canvas-errors';
import {
  canvasBankName,
  QUESTION_BANK_EXPORT_JOB,
  QuestionBankSyncService,
} from './question-bank-sync.service';

const BANK = '019a0000-0000-7000-8000-0000000000b1';
const COURSE = '019a0000-0000-7000-8000-0000000000c1';
const OTHER_COURSE = '019a0000-0000-7000-8000-0000000000c2';
const JOB = '019a0000-0000-7000-8000-0000000000a1';
const Q1 = '019a0000-0000-7000-8000-000000000001';
const Q2 = '019a0000-0000-7000-8000-000000000002';
const Q3 = '019a0000-0000-7000-8000-000000000003';

const claims: BffClaims = {
  sub: 'user-1',
  courseId: COURSE,
  roles: ['instructor'],
  scope: 'course',
  jti: 'j',
  iat: 1,
  exp: 2,
};

function quizItem(quizId: string, overrides: Record<string, unknown> = {}) {
  return {
    quiz_id: quizId,
    type: 'MCQ_SINGLE',
    question: `Câu ${quizId}?`,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'B',
    explanation: null,
    current_version_id: `v-${quizId}`,
    learning_outcomes: { code: 'L.O.1.1' },
    ...overrides,
  };
}

function setup() {
  const prisma = {
    quiz_items: { count: jest.fn(), findMany: jest.fn() },
    question_banks: { findUniqueOrThrow: jest.fn() },
    question_bank_sync_jobs: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        job_id: JOB,
        status: 'QUEUED',
        ...data,
      })),
      update: jest.fn(async () => ({})),
    },
    question_lms_links: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(async () => ({})),
    },
  };
  const authz = { assertCourseAccess: jest.fn(async () => undefined) };
  const access = {
    assertRole: jest.fn(async () => ({
      bank: { bank_id: BANK, home_course_id: COURSE },
      role: 'EDIT',
    })),
  };
  const canvas = {
    getCourseByLtiContext: jest.fn(async () => ({ id: 42, name: 'K' })),
    startQtiImport: jest.fn(async () => ({
      migrationId: 77,
      progressUrl: 'https://canvas.example/api/v1/progress/9',
    })),
    getProgress: jest.fn(
      async (): Promise<Record<string, unknown>> => ({
        workflow_state: 'completed',
      }),
    ),
    listMigrationIssues: jest.fn(
      async (): Promise<Record<string, unknown>[]> => [],
    ),
    listQuestionBanks: jest.fn(),
    listBankQuestions: jest.fn(),
    lmsBaseUrl: jest.fn(() => 'https://canvas.example'),
  };
  const canvasCourses = { contextId: jest.fn(async () => 'ctx-1') };
  const queue = { add: jest.fn(async () => ({})) };
  const service = new QuestionBankSyncService(
    prisma as never,
    authz as never,
    access as never,
    canvas as never,
    canvasCourses as never,
    queue as never,
  );
  return { service, prisma, authz, access, canvas, canvasCourses, queue };
}

describe('canvasBankName', () => {
  it('ghép mã môn · mã LO · tên ngân hàng, bỏ phần trống, cắt 255 ký tự', () => {
    expect(canvasBankName('CO3137', 'L.O.2.1', 'Ngân hàng chung')).toBe(
      'CO3137 · L.O.2.1 · Ngân hàng chung',
    );
    expect(canvasBankName(null, null, 'B')).toBe('Chưa gắn LO · B');
    expect(canvasBankName('X', 'L', 'y'.repeat(400))).toHaveLength(255);
  });
});

describe('QuestionBankSyncService.requestExport', () => {
  it('cần EDIT trên ngân hàng, kiểm quyền khoá đích (mặc định khoá gốc), rồi xếp job vào hàng đợi', async () => {
    const { service, prisma, authz, access, canvasCourses, queue } = setup();
    prisma.quiz_items.count.mockResolvedValue(3);

    const job = await service.requestExport(claims, BANK, {});

    expect(access.assertRole).toHaveBeenCalledWith(claims, BANK, 'EDIT');
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(
      claims,
      COURSE,
      expect.arrayContaining(['instructor']),
    );
    expect(canvasCourses.contextId).toHaveBeenCalledWith(COURSE);
    expect(prisma.question_bank_sync_jobs.create).toHaveBeenCalledWith({
      data: {
        bank_id: BANK,
        direction: 'EXPORT',
        requested_by: 'user-1',
        target: { course_id: COURSE },
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      QUESTION_BANK_EXPORT_JOB,
      { jobId: JOB },
      expect.objectContaining({ jobId: `qb-${JOB}`, attempts: 1 }),
    );
    expect(job.job_id).toBe(JOB);
  });

  it('xuất sang khoá khác khi truyền courseId', async () => {
    const { service, prisma, authz } = setup();
    prisma.quiz_items.count.mockResolvedValue(1);
    await service.requestExport(claims, BANK, { courseId: OTHER_COURSE });
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(
      claims,
      OTHER_COURSE,
      expect.anything(),
    );
    expect(prisma.question_bank_sync_jobs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ target: { course_id: OTHER_COURSE } }),
    });
  });

  it('không có quyền EDIT thì dừng trước khi đụng Canvas', async () => {
    const { service, access, canvasCourses, queue } = setup();
    access.assertRole.mockRejectedValue(new ForbiddenException('no'));
    await expect(service.requestExport(claims, BANK, {})).rejects.toThrow(
      ForbiddenException,
    );
    expect(canvasCourses.contextId).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('khoá không mở từ Canvas: báo ngay (400), không tạo job', async () => {
    const { service, canvasCourses, prisma } = setup();
    canvasCourses.contextId.mockRejectedValue(
      new BadRequestException('Khoá học này không được mở từ Canvas'),
    );
    await expect(service.requestExport(claims, BANK, {})).rejects.toThrow(
      'không được mở từ Canvas',
    );
    expect(prisma.question_bank_sync_jobs.create).not.toHaveBeenCalled();
  });

  it('ngân hàng chưa có câu đã duyệt thì từ chối', async () => {
    const { service, prisma } = setup();
    prisma.quiz_items.count.mockResolvedValue(0);
    await expect(service.requestExport(claims, BANK, {})).rejects.toThrow(
      'chưa có câu đã duyệt',
    );
  });

  it('đang có job chưa xong cho ngân hàng thì trả lại job đó, không xếp thêm', async () => {
    const { service, prisma, queue } = setup();
    prisma.quiz_items.count.mockResolvedValue(2);
    const running = { job_id: 'old', status: 'WAITING_LMS' };
    prisma.question_bank_sync_jobs.findFirst.mockResolvedValue(running);
    await expect(service.requestExport(claims, BANK, {})).resolves.toBe(
      running,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });
});

describe('QuestionBankSyncService.run (xuất)', () => {
  function readyToRun() {
    const ctx = setup();
    ctx.prisma.question_bank_sync_jobs.findUnique.mockResolvedValue({
      job_id: JOB,
      bank_id: BANK,
      direction: 'EXPORT',
      status: 'QUEUED',
      target: { course_id: COURSE },
    });
    ctx.prisma.question_banks.findUniqueOrThrow.mockResolvedValue({
      bank_id: BANK,
      title: 'Ngân hàng chung',
      subject_code: null,
      courses: { subject_code: 'CO3137' },
    });
    return ctx;
  }

  function lastUpdate(prisma: ReturnType<typeof setup>['prisma']) {
    const calls = prisma.question_bank_sync_jobs.update.mock
      .calls as unknown as [{ data: Record<string, unknown> }][];
    return calls[calls.length - 1][0].data;
  }

  it('đóng gói, import, khớp lại câu theo #quiz_id, ghi link (mới và cập nhật) và đếm', async () => {
    const { service, prisma, canvas } = readyToRun();
    prisma.quiz_items.findMany.mockResolvedValue([
      quizItem(Q1),
      quizItem(Q2, { learning_outcomes: { code: 'L.O.2.1' } }),
      quizItem(Q3, { correct_answer: 'không có' }),
    ]);
    canvas.listQuestionBanks.mockResolvedValue([
      { id: 3, title: 'CO3137 · L.O.1.1 · Ngân hàng chung' },
      { id: 4, title: 'CO3137 · L.O.2.1 · Ngân hàng chung' },
      { id: 5, title: 'Ngân hàng viết tay' },
    ]);
    canvas.listBankQuestions.mockImplementation(async (id: number) =>
      id === 3
        ? [{ id: 31, question_name: `L.O.1.1 #${Q1}` }]
        : [
            { id: 41, question_name: `L.O.2.1 #${Q2}` },
            { id: 42, question_name: 'Câu viết tay' },
          ],
    );
    // Q2 đã từng xuất sang khoá Canvas này.
    prisma.question_lms_links.findMany
      .mockResolvedValueOnce([{ quiz_id: Q2 }])
      .mockResolvedValueOnce([]);

    await service.run(JOB);

    const [courseId, fileName, data] = canvas.startQtiImport.mock
      .calls[0] as unknown as [number, string, Buffer];
    expect(courseId).toBe(42);
    expect(fileName).toBe(`da-bank-${BANK}.zip`);
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(canvas.listBankQuestions).toHaveBeenCalledTimes(2); // bỏ ngân hàng viết tay
    expect(prisma.question_lms_links.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.question_lms_links.upsert).toHaveBeenCalledWith({
      where: {
        uq_question_lms_link: {
          quiz_id: Q1,
          direction: 'EXPORT',
          lms_base_url: 'https://canvas.example',
          lms_context_type: 'course',
          lms_context_id: '42',
        },
      },
      create: expect.objectContaining({
        quiz_id: Q1,
        version_id: `v-${Q1}`,
        migration_id: `daq-${Q1}`,
        ext_question_id: '31',
        ext_bank_id: '3',
        ext_bank_title: 'CO3137 · L.O.1.1 · Ngân hàng chung',
      }),
      update: expect.objectContaining({
        version_id: `v-${Q1}`,
        ext_question_id: '31',
      }),
    });
    const done = lastUpdate(prisma);
    expect(done.status).toBe('COMPLETED');
    expect(done.counts).toEqual({
      exported: 1,
      updated: 1,
      unsupported: 1,
      failed: 0,
      retired_on_canvas: 0,
      canvas_issues: 0,
    });
    expect(done.report).toEqual([
      { quiz_id: Q3, reason: 'Đáp án đúng không nằm trong các phương án.' },
    ]);
    expect(prisma.question_bank_sync_jobs.update).toHaveBeenCalledWith({
      where: { job_id: JOB },
      data: expect.objectContaining({
        status: 'WAITING_LMS',
        lms_migration_ids: [77],
      }),
    });
  });

  it('câu không tìm thấy bên Canvas sau import và câu đã ngừng dùng vẫn còn bên Canvas đều được báo', async () => {
    const { service, prisma, canvas } = readyToRun();
    prisma.quiz_items.findMany.mockResolvedValue([quizItem(Q1)]);
    canvas.listQuestionBanks.mockResolvedValue([]);
    prisma.question_lms_links.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { quiz_id: Q3, ext_bank_title: 'CO3137 · L.O.1.1 · Ngân hàng chung' },
      ]);

    await service.run(JOB);

    const done = lastUpdate(prisma);
    expect(done.status).toBe('COMPLETED');
    expect(done.counts).toMatchObject({
      exported: 0,
      failed: 1,
      retired_on_canvas: 1,
    });
    expect(prisma.question_lms_links.upsert).not.toHaveBeenCalled();
  });

  it('migration thất bại trên Canvas: job FAILED kèm lý do, không ghi link', async () => {
    const { service, prisma, canvas } = readyToRun();
    prisma.quiz_items.findMany.mockResolvedValue([quizItem(Q1)]);
    canvas.getProgress.mockResolvedValue({
      workflow_state: 'failed',
      message: null,
    });
    canvas.listMigrationIssues.mockResolvedValue([
      { description: 'QTI không hợp lệ' },
    ]);

    await service.run(JOB);

    expect(lastUpdate(prisma)).toMatchObject({
      status: 'FAILED',
      last_error: 'Canvas không import được gói QTI: QTI không hợp lệ',
    });
    expect(prisma.question_lms_links.upsert).not.toHaveBeenCalled();
  });

  it('token Canvas sai: lỗi ghi vào job dạng dễ đọc, không ném ra BullMQ', async () => {
    const { service, prisma, canvas } = readyToRun();
    prisma.quiz_items.findMany.mockResolvedValue([quizItem(Q1)]);
    canvas.startQtiImport.mockRejectedValue(
      new CanvasApiError('Canvas trả HTTP 401 khi tạo content migration', 401),
    );
    await expect(service.run(JOB)).resolves.toBeUndefined();
    expect(lastUpdate(prisma)).toMatchObject({
      status: 'FAILED',
      last_error: 'Token Canvas hết hạn hoặc không hợp lệ',
    });
  });

  it('không câu nào đóng gói được: FAILED, không gọi Canvas', async () => {
    const { service, prisma, canvas } = readyToRun();
    prisma.quiz_items.findMany.mockResolvedValue([
      quizItem(Q1, { type: 'MATCHING' }),
    ]);
    await service.run(JOB);
    expect(canvas.startQtiImport).not.toHaveBeenCalled();
    expect(lastUpdate(prisma).status).toBe('FAILED');
  });

  it('job đã xong thì bỏ qua (BullMQ chạy lại sau restart)', async () => {
    const { service, prisma, canvas } = setup();
    prisma.question_bank_sync_jobs.findUnique.mockResolvedValue({
      job_id: JOB,
      status: 'COMPLETED',
    });
    await service.run(JOB);
    expect(prisma.question_bank_sync_jobs.update).not.toHaveBeenCalled();
    expect(canvas.startQtiImport).not.toHaveBeenCalled();
  });
});

describe('QuestionBankSyncService đọc job và ngân hàng Canvas', () => {
  it('xem job cần quyền VIEW trên ngân hàng của job', async () => {
    const { service, prisma, access } = setup();
    prisma.question_bank_sync_jobs.findUnique.mockResolvedValue({
      job_id: JOB,
      bank_id: BANK,
    });
    await service.getJob(claims, JOB);
    expect(access.assertRole).toHaveBeenCalledWith(claims, BANK, 'VIEW');
    await expect(service.getJob(claims, 'not-a-uuid')).rejects.toThrow(
      'Không tìm thấy job',
    );
  });

  it('liệt kê ngân hàng Canvas của khoá cần là giảng viên/trợ giảng', async () => {
    const { service, authz, canvas } = setup();
    canvas.listQuestionBanks.mockResolvedValue([
      { id: 3, title: 'B', assessment_question_count: 6 },
    ]);
    await expect(service.listCanvasBanks(claims, COURSE)).resolves.toEqual([
      { id: 3, title: 'B', question_count: 6 },
    ]);
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(
      claims,
      COURSE,
      expect.arrayContaining(['instructor']),
    );
    await expect(service.listCanvasBanks(claims, undefined)).rejects.toThrow(
      BadRequestException,
    );
  });
});
