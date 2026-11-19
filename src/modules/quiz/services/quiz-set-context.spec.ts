import { BankAccessService } from '../../question-bank/bank-access.service';
import {
  loadCanvasQuizContext,
  loadQuizBuilderContext,
} from './quiz-set-context';

const COURSE = '00000000-0000-0000-0000-000000000001';
const CHAPTER = '00000000-0000-0000-0000-000000000002';
const USER = '00000000-0000-0000-0000-000000000003';
const BANK_LOCAL = '00000000-0000-0000-0000-000000000011';
const LO_LOCAL = '00000000-0000-4000-8000-000000000010';
const claims = {
  sub: USER,
  courseId: COURSE,
  roles: ['instructor'],
  scope: 'course' as const,
  jti: 'j1',
  iat: 0,
  exp: 1,
};

function setup() {
  const prisma = {
    chapters: {
      findMany: jest.fn().mockResolvedValue([
        {
          chapter_id: CHAPTER,
          code: '1',
          title: 'Giới thiệu',
          sort_order: 1,
          chapter_los: [
            {
              lo_id: LO_LOCAL,
              learning_outcomes: {
                lo_id: LO_LOCAL,
                code: 'L.O.1.1',
                statement_vi: 'Hiểu MapReduce và HDFS',
                bloom_level: 2,
                is_current: true,
                deleted_at: null,
              },
            },
          ],
        },
      ]),
    },
    course_sessions: { findMany: jest.fn().mockResolvedValue([]) },
    quiz_items: { findMany: jest.fn().mockResolvedValue([]) },
    documents: { findMany: jest.fn().mockResolvedValue([]) },
    quiz_sets: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const canvas = {
    listModules: jest.fn().mockResolvedValue([{ id: 17, name: 'Chương 1' }]),
  };
  const canvasCourses = { contextId: jest.fn().mockResolvedValue('8') };
  const bankAccess = {
    accessibleBanks: jest.fn().mockResolvedValue([
      {
        bank: {
          bank_id: BANK_LOCAL,
          title: 'Ngân hàng chung',
          home_course_id: COURSE,
          is_course_default: true,
          courses: { name: 'Big Data L01' },
        },
        role: 'EDIT' as const,
        relation: 'course' as const,
      },
    ]),
  } as unknown as BankAccessService;
  return {
    prisma,
    canvas,
    canvasCourses,
    bankAccess,
    load: (body: Parameters<typeof loadCanvasQuizContext>[2]) =>
      loadCanvasQuizContext(
        { prisma, canvas, canvasCourses, bankAccess } as never,
        claims,
        body,
      ),
  };
}

describe('loadCanvasQuizContext', () => {
  it('dùng module của Canvas để gợi ý chương', async () => {
    const { load } = setup();
    const result = await load({ courseId: COURSE, moduleId: '17' });
    expect(result.module).toEqual({ id: '17', name: 'Chương 1' });
    expect(result.chapter).toMatchObject({ chapter_id: CHAPTER });
  });

  it('mở từ trang Assignment không có module: không gọi Canvas, giảng viên tự chọn chương', async () => {
    const { load, canvas, canvasCourses } = setup();
    const result = await load({ courseId: COURSE });
    expect(result.module).toBeNull();
    expect(result.chapter).toBeNull();
    expect(result.chapters).toHaveLength(1);
    expect(canvas.listModules).not.toHaveBeenCalled();
    expect(canvasCourses.contextId).not.toHaveBeenCalled();
  });

  it('vẫn nhận chương giảng viên chọn khi không có module', async () => {
    const { load } = setup();
    const result = await load({
      courseId: COURSE,
      moduleId: null,
      chapterId: CHAPTER,
    });
    expect(result.module).toBeNull();
    expect(result.chapter).toMatchObject({ chapter_id: CHAPTER });
  });

  it('module không phải id số bị từ chối, module lạ khóa khác không tìm thấy', async () => {
    const { load } = setup();
    await expect(load({ courseId: COURSE, moduleId: 'abc' })).rejects.toThrow(
      'không hợp lệ',
    );
    await expect(load({ courseId: COURSE, moduleId: '99' })).rejects.toThrow(
      'không thuộc khóa',
    );
  });

  it('ẩn câu đã RETIRED và lọc theo ngân hàng >= USE (không lấy PRIVATE người khác)', async () => {
    const { prisma, bankAccess, load } = setup();
    await load({ courseId: COURSE, chapterId: CHAPTER });
    expect(prisma.quiz_items.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bank_id: { in: [BANK_LOCAL] },
          status: { not: 'RETIRED' },
        }),
      }),
    );

    await loadQuizBuilderContext({ prisma, bankAccess } as never, claims, {
      courseId: COURSE,
      loIds: [LO_LOCAL],
    });
    expect(prisma.quiz_items.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bank_id: { in: [BANK_LOCAL] },
          status: { not: 'RETIRED' },
        }),
      }),
    );
  });

  it('map LO khác khoá: khớp, cảnh báo khác phát biểu, và đưa câu thiếu LO vào unmappedForeignItems', async () => {
    const OTHER_COURSE = '00000000-0000-0000-0000-000000000099';
    const BANK_FOREIGN = '00000000-0000-0000-0000-000000000022';
    const LO_OTHER_MATCH = '00000000-0000-4000-8000-000000000051';
    const LO_OTHER_DIFF = '00000000-0000-4000-8000-000000000052';
    const LO_OTHER_MISSING = '00000000-0000-4000-8000-000000000053';
    const { prisma, bankAccess } = setup();
    (bankAccess.accessibleBanks as jest.Mock).mockResolvedValue([
      {
        bank: {
          bank_id: BANK_LOCAL,
          title: 'Ngân hàng lớp này',
          home_course_id: COURSE,
          is_course_default: true,
          courses: { name: 'Lớp L01' },
        },
        role: 'EDIT',
        relation: 'course',
      },
      {
        bank: {
          bank_id: BANK_FOREIGN,
          title: 'Ngân hàng cùng môn L02',
          home_course_id: OTHER_COURSE,
          is_course_default: true,
          courses: { name: 'Lớp L02' },
        },
        role: 'USE',
        relation: 'subject',
      },
    ]);
    prisma.quiz_items.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        quiz_id: 'q-match',
        bank_id: BANK_FOREIGN,
        course_id: OTHER_COURSE,
        lo_id: LO_OTHER_MATCH,
        question: 'Câu khớp LO?',
        type: 'MCQ_SINGLE',
        bloom_level: 2,
        learning_outcomes: {
          lo_id: LO_OTHER_MATCH,
          code: 'L.O.1.1',
          statement_vi: '  Hiểu   MapReduce và HDFS ',
          deleted_at: null,
        },
      },
      {
        quiz_id: 'q-diff',
        bank_id: BANK_FOREIGN,
        course_id: OTHER_COURSE,
        lo_id: LO_OTHER_DIFF,
        question: 'Câu khác phát biểu?',
        type: 'MCQ_SINGLE',
        bloom_level: 2,
        learning_outcomes: {
          lo_id: LO_OTHER_DIFF,
          code: 'L.O.1.1',
          statement_vi: 'Hiểu Spark Streaming (CTĐT 2024)',
          deleted_at: null,
        },
      },
      {
        quiz_id: 'q-missing',
        bank_id: BANK_FOREIGN,
        course_id: OTHER_COURSE,
        lo_id: LO_OTHER_MISSING,
        question: 'Câu thiếu LO ở lớp đích?',
        type: 'MCQ_SINGLE',
        bloom_level: 3,
        learning_outcomes: {
          lo_id: LO_OTHER_MISSING,
          code: 'L.O.9.9',
          statement_vi: 'LO không tồn tại ở lớp L01',
          deleted_at: null,
        },
      },
    ]);

    const res = await loadQuizBuilderContext(
      { prisma, bankAccess } as never,
      claims,
      { courseId: COURSE, loIds: [LO_LOCAL] },
    );

    expect(res.banks).toHaveLength(2);
    expect(res.quizItems).toHaveLength(2);
    expect(res.quizItems[0]).toMatchObject({
      quiz_id: 'q-match',
      lo_id: LO_LOCAL,
      source_lo_id: LO_OTHER_MATCH,
      foreign: true,
      can_edit: false,
      lo_mapping: { status: 'matched' },
    });
    expect(res.quizItems[1]).toMatchObject({
      quiz_id: 'q-diff',
      lo_id: LO_LOCAL,
      foreign: true,
      can_edit: false,
      lo_mapping: {
        status: 'statement_differs',
        source_lo_code: 'L.O.1.1',
        source_statement_vi: 'Hiểu Spark Streaming (CTĐT 2024)',
        target_statement_vi: 'Hiểu MapReduce và HDFS',
      },
    });
    expect(res.unmappedForeignItems).toEqual([
      expect.objectContaining({
        quiz_id: 'q-missing',
        source_lo_code: 'L.O.9.9',
      }),
    ]);
  });
});
