import { Prisma } from '@prisma/client';
import { errorMessage } from '../common/utils/errors';
import {
  clipCodePoints,
  isWithinCodePoints,
} from '../common/utils/text-length';
import { isPlainObject } from '../common/utils/type-guards';
import { isUuid } from '../common/utils/uuid';
import {
  isQuestionType,
  normalizeAnswerKey,
  TRUE_FALSE_OPTIONS,
  type QuestionType,
} from '../question/question-types';

/**
 * Học liệu AI sinh ra (quiz_items, lesson_cards) do worker gửi về: kiểm dạng
 * và ghi. Dùng chung cho mọi kết quả worker mang câu/card (CONTENT_GENERATION_RESULT,
 * và ENRICHMENT_CONTENT_RESULT nếu muốn), để mọi đường ghi học liệu AI có
 * cùng một luật:
 *
 * - một lesson cho mỗi (course_id, lo_id), tạo ở DRAFT nếu chưa có;
 * - upsert theo id tất định của worker; chỉ ghi đè bản còn GENERATED_DRAFT —
 *   câu/card giảng viên đã duyệt hay xuất bản không bị lặng lẽ kéo về nháp;
 *   ghi đè thì verification_status/evidence cũng theo lần sinh mới;
 * - đáp án qua normalizeAnswerKey như đường giảng viên tự soạn.
 *
 * Ngữ nghĩa SQL giữ đúng như persist_curriculum_quiz_items /
 * persist_curriculum_lesson_cards cũ ở packages-ai.
 */

export const VERIFICATION_STATUSES = [
  'UNVERIFIED',
  'VERIFIED',
  'INCONCLUSIVE',
  'FLAGGED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export interface GeneratedQuizItem {
  quiz_id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correct_answer: unknown;
  explanation: string | null;
  bloom_level: number | null;
  source_chunk_ids: string[];
  verification_status: VerificationStatus;
  verification_evidence: Record<string, unknown>;
}

export interface GeneratedCardContent {
  key_insight: string;
  bullets: string[];
  example: string | null;
  misconception: string | null;
  check_question: string;
  check_answer: string;
  model_id: string | null;
}

export interface GeneratedLessonCard {
  card_id: string;
  title: string;
  content: GeneratedCardContent;
  source_chunk_ids: string[];
  verification_status: VerificationStatus;
  verification_evidence: Record<string, unknown>;
}

const MAX_TITLE_CHARS = 255;

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/** Khoá thừa/thiếu so với hợp đồng: worker và core-api lệch phiên bản. */
export function checkKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  path: string,
  problems: string[],
): void {
  const allowed = new Set(required);
  const extra = Object.keys(value).filter((key) => !allowed.has(key));
  if (extra.length)
    problems.push(`${path}: unexpected fields ${extra.join(', ')}`);
  const missing = required.filter((key) => !(key in value));
  if (missing.length) problems.push(`${path}: missing ${missing.join(', ')}`);
}

function checkSourceChunks(
  value: unknown,
  path: string,
  problems: string[],
): string[] {
  if (!Array.isArray(value) || !value.length || !value.every(isUuid)) {
    problems.push(
      `${path}.source_chunk_ids must be a non-empty array of uuids`,
    );
    return [];
  }
  return value;
}

function checkVerification(
  item: Record<string, unknown>,
  path: string,
  problems: string[],
): { status: VerificationStatus; evidence: Record<string, unknown> } {
  const status = item.verification_status;
  if (!(VERIFICATION_STATUSES as readonly unknown[]).includes(status)) {
    problems.push(
      `${path}.verification_status must be one of ${VERIFICATION_STATUSES.join(', ')}`,
    );
  }
  if (!isPlainObject(item.verification_evidence)) {
    problems.push(`${path}.verification_evidence must be an object`);
  }
  return {
    status: status as VerificationStatus,
    evidence: (item.verification_evidence ?? {}) as Record<string, unknown>,
  };
}

const QUIZ_ITEM_KEYS = [
  'quiz_id',
  'type',
  'question',
  'options',
  'correct_answer',
  'explanation',
  'bloom_level',
  'source_chunk_ids',
  'verification_status',
  'verification_evidence',
] as const;

