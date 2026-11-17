import { BadRequestException, NotFoundException } from '@nestjs/common';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CanvasApiClient } from '../../../integrations/canvas/canvas-api.client';
import { CanvasCourseService } from '../../../integrations/canvas/canvas-course.service';
import {
  classifyModule,
  resolveChapterCode,
} from '../../../integrations/canvas/canvas-placement';
import { settingsView } from '../domain/quiz-set-exam';
import type { QuizSnapshotItem } from '../quiz.types';

export async function loadCanvasQuizContext(
  deps: {
    prisma: PrismaService;
    canvas: CanvasApiClient;
    canvasCourses: CanvasCourseService;
  },
  body: { courseId: string; moduleId?: string | null; chapterId?: string },
) {
  const { prisma, canvas, canvasCourses } = deps;
  // Mở từ trang Assignment thì Canvas không gắn module nào: bài tập được tạo
  // ngoài module và giảng viên tự chọn chương. Có moduleId thì phải là id số.
  const moduleId = body.moduleId ? String(body.moduleId) : null;
  if (moduleId !== null && !/^\d+$/.test(moduleId))
    throw new BadRequestException('Module Canvas không hợp lệ.');
  const [modules, chapters, sessions] = await Promise.all([
    moduleId
      ? canvas.listModules(await canvasCourses.contextId(body.courseId))
      : Promise.resolve([]),
    prisma.chapters.findMany({
      where: { course_id: body.courseId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      include: { chapter_los: { include: { learning_outcomes: true } } },
    }),
    prisma.course_sessions.findMany({
      where: { course_id: body.courseId },
      include: { chapters: true },
    }),
  ]);
  const module = moduleId
    ? modules.find((item) => String(item.id) === moduleId)
    : null;
  if (moduleId && !module)
    throw new NotFoundException('Module không thuộc khóa Canvas hiện tại.');
  const ref = module ? classifyModule(module.name).chapterRef : null;
  const code =
    ref &&
    resolveChapterCode(
      ref,
      sessions.map((s) => ({
        session_no: s.session_no,
        chapter_code: s.chapters?.code ?? null,
      })),
      new Set(chapters.map((c) => c.code)),
    );
  const chapter = body.chapterId
    ? chapters.find((c) => c.chapter_id === body.chapterId)
    : chapters.find((c) => c.code === code);
  if (body.chapterId && !chapter)
    throw new BadRequestException('Chương không thuộc khóa học.');
  const learningOutcomes = (chapter?.chapter_los ?? [])
    .map((l) => l.learning_outcomes)
    .filter((l) => !l.deleted_at)
    .sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
  const [quizItems, documents] = chapter
    ? await Promise.all([
        prisma.quiz_items.findMany({
          where: {
            course_id: body.courseId,
            lo_id: { in: learningOutcomes.map((l) => l.lo_id) },
            deleted_at: null,
          },
          include: { learning_outcomes: { select: { code: true } } },
          orderBy: { created_at: 'desc' },
          take: 200,
        }),
        prisma.documents.findMany({
          where: {
            course_id: body.courseId,
            chapter_code: chapter.code,
            role: 'lecture',
            deleted_at: null,
          },
          select: { document_id: true, title: true, status: true },
        }),
      ])
    : [[], []];
  // Dùng lại được mọi đề của khóa: đề giữa kỳ nhiều chương thường được thêm
  // vào một module riêng, không khớp chương nào. Đề của chương đang mở lên đầu.
  const sets = await prisma.quiz_sets.findMany({
    where: { course_id: body.courseId, deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  const chapterCode = new Map(chapters.map((c) => [c.chapter_id, c.code]));
  const covers = (set: { chapter_ids: string[] }) =>
    Boolean(chapter && set.chapter_ids.includes(chapter.chapter_id));
  return {
    module: module ? { id: String(module.id), name: module.name } : null,
    chapters: chapters.map(({ chapter_id, code, title }) => ({
      chapter_id,
      code,
      title,
    })),
    chapter: chapter
      ? {
          chapter_id: chapter.chapter_id,
          code: chapter.code,
          title: chapter.title,
        }
      : null,
    learningOutcomes,
    quizItems,
    documents,
    quizSets: [...sets.filter(covers), ...sets.filter((s) => !covers(s))].map(
      (set) => ({
        quiz_set_id: set.quiz_set_id,
        title: set.title,
        created_at: set.created_at,
        questionCount: (set.items as unknown as QuizSnapshotItem[]).length,
        settings: settingsView(set),
        chapterCodes: set.chapter_ids.flatMap((id) => {
          const c = chapterCode.get(id);
          return c ? [c] : [];
        }),
      }),
    ),
  };
}

export async function loadQuizBuilderContext(
  prisma: PrismaService,
  body: { courseId: string; loIds?: string[] },
) {
  const loIds = Array.isArray(body.loIds) ? body.loIds.filter(isUuid).slice(0, 200) : [];
  const [chapters, documents, sets, quizItems] = await Promise.all([
    prisma.chapters.findMany({
      where: { course_id: body.courseId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      include: { chapter_los: { include: { learning_outcomes: true } } },
    }),
    prisma.documents.findMany({
      where: { course_id: body.courseId, deleted_at: null },
      select: {
        document_id: true,
        title: true,
        role: true,
        chapter_code: true,
        status: true,
        _count: { select: { chunks: { where: { deleted_at: null } } } },
      },
      orderBy: [{ chapter_code: 'asc' }, { title: 'asc' }],
    }),
    prisma.quiz_sets.findMany({
      where: { course_id: body.courseId, deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 50,
    }),
    loIds.length
      ? prisma.quiz_items.findMany({
          where: { course_id: body.courseId, lo_id: { in: loIds }, deleted_at: null },
          include: { learning_outcomes: { select: { code: true } } },
          orderBy: { created_at: 'desc' },
          take: 500,
        })
      : Promise.resolve([]),
  ]);
  const chapterCode = new Map(chapters.map((c) => [c.chapter_id, c.code]));
  return {
    chapters: chapters.map((c) => ({
      chapter_id: c.chapter_id,
      code: c.code,
      title: c.title,
      learningOutcomes: c.chapter_los
        .map((l) => l.learning_outcomes)
        .filter((lo) => !lo.deleted_at)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
        .map((lo) => ({
          lo_id: lo.lo_id,
          code: lo.code,
          statement_vi: lo.statement_vi,
          bloom_level: lo.bloom_level,
        })),
    })),
    documents: documents.map(({ _count, ...doc }) => ({
      ...doc,
      ready: _count.chunks > 0,
    })),
    quizItems,
    quizSets: sets.map((set) => ({
      quiz_set_id: set.quiz_set_id,
      title: set.title,
      created_at: set.created_at,
      questionCount: (set.items as unknown as QuizSnapshotItem[]).length,
      settings: settingsView(set),
      chapterCodes: set.chapter_ids.flatMap((id) => {
        const code = chapterCode.get(id);
        return code ? [code] : [];
      }),
    })),
  };
}

