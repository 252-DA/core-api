import { isWithinCodePoints } from '../../common/utils/text-length';
import { isPlainObject } from '../../common/utils/type-guards';
import { isUuid } from '../../common/utils/uuid';
import { InvalidWorkerResultError } from '../../messaging/worker-results/worker-result-envelope';
import {
  checkKeys,
  parseGeneratedLessonCards,
  parseGeneratedQuizItems,
  VERIFICATION_STATUSES,
  type GeneratedLessonCard,
  type GeneratedQuizItem,
  type VerificationStatus,
} from './generated-content';

/**
 * Payload của CONTENT_GENERATION_RESULT, đúng
 * contracts/integration-events/v1/content-generation-result.json. Mỗi kết quả
 * mang trạng thái đích của content_generation_requests.
 */
export const CONTENT_TYPES = [
  'quiz',
  'card',
  'relations',
  'micro_outline',
  'video_script',
  'micro_quiz',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const MAX_ERROR_CHARS = 4000;
const MAX_REJECT_REASON_CHARS = 300;
const MAX_REJECTED = 100;
const MAX_OUTLINE_SECTIONS = 20;
const MAX_SCRIPT_SCENES = 20;

export interface RejectedDraft {
  reason: string;
  regeneration_attempts: number;
}

export interface MicroOutlineSection {
  title: string;
  summary: string;
  page_from: number;
  page_to: number;
  suggested_lo_id: string | null;
  low_text: boolean;
  lo_rationale?: string | null;
}

export interface VideoScriptScene {
  title: string;
  bullets: string[];
  narration: string;
  slide_page?: number | null;
  duration_sec?: number | null;
  check?: {
    status: VerificationStatus;
    verdict?: string | null;
    reason?: string | null;
    writer_model?: string | null;
    judge_model?: string | null;
    source_chunk_ids?: string[];
  };
}

export interface VideoScriptPayload {
  voice?: string;
  source_document_id?: string | null;
  source_page_from?: number | null;
  source_page_to?: number | null;
  scenes: VideoScriptScene[];
}

interface Base {
  request_id: string;
}

export type ContentGenerationResult =
  | (Base & { status: 'RUNNING'; course_id: string; content_type: ContentType })
  | (Base & {
      status: 'FAILED';
      course_id: string | null;
      content_type: ContentType | null;
      error: string;
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'relations';
      generated_count: number;
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'micro_outline';
      document_id: string;
      generated_count: number;
      sections: MicroOutlineSection[];
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'video_script';
      micro_content_id: string;
      generated_count: number;
      script: VideoScriptPayload;
      rejected: RejectedDraft[];
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'micro_quiz';
      micro_content_id: string;
      lo_id: string | null;
      generated_count: number;
      quiz_items: GeneratedQuizItem[];
      rejected: RejectedDraft[];
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'quiz';
      lo_id: string;
      generated_count: number;
      quiz_items: GeneratedQuizItem[];
      rejected: RejectedDraft[];
    })
  | (Base & {
      status: 'SUCCEEDED';
      course_id: string;
      content_type: 'card';
      lo_id: string;
      generated_count: number;
      lesson_cards: GeneratedLessonCard[];
      rejected: RejectedDraft[];
    });

function isContentType(value: unknown): value is ContentType {
  return (CONTENT_TYPES as readonly unknown[]).includes(value);
}

function checkAllowedAndRequiredKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
  problems: string[],
) {
  const allowed = new Set([...required, ...optional]);
  const extra = Object.keys(value).filter((key) => !allowed.has(key));
  if (extra.length) problems.push(`${path}: unexpected fields ${extra.join(', ')}`);
  const missing = required.filter((key) => !(key in value));
  if (missing.length) problems.push(`${path}: missing ${missing.join(', ')}`);
}