/**
 * Kiểm một mảng câu theo hợp đồng; lỗi được nối vào `problems` (người gọi ném
 * InvalidWorkerResultError một lần cho cả payload). Đáp án đã qua
 * normalizeAnswerKey: thứ ghi xuống là dạng chuẩn của question-types.ts.
 */
export function parseGeneratedQuizItems(
  raw: unknown,
  path: string,
  problems: string[],
  limits: { min: number; max: number } = { min: 1, max: 100 },
): GeneratedQuizItem[] {
  if (
    !Array.isArray(raw) ||
    raw.length < limits.min ||
    raw.length > limits.max
  ) {
    problems.push(
      `${path} must be an array of ${limits.min}–${limits.max} items`,
    );
    return [];
  }
  const seen = new Set<string>();
  const items: GeneratedQuizItem[] = [];
  raw.forEach((value, index) => {
    const at = `${path}[${index}]`;
    if (!isPlainObject(value)) {
      problems.push(`${at} must be an object`);
      return;
    }
    const before = problems.length;
    checkKeys(value, QUIZ_ITEM_KEYS, at, problems);
    const { quiz_id, type, question, options, explanation, bloom_level } =
      value;
    if (!isUuid(quiz_id)) problems.push(`${at}.quiz_id must be a uuid`);
    else if (seen.has(quiz_id.toLowerCase()))
      problems.push(`${at}.quiz_id ${quiz_id} appears twice`);
    else seen.add(quiz_id.toLowerCase());
    if (!isQuestionType(type))
      problems.push(`${at}.type is not a question type`);
    if (!isText(question))
      problems.push(`${at}.question must be non-empty text`);
    if (
      options !== null &&
      (!Array.isArray(options) || !options.every((o) => typeof o === 'string'))
    ) {
      problems.push(`${at}.options must be an array of strings or null`);
    }
    if (!isNullableString(explanation))
      problems.push(`${at}.explanation must be a string or null`);
    if (
      bloom_level !== null &&
      !(
        Number.isInteger(bloom_level) &&
        (bloom_level as number) >= 1 &&
        (bloom_level as number) <= 6
      )
    ) {
      problems.push(`${at}.bloom_level must be an integer 1–6 or null`);
    }
    const sourceChunkIds = checkSourceChunks(
      value.source_chunk_ids,
      at,
      problems,
    );
    const verification = checkVerification(value, at, problems);

    let key = {
      options: options,
      correct_answer: value.correct_answer,
    };
    if (isQuestionType(type) && isText(question)) {
      // Kiểu không có phương án thì cột options là NULL (như SQL cũ); Đúng/Sai
      // có đúng hai phương án cố định. normalizeAnswerKey tự thay options của
      // các kiểu này nên phải kiểm trước, không thì lỗi của worker bị nuốt.
      if (
        (type === 'FILL_BLANK' || type === 'SHORT_ANSWER') &&
        options !== null
      )
        problems.push(`${at}.options must be null for ${type}`);
      if (
        type === 'TRUE_FALSE' &&
        JSON.stringify(options) !== JSON.stringify(TRUE_FALSE_OPTIONS)
      )
        problems.push(
          `${at}.options must be ${JSON.stringify(TRUE_FALSE_OPTIONS)}`,
        );
      try {
        key = normalizeAnswerKey(type, question, key);
      } catch (err) {
        problems.push(`${at}: ${errorMessage(err)}`);
      }
    }
    if (problems.length > before) return;
    items.push({
      quiz_id: quiz_id as string,
      type: type as QuestionType,
      question: question as string,
      options: key.options as string[] | null,
      correct_answer: key.correct_answer,
      explanation: explanation as string | null,
      bloom_level: bloom_level as number | null,
      source_chunk_ids: sourceChunkIds,
      verification_status: verification.status,
      verification_evidence: verification.evidence,
    });
  });
  return items;
}

const CARD_KEYS = [
  'card_id',
  'title',
  'content',
  'source_chunk_ids',
  'verification_status',
  'verification_evidence',
] as const;
const CARD_CONTENT_KEYS = [
  'key_insight',
  'bullets',
  'example',
  'misconception',
  'check_question',
  'check_answer',
  'model_id',
] as const;

