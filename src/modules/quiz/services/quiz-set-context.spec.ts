import {
  loadCanvasQuizContext,
  loadQuizBuilderContext,
} from './quiz-set-context';

const COURSE = '00000000-0000-0000-0000-000000000001';
const CHAPTER = '00000000-0000-0000-0000-000000000002';

function setup() {
  const prisma = {
    chapters: {
      findMany: jest.fn().mockResolvedValue([
        {
          chapter_id: CHAPTER,
          code: '1',
          title: 'Giới thiệu',
          sort_order: 1,
          chapter_los: [],
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
  return {
    prisma,
    canvas,
    canvasCourses,
    load: (body: Parameters<typeof loadCanvasQuizContext>[1]) =>
      loadCanvasQuizContext({ prisma, canvas, canvasCourses } as never, body),
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

  it('ẩn câu đã RETIRED khỏi danh sách gợi ý ở cả context Canvas và Soạn đề', async () => {
    const { prisma, load } = setup();
    await load({ courseId: COURSE, chapterId: CHAPTER });
    expect(prisma.quiz_items.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'RETIRED' },
        }),
      }),
    );

    await loadQuizBuilderContext(prisma as never, {
      courseId: COURSE,
      loIds: ['00000000-0000-4000-8000-000000000010'],
    });
    expect(prisma.quiz_items.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: 'RETIRED' },
        }),
      }),
    );
  });
});
