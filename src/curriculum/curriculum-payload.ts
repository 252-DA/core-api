import { isWithinCodePoints } from '../common/utils/text-length';
import { isPlainObject } from '../common/utils/type-guards';
import { isUuid } from '../common/utils/uuid';
import { InvalidWorkerResultError } from '../messaging/worker-results/worker-result-envelope';

/**
 * Bản đề cương chuẩn hoá worker gửi trong CURRICULUM_IMPORT_RESULT
 * (contracts/integration-events/v1/curriculum-import-result.json,
 * definitions.curriculum; worker: curriculum_payload() trong
 * worker/worker/use_cases/curriculum_import.py). Lưu nguyên vào
 * curriculum_imports.curriculum; curriculum-writer.ts ghi nó khi áp dụng.
 */
export type Provenance = 'extracted' | 'inferred' | 'confirmed';

interface SourceColumns {
  source_section: string | null;
  source_page: number | null;
}

export interface CurriculumCourse {
  code: string;
  title_vi: string;
  title_en: string | null;
  credits: number | null;
  semester: string | null;
  syllabus_version: string | null;
  lo_year: string | null;
}

export interface CurriculumChapter extends SourceColumns {
  code: string;
  title: string;
  title_en: string | null;
  order_index: number;
  topics: string[];
}

export interface CurriculumLearningOutcome extends SourceColumns {
  code: string;
  parent_code: string | null;
  statement_vi: string;
  statement_en: string | null;
  bloom_level: number | null;
  bloom_provenance: Provenance;
  cdio_level: 'I' | 'II' | 'III' | null;
  cdio_provenance: Provenance;
}

export interface CurriculumChapterLoLink extends SourceColumns {
  chapter_code: string;
  lo_code: string;
  provenance: Provenance;
}

export interface CurriculumGoal extends SourceColumns {
  code: string;
  statement_vi: string;
  statement_en: string | null;
}

export interface CurriculumSession extends SourceColumns {
  order_index: number;
  session_no: number | null;
  chapter_code: string | null;
  title_vi: string;
  title_en: string | null;
}

export interface CurriculumAssessment extends SourceColumns {
  code: string;
  parent_code: string | null;
  name_vi: string;
  name_en: string | null;
  activity_type: string | null;
  category: string;
  weight: number | null;
  weight_provenance: Provenance;
}

export interface CurriculumLoAssessmentLink extends SourceColumns {
  lo_code: string;
  assessment_code: string;
  row_order_index: number | null;
  chapter_code: string | null;
  provenance: Provenance;
}

export interface CurriculumIssue extends SourceColumns {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source_locator: string | null;
}

export interface NormalizedCurriculum {
  course: CurriculumCourse;
  source_document_id: string | null;
  chapters: CurriculumChapter[];
  learning_outcomes: CurriculumLearningOutcome[];
  chapter_lo_links: CurriculumChapterLoLink[];
  goals: CurriculumGoal[];
  sessions: CurriculumSession[];
  assessments: CurriculumAssessment[];
  lo_assessment_links: CurriculumLoAssessmentLink[];
  issues: CurriculumIssue[];
}

export type CurriculumImportResultPayload =
  | {
      import_id: string;
      status: 'READY' | 'BLOCKED';
      preview: Record<string, unknown> & { blocking: boolean };
      curriculum: NormalizedCurriculum;
      error: null;
    }
  | {
      import_id: string;
      status: 'FAILED';
      preview: null;
      curriculum: null;
      error: string;
    };

// --- Kiểm dạng ---------------------------------------------------------------
// Bảng kiểu theo từng loại phần tử, chép đúng schema hợp đồng; kiểm ở đây để
// payload sai thành InvalidWorkerResultError (không retry) thay vì lỗi DB lúc
// áp dụng.

type FieldKind =
  | 'code'
  | 'text'
  | 'optText'
  | 'int'
  | 'optInt'
  | 'optNumber'
  | 'provenance'
  | 'severity'
  | 'bloom'
  | 'cdio'
  | 'textArray';
