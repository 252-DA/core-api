import { BadGatewayException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { BffClaims } from '../auth/bff-claims';
import {
  assetExtension,
  gradedReport,
  normalizeRubric,
  reportComment,
  resultText,
  type EssayResult,
} from './essay-grading';
import { EssayProcessorService, NOTICE_SUBJECT } from './essay-processor.service';
import { EssayReportPublisherService } from './essay-report.publisher';
import { LtiServiceError } from './lti-services.client';

const COURSE = '00000000-0000-0000-0000-000000000001';
const TEACHER = '00000000-0000-0000-0000-000000000002';
const PROCESSOR = '00000000-0000-0000-0000-000000000003';
const ESSAY = '00000000-0000-0000-0000-000000000004';
const CANVAS = 'https://canvas.example';
const teacher: BffClaims = { sub: TEACHER, courseId: COURSE, scope: 'course', roles: ['instructor'], jti: 't', iat: 0, exp: 1 };
const system: BffClaims = { sub: NOTICE_SUBJECT, scope: 'admin', roles: ['system'], jti: 's', iat: 0, exp: 1 };
const config = { enabled: true, clientId: '10000000000001' } as never;
const RUBRIC = [
  { criterion: 'Nội dung', description: 'Đúng trọng tâm', points: 6 },
  { criterion: 'Trình bày', description: '', points: 4 },
];
const RESULT: EssayResult = {
  score: 7.5,
  max_score: 10,
  criteria: [
    { criterion: 'Nội dung', points: 4.5, max_points: 6, comment: 'Thiếu ví dụ' },
    { criterion: 'Trình bày', points: 3, max_points: 4, comment: '' },
  ],
  feedback: 'Bài khá.',
};

function lti(overrides: Record<string, jest.Mock> = {}) {
  return {
    isPlatformUrl: (url: string) => typeof url === 'string' && url.startsWith(CANVAS),
    registerNoticeHandler: jest.fn().mockResolvedValue(undefined),
    downloadAsset: jest.fn().mockResolvedValue({ content: Buffer.from('pdf'), contentType: 'application/pdf' }),
    postReport: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('essay-grading helpers', () => {
  it('rubric: điểm tối đa là tổng điểm tiêu chí', () => {
    expect(normalizeRubric(RUBRIC)).toEqual({ rubric: RUBRIC, maxScore: 10 });
  });

  it('rubric: từ chối rubric rỗng, tiêu chí không tên, điểm ngoài khoảng', () => {
    expect(() => normalizeRubric([])).toThrow(BadRequestException);
    expect(() => normalizeRubric([{ criterion: ' ', points: 2 }])).toThrow(BadRequestException);
    expect(() => normalizeRubric([{ criterion: 'A', points: 0 }])).toThrow(BadRequestException);
    expect(() => normalizeRubric(Array.from({ length: 11 }, () => ({ criterion: 'A', points: 1 })))).toThrow(
      BadRequestException,
    );
  });

  it('result của báo cáo gọn trong 16 ký tự Canvas cho phép', () => {
    expect(resultText(7.5, 10)).toBe('7.5/10');
    expect(resultText(7.25, 100)).toBe('7.25/100');
    expect(resultText(8, 10)).toBe('8/10');
  });

  it('báo cáo chấm: màu theo tỉ lệ điểm, nhận xét liệt kê từng tiêu chí', () => {
    const report = gradedReport({ assetId: 'a', timestamp: 't' }, RESULT, { visibleToOwner: false, assetCount: 1 });
    expect(report).toMatchObject({ result: '7.5/10', processingProgress: 'Processed', indicationColor: '#FC5E13', visibleToOwner: false });
    expect(report.comment).toContain('Nội dung: 4.5/6 — Thiếu ví dụ');
    expect(report.comment).toContain('giảng viên quyết định điểm cuối');
    expect(reportComment(RESULT, 2)).toContain('Chấm chung 2 file');
  });

  it('đuôi file lấy từ tên, không có thì từ content type', () => {
    expect(assetExtension({ title: 'Bai luan.DOCX', content_type: null })).toBe('.docx');
    expect(assetExtension({ title: null, content_type: 'text/html; charset=utf-8' })).toBe('.html');
  });
});

describe('EssayProcessorService', () => {
  function setup(client = lti()) {
    const prisma = {
      essay_processors: {
        create: jest.fn().mockImplementation(({ data }) => ({ processor_id: PROCESSOR, ...data })),
        findMany: jest.fn().mockResolvedValue([{ processor_id: PROCESSOR }]),
      },
      essay_submissions: {
        createMany: jest.fn().mockImplementation(({ data }) => ({ count: data.length })),
        findMany: jest.fn(),
      },
      lms_user_mappings: { findMany: jest.fn().mockResolvedValue([{ internal_user_id: 'u1', lms_sub: 'student-sub' }]) },
    };
    const authz = { assertCourseAccess: jest.fn() };
    const service = new EssayProcessorService(prisma as never, authz as never, client as never, config);
    return { service, prisma, authz, client };
  }
  const create = {
    courseId: COURSE,
    title: 'Chấm tiểu luận',
    instructions: 'Phân tích kiến trúc Lambda',
    rubric: RUBRIC,
    pnsUrl: `${CANVAS}/api/lti/notice-handlers/7`,
    handlerUrl: 'https://tool.example/api/lti/notices',
  };

  it('gắn bộ chấm: đăng ký nhận thông báo với Canvas rồi mới lưu', async () => {
    const { service, prisma, client } = setup();
    const result = await service.createProcessor(teacher, create);

    expect(client.registerNoticeHandler).toHaveBeenCalledWith(create.pnsUrl, create.handlerUrl);
    expect(prisma.essay_processors.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ course_id: COURSE, lti_client_id: '10000000000001', max_score: 10 }),
    });
    expect(result).toMatchObject({ processor_id: PROCESSOR, max_score: 10 });
  });

  it('Canvas không nhận đăng ký thì không lưu bộ chấm', async () => {
    const { service, prisma } = setup(lti({ registerNoticeHandler: jest.fn().mockRejectedValue(new Error('403')) }));
    await expect(service.createProcessor(teacher, create)).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.essay_processors.create).not.toHaveBeenCalled();
  });

  it('không gửi token tới địa chỉ PNS ngoài Canvas', async () => {
    const { service, client } = setup();
    await expect(
      service.createProcessor(teacher, { ...create, pnsUrl: 'https://evil.example/pns' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(client.registerNoticeHandler).not.toHaveBeenCalled();
  });

  it('nhận thông báo: chỉ danh tính hệ thống của web', async () => {
    const { service } = setup();
    await expect(service.receiveNotices(teacher, { notices: [] })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('nhận thông báo: bỏ processor lạ và file ngoài Canvas, gắn sinh viên đã biết', async () => {
    const { service, prisma } = setup();
    const notice = {
      noticeId: 'n1',
      processorId: PROCESSOR,
      submissionId: 'sub:1',
      userSub: 'student-sub',
      reportUrl: `${CANVAS}/api/lti/asset_processors/1/reports`,
      assets: [
        { asset_id: 'a1', url: `${CANVAS}/api/lti/asset_processors/1/assets/a1`, title: 'bai.pdf' },
        { asset_id: 'a2', url: 'https://evil.example/a2' },
      ],
    };
    const result = await service.receiveNotices(system, {
      notices: [notice, { ...notice, noticeId: 'n2', processorId: '00000000-0000-0000-0000-00000000dead' }],
    });

    expect(result).toEqual({ received: 2, accepted: 1 });
    const { data, skipDuplicates } = prisma.essay_submissions.createMany.mock.calls[0][0];
    expect(skipDuplicates).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ notice_id: 'n1', user_id: 'u1', status: 'RECEIVED' });
    expect(data[0].assets).toEqual([expect.objectContaining({ asset_id: 'a1', title: 'bai.pdf' })]);
  });

  it('báo cáo chi tiết: sinh viên chỉ xem được khi bộ chấm cho phép', async () => {
    const { service, prisma, authz } = setup();
    authz.assertCourseAccess.mockRejectedValue(new ForbiddenException());
    const row = (visible: boolean) => ({
      lms_user_sub: 'student-sub',
      user_id: 'u1',
      status: 'REPORTED',
      result: RESULT,
      error: 'x',
      received_at: new Date(0),
      essay_processors: { course_id: COURSE, title: 'T', max_score: 10, rubric: RUBRIC, visible_to_owner: visible },
    });
    const student: BffClaims = { ...teacher, sub: 'u1', roles: ['learner'] };

    prisma.essay_submissions.findMany.mockResolvedValue([row(false)]);
    await expect(service.getReport(student, { submissionId: 'sub:1', userSub: 'student-sub' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    prisma.essay_submissions.findMany.mockResolvedValue([row(true)]);
    const [view] = await service.getReport(student, { submissionId: 'sub:1', userSub: 'student-sub' });
    expect(view).toMatchObject({ status: 'REPORTED', error: null, is_teacher: false });
  });
});

describe('EssayReportPublisherService', () => {
  const asset = { asset_id: 'a1', url: `${CANVAS}/assets/a1`, title: 'bai.pdf', content_type: null, size: null, sha256: null };
  function row(overrides: Record<string, unknown> = {}) {
    return {
      essay_submission_id: ESSAY,
      lms_submission_id: 'sub:1',
      report_url: `${CANVAS}/reports`,
      assets: [asset],
      attempts: 0,
      error: null,
      error_code: null,
      result: RESULT,
      essay_processors: { course_id: COURSE, visible_to_owner: true },
      ...overrides,
    } as never;
  }
  function setup(client = lti()) {
    const prisma = {
      essay_submissions: { update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      outbox_events: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
    const storage = { putObject: jest.fn() };
    const publisher = new EssayReportPublisherService(prisma as never, client as never, storage as never, config);
    return { publisher, prisma, storage, client };
  }

  it('bài mới: báo Processing, tải file về MinIO, giao worker qua outbox', async () => {
    const { publisher, prisma, storage, client } = setup();
    await publisher.fetchAndQueue(row());

    expect(client.postReport).toHaveBeenCalledWith(`${CANVAS}/reports`, expect.objectContaining({ processingProgress: 'Processing', assetId: 'a1' }));
    expect(storage.putObject).toHaveBeenCalledWith(`essay-submissions/${ESSAY}/a1.pdf`, Buffer.from('pdf'), 'application/pdf');
    expect(prisma.essay_submissions.update).toHaveBeenCalledWith({
      where: { essay_submission_id: ESSAY },
      data: expect.objectContaining({
        status: 'QUEUED',
        assets: [expect.objectContaining({ storage_key: `essay-submissions/${ESSAY}/a1.pdf`, content_type: 'application/pdf' })],
      }),
    });
    expect(prisma.outbox_events.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ event_type: 'ESSAY_GRADING_REQUESTED', payload: { essay_submission_id: ESSAY, course_id: COURSE } }),
    });
  });

  it('tải lỗi: thử lại sau, quá số lần thì FAILED với DOWNLOAD_FAILED', async () => {
    const failing = lti({ downloadAsset: jest.fn().mockRejectedValue(new LtiServiceError('Canvas trả HTTP 500', 500)) });
    const { publisher, prisma } = setup(failing);

    await publisher.fetchAndQueue(row());
    expect(prisma.essay_submissions.update.mock.calls[0][0].data).toMatchObject({ attempts: 1, next_attempt_at: expect.any(Date) });
    expect(prisma.outbox_events.create).not.toHaveBeenCalled();

    await publisher.fetchAndQueue(row({ attempts: 4 }));
    expect(prisma.essay_submissions.update.mock.calls[1][0].data).toMatchObject({ status: 'FAILED', error_code: 'DOWNLOAD_FAILED' });
  });

  it('file quá lớn: FAILED ngay, không thử lại', async () => {
    const { publisher, prisma } = setup(lti({ downloadAsset: jest.fn().mockRejectedValue(new LtiServiceError('lớn', 413)) }));
    await publisher.fetchAndQueue(row());
    expect(prisma.essay_submissions.update.mock.calls[0][0].data).toMatchObject({ status: 'FAILED', error_code: 'ASSET_TOO_LARGE' });
  });

  it('chấm xong: gửi điểm gợi ý về SpeedGrader rồi REPORTED', async () => {
    const { publisher, prisma, client } = setup();
    await publisher.reportGraded(row());

    expect(client.postReport).toHaveBeenCalledWith(
      `${CANVAS}/reports`,
      expect.objectContaining({ result: '7.5/10', processingProgress: 'Processed', visibleToOwner: true }),
    );
    expect(prisma.essay_submissions.update.mock.calls[0][0].data).toMatchObject({ status: 'REPORTED', reported_at: expect.any(Date) });
  });

  it('gửi báo cáo lỗi: giữ GRADED để thử lại, không mất kết quả', async () => {
    const { publisher, prisma } = setup(lti({ postReport: jest.fn().mockRejectedValue(new Error('timeout')) }));
    await publisher.reportGraded(row());
    const data = prisma.essay_submissions.update.mock.calls[0][0].data;
    expect(data.status).toBeUndefined();
    expect(data).toMatchObject({ attempts: 1, next_attempt_at: expect.any(Date) });
  });

  it('chấm thất bại: báo lỗi về Canvas một lần, kèm mã lỗi', async () => {
    const { publisher, prisma, client } = setup();
    await publisher.reportFailure(row({ error_code: 'UNSUPPORTED_ASSET_TYPE', error: 'File .zip' }));

    expect(client.postReport).toHaveBeenCalledWith(
      `${CANVAS}/reports`,
      expect.objectContaining({ processingProgress: 'Failed', errorCode: 'UNSUPPORTED_ASSET_TYPE' }),
    );
    expect(prisma.essay_submissions.update.mock.calls[0][0].data).toMatchObject({ reported_at: expect.any(Date) });
  });
});