function parseMicroOutlineSections(
  raw: unknown,
  problems: string[],
): MicroOutlineSection[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_OUTLINE_SECTIONS) {
    problems.push(`sections must be an array of 1–${MAX_OUTLINE_SECTIONS} items`);
    return [];
  }
  return raw.flatMap((entry, idx) => {
    const at = `sections[${idx}]`;
    if (!isPlainObject(entry)) {
      problems.push(`${at} must be an object`);
      return [];
    }
    checkAllowedAndRequiredKeys(
      entry,
      ['title', 'summary', 'page_from', 'page_to', 'suggested_lo_id', 'low_text'],
      ['lo_rationale'],
      at,
      problems,
    );
    const { title, summary, page_from, page_to, suggested_lo_id, low_text, lo_rationale } = entry;
    if (typeof title !== 'string' || !title.trim() || !isWithinCodePoints(title, 255)) {
      problems.push(`${at}.title must be non-empty text of <= 255 chars`);
    }
    if (typeof summary !== 'string') {
      problems.push(`${at}.summary must be a string`);
    }
    if (!Number.isInteger(page_from) || (page_from as number) < 1) {
      problems.push(`${at}.page_from must be an integer >= 1`);
    }
    if (
      !Number.isInteger(page_to) ||
      (page_to as number) < 1 ||
      (Number.isInteger(page_from) && (page_to as number) < (page_from as number))
    ) {
      problems.push(`${at}.page_to must be an integer >= page_from`);
    }
    if (suggested_lo_id !== null && !isUuid(suggested_lo_id)) {
      problems.push(`${at}.suggested_lo_id must be a uuid or null`);
    }
    if (typeof low_text !== 'boolean') {
      problems.push(`${at}.low_text must be a boolean`);
    }
    if (
      lo_rationale !== undefined &&
      lo_rationale !== null &&
      typeof lo_rationale !== 'string'
    ) {
      problems.push(`${at}.lo_rationale must be a string or null`);
    }
    return [entry as unknown as MicroOutlineSection];
  });
}

function parseVideoScriptPayload(
  raw: unknown,
  problems: string[],
): VideoScriptPayload | null {
  if (!isPlainObject(raw)) {
    problems.push('script must be an object');
    return null;
  }
  const scenesRaw = raw.scenes;
  if (!Array.isArray(scenesRaw) || scenesRaw.length === 0 || scenesRaw.length > MAX_SCRIPT_SCENES) {
    problems.push(`script.scenes must be an array of 1–${MAX_SCRIPT_SCENES} items`);
    return null;
  }
  scenesRaw.forEach((sc, idx) => {
    const at = `script.scenes[${idx}]`;
    if (!isPlainObject(sc)) {
      problems.push(`${at} must be an object`);
      return;
    }
    if (typeof sc.title !== 'string' || !sc.title.trim() || !isWithinCodePoints(sc.title, 255)) {
      problems.push(`${at}.title must be non-empty text of <= 255 chars`);
    }
    if (
      !Array.isArray(sc.bullets) ||
      sc.bullets.length > 6 ||
      !sc.bullets.every((b) => typeof b === 'string' && b.trim().length > 0)
    ) {
      problems.push(`${at}.bullets must be an array of <= 6 non-empty strings`);
    }
    if (typeof sc.narration !== 'string' || !sc.narration.trim()) {
      problems.push(`${at}.narration must be non-empty text`);
    }
    if (
      sc.slide_page !== undefined &&
      sc.slide_page !== null &&
      (!Number.isInteger(sc.slide_page) || (sc.slide_page as number) < 1)
    ) {
      problems.push(`${at}.slide_page must be an integer >= 1 or null`);
    }
    if (sc.check !== undefined) {
      if (!isPlainObject(sc.check)) {
        problems.push(`${at}.check must be an object`);
      } else if (!(VERIFICATION_STATUSES as readonly unknown[]).includes(sc.check.status)) {
        problems.push(
          `${at}.check.status must be one of ${VERIFICATION_STATUSES.join(', ')}`,
        );
      }
    }
  });
  return raw as unknown as VideoScriptPayload;
}