type RowSpec = Record<string, FieldKind>;

const SOURCE: RowSpec = { source_section: 'optText', source_page: 'optInt' };
const COURSE_SPEC: RowSpec = {
  code: 'code',
  title_vi: 'text',
  title_en: 'optText',
  credits: 'optInt',
  semester: 'optText',
  syllabus_version: 'optText',
  lo_year: 'optText',
};
const LIST_SPECS: Record<string, RowSpec> = {
  chapters: {
    code: 'code',
    title: 'text',
    title_en: 'optText',
    order_index: 'int',
    topics: 'textArray',
    ...SOURCE,
  },
  learning_outcomes: {
    code: 'code',
    parent_code: 'optText',
    statement_vi: 'text',
    statement_en: 'optText',
    bloom_level: 'bloom',
    bloom_provenance: 'provenance',
    cdio_level: 'cdio',
    cdio_provenance: 'provenance',
    ...SOURCE,
  },
  chapter_lo_links: {
    chapter_code: 'code',
    lo_code: 'code',
    provenance: 'provenance',
    ...SOURCE,
  },
  goals: {
    code: 'code',
    statement_vi: 'text',
    statement_en: 'optText',
    ...SOURCE,
  },
  sessions: {
    order_index: 'int',
    session_no: 'optInt',
    chapter_code: 'optText',
    title_vi: 'text',
    title_en: 'optText',
    ...SOURCE,
  },
  assessments: {
    code: 'code',
    parent_code: 'optText',
    name_vi: 'text',
    name_en: 'optText',
    activity_type: 'optText',
    category: 'text',
    weight: 'optNumber',
    weight_provenance: 'provenance',
    ...SOURCE,
  },
  lo_assessment_links: {
    lo_code: 'code',
    assessment_code: 'code',
    row_order_index: 'optInt',
    chapter_code: 'optText',
    provenance: 'provenance',
    ...SOURCE,
  },
  issues: {
    code: 'code',
    severity: 'severity',
    message: 'text',
    source_locator: 'optText',
    ...SOURCE,
  },
};
const CURRICULUM_KEYS = new Set([
  'course',
  'source_document_id',
  ...Object.keys(LIST_SPECS),
]);
const PROVENANCES = new Set(['extracted', 'inferred', 'confirmed']);
const SEVERITIES = new Set(['error', 'warning', 'info']);
const CDIO_LEVELS = new Set(['I', 'II', 'III']);
const MAX_ERROR = 2000;
const MAX_PROBLEMS = 20;

function fieldOk(kind: FieldKind, value: unknown): boolean {
  switch (kind) {
    case 'code':
      return typeof value === 'string' && value.length > 0;
    case 'text':
      return typeof value === 'string';
    case 'optText':
      return value === null || typeof value === 'string';
    case 'int':
      return Number.isSafeInteger(value);
    case 'optInt':
      return value === null || Number.isSafeInteger(value);
    case 'optNumber':
      return (
        value === null || (typeof value === 'number' && Number.isFinite(value))
      );
    case 'provenance':
      return typeof value === 'string' && PROVENANCES.has(value);
    case 'severity':
      return typeof value === 'string' && SEVERITIES.has(value);
    case 'bloom':
      return (
        value === null ||
        (Number.isInteger(value) &&
          (value as number) >= 1 &&
          (value as number) <= 6)
      );
    case 'cdio':
      return (
        value === null || (typeof value === 'string' && CDIO_LEVELS.has(value))
      );
    case 'textArray':
      return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }
}

function checkRow(
  path: string,
  value: unknown,
  spec: RowSpec,
  problems: string[],
) {
  if (!isPlainObject(value)) {
    problems.push(`${path} must be an object`);
    return;
  }
  for (const key of Object.keys(value)) {
    if (!(key in spec)) problems.push(`${path}.${key} is not allowed`);
  }
  for (const [key, kind] of Object.entries(spec)) {
    if (!(key in value)) problems.push(`${path}.${key} is required`);
    else if (!fieldOk(kind, value[key]))
      problems.push(`${path}.${key} must be ${kind}`);
  }
}