/** Như parseGeneratedQuizItems cho lesson_cards; thứ tự mảng là thứ tự học. */
export function parseGeneratedLessonCards(
  raw: unknown,
  path: string,
  problems: string[],
  limits: { min: number; max: number } = { min: 1, max: 20 },
): GeneratedLessonCard[] {
  if (
    !Array.isArray(raw) ||
    raw.length < limits.min ||
    raw.length > limits.max
  ) {
    problems.push(
      `${path} must be an array of ${limits.min}–${limits.max} cards`,
    );
    return [];
  }
  const seen = new Set<string>();
  const cards: GeneratedLessonCard[] = [];
  raw.forEach((value, index) => {
    const at = `${path}[${index}]`;
    if (!isPlainObject(value)) {
      problems.push(`${at} must be an object`);
      return;
    }
    const before = problems.length;
    checkKeys(value, CARD_KEYS, at, problems);
    const { card_id, title, content } = value;
    if (!isUuid(card_id)) problems.push(`${at}.card_id must be a uuid`);
    else if (seen.has(card_id.toLowerCase()))
      problems.push(`${at}.card_id ${card_id} appears twice`);
    else seen.add(card_id.toLowerCase());
    if (!isText(title) || !isWithinCodePoints(title, MAX_TITLE_CHARS))
      problems.push(
        `${at}.title must be non-empty text of at most ${MAX_TITLE_CHARS} characters`,
      );
    if (!isPlainObject(content)) {
      problems.push(`${at}.content must be an object`);
    } else {
      checkKeys(content, CARD_CONTENT_KEYS, `${at}.content`, problems);
      for (const field of [
        'key_insight',
        'check_question',
        'check_answer',
      ] as const) {
        if (!isText(content[field]))
          problems.push(`${at}.content.${field} must be non-empty text`);
      }
      const bullets = content.bullets;
      if (!Array.isArray(bullets) || !bullets.length || !bullets.every(isText))
        problems.push(
          `${at}.content.bullets must be a non-empty array of text`,
        );
      for (const field of ['example', 'misconception', 'model_id'] as const) {
        if (!isNullableString(content[field]))
          problems.push(`${at}.content.${field} must be a string or null`);
      }
    }
    const sourceChunkIds = checkSourceChunks(
      value.source_chunk_ids,
      at,
      problems,
    );
    const verification = checkVerification(value, at, problems);
    if (problems.length > before) return;
    cards.push({
      card_id: card_id as string,
      title: title as string,
      content: content as GeneratedCardContent,
      source_chunk_ids: sourceChunkIds,
      verification_status: verification.status,
      verification_evidence: verification.evidence,
    });
  });
  return cards;
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------

export interface CurrentLearningOutcome {
  lo_id: string;
  course_id: string;
  statement_vi: string;
}

export interface LessonRef {
  lesson_id: string;
  course_id: string;
  lo_id: string;
}

export interface UpsertCount {
  /** Dòng mới hoặc bản nháp được ghi đè. */
  written: number;
  /** Đã có và không còn là GENERATED_DRAFT: để nguyên. */
  skipped: number;
}

/**
 * LO còn hiện hành, hoặc null. SQL cũ lặng lẽ không ghi câu nào khi LO đã bị
 * thay/xoá (INSERT ... SELECT ra 0 dòng); người gọi phải xử lý null.
 */
export async function findCurrentLearningOutcome(
  tx: Prisma.TransactionClient,
  loId: string,
): Promise<CurrentLearningOutcome | null> {
  return tx.learning_outcomes.findFirst({
    where: { lo_id: loId, deleted_at: null, is_current: true },
    select: { lo_id: true, course_id: true, statement_vi: true },
  });
}

/** Lesson của LO; chưa có thì tạo ở DRAFT, đã có thì chỉ chạm updated_at. */
export async function ensureLessonForLo(
  tx: Prisma.TransactionClient,
  lo: CurrentLearningOutcome,
): Promise<LessonRef> {
  // lessons.title là VARCHAR(255) mà phát biểu LO có thể dài hơn: cắt theo
  // ký tự (không theo UTF-16) để không làm hỏng cả lần ghi.
  const title =
    clipCodePoints(lo.statement_vi || 'Generated lesson', MAX_TITLE_CHARS) ||
    'Generated lesson';
  return tx.lessons.upsert({
    where: { course_id_lo_id: { course_id: lo.course_id, lo_id: lo.lo_id } },
    create: {
      course_id: lo.course_id,
      lo_id: lo.lo_id,
      title,
      status: 'DRAFT',
    },
    update: { updated_at: new Date() },
    select: { lesson_id: true, course_id: true, lo_id: true },
  });
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Upsert câu theo quiz_id. Câu SQL thô vì cần ON CONFLICT ... WHERE: Prisma
 * upsert không có điều kiện "chỉ ghi đè bản nháp".
 */
export async function upsertGeneratedQuizItems(
  tx: Prisma.TransactionClient,
  lesson: LessonRef,
  items: GeneratedQuizItem[],
): Promise<UpsertCount> {
  let written = 0;
  for (const item of items) {
    written += await tx.$executeRaw`
      INSERT INTO quiz_items (
        quiz_id, lesson_id, course_id, lo_id, type, question, options,
        correct_answer, explanation, bloom_level, source_chunk_ids, status,
        verification_status, verification_evidence, deleted_at
      ) VALUES (
        ${item.quiz_id}::uuid, ${lesson.lesson_id}::uuid, ${lesson.course_id}::uuid,
        ${lesson.lo_id}::uuid, ${item.type}, ${item.question},
        ${item.options === null ? null : json(item.options)}::jsonb,
        ${json(item.correct_answer)}::jsonb, ${item.explanation},
        ${item.bloom_level}::int, ${item.source_chunk_ids}::uuid[], 'GENERATED_DRAFT',
        ${item.verification_status}, ${json(item.verification_evidence)}::jsonb, NULL
      )
      ON CONFLICT (quiz_id) DO UPDATE SET
        lesson_id = EXCLUDED.lesson_id,
        course_id = EXCLUDED.course_id,
        lo_id = EXCLUDED.lo_id,
        type = EXCLUDED.type,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer,
        explanation = EXCLUDED.explanation,
        bloom_level = EXCLUDED.bloom_level,
        source_chunk_ids = EXCLUDED.source_chunk_ids,
        status = 'GENERATED_DRAFT',
        verification_status = EXCLUDED.verification_status,
        verification_evidence = EXCLUDED.verification_evidence,
        updated_at = NOW(),
        deleted_at = NULL
      WHERE quiz_items.status = 'GENERATED_DRAFT'`;
  }
  return { written, skipped: items.length - written };
}

/**
 * Upsert card theo card_id. Card mới nối tiếp vị trí lớn nhất của lesson theo
 * thứ tự mảng (mỗi câu lệnh thấy dòng của câu trước trong cùng transaction);
 * card đã có giữ vị trí, lesson_id, course_id, lo_id cũ.
 */
export async function upsertGeneratedLessonCards(
  tx: Prisma.TransactionClient,
  lesson: LessonRef,
  cards: GeneratedLessonCard[],
): Promise<UpsertCount> {
  let written = 0;
  for (const card of cards) {
    written += await tx.$executeRaw`
      INSERT INTO lesson_cards (
        card_id, lesson_id, course_id, lo_id, title, content, source_chunk_ids,
        position, status, verification_status, verification_evidence, deleted_at
      )
      SELECT
        ${card.card_id}::uuid, ${lesson.lesson_id}::uuid, ${lesson.course_id}::uuid,
        ${lesson.lo_id}::uuid, ${card.title}, ${json(card.content)}::jsonb,
        ${card.source_chunk_ids}::uuid[],
        COALESCE((
          SELECT MAX(lc.position) + 1
            FROM lesson_cards lc
           WHERE lc.lesson_id = ${lesson.lesson_id}::uuid
             AND lc.deleted_at IS NULL
        ), 0),
        'GENERATED_DRAFT', ${card.verification_status},
        ${json(card.verification_evidence)}::jsonb, NULL
      ON CONFLICT (card_id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        source_chunk_ids = EXCLUDED.source_chunk_ids,
        verification_status = EXCLUDED.verification_status,
        verification_evidence = EXCLUDED.verification_evidence,
        updated_at = NOW(),
        deleted_at = NULL
      WHERE lesson_cards.status = 'GENERATED_DRAFT'`;
  }
  return { written, skipped: cards.length - written };
}