function parseRejected(raw: unknown, problems: string[]): RejectedDraft[] {
  if (!Array.isArray(raw) || raw.length > MAX_REJECTED) {
    problems.push(`rejected must be an array of at most ${MAX_REJECTED} items`);
    return [];
  }
  return raw.flatMap((value, index) => {
    const at = `rejected[${index}]`;
    if (!isPlainObject(value)) {
      problems.push(`${at} must be an object`);
      return [];
    }
    checkKeys(value, ['reason', 'regeneration_attempts'], at, problems);
    const { reason, regeneration_attempts } = value;
    if (
      typeof reason !== 'string' ||
      !reason.trim() ||
      !isWithinCodePoints(reason, MAX_REJECT_REASON_CHARS)
    )
      problems.push(
        `${at}.reason must be text of 1–${MAX_REJECT_REASON_CHARS} characters`,
      );
    if (
      !Number.isInteger(regeneration_attempts) ||
      (regeneration_attempts as number) < 0
    )
      problems.push(
        `${at}.regeneration_attempts must be a non-negative integer`,
      );
    return [
      {
        reason: reason as string,
        regeneration_attempts: regeneration_attempts as number,
      },
    ];
  });
}

/**
 * Kiểm payload; sai ở bất kỳ đâu → InvalidWorkerResultError liệt kê mọi chỗ
 * sai (không retry: gửi lại cũng sai y như vậy).
 */
