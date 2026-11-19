import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { BffClaims } from '../../../auth/bff-claims';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CanvasApiClient } from '../../../integrations/canvas/canvas-api.client';
import { CanvasCourseService } from '../../../integrations/canvas/canvas-course.service';
import {
  classifyModule,
  resolveChapterCode,
} from '../../../integrations/canvas/canvas-placement';
import {
  atLeast,
  BankAccessService,
} from '../../question-bank/bank-access.service';
import {
  normalizeLoStatement,
  USABLE_STATUSES,
} from '../../question-bank/question-bank.service';
import { settingsView } from '../domain/quiz-set-exam';
import type { QuizSnapshotItem } from '../quiz.types';

type LoEntry = {
  lo_id: string;
  code: string;
  statement_vi: string;
  bloom_level: number | null;
  is_current?: boolean;
};

type BankMeta = {
  bank_id: string;
  title: string;
  home_course_id: string;
  home_course_name: string;
  is_course_default: boolean;
  is_current_course: boolean;
  role: 'VIEW' | 'USE' | 'EDIT';
};

export type LoMappingInfo =
  | { status: 'matched' }
  | {
      status: 'statement_differs';
      source_lo_code: string;
      source_statement_vi: string;
      target_statement_vi: string;
    };

async function loadUsableQuizItems(
  deps: { prisma: PrismaService; bankAccess: BankAccessService },
  claims: BffClaims,
  courseId: string,
  selectedLos: LoEntry[],
  allCourseLos: LoEntry[],
  take: number,
) {
  const usable = await deps.bankAccess.accessibleBanks(claims, 'USE');
  const banksMeta: BankMeta[] = usable.map(({ bank, role }) => ({
    bank_id: bank.bank_id,
    title: bank.title,
    home_course_id: bank.home_course_id,
    home_course_name: bank.courses.name,
    is_course_default: bank.is_course_default,
    is_current_course: bank.home_course_id === courseId,
    role,
  }));
  const bankById = new Map(banksMeta.map((b) => [b.bank_id, b]));
  const usableIds = banksMeta.map((b) => b.bank_id);
  const foreignIds = banksMeta
    .filter((b) => !b.is_current_course)
    .map((b) => b.bank_id);

  if (!usableIds.length || !selectedLos.length) {
    return {
      banks: banksMeta.map(({ role: _role, ...rest }) => rest),
      quizItems: [],
      unmappedForeignItems: [],
    };
  }

  const selectedLoByCode = new Map<string, LoEntry>();
  for (const lo of selectedLos) {
    const prev = selectedLoByCode.get(lo.code);
    if (!prev || (!prev.is_current && lo.is_current)) {
      selectedLoByCode.set(lo.code, lo);
    }
  }
  const courseLoByCode = new Map<string, LoEntry>();
  for (const lo of allCourseLos) {
    const prev = courseLoByCode.get(lo.code);
    if (!prev || (!prev.is_current && lo.is_current)) {
      courseLoByCode.set(lo.code, lo);
    }
  }

  const [localRows, foreignRows] = await Promise.all([
    deps.prisma.quiz_items.findMany({
      where: {
        bank_id: { in: usableIds },
        course_id: courseId,
        lo_id: { in: selectedLos.map((lo) => lo.lo_id) },
        status: { not: 'RETIRED' },
        deleted_at: null,
      },
      include: {
        learning_outcomes: {
          select: {
            lo_id: true,
            code: true,
            statement_vi: true,
            deleted_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take,
    }),
    foreignIds.length
      ? deps.prisma.quiz_items.findMany({
          where: {
            bank_id: { in: foreignIds },
            course_id: { not: courseId },
            status: { in: USABLE_STATUSES },
            deleted_at: null,
          },
          include: {
            learning_outcomes: {
              select: {
                lo_id: true,
                code: true,
                statement_vi: true,
                deleted_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take,
        })
      : Promise.resolve([]),
  ]);

  const serializeBank = (b: BankMeta) => ({
    bank_id: b.bank_id,
    title: b.title,
    home_course_id: b.home_course_id,
    home_course_name: b.home_course_name,
    is_course_default: b.is_course_default,
    is_current_course: b.is_current_course,
  });

  const mappedLocal = localRows.map((item) => {
    const meta = bankById.get(item.bank_id);
    return {
      ...item,
      source_lo_id: item.lo_id,
      foreign: false,
      can_edit: atLeast(meta?.role ?? null, 'EDIT'),
      bank: meta ? serializeBank(meta) : null,
      lo_mapping: { status: 'matched' } as LoMappingInfo,
    };
  });

  const mappedForeign: typeof mappedLocal = [];
  const unmappedForeignItems: Array<{
    quiz_id: string;
    question: string;
    type: string;
    bloom_level: number | null;
    bank: ReturnType<typeof serializeBank> | null;
    source_lo_code: string | null;
    source_statement_vi: string | null;
  }> = [];

  for (const item of foreignRows) {
    const meta = bankById.get(item.bank_id);
    const sourceLo =
      item.learning_outcomes && !item.learning_outcomes.deleted_at
        ? item.learning_outcomes
        : null;
    const targetSelected = sourceLo
      ? (selectedLoByCode.get(sourceLo.code) ?? null)
      : null;
    const targetInCourse = sourceLo
      ? (courseLoByCode.get(sourceLo.code) ?? null)
      : null;

    if (targetSelected) {
      const differs =
        normalizeLoStatement(sourceLo!.statement_vi) !==
        normalizeLoStatement(targetSelected.statement_vi);
      const loMapping: LoMappingInfo = differs
        ? {
            status: 'statement_differs',
            source_lo_code: sourceLo!.code,
            source_statement_vi: sourceLo!.statement_vi,
            target_statement_vi: targetSelected.statement_vi,
          }
        : { status: 'matched' };
      mappedForeign.push({
        ...item,
        source_lo_id: item.lo_id,
        lo_id: targetSelected.lo_id,
        learning_outcomes: {
          lo_id: targetSelected.lo_id,
          code: targetSelected.code,
          statement_vi: targetSelected.statement_vi,
          deleted_at: null,
        },
        foreign: true,
        can_edit: atLeast(meta?.role ?? null, 'EDIT'),
        bank: meta ? serializeBank(meta) : null,
        lo_mapping: loMapping,
      });
    } else if (!targetInCourse) {
      unmappedForeignItems.push({
        quiz_id: item.quiz_id,
        question: item.question,
        type: item.type,
        bloom_level: item.bloom_level,
        bank: meta ? serializeBank(meta) : null,
        source_lo_code: sourceLo?.code ?? null,
        source_statement_vi: sourceLo?.statement_vi ?? null,
      });
    }
  }

  return {
    banks: banksMeta.map(serializeBank),
    quizItems: [...mappedLocal, ...mappedForeign].slice(0, take),
    unmappedForeignItems,
  };
}

export async function loadCanvasQuizContext(
  deps: {
    prisma: PrismaService;
    canvas: CanvasApiClient;
    canvasCourses: CanvasCourseService;
    bankAccess: BankAccessService;
  },
  claims: BffClaims,
  body: { courseId: string; moduleId?: string | null; chapterId?: string },
) {
  const { prisma, canvas, canvasCourses, bankAccess } = deps;
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
  const allCourseLos = chapters.flatMap((c) =>
    c.chapter_los.map((l) => l.learning_outcomes).filter((l) => !l.deleted_at),
  );
  const learningOutcomes = (chapter?.chapter_los ?? [])
    .map((l) => l.learning_outcomes)
    .filter((l) => !l.deleted_at)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const [{ quizItems }, documents] = chapter
    ? await Promise.all([
        loadUsableQuizItems(
          { prisma, bankAccess },
          claims,
          body.courseId,
          learningOutcomes,
          allCourseLos,
          200,
        ),
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
    : [{ quizItems: [] }, []];
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
  deps: { prisma: PrismaService; bankAccess: BankAccessService },
  claims: BffClaims,
  body: { courseId: string; loIds?: string[] },
) {
  const { prisma, bankAccess } = deps;
  const loIds = Array.isArray(body.loIds)
    ? body.loIds.filter(isUuid).slice(0, 200)
    : [];
  const [chapters, documents, sets] = await Promise.all([
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
  ]);
  const allCourseLos = chapters.flatMap((c) =>
    c.chapter_los
      .map((l) => l.learning_outcomes)
      .filter((lo) => !lo.deleted_at),
  );
  const loIdSet = new Set(loIds);
  const selectedLos = allCourseLos.filter((lo) => loIdSet.has(lo.lo_id));
  const { banks, quizItems, unmappedForeignItems } = await loadUsableQuizItems(
    { prisma, bankAccess },
    claims,
    body.courseId,
    selectedLos,
    allCourseLos,
    500,
  );
  const chapterCode = new Map(chapters.map((c) => [c.chapter_id, c.code]));
  return {
    chapters: chapters.map((c) => ({
      chapter_id: c.chapter_id,
      code: c.code,
      title: c.title,
      learningOutcomes: c.chapter_los
        .map((l) => l.learning_outcomes)
        .filter((lo) => !lo.deleted_at)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true }),
        )
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
    banks,
    unmappedForeignItems,
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
