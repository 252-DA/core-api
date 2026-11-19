import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { UnrecoverableError } from 'bullmq';
import { CONTRACTS_DIR } from '../../testing/repo-paths';
import {
  InvalidWorkerResultError,
  RESULT_ID_PATTERN,
  parseWorkerResultEnvelope,
} from './worker-result-envelope';
import { WORKER_RESULT_KINDS } from './worker-results.constants';

const valid = (): Record<string, unknown> => ({
  result_id: 'QUIZ_GRADING_RESULT.6f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f',
  kind: 'QUIZ_GRADING_RESULT',
  source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  occurred_at: '2026-11-07T10:30:15.123Z',
  payload: { submission_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
});

function rejection(data: unknown, jobName?: string): Error {
  try {
    parseWorkerResultEnvelope(data, jobName);
  } catch (err) {
    return err as Error;
  }
  throw new Error('expected the envelope to be rejected');
}

describe('parseWorkerResultEnvelope', () => {
  it('accepts a well-formed envelope', () => {
    const data = valid();
    expect(parseWorkerResultEnvelope(data, 'QUIZ_GRADING_RESULT')).toEqual(
      data,
    );
  });

  it('counts source_event_id length by code point, like the schema maxLength', () => {
    const atLimit = '𝑓'.repeat(200); // 400 đơn vị UTF-16
    expect(
      parseWorkerResultEnvelope({ ...valid(), source_event_id: atLimit })
        .source_event_id,
    ).toBe(atLimit);
    expect(
      rejection({ ...valid(), source_event_id: `${atLimit}x` }).message,
    ).toContain('source_event_id must be a non-empty string or null');
  });

  it('accepts a null source_event_id and a non-UTC offset', () => {
    const data = {
      ...valid(),
      source_event_id: null,
      occurred_at: '2026-11-07T17:30:15+07:00',
    };
    expect(parseWorkerResultEnvelope(data).source_event_id).toBeNull();
  });

  it.each([
    ['a colon in result_id', { result_id: 'grading:abc:1' }],
    ['an integer result_id', { result_id: '12345' }],
    ['an empty result_id', { result_id: '' }],
    ['an unknown kind', { kind: 'QUIZ_GRADED' }],
    ['an empty source_event_id', { source_event_id: '' }],
    ['a numeric source_event_id', { source_event_id: 7 }],
    ['occurred_at without timezone', { occurred_at: '2026-11-07T10:30:15' }],
    ['occurred_at that is not a date', { occurred_at: '2026-13-45T99:99:99Z' }],
    ['an array payload', { payload: [{ score: 7 }] }],
    ['a null payload', { payload: null }],
    ['an unexpected field', { producer: 'answer-grading-worker' }],
  ])('rejects %s without retry', (_label, override) => {
    const err = rejection({ ...valid(), ...override });
    expect(err).toBeInstanceOf(InvalidWorkerResultError);
    // BullMQ không retry UnrecoverableError.
    expect(err).toBeInstanceOf(UnrecoverableError);
  });

  it('requires source_event_id to be present even when null', () => {
    const data = valid();
    delete data.source_event_id;
    expect(rejection(data).message).toContain('source_event_id is required');
  });

  it.each([null, 'text', 42, [valid()]])('rejects job data %p', (data) => {
    expect(rejection(data)).toBeInstanceOf(InvalidWorkerResultError);
  });

  it('rejects a job whose name differs from the kind', () => {
    expect(rejection(valid(), 'ESSAY_GRADING_RESULT').message).toContain(
      'differs from kind',
    );
  });

  it('reports every problem at once', () => {
    const err = rejection({
      ...valid(),
      result_id: 'a:b',
      kind: 'NOPE',
      payload: [],
    });
    expect(err.message).toMatch(/result_id.*unknown kind.*payload/);
  });
});

// Cùng bộ fixture packages-ai/tests/unit/test_contract_fixtures.py dùng: bên
// TS phải chấp nhận/từ chối đúng như JSON Schema.
const CONTRACTS = CONTRACTS_DIR;
const ENVELOPE_SCHEMA = join(
  CONTRACTS,
  'integration-events',
  'v1',
  'worker-result-envelope.json',
);
const describeContract = existsSync(ENVELOPE_SCHEMA) ? describe : describe.skip;

describeContract('worker-result-envelope contract', () => {
  const readJson = (path: string): unknown =>
    JSON.parse(readFileSync(path, 'utf8'));
  const fixtures = (dir: 'valid' | 'invalid') => {
    const base = join(CONTRACTS, 'fixtures', 'v1', dir);
    return readdirSync(base)
      .filter((name) => name.startsWith('worker-result-envelope'))
      .map((name) => [name, readJson(join(base, name))] as const);
  };
  const schema = () =>
    readJson(ENVELOPE_SCHEMA) as {
      properties: {
        kind: { enum: string[] };
        result_id: { pattern: string };
      };
    };

  it('lists the same kinds as the schema', () => {
    expect([...schema().properties.kind.enum].sort()).toEqual(
      [...WORKER_RESULT_KINDS].sort(),
    );
  });

  it('uses the same result_id pattern as the schema', () => {
    expect(RESULT_ID_PATTERN.source).toBe(
      schema().properties.result_id.pattern,
    );
  });

  const accepted = (data: unknown) => {
    try {
      parseWorkerResultEnvelope(data);
      return true;
    } catch (err) {
      if (err instanceof InvalidWorkerResultError) return false;
      throw err;
    }
  };

  it('accepts every valid envelope fixture', () => {
    const valid = fixtures('valid');
    expect(valid.length).toBeGreaterThan(0);
    expect(valid.filter(([, data]) => !accepted(data)).map(([n]) => n)).toEqual(
      [],
    );
  });

  it('rejects every invalid envelope fixture', () => {
    const invalid = fixtures('invalid');
    expect(invalid.length).toBeGreaterThan(0);
    expect(
      invalid.filter(([, data]) => accepted(data)).map(([n]) => n),
    ).toEqual([]);
  });
});