export function parseContentGenerationResult(
  payload: unknown,
  resultId = '(unknown result)',
): ContentGenerationResult {
  const problems: string[] = [];
  if (!isPlainObject(payload)) {
    throw new InvalidWorkerResultError(
      `${resultId}: payload must be an object`,
    );
  }
  const { request_id, course_id, content_type, status } = payload;
  if (!isUuid(request_id)) problems.push('request_id must be a uuid');

  let result: ContentGenerationResult | undefined;
  switch (status) {
    case 'RUNNING':
      checkKeys(
        payload,
        ['request_id', 'course_id', 'content_type', 'status'],
        'payload',
        problems,
      );
      if (!isUuid(course_id)) problems.push('course_id must be a uuid');
      if (!isContentType(content_type))
        problems.push(`content_type must be one of ${CONTENT_TYPES.join(', ')}`);
      result = {
        status,
        request_id,
        course_id,
        content_type,
      } as ContentGenerationResult;
      break;
    case 'FAILED': {
      checkKeys(
        payload,
        ['request_id', 'course_id', 'content_type', 'status', 'error'],
        'payload',
        problems,
      );
      if (course_id !== null && !isUuid(course_id))
        problems.push('course_id must be a uuid or null');
      if (content_type !== null && !isContentType(content_type))
        problems.push(`content_type must be one of ${CONTENT_TYPES.join(', ')} or null`);
      const error = payload.error;
      if (
        typeof error !== 'string' ||
        !error.trim() ||
        !isWithinCodePoints(error, MAX_ERROR_CHARS)
      )
        problems.push(`error must be text of 1–${MAX_ERROR_CHARS} characters`);
      result = {
        status,
        request_id,
        course_id,
        content_type,
        error,
      } as ContentGenerationResult;
      break;
    }
    case 'SUCCEEDED': {
      if (!isUuid(course_id)) problems.push('course_id must be a uuid');
      const count = payload.generated_count;
      if (!Number.isInteger(count) || (count as number) < 0)
        problems.push('generated_count must be a non-negative integer');
      if (content_type === 'relations') {
        checkKeys(
          payload,
          [
            'request_id',
            'course_id',
            'content_type',
            'status',
            'generated_count',
          ],
          'payload',
          problems,
        );
        result = {
          status,
          request_id,
          course_id,
          content_type,
          generated_count: count,
        } as ContentGenerationResult;
        break;
      }
      if (content_type === 'micro_outline') {
        checkKeys(
          payload,
          [
            'request_id',
            'course_id',
            'content_type',
            'status',
            'document_id',
            'generated_count',
            'sections',
          ],
          'payload',
          problems,
        );
        if (!isUuid(payload.document_id)) problems.push('document_id must be a uuid');
        const sections = parseMicroOutlineSections(payload.sections, problems);
        if (Array.isArray(payload.sections) && count !== payload.sections.length) {
          problems.push('generated_count must equal sections.length');
        }
        result = {
          status,
          request_id,
          course_id,
          content_type,
          document_id: payload.document_id,
          generated_count: count,
          sections,
        } as unknown as ContentGenerationResult;
        break;
      }
      if (content_type === 'video_script') {
        checkKeys(
          payload,
          [
            'request_id',
            'course_id',
            'content_type',
            'status',
            'micro_content_id',
            'generated_count',
            'script',
            'rejected',
          ],
          'payload',
          problems,
        );
        if (!isUuid(payload.micro_content_id))
          problems.push('micro_content_id must be a uuid');
        const script = parseVideoScriptPayload(payload.script, problems);
        const rejected = parseRejected(payload.rejected, problems);
        if (script && count !== script.scenes.length) {
          problems.push('generated_count must equal script.scenes.length');
        }
        result = {
          status,
          request_id,
          course_id,
          content_type,
          micro_content_id: payload.micro_content_id,
          generated_count: count,
          script,
          rejected,
        } as unknown as ContentGenerationResult;
        break;
      }
      if (content_type === 'micro_quiz') {
        checkAllowedAndRequiredKeys(
          payload,
          [
            'request_id',
            'course_id',
            'content_type',
            'status',
            'micro_content_id',
            'generated_count',
            'quiz_items',
            'rejected',
          ],
          ['lo_id'],
          'payload',
          problems,
        );
        if (!isUuid(payload.micro_content_id))
          problems.push('micro_content_id must be a uuid');
        if (
          payload.lo_id !== undefined &&
          payload.lo_id !== null &&
          !isUuid(payload.lo_id)
        ) {
          problems.push('lo_id must be a uuid or null');
        }
        const quizItems = parseGeneratedQuizItems(
          payload.quiz_items,
          'quiz_items',
          problems,
          { min: 1, max: 20 },
        );
        const rejected = parseRejected(payload.rejected, problems);
        if (
          Array.isArray(payload.quiz_items) &&
          count !== payload.quiz_items.length
        ) {
          problems.push('generated_count must equal quiz_items.length');
        }
        result = {
          status,
          request_id,
          course_id,
          content_type,
          micro_content_id: payload.micro_content_id,
          lo_id: (payload.lo_id ?? null) as string | null,
          generated_count: count,
          quiz_items: quizItems,
          rejected,
        } as unknown as ContentGenerationResult;
        break;
      }
      if (content_type !== 'quiz' && content_type !== 'card') {
        problems.push(`content_type must be one of ${CONTENT_TYPES.join(', ')}`);
        break;
      }
      const itemsKey = content_type === 'quiz' ? 'quiz_items' : 'lesson_cards';
      checkKeys(
        payload,
        [
          'request_id',
          'course_id',
          'content_type',
          'status',
          'lo_id',
          'generated_count',
          itemsKey,
          'rejected',
        ],
        'payload',
        problems,
      );
      if (!isUuid(payload.lo_id)) problems.push('lo_id must be a uuid');
      const items =
        content_type === 'quiz'
          ? parseGeneratedQuizItems(payload.quiz_items, 'quiz_items', problems)
          : parseGeneratedLessonCards(
              payload.lesson_cards,
              'lesson_cards',
              problems,
            );
      const rejected = parseRejected(payload.rejected, problems);
      // Số câu/card là số phần tử thật gửi về; lệch là worker đếm sai.
      if (
        Array.isArray(payload[itemsKey]) &&
        count !== (payload[itemsKey] as unknown[]).length
      )
        problems.push(`generated_count must equal ${itemsKey}.length`);
      result = {
        status,
        request_id,
        course_id,
        content_type,
        lo_id: payload.lo_id,
        generated_count: count,
        [itemsKey]: items,
        rejected,
      } as unknown as ContentGenerationResult;
      break;
    }
    default:
      problems.push('status must be RUNNING, SUCCEEDED or FAILED');
  }

  if (problems.length || !result) {
    throw new InvalidWorkerResultError(
      `invalid CONTENT_GENERATION_RESULT ${resultId}: ${problems.join('; ')}`,
    );
  }
  return result;
}
