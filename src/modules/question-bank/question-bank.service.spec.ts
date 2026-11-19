import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { BffClaims } from '../../auth/bff-claims';
import { BankAccessService } from './bank-access.service';
import { QuestionBankService } from './question-bank.service';

const USER = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';
const COURSE = '00000000-0000-4000-8000-000000000011';
const BANK = '00000000-0000-4000-8000-000000000021';
const LO = '00000000-0000-4000-8000-000000000031';
const QUIZ = '00000000-0000-4000-8000-000000000041';

describe('QuestionBankService', () => {
  const claims: BffClaims = {
    sub: USER,
    courseId: COURSE,
    roles: ['instructor'],
    scope: 'course',
    jti: 'j',
    iat: 0,
    exp: 1,
  };

  function setup() {
    const tx = {
      question_banks: {
        create: jest
          .fn()
          .mockResolvedValue({ bank_id: BANK, title: 'Ngân hàng' }),
        update: jest.fn().mockResolvedValue({
          bank_id: BANK,
          title: 'Ngân hàng mới',
          visibility: 'SUBJECT',
        }),
      },
      quiz_items: {
        create: jest.fn().mockResolvedValue({ quiz_id: QUIZ }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          quiz_id: QUIZ,
          bank_id: BANK,
          status: 'APPROVED',
          origin: 'MANUAL',
          current_version_id: 'v1',
        }),
        update: jest.fn().mockResolvedValue({
          quiz_id: QUIZ,
          status: 'RETIRED',
        }),
      },
      question_bank_shares: {
        upsert: jest.fn().mockResolvedValue({ bank_id: BANK, role: 'USE' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      review_audit_logs: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      ),
      lms_user_mappings: {
        findFirst: jest.fn().mockResolvedValue({ role: 'instructor' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(1),
      },
      course_memberships: {
        findMany: jest.fn().mockResolvedValue([
          {
            course_id: COURSE,
            courses: { subject_code: 'CO3137', deleted_at: null },
          },
        ]),
      },
      courses: {
        findFirst: jest.fn().mockResolvedValue({ subject_code: 'CO3137' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(1),
      },
      learning_outcomes: {
        findFirst: jest.fn().mockResolvedValue({ lo_id: LO }),
      },
      question_banks: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({
          bank_id: BANK,
          title: 'Ngân hàng A',
          owner_id: USER,
          home_course_id: COURSE,
          subject_code: 'CO3137',
          visibility: 'COURSE',
          is_course_default: false,
          question_bank_shares: [],
        }),
      },
      quiz_items: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({
          quiz_id: QUIZ,
          bank_id: BANK,
          status: 'APPROVED',
          current_version_id: 'v1',
          forked_from_version_id: null,
        }),
      },
      quiz_item_versions: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ version_id: 'v1', version_no: 1 }]),
      },
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const access = new BankAccessService(prisma as never);
    const service = new QuestionBankService(
      prisma as never,
      authz as never,
      access,
    );
    return { service, prisma, tx, authz };
  }

  it('listBanks bảo đảm ngân hàng mặc định cho giảng viên khoá, còn learner nhận mảng rỗng', async () => {
    const { service, prisma } = setup();
    prisma.question_banks.findMany.mockResolvedValue([
      {
        bank_id: BANK,
        title: 'Ngân hàng chung · CO3137',
        description: null,
        visibility: 'COURSE',
        is_course_default: true,
        subject_code: 'CO3137',
        owner_id: null,
        home_course_id: COURSE,
        question_bank_shares: [],
        courses: {
          course_id: COURSE,
          name: 'Big Data',
          code: 'LMS-1',
          subject_code: 'CO3137',
        },
        owner: null,
      },
    ]);
    prisma.quiz_items.groupBy.mockResolvedValue([
      { bank_id: BANK, status: 'APPROVED', _count: { _all: 3 } },
      { bank_id: BANK, status: 'RETIRED', _count: { _all: 1 } },
    ]);

    const banks = await service.listBanks(claims, COURSE);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(banks[0]).toMatchObject({
      bank_id: BANK,
      role: 'EDIT',
      relation: 'course',
      is_current_course: true,
      counts: { total: 3, usable: 3, retired: 1 },
    });

    prisma.lms_user_mappings.findFirst.mockResolvedValue({ role: 'learner' });
    prisma.course_memberships.findMany.mockResolvedValue([]);
    await expect(service.listBanks(claims, COURSE)).resolves.toEqual([]);
  });

  it('createBank tạo ngân hàng mới thuộc khoá và chép subject_code', async () => {
    const { service, tx } = setup();
    await service.createBank(claims, {
      courseId: COURSE,
      title: '  Đề ôn tập  ',
      visibility: 'SUBJECT',
    });
    expect(tx.question_banks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Đề ôn tập',
        visibility: 'SUBJECT',
        owner_id: USER,
        home_course_id: COURSE,
        subject_code: 'CO3137',
      }),
    });
    expect(tx.review_audit_logs.create).toHaveBeenCalled();
  });

  it('updateBank chặn người được chia sẻ EDIT đổi visibility và không cho để default bank thành PRIVATE', async () => {
    const { service, prisma } = setup();
    prisma.question_banks.findFirst.mockResolvedValue({
      bank_id: BANK,
      title: 'Của người khác',
      owner_id: OTHER,
      home_course_id: '00000000-0000-4000-8000-000000000099',
      subject_code: 'CO3137',
      visibility: 'PRIVATE',
      is_course_default: false,
      question_bank_shares: [
        { grantee_type: 'USER', grantee_id: USER, role: 'EDIT' },
      ],
    });
    await expect(
      service.updateBank(claims, BANK, { visibility: 'SUBJECT' }),
    ).rejects.toThrow(ForbiddenException);

    prisma.question_banks.findFirst.mockResolvedValue({
      bank_id: BANK,
      title: 'Ngân hàng chung',
      owner_id: null,
      home_course_id: COURSE,
      subject_code: 'CO3137',
      visibility: 'COURSE',
      is_course_default: true,
      question_bank_shares: [],
    });
    await expect(
      service.updateBank(claims, BANK, { visibility: 'PRIVATE' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('listItems mặc định ẩn RETIRED và gắn cờ stale cho lms_links', async () => {
    const { service, prisma } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: QUIZ,
        current_version_id: 'v2',
        question_lms_links: [{ version_id: 'v1', ext_question_id: 'c-1' }],
      },
    ]);
    const res = await service.listItems(claims, BANK, {
      lo: 'L.O.1',
      type: 'MCQ_SINGLE',
      origin: 'MANUAL',
    });
    expect(prisma.quiz_items.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bank_id: BANK,
          status: { not: 'RETIRED' },
          type: 'MCQ_SINGLE',
          origin: 'MANUAL',
          learning_outcomes: { code: 'L.O.1' },
        }),
      }),
    );
    expect(res.items[0].lms_links[0].stale).toBe(true);
  });

  it('createItem chuẩn hoá đáp án qua normalizeAnswerKey, ghi MANUAL + APPROVED và đọc lại version', async () => {
    const { service, tx } = setup();
    await expect(
      service.createItem(claims, BANK, {
        type: 'MCQ_SINGLE',
        question: 'Hỏi?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'Z',
      }),
    ).rejects.toThrow(BadRequestException);

    const created = await service.createItem(claims, BANK, {
      type: 'FILL_BLANK',
      question: 'Spark chạy trên ____.',
      correct_answer: 'JVM',
      loId: LO,
      bloomLevel: 2,
    });
    expect(tx.quiz_items.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bank_id: BANK,
        lesson_id: null,
        origin: 'MANUAL',
        status: 'APPROVED',
        author_id: USER,
        updated_by: USER,
        correct_answer: ['JVM'],
      }),
    });
    expect(created.current_version_id).toBe('v1');
  });

  it('share, unshare, listVersions và retireItem kiểm quyền và ghi audit log', async () => {
    const { service, prisma, tx } = setup();
    await service.share(claims, BANK, {
      granteeType: 'USER',
      granteeId: OTHER,
      role: 'USE',
    });
    expect(tx.question_bank_shares.upsert).toHaveBeenCalled();

    await service.unshare(claims, BANK, {
      granteeType: 'USER',
      granteeId: OTHER,
    });
    expect(tx.question_bank_shares.deleteMany).toHaveBeenCalled();

    const versions = await service.listVersions(claims, QUIZ);
    expect(versions.versions).toHaveLength(1);

    const retired = await service.retireItem(claims, BANK, QUIZ, {});
    expect(retired).toEqual({
      quiz_id: QUIZ,
      status: 'RETIRED',
      updated: true,
    });

    prisma.quiz_items.findFirst.mockResolvedValue(null);
    await expect(service.retireItem(claims, BANK, QUIZ, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createBank/updateBank từ chối SUBJECT khi khoá chưa có mã môn', async () => {
    const { service, prisma } = setup();
    prisma.courses.findFirst.mockResolvedValue({ subject_code: null });
    await expect(
      service.createBank(claims, {
        courseId: COURSE,
        title: 'Theo môn',
        visibility: 'SUBJECT',
      }),
    ).rejects.toThrow(BadRequestException);

    prisma.question_banks.findFirst.mockResolvedValue({
      bank_id: BANK,
      title: 'Ngân hàng A',
      owner_id: USER,
      home_course_id: COURSE,
      subject_code: null,
      visibility: 'COURSE',
      is_course_default: false,
      question_bank_shares: [],
    });
    await expect(
      service.updateBank(claims, BANK, { visibility: 'SUBJECT' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('shareCandidates liệt kê khoá và giảng viên cùng mã môn (trừ khoá gốc và bản thân)', async () => {
    const { service, prisma } = setup();
    const OTHER_COURSE = '00000000-0000-4000-8000-000000000012';
    prisma.courses.findMany.mockResolvedValue([
      {
        course_id: COURSE,
        name: 'Big Data L01',
        course_memberships: [
          {
            role: 'instructor',
            lms_user_mappings: {
              internal_user_id: USER,
              display_name: 'Chính tôi',
              deleted_at: null,
            },
          },
        ],
      },
      {
        course_id: OTHER_COURSE,
        name: 'Big Data L02',
        course_memberships: [
          {
            role: 'instructor',
            lms_user_mappings: {
              internal_user_id: OTHER,
              display_name: 'GV Đồng nghiệp',
              deleted_at: null,
            },
          },
        ],
      },
    ]);
    const res = await service.shareCandidates(claims, BANK);
    expect(res).toEqual({
      subject_code: 'CO3137',
      courses: [{ course_id: OTHER_COURSE, name: 'Big Data L02' }],
      users: [
        {
          user_id: OTHER,
          display_name: 'GV Đồng nghiệp',
          courses: ['Big Data L02'],
        },
      ],
    });
  });

  it('forkItem tạo câu mới không ghi quiz_id, map LO theo mã, giữ câu gốc và ghi audit FORK_QUIZ', async () => {
    const { service, prisma, tx } = setup();
    const OTHER_COURSE = '00000000-0000-4000-8000-000000000012';
    const TARGET_BANK = '00000000-0000-4000-8000-000000000022';
    const TARGET_LO = '00000000-0000-4000-8000-000000000032';

    prisma.question_banks.findFirst
      .mockResolvedValueOnce({
        bank_id: BANK,
        title: 'Nguồn',
        owner_id: OTHER,
        home_course_id: OTHER_COURSE,
        subject_code: 'CO3137',
        visibility: 'SUBJECT',
        question_bank_shares: [],
      })
      .mockResolvedValueOnce({
        bank_id: TARGET_BANK,
        title: 'Đích',
        owner_id: USER,
        home_course_id: COURSE,
        subject_code: 'CO3137',
        visibility: 'PRIVATE',
        question_bank_shares: [],
      });
    prisma.quiz_items.findFirst.mockResolvedValue({
      quiz_id: QUIZ,
      bank_id: BANK,
      course_id: OTHER_COURSE,
      lo_id: LO,
      status: 'PUBLISHED',
      current_version_id: 'v-src-2',
      learning_outcomes: {
        lo_id: LO,
        code: 'L.O.1.1',
        statement_vi: 'Phát biểu cũ',
        deleted_at: null,
      },
      current_version: {
        version_id: 'v-src-2',
        type: 'FILL_BLANK',
        question: 'HDFS viết tắt của ____.',
        options: null,
        correct_answer: ['Hadoop Distributed File System'],
        explanation: 'Giải thích',
        bloom_level: 2,
        source_chunk_ids: [],
      },
    });
    prisma.learning_outcomes.findFirst.mockResolvedValue({
      lo_id: TARGET_LO,
      statement_vi: 'Phát biểu mới hơn ở lớp L01',
    });

    const result = await service.forkItem(claims, BANK, QUIZ, {
      targetBankId: TARGET_BANK,
    });

    const createPayload = tx.quiz_items.create.mock.calls[0][0].data;
    expect(createPayload).not.toHaveProperty('quiz_id');
    expect(createPayload).toMatchObject({
      bank_id: TARGET_BANK,
      course_id: COURSE,
      lesson_id: null,
      lo_id: TARGET_LO,
      status: 'APPROVED',
      origin: 'FORK',
      forked_from_version_id: 'v-src-2',
      author_id: USER,
      updated_by: USER,
    });
    expect(tx.review_audit_logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'FORK_QUIZ',
        raw_changes: expect.objectContaining({
          from: QUIZ,
          from_version: 'v-src-2',
          to_bank: TARGET_BANK,
          lo_mapped: true,
        }),
      }),
    });
    expect(result).toMatchObject({
      source_quiz_id: QUIZ,
      target_bank_id: TARGET_BANK,
      lo_mapped: true,
      unmapped_lo_code: null,
      lo_statement_differs: true,
    });
  });

  it('forkItem để lo_id = NULL và GENERATED_DRAFT khi thiếu LO đích hoặc câu nguồn là nháp, chặn fork cùng ngân hàng', async () => {
    const { service, prisma, tx } = setup();
    const OTHER_COURSE = '00000000-0000-4000-8000-000000000012';
    const TARGET_BANK = '00000000-0000-4000-8000-000000000022';

    await expect(
      service.forkItem(claims, BANK, QUIZ, { targetBankId: BANK }),
    ).rejects.toThrow(BadRequestException);

    prisma.question_banks.findFirst
      .mockResolvedValueOnce({
        bank_id: BANK,
        owner_id: OTHER,
        home_course_id: OTHER_COURSE,
        subject_code: 'CO3137',
        visibility: 'SUBJECT',
        question_bank_shares: [],
      })
      .mockResolvedValueOnce({
        bank_id: TARGET_BANK,
        owner_id: USER,
        home_course_id: COURSE,
        subject_code: 'CO3137',
        visibility: 'COURSE',
        question_bank_shares: [],
      });
    prisma.quiz_items.findFirst.mockResolvedValue({
      quiz_id: QUIZ,
      bank_id: BANK,
      course_id: OTHER_COURSE,
      lo_id: LO,
      status: 'REVIEWING',
      current_version_id: 'v-src-1',
      learning_outcomes: {
        lo_id: LO,
        code: 'L.O.9.9',
        statement_vi: 'LO không có ở khoá đích',
        deleted_at: null,
      },
      current_version: {
        version_id: 'v-src-1',
        type: 'MCQ_SINGLE',
        question: 'Câu nháp?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: null,
        bloom_level: 1,
        source_chunk_ids: [],
      },
    });
    prisma.learning_outcomes.findFirst.mockResolvedValue(null);

    const res = await service.forkItem(claims, BANK, QUIZ, {
      targetBankId: TARGET_BANK,
    });
    expect(tx.quiz_items.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lo_id: null,
        status: 'GENERATED_DRAFT',
        provenance: expect.objectContaining({
          unmapped_lo_code: 'L.O.9.9',
        }),
      }),
    });
    expect(res).toMatchObject({
      lo_mapped: false,
      unmapped_lo_code: 'L.O.9.9',
      lo_statement_differs: false,
    });
  });
});
