import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { isFinalFailure, WorkerResultsProcessor } from './worker-results.processor';
import { WorkerResultHandlerRegistry } from './worker-result-handler.registry';
import {
  WorkerResultNotImplementedError,
  type WorkerResultHandler,
} from './worker-result-handler';
import { InvalidWorkerResultError } from './worker-result-envelope';
import { WORKER_RESULTS_QUEUE } from '../queues';
import { type WorkerResultKind } from './worker-results.constants';

/** Stub như của đợt 0, không phụ thuộc handler thật của domain nào. */
class StubResultHandler implements WorkerResultHandler {
  handle(): Promise<never> {
    return Promise.reject(
      new WorkerResultNotImplementedError('QUIZ_GRADING_RESULT'),
    );
  }
}

const envelope = (kind: WorkerResultKind = 'QUIZ_GRADING_RESULT') => ({
  result_id: `${kind}.6f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f`,
  kind,
  source_event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  occurred_at: '2026-11-07T10:30:15.123Z',
  payload: { submission_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
});

function job(data: Record<string, unknown>, overrides: Partial<Job> = {}) {
  return {
    id: data.result_id,
    name: data.kind,
    data,
    attemptsMade: 2,
    opts: { attempts: 10 },
    ...overrides,
  } as unknown as Job;
}

function handler(result: unknown = { applied: true }) {
  return { handle: jest.fn().mockResolvedValue(result) };
}

function setup(
  handlers: Partial<Record<WorkerResultKind, WorkerResultHandler>>,
) {
  const registry = {
    get: jest.fn((kind: WorkerResultKind) => handlers[kind]),
  };
  return new WorkerResultsProcessor(
    registry as unknown as WorkerResultHandlerRegistry,
  );
}

describe('WorkerResultsProcessor', () => {
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  beforeEach(() => {
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('consumes worker_results one job at a time', () => {
    expect(
      Reflect.getMetadata('bullmq:processor_metadata', WorkerResultsProcessor),
    ).toEqual({ name: WORKER_RESULTS_QUEUE });
    expect(
      Reflect.getMetadata('bullmq:worker_metadata', WorkerResultsProcessor),
    ).toEqual({ concurrency: 1 });
  });

  it('dispatches to the handler of the kind with the envelope and job context', async () => {
    const quiz = handler({ applied: 3 });
    const essay = handler();
    const processor = setup({
      QUIZ_GRADING_RESULT: quiz,
      ESSAY_GRADING_RESULT: essay,
    });
    const data = envelope();

    await expect(processor.process(job(data))).resolves.toEqual({
      applied: 3,
    });

    expect(quiz.handle).toHaveBeenCalledWith(data, {
      jobId: data.result_id,
      attemptsMade: 2,
    });
    expect(essay.handle).not.toHaveBeenCalled();
  });

  it('fails a malformed envelope without retry and without calling a handler', async () => {
    const quiz = handler();
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    const run = processor.process(job({ ...envelope(), result_id: 'a:b' }));

    await expect(run).rejects.toBeInstanceOf(UnrecoverableError);
    await expect(run).rejects.toBeInstanceOf(InvalidWorkerResultError);
    expect(quiz.handle).not.toHaveBeenCalled();
  });

  it('fails without retry when the job name is not the kind', async () => {
    const quiz = handler();
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await expect(
      processor.process(job(envelope(), { name: 'ESSAY_GRADING_RESULT' })),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(quiz.handle).not.toHaveBeenCalled();
  });

  it('fails without retry when no handler is registered for the kind', async () => {
    const processor = setup({ QUIZ_GRADING_RESULT: handler() });

    const run = processor.process(job(envelope('DOCUMENT_PROCESSING_RESULT')));

    await expect(run).rejects.toBeInstanceOf(UnrecoverableError);
    await expect(run).rejects.toThrow(
      'No worker result handler registered for DOCUMENT_PROCESSING_RESULT',
    );
  });

  it('rethrows a handler error unchanged so BullMQ retries it', async () => {
    const failure = new Error('database unavailable');
    const processor = setup({
      QUIZ_GRADING_RESULT: { handle: jest.fn().mockRejectedValue(failure) },
    });

    const run = processor.process(job(envelope()));

    await expect(run).rejects.toBe(failure);
    await expect(run).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  it('lets a handler stop retries for a malformed payload', async () => {
    const processor = setup({
      QUIZ_GRADING_RESULT: {
        handle: jest
          .fn()
          .mockRejectedValue(new InvalidWorkerResultError('missing score')),
      },
    });

    await expect(processor.process(job(envelope()))).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
  });

  it('still processes a job whose id is not the result_id, with a warning', async () => {
    const quiz = handler();
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await processor.process(job(envelope(), { id: '17' }));

    expect(quiz.handle).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('jobId = result_id'),
    );
  });

  it('keeps a stub result retryable so it stays in Redis', async () => {
    const processor = setup({
      QUIZ_GRADING_RESULT: new StubResultHandler(),
    });

    const run = processor.process(job(envelope()));

    await expect(run).rejects.toBeInstanceOf(WorkerResultNotImplementedError);
    await expect(run).rejects.not.toBeInstanceOf(UnrecoverableError);
  });

  it('logs whether a failed job will be retried', () => {
    const processor = setup({});

    processor.onFailed(job(envelope(), { attemptsMade: 3 }), new Error('x'));
    processor.onFailed(job(envelope(), { attemptsMade: 10 }), new Error('x'));
    processor.onFailed(
      job(envelope(), { attemptsMade: 1 }),
      new UnrecoverableError('bad'),
    );

    const messages = (error.mock.calls as [string][]).map(([msg]) => msg);
    expect(messages).toEqual([
      expect.stringContaining('sẽ thử lại'),
      expect.stringContaining('dừng'),
      expect.stringContaining('dừng'),
    ]);
  });
});

/**
 * Hook onFinalFailure: chạy khi kết quả không bao giờ áp dụng được nữa (xem
 * WorkerResultHandler). Job BullMQ thật: attemptsMade = số lần đã lỗi TRƯỚC lần
 * này; BullMQ thử lại khi attemptsMade + 1 < attempts.
 */
describe('WorkerResultsProcessor final failure hook', () => {
  let error: jest.SpyInstance;
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  function withHook(handle: jest.Mock, onFinalFailure = jest.fn().mockResolvedValue(undefined)) {
    return { handle, onFinalFailure } as unknown as WorkerResultHandler & {
      onFinalFailure: jest.Mock;
    };
  }

  it('calls the hook at once for a payload the handler calls invalid', async () => {
    const failure = new InvalidWorkerResultError('unknown attempt ids');
    const quiz = withHook(jest.fn().mockRejectedValue(failure));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });
    const data = envelope();

    // attemptsMade 0 của tối đa 10 lần: lỗi thường sẽ còn thử lại, lỗi này thì không.
    await expect(
      processor.process(job(data, { attemptsMade: 0 })),
    ).rejects.toBe(failure);

    expect(quiz.onFinalFailure).toHaveBeenCalledTimes(1);
    expect(quiz.onFinalFailure).toHaveBeenCalledWith(data, failure, {
      jobId: data.result_id,
      attemptsMade: 0,
    });
  });

  it('calls the hook at once for any UnrecoverableError of the handler', async () => {
    const failure = new UnrecoverableError('bad');
    const quiz = withHook(jest.fn().mockRejectedValue(failure));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await expect(
      processor.process(job(envelope(), { attemptsMade: 0 })),
    ).rejects.toBe(failure);

    expect(quiz.onFinalFailure).toHaveBeenCalledTimes(1);
  });

  it('does not call the hook for an ordinary error while retries remain', async () => {
    const failure = new Error('database unavailable');
    const quiz = withHook(jest.fn().mockRejectedValue(failure));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    // Lần thứ 1, 2 và 9 trong 10 lần: BullMQ còn thử lại.
    for (const attemptsMade of [0, 1, 8]) {
      await expect(
        processor.process(job(envelope(), { attemptsMade })),
      ).rejects.toBe(failure);
    }

    expect(quiz.onFinalFailure).not.toHaveBeenCalled();
  });

  it('calls the hook only on the last attempt of an ordinary error', async () => {
    const failure = new Error('database unavailable');
    const quiz = withHook(jest.fn().mockRejectedValue(failure));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });
    const data = envelope();

    // Lần thứ 10 trong 10 lần.
    await expect(
      processor.process(job(data, { attemptsMade: 9 })),
    ).rejects.toBe(failure);

    expect(quiz.onFinalFailure).toHaveBeenCalledTimes(1);
    expect(quiz.onFinalFailure).toHaveBeenCalledWith(data, failure, {
      jobId: data.result_id,
      attemptsMade: 9,
    });
  });

  it('treats a job without attempts as a single attempt', async () => {
    const failure = new Error('boom');
    const quiz = withHook(jest.fn().mockRejectedValue(failure));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await expect(
      processor.process(job(envelope(), { attemptsMade: 0, opts: {} })),
    ).rejects.toBe(failure);

    expect(quiz.onFinalFailure).toHaveBeenCalledTimes(1);
  });

  it('does not call the hook when the handler succeeds', async () => {
    const quiz = withHook(jest.fn().mockResolvedValue({ applied: true }));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await processor.process(job(envelope(), { attemptsMade: 9 }));

    expect(quiz.onFinalFailure).not.toHaveBeenCalled();
  });

  it('rethrows the original error when the hook itself throws', async () => {
    const failure = new InvalidWorkerResultError('bad payload');
    const hook = jest.fn().mockRejectedValue(new Error('hook broke'));
    const quiz = withHook(jest.fn().mockRejectedValue(failure), hook);
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await expect(processor.process(job(envelope()))).rejects.toBe(failure);

    expect(hook).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('hook broke'));
  });

  it('is fine with a handler that has no hook', async () => {
    const failure = new InvalidWorkerResultError('bad payload');
    const processor = setup({
      QUIZ_GRADING_RESULT: { handle: jest.fn().mockRejectedValue(failure) },
    });

    await expect(processor.process(job(envelope()))).rejects.toBe(failure);
  });

  it('wraps a non-Error rejection for the hook', async () => {
    const quiz = withHook(jest.fn().mockRejectedValue('plain string'));
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });

    await expect(
      processor.process(job(envelope(), { attemptsMade: 9 })),
    ).rejects.toBe('plain string');

    const [, cause] = quiz.onFinalFailure.mock.calls[0] as [unknown, Error];
    expect(cause).toEqual(new Error('plain string'));
  });

  it('still lets the hook clean up when only the envelope is malformed', async () => {
    const quiz = withHook(jest.fn());
    const processor = setup({ QUIZ_GRADING_RESULT: quiz });
    const data = { ...envelope(), occurred_at: 'yesterday' };

    await expect(processor.process(job(data))).rejects.toBeInstanceOf(
      InvalidWorkerResultError,
    );

    expect((quiz as unknown as { handle: jest.Mock }).handle).not.toHaveBeenCalled();
    expect(quiz.onFinalFailure).toHaveBeenCalledTimes(1);
    const [salvaged, cause] = quiz.onFinalFailure.mock.calls[0] as [
      Record<string, unknown>,
      Error,
    ];
    expect(salvaged).toMatchObject({
      kind: 'QUIZ_GRADING_RESULT',
      payload: data.payload,
    });
    expect(cause).toBeInstanceOf(InvalidWorkerResultError);
  });

  it('does not run any hook when the kind is unknown, differs from the job name or the payload is not an object', async () => {
    const quiz = withHook(jest.fn());
    const essay = withHook(jest.fn());
    const processor = setup({
      QUIZ_GRADING_RESULT: quiz,
      ESSAY_GRADING_RESULT: essay,
    });

    await expect(
      processor.process(job({ ...envelope(), kind: 'NOPE' })),
    ).rejects.toBeInstanceOf(InvalidWorkerResultError);
    await expect(
      processor.process(job(envelope(), { name: 'ESSAY_GRADING_RESULT' })),
    ).rejects.toBeInstanceOf(InvalidWorkerResultError);
    await expect(
      processor.process(job({ ...envelope(), payload: 'text' })),
    ).rejects.toBeInstanceOf(InvalidWorkerResultError);
    await expect(
      processor.process(job('not an object' as never)),
    ).rejects.toBeInstanceOf(InvalidWorkerResultError);

    expect(quiz.onFinalFailure).not.toHaveBeenCalled();
    expect(essay.onFinalFailure).not.toHaveBeenCalled();
  });

  it('has no hook to run when no handler is registered', async () => {
    const processor = setup({});

    await expect(
      processor.process(job(envelope())),
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });
});

describe('isFinalFailure', () => {
  const at = (attemptsMade: number, attempts?: number) =>
    ({ attemptsMade, opts: { attempts } }) as unknown as Job;

  it('follows BullMQ: retry while attemptsMade + 1 < attempts', () => {
    expect(isFinalFailure(at(0, 3), new Error('x'))).toBe(false);
    expect(isFinalFailure(at(1, 3), new Error('x'))).toBe(false);
    expect(isFinalFailure(at(2, 3), new Error('x'))).toBe(true);
    expect(isFinalFailure(at(0, 1), new Error('x'))).toBe(true);
    expect(isFinalFailure(at(0, undefined), new Error('x'))).toBe(true);
  });

  it('is final for an unrecoverable error whatever the attempt', () => {
    expect(isFinalFailure(at(0, 10), new UnrecoverableError('x'))).toBe(true);
    expect(isFinalFailure(at(0, 10), new InvalidWorkerResultError('x'))).toBe(
      true,
    );
    const lookalike = Object.assign(new Error('x'), {
      name: 'UnrecoverableError',
    });
    expect(isFinalFailure(at(0, 10), lookalike)).toBe(true);
  });
});
