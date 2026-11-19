import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CONTRACTS_DIR } from '../../testing/repo-paths';
import { parseContentGenerationResult } from '../../modules/content-generation/handlers/content-generation-result.payload';
import { parseEnrichmentContentPayload } from '../../modules/content-generation/handlers/enrichment-content-result.handler';
import { parseCurriculumImportEnvelope } from '../../modules/curriculum/handlers/curriculum-import-result.handler';
import { parseDocumentProcessingPayload } from '../../modules/document/handlers/document-processing-result.handler';
import { parseEssayGradingResult } from '../../modules/essay-processor/handlers/essay-grading-result.handler';
import { parseMicroContentGradingResult } from '../../modules/micro-content/handlers/micro-content-grading-result.handler';
import { parseMicroContentVideoPayload } from '../../modules/micro-content/handlers/micro-content-video-result.handler';
import { parseQuizGradingResult } from '../../modules/quiz/handlers/quiz-grading-result.handler';
import {
  InvalidWorkerResultError,
  parseWorkerResultEnvelope,
} from './worker-result-envelope';
import {
  WORKER_RESULT_KINDS,
  type WorkerResultKind,
} from './worker-results.constants';

/**
 * Hợp đồng dùng chung với worker Python: mọi fixture trong
 * contracts/fixtures/v1/{valid,invalid} có `result_id` là một envelope kết quả
 * worker. packages-ai/tests/unit/test_contract_fixtures.py kiểm chúng bằng JSON
 * Schema; ở đây kiểm bằng đúng bộ kiểm mà processor và handler của core-api chạy
 * (envelope rồi payload của kind) — hai phía phải đồng ý với nhau. Fixture valid
 * phải nhận, invalid phải từ chối. Bỏ qua khi không có thư mục contracts (repo
 * core-api checkout riêng).
 */
const FIXTURES = resolve(CONTRACTS_DIR, 'fixtures', 'v1');
const describeContract = existsSync(FIXTURES) ? describe : describe.skip;

type Payload = Record<string, unknown>;

/**
 * Hàm kiểm payload thuần (không cần DB) của từng kind. Kiểu Record bắt buộc có đủ
 * mọi kind: thêm kind vào WORKER_RESULT_KINDS mà quên bộ kiểm ở đây thì tsc báo.
 */
const PAYLOAD_PARSERS: Record<
  WorkerResultKind,
  (payload: Payload, resultId: string) => unknown
> = {
  QUIZ_GRADING_RESULT: (payload) => parseQuizGradingResult(payload),
  MICRO_CONTENT_GRADING_RESULT: (payload) =>
    parseMicroContentGradingResult(payload),
  ESSAY_GRADING_RESULT: (payload) => parseEssayGradingResult(payload),
  CONTENT_GENERATION_RESULT: parseContentGenerationResult,
  ENRICHMENT_CONTENT_RESULT: parseEnrichmentContentPayload,
  CURRICULUM_IMPORT_RESULT: parseCurriculumImportEnvelope,
  MICRO_CONTENT_VIDEO_RESULT: parseMicroContentVideoPayload,
  DOCUMENT_PROCESSING_RESULT: parseDocumentProcessingPayload,
};

type Fixture = { file: string; data: unknown };

function resultFixtures(dir: 'valid' | 'invalid'): Fixture[] {
  const folder = join(FIXTURES, dir);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .sort()
    .map((file) => ({
      file,
      data: JSON.parse(readFileSync(join(folder, file), 'utf8')) as unknown,
    }))
    .filter(
      ({ data }) =>
        typeof data === 'object' &&
        data !== null &&
        !Array.isArray(data) &&
        'result_id' in data,
    );
}

/** Envelope rồi payload của kind, như WorkerResultsProcessor + handler.handle(). */
function checkResult(data: unknown) {
  const envelope = parseWorkerResultEnvelope(
    data,
    (data as { kind?: string }).kind,
  );
  PAYLOAD_PARSERS[envelope.kind](envelope.payload, envelope.result_id);
}

/**
 * Fixture chỉ kiểm hình dạng envelope (payload là chỗ giữ chỗ): không có payload
 * hợp lệ của kind để chạy bộ kiểm payload.
 */
const envelopeOnly = (file: string) => file.startsWith('worker-result-envelope');

describeContract('worker result contract fixtures', () => {
  const valid = resultFixtures('valid');
  const invalid = resultFixtures('invalid');

  it('finds the fixtures', () => {
    expect(valid.length).toBeGreaterThan(0);
    expect(invalid.length).toBeGreaterThan(0);
  });

  const pairs = (list: Fixture[]) =>
    list.map(({ file, data }) => [file, data] as [string, unknown]);
  const kindOf = (data: unknown) => (data as { kind?: string }).kind;

  it.each(pairs(valid.filter(({ file }) => !envelopeOnly(file))))(
    'accepts valid %s (envelope and payload)',
    (_file, data) => {
      expect(() => checkResult(data)).not.toThrow();
    },
  );

  it.each(pairs(valid.filter(({ file }) => envelopeOnly(file))))(
    'accepts valid %s (envelope only, payload is a placeholder)',
    (_file, data) => {
      expect(() => parseWorkerResultEnvelope(data, kindOf(data))).not.toThrow();
    },
  );

  it.each(pairs(invalid))('rejects invalid %s without retry', (file, data) => {
    // UnrecoverableError qua InvalidWorkerResultError: BullMQ không retry vì gửi
    // lại cũng sai y như vậy.
    expect(() => checkResult(data)).toThrow(InvalidWorkerResultError);
    const envelopeStep = () => parseWorkerResultEnvelope(data, kindOf(data));
    if (envelopeOnly(file)) {
      // Fixture chỉ sai envelope: bị từ chối ngay ở bước envelope.
      expect(envelopeStep).toThrow(InvalidWorkerResultError);
    } else {
      // Fixture sai payload: envelope vẫn đúng, lỗi phải đến từ bộ kiểm payload
      // của kind (không phải do envelope lỗi che mất việc kiểm payload).
      expect(envelopeStep).not.toThrow();
    }
  });

  it('has a valid and an invalid payload fixture for every kind, so the payload checks are really exercised', () => {
    for (const kind of WORKER_RESULT_KINDS) {
      const ofKind = (list: Fixture[]) =>
        list.filter(
          ({ file, data }) =>
            !envelopeOnly(file) && (data as { kind?: string }).kind === kind,
        );
      expect({ kind, valid: ofKind(valid).length > 0 }).toEqual({
        kind,
        valid: true,
      });
      expect({ kind, invalid: ofKind(invalid).length > 0 }).toEqual({
        kind,
        invalid: true,
      });
    }
  });
});
