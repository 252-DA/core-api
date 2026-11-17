import { UnrecoverableError } from 'bullmq';
import { isPlainObject } from '../../common/utils/type-guards';
import { isWithinCodePoints } from '../../common/utils/text-length';
import {
  isWorkerResultKind,
  type WorkerResultKind,
} from './worker-results.constants';

/**
 * Dữ liệu một job của `worker_results`, đúng
 * contracts/integration-events/v1/worker-result-envelope.json. Tên job = kind,
 * jobId = result_id.
 */
export interface WorkerResultEnvelope<
  P extends object = Record<string, unknown>,
> {
  /** Tất định từ nguồn (`<KIND>.<source_id>[.<lần>]`): BullMQ chặn trùng theo id này. */
  result_id: string;
  kind: WorkerResultKind;
  /** event_id outbox của lệnh đã sinh ra việc này; null khi job gốc không qua outbox. */
  source_event_id: string | null;
  /** ISO-8601 có múi giờ. */
  occurred_at: string;
  /** Chưa kiểm: handler của kind tự kiểm rồi mới dùng. */
  payload: P;
}

/**
 * Kết quả sai hợp đồng (envelope hoặc payload). Là UnrecoverableError nên
 * BullMQ không retry — gửi lại cũng sai y như vậy — và job nằm lại ở failed để
 * điều tra. Handler ném lỗi này khi payload của kind sai dạng.
 */
export class InvalidWorkerResultError extends UnrecoverableError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorkerResultError';
  }
}

/**
 * BullMQ Node từ chối custom jobId là số nguyên hoặc chứa ':'; bắt đầu bằng
 * chữ cái thì không bao giờ là số. Khớp pattern trong schema và
 * RESULT_ID_PATTERN bên worker.
 */
export const RESULT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,199}$/;
const OCCURRED_AT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const MAX_SOURCE_EVENT_ID = 200;
const ENVELOPE_KEYS = new Set([
  'result_id',
  'kind',
  'source_event_id',
  'occurred_at',
  'payload',
]);

/**
 * Kiểm dữ liệu job theo hợp đồng envelope; sai thì ném InvalidWorkerResultError
 * liệt kê mọi chỗ sai. `jobName` (tên job BullMQ) phải trùng `kind`.
 */
export function parseWorkerResultEnvelope(
  data: unknown,
  jobName?: string,
): WorkerResultEnvelope {
  if (!isPlainObject(data)) {
    throw new InvalidWorkerResultError(
      'worker result job data must be a JSON object',
    );
  }
  const problems: string[] = [];
  const extra = Object.keys(data).filter((key) => !ENVELOPE_KEYS.has(key));
  if (extra.length) problems.push(`unexpected fields: ${extra.join(', ')}`);

  const { result_id, kind, source_event_id, occurred_at, payload } = data;
  if (typeof result_id !== 'string' || !RESULT_ID_PATTERN.test(result_id)) {
    problems.push('result_id must match ' + String(RESULT_ID_PATTERN));
  }
  if (!isWorkerResultKind(kind)) {
    problems.push(`unknown kind ${JSON.stringify(kind)}`);
  } else if (jobName !== undefined && jobName !== kind) {
    problems.push(`job name ${JSON.stringify(jobName)} differs from kind`);
  }
  if (!('source_event_id' in data)) {
    problems.push('source_event_id is required (null when there is none)');
  } else if (
    source_event_id !== null &&
    (typeof source_event_id !== 'string' ||
      source_event_id.length === 0 ||
      !isWithinCodePoints(source_event_id, MAX_SOURCE_EVENT_ID))
  ) {
    problems.push('source_event_id must be a non-empty string or null');
  }
  if (
    typeof occurred_at !== 'string' ||
    !OCCURRED_AT_PATTERN.test(occurred_at) ||
    Number.isNaN(Date.parse(occurred_at))
  ) {
    problems.push('occurred_at must be ISO-8601 with a timezone');
  }
  if (!isPlainObject(payload)) problems.push('payload must be a JSON object');

  if (problems.length) {
    const id = typeof result_id === 'string' ? result_id : '(no result_id)';
    throw new InvalidWorkerResultError(
      `invalid worker result ${id}: ${problems.join('; ')}`,
    );
  }
  return data as unknown as WorkerResultEnvelope;
}
