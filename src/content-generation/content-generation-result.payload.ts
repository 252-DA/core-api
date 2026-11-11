import { InvalidWorkerResultError } from '../worker-results/worker-result-envelope';
import {
  checkKeys,
  isPlainObject,
  isUuid,
  parseGeneratedLessonCards,
  parseGeneratedQuizItems,
  type GeneratedLessonCard,
  type GeneratedQuizItem,
} from './generated-content';
import { isWithinCodePoints } from '../worker-results/text-length';

/**
 * Payload của CONTENT_GENERATION_RESULT, đúng
 * contracts/integration-events/v1/content-generation-result.json. Mỗi kết quả
 * mang trạng thái đích của content_generation_requests.
 */
export const CONTENT_TYPES = ['quiz', 'card', 'relations'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const MAX_ERROR_CHARS = 4000;
const MAX_REJECT_REASON_CHARS = 300;
const MAX_REJECTED = 100;

export interface RejectedDraft {
  reason: string;
  regeneration_attempts: number;
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
        problems.push('content_type must be quiz, card or relations');
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
        problems.push('content_type must be quiz, card, relations or null');
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
      if (content_type !== 'quiz' && content_type !== 'card') {
        problems.push('content_type must be quiz, card or relations');
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