/** Danh sách chỗ sai (rỗng = đúng dạng). Dùng cả khi nhận kết quả lẫn khi áp dụng. */
export function curriculumProblems(value: unknown): string[] {
  const problems: string[] = [];
  if (!isPlainObject(value)) return ['curriculum must be an object'];
  for (const key of Object.keys(value)) {
    if (!CURRICULUM_KEYS.has(key))
      problems.push(`curriculum.${key} is not allowed`);
  }
  checkRow('curriculum.course', value.course, COURSE_SPEC, problems);
  if (!fieldOk('optText', value.source_document_id)) {
    problems.push('curriculum.source_document_id must be optText');
  }
  for (const [list, spec] of Object.entries(LIST_SPECS)) {
    const rows = value[list];
    if (!Array.isArray(rows)) {
      problems.push(`curriculum.${list} must be an array`);
      continue;
    }
    rows.forEach((row, i) =>
      checkRow(`curriculum.${list}[${i}]`, row, spec, problems),
    );
  }
  return problems.slice(0, MAX_PROBLEMS);
}

/** Đề cương còn lỗi chặn (issue severity error) thì không được ghi. */
export function hasBlockingIssues(curriculum: NormalizedCurriculum): boolean {
  return curriculum.issues.some((issue) => issue.severity === 'error');
}

/**
 * Kiểm payload CURRICULUM_IMPORT_RESULT; sai thì ném InvalidWorkerResultError
 * liệt kê chỗ sai. Ngoài dạng còn kiểm nhất quán: BLOCKED ⇔ preview.blocking ⇔
 * đề cương có issue severity error — cổng duyệt cấu trúc dựa vào đó.
 */
export function parseCurriculumImportResult(
  payload: Record<string, unknown>,
  resultId: string,
): CurriculumImportResultPayload {
  const problems: string[] = [];
  const allowed = new Set([
    'import_id',
    'status',
    'preview',
    'curriculum',
    'error',
  ]);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) problems.push(`${key} is not allowed`);
  }
  for (const key of allowed) {
    if (!(key in payload)) problems.push(`${key} is required`);
  }
  const { import_id, status, preview, curriculum, error } = payload;
  if (!isUuid(import_id)) {
    problems.push('import_id must be a UUID');
  }
  if (status === 'FAILED') {
    if (preview !== null) problems.push('preview must be null when FAILED');
    if (curriculum !== null)
      problems.push('curriculum must be null when FAILED');
    if (
      typeof error !== 'string' ||
      error.length === 0 ||
      !isWithinCodePoints(error, MAX_ERROR)
    ) {
      problems.push(
        `error must be a non-empty string of at most ${MAX_ERROR} chars when FAILED`,
      );
    }
  } else if (status === 'READY' || status === 'BLOCKED') {
    if (error !== null) problems.push(`error must be null when ${status}`);
    if (!isPlainObject(preview) || typeof preview.blocking !== 'boolean') {
      problems.push('preview must be an object with a boolean blocking');
    } else if (preview.blocking !== (status === 'BLOCKED')) {
      problems.push(`preview.blocking contradicts status ${status}`);
    }
    const shape = curriculumProblems(curriculum);
    problems.push(...shape);
    if (
      shape.length === 0 &&
      hasBlockingIssues(curriculum as NormalizedCurriculum) !==
        (status === 'BLOCKED')
    ) {
      problems.push(`curriculum issues contradict status ${status}`);
    }
  } else {
    problems.push('status must be READY, BLOCKED or FAILED');
  }

  if (problems.length) {
    throw new InvalidWorkerResultError(
      `invalid CURRICULUM_IMPORT_RESULT ${resultId}: ${problems.slice(0, MAX_PROBLEMS).join('; ')}`,
    );
  }
  return payload as unknown as CurriculumImportResultPayload;
}
