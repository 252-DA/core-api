import { EventEmitter } from 'node:events';
import {
  MAX_RELAY_FAILURES,
  OUTBOX_CHANNEL,
  OutboxService,
  relayFailureOutcome,
} from './outbox.service';

type RawCall = { sql: string; values: unknown[] };

type Event = {
  event_id: string;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: unknown;
  retry_count: number | null;
  next_retry_at: Date;
  occurred_at: Date;
};

function event(n: number, overrides: Partial<Event> = {}): Event {
  const id = `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
  return {
    event_id: id,
    event_type: 'LESSON_PUBLISHED',
    aggregate_type: 'lesson',
    aggregate_id: id,
    payload: { n },
    retry_count: 0,
    next_retry_at: new Date(1_000 + n),
    occurred_at: new Date(1_000 + n),
    ...overrides,
  };
}

class FakeListenClient extends EventEmitter {
  connect = jest.fn().mockResolvedValue(undefined);
  query = jest.fn().mockResolvedValue(undefined);
  end = jest.fn(() => {
    this.emit('end');
    return Promise.resolve();
  });
  notify(channel = OUTBOX_CHANNEL) {
    this.emit('notification', { channel });
  }
}

function setup(batches: Event[][] = []) {
  const claims: RawCall[] = [];
  const writes: RawCall[] = [];
  const pending = [...batches];
  const prisma = {
    $queryRaw: jest.fn(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        claims.push({ sql: strings.join('?'), values });
        return Promise.resolve(pending.shift() ?? []);
      },
    ),
    $executeRaw: jest.fn(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        writes.push({ sql: strings.join('?'), values });
        return Promise.resolve(1);
      },
    ),
  };
  const queue = (id: string) => ({
    add: jest
      .fn<Promise<{ id: string }>, [string, { event_id: string }, unknown]>()
      .mockResolvedValue({ id }),
  });
  const relayQueue = queue('relay-job');
  const contentGenerationQueue = queue('generation-job');
  const answerGradingQueue = queue('grading-job');
  const essayGradingQueue = queue('essay-job');
  const microContentVideoQueue = queue('video-job');
  const documentProcessingQueue = queue('document-job');
  const clients: FakeListenClient[] = [];
  const listenFactory = jest.fn(() => {
    const client = new FakeListenClient();
    clients.push(client);
    return client;
  });
  const service = new OutboxService(
    prisma as never,
    relayQueue as never,
    contentGenerationQueue as never,
    answerGradingQueue as never,
    essayGradingQueue as never,
    microContentVideoQueue as never,
    listenFactory,
    documentProcessingQueue as never,
  );
  return {
    service,
    prisma,
    claims,
    writes,
    pending,
    relayQueue,
    contentGenerationQueue,
    answerGradingQueue,
    essayGradingQueue,
    microContentVideoQueue,
    documentProcessingQueue,
    clients,
    listenFactory,
  };
}

const processedWrites = (writes: RawCall[]) =>
  writes.filter((w) => w.sql.includes("status = 'PROCESSED'"));
const failureWrites = (writes: RawCall[]) =>
  writes.filter((w) => w.sql.includes('retry_count = ?'));

describe('OutboxService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('routing', () => {
    it('routes content-generation requests to the content_generation queue', async () => {
      const e = event(1, {
        event_type: 'CONTENT_GENERATION_REQUESTED',
        aggregate_type: 'content_generation_request',
        payload: { request_id: 'r', type: 'quiz' },
      });
      const { service, relayQueue, contentGenerationQueue, writes } = setup([
        [e],
      ]);

      await service.pollAndRelay();

      expect(contentGenerationQueue.add).toHaveBeenCalledWith(
        'CONTENT_GENERATION_REQUESTED',
        {
          event_id: e.event_id,
          event_type: e.event_type,
          aggregate_type: e.aggregate_type,
          aggregate_id: e.aggregate_id,
          payload: e.payload,
        },
        {
          jobId: e.event_id,
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
      expect(relayQueue.add).not.toHaveBeenCalled();
      expect(processedWrites(writes)).toHaveLength(1);
    });

    it('keeps non-generation events on the relay queue', async () => {
      const { service, relayQueue, contentGenerationQueue } = setup([
        [event(2)],
      ]);

      await service.pollAndRelay();

      expect(relayQueue.add).toHaveBeenCalledWith(
        'LESSON_PUBLISHED',
        expect.objectContaining({ event_id: event(2).event_id }),
        expect.objectContaining({ jobId: event(2).event_id }),
      );
      expect(contentGenerationQueue.add).not.toHaveBeenCalled();
    });

    it('routes answer and micro-content grading to the answer_grading queue', async () => {
      const { service, relayQueue, answerGradingQueue } = setup([
        [
          event(3, { event_type: 'ANSWER_GRADING_REQUESTED' }),
          event(4, { event_type: 'MICRO_CONTENT_GRADING_REQUESTED' }),
        ],
      ]);

      await service.pollAndRelay();

      expect(answerGradingQueue.add.mock.calls.map((c) => c[0])).toEqual([
        'ANSWER_GRADING_REQUESTED',
        'MICRO_CONTENT_GRADING_REQUESTED',
      ]);
      expect(relayQueue.add).not.toHaveBeenCalled();
    });

    it('routes essay grading (Asset Processor) to the essay_grading queue', async () => {
      const { service, relayQueue, answerGradingQueue, essayGradingQueue } =
        setup([[event(5, { event_type: 'ESSAY_GRADING_REQUESTED' })]]);

      await service.pollAndRelay();

      expect(essayGradingQueue.add).toHaveBeenCalledWith(
        'ESSAY_GRADING_REQUESTED',
        expect.objectContaining({ event_id: event(5).event_id }),
        expect.objectContaining({ jobId: event(5).event_id }),
      );
      expect(answerGradingQueue.add).not.toHaveBeenCalled();
      expect(relayQueue.add).not.toHaveBeenCalled();
    });

    it('routes micro-content video requests to the micro_content_video queue', async () => {
      const { service, relayQueue, microContentVideoQueue } = setup([
        [
          event(6, { event_type: 'MICRO_CONTENT_SCRIPT_REQUESTED' }),
          event(7, { event_type: 'MICRO_CONTENT_RENDER_REQUESTED' }),
        ],
      ]);

      await service.pollAndRelay();

      expect(microContentVideoQueue.add).toHaveBeenCalledTimes(2);
      expect(relayQueue.add).not.toHaveBeenCalled();
    });

    it('routes the course chunk→LO remap command to the document worker queue', async () => {
      const { service, relayQueue, documentProcessingQueue } = setup([
        [event(8, { event_type: 'COURSE_CHUNK_LO_REMAP_REQUESTED' })],
      ]);

      await service.pollAndRelay();

      expect(documentProcessingQueue.add).toHaveBeenCalledWith(
        'COURSE_CHUNK_LO_REMAP_REQUESTED',
        expect.objectContaining({
          event_type: 'COURSE_CHUNK_LO_REMAP_REQUESTED',
        }),
        expect.objectContaining({ jobId: expect.any(String) }),
      );
      expect(relayQueue.add).not.toHaveBeenCalled();
    });

    it('retries the remap command instead of sending it to the relay queue when document_processing is missing', async () => {
      const { service, relayQueue, writes } = setup([
        [event(9, { event_type: 'COURSE_CHUNK_LO_REMAP_REQUESTED' })],
      ]);
      Object.assign(service, { documentProcessingQueue: undefined });

      await service.pollAndRelay();

      expect(relayQueue.add).not.toHaveBeenCalled();
      expect(failureWrites(writes)).toHaveLength(1);
    });
  });

  describe('claiming', () => {
    it('claims due PENDING rows and stale PROCESSING rows by locked_at with SKIP LOCKED', async () => {
      const { service, claims } = setup();

      await service.pollAndRelay();

      expect(claims).toHaveLength(1);
      const { sql, values } = claims[0];
      expect(sql).toContain("status = 'PENDING' AND next_retry_at <= now()");
      expect(sql).toContain("status = 'PROCESSING'");
      expect(sql).toContain(
        'COALESCE(locked_at, occurred_at) < now() - ?::interval',
      );
      expect(sql).toContain('ORDER BY next_retry_at, occurred_at');
      expect(sql).toContain('FOR UPDATE SKIP LOCKED');
      expect(sql).toContain(
        "SET status = 'PROCESSING', locked_at = now(), locked_by = ?",
      );
      expect(values).toEqual([
        '10 minutes',
        10,
        expect.stringContaining(`:${process.pid}`),
      ]);
    });

    it('does nothing when no event is due', async () => {
      const { service, relayQueue, writes } = setup([[]]);

      await service.pollAndRelay();

      expect(relayQueue.add).not.toHaveBeenCalled();
      expect(writes).toHaveLength(0);
    });

    it('relays claimed events oldest first even if RETURNING is unordered', async () => {
      const late = event(9, { next_retry_at: new Date(5_000) });
      const early = event(8, { next_retry_at: new Date(2_000) });
      const { service, relayQueue } = setup([[late, early]]);

      await service.pollAndRelay();

      expect(relayQueue.add.mock.calls.map((c) => c[1].event_id)).toEqual([
        early.event_id,
        late.event_id,
      ]);
    });

    it('keeps claiming while batches come back full, then stops', async () => {
      const full = Array.from({ length: 10 }, (_, i) => event(100 + i));
      const { service, claims, relayQueue } = setup([full, [event(200)]]);

      await service.pollAndRelay();

      expect(claims).toHaveLength(2);
      expect(relayQueue.add).toHaveBeenCalledTimes(11);
    });
  });

  describe('bookkeeping', () => {
    it('marks success PROCESSED, clears the lock and does not count it as a retry', async () => {
      const e = event(10, { retry_count: 2 });
      const { service, writes } = setup([[e]]);

      await service.pollAndRelay();

      expect(writes).toHaveLength(1);
      const [w] = processedWrites(writes);
      expect(w.sql).toContain('processed_at = now()');
      expect(w.sql).toContain('locked_at = NULL, locked_by = NULL');
      expect(w.sql).toContain("status = 'PROCESSING' AND locked_by = ?");
      expect(w.sql).not.toContain('retry_count');
      expect(w.values).toEqual([
        e.event_id,
        expect.stringContaining(`:${process.pid}`),
      ]);
    });

    it.each([
      [0, 1, 2],
      [3, 4, 16],
      [null, 1, 2],
    ])(
      'backs off after a failed queue.add (retry_count %p → %p, wait %ps)',
      async (before, after, delay) => {
        const e = event(11, { retry_count: before });
        const { service, relayQueue, writes } = setup([[e]]);
        relayQueue.add.mockRejectedValueOnce(new Error('redis down'));

        await service.pollAndRelay();

        expect(processedWrites(writes)).toHaveLength(0);
        const [w] = failureWrites(writes);
        expect(w.sql).toContain(
          'next_retry_at = now() + make_interval(secs => ?)',
        );
        expect(w.sql).toContain('locked_at = NULL, locked_by = NULL');
        expect(w.values.slice(0, 5)).toEqual([
          'PENDING',
          after,
          'redis down',
          delay,
          e.event_id,
        ]);
      },
    );

    it(`moves an event to DEAD_LETTER on failure number ${MAX_RELAY_FAILURES}`, async () => {
      const e = event(12, { retry_count: MAX_RELAY_FAILURES - 1 });
      const { service, relayQueue, writes } = setup([[e]]);
      relayQueue.add.mockRejectedValueOnce(new Error('still down'));

      await service.pollAndRelay();

      const [w] = failureWrites(writes);
      expect(w.values.slice(0, 4)).toEqual([
        'DEAD_LETTER',
        MAX_RELAY_FAILURES,
        'still down',
        0,
      ]);
    });

    it('computes the retry outcome from the number of previous failures', () => {
      expect(relayFailureOutcome(undefined)).toEqual({
        status: 'PENDING',
        retryCount: 1,
        delaySeconds: 2,
      });
      expect(relayFailureOutcome(8)).toEqual({
        status: 'PENDING',
        retryCount: 9,
        delaySeconds: 512,
      });
      expect(relayFailureOutcome(9)).toEqual({
        status: 'DEAD_LETTER',
        retryCount: 10,
        delaySeconds: 0,
      });
      expect(relayFailureOutcome(15)).toEqual({
        status: 'DEAD_LETTER',
        retryCount: 16,
        delaySeconds: 0,
      });
    });

    it('treats a queue.add that never answers as a failure', async () => {
      jest.useFakeTimers();
      const { service, relayQueue, writes } = setup([[event(13)]]);
      relayQueue.add.mockReturnValueOnce(new Promise(() => undefined));

      const done = service.pollAndRelay();
      await jest.advanceTimersByTimeAsync(10_000);
      await done;

      const [w] = failureWrites(writes);
      expect(w.values[0]).toBe('PENDING');
      expect(String(w.values[2])).toContain('không trả lời');
    });

    it('keeps relaying the rest of the batch when one bookkeeping write fails', async () => {
      const { service, prisma, relayQueue } = setup([[event(14), event(15)]]);
      prisma.$executeRaw.mockRejectedValueOnce(new Error('db blip'));

      await expect(service.pollAndRelay()).resolves.toBeUndefined();

      expect(relayQueue.add).toHaveBeenCalledTimes(2);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('does not throw when another process took the lock meanwhile', async () => {
      const { service, prisma } = setup([[event(16)]]);
      prisma.$executeRaw.mockResolvedValueOnce(0);

      await expect(service.pollAndRelay()).resolves.toBeUndefined();
    });
  });

  describe('overlap guard', () => {
    it('never runs two polls at once and folds concurrent calls into one extra pass', async () => {
      const { service, prisma } = setup();
      let active = 0;
      let maxActive = 0;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      prisma.$queryRaw.mockImplementation(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        if (prisma.$queryRaw.mock.calls.length === 1) await gate;
        active -= 1;
        return [];
      });

      const first = service.pollAndRelay();
      const second = service.pollAndRelay();
      const third = service.pollAndRelay();
      await Promise.resolve();
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);

      release();
      await Promise.all([first, second, third]);

      expect(maxActive).toBe(1);
      // Lượt đầu + đúng một lượt gộp cho hai lời gọi chen giữa.
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(second).toBe(first);

      await service.pollAndRelay();
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    });
  });

  describe('LISTEN / NOTIFY', () => {
    async function started(batches: Event[][] = []) {
      jest.useFakeTimers();
      const ctx = setup(batches);
      ctx.service.onModuleInit();
      await jest.advanceTimersByTimeAsync(0);
      return ctx;
    }

    it('listens on outbox_channel and polls once at startup', async () => {
      const { clients, prisma, service } = await started();

      expect(clients).toHaveLength(1);
      expect(clients[0].query).toHaveBeenCalledWith(`LISTEN ${OUTBOX_CHANNEL}`);
      // Một lượt lúc khởi động (+ có thể một lượt sau khi LISTEN xong).
      expect(prisma.$queryRaw.mock.calls.length).toBeGreaterThanOrEqual(1);
      await service.onModuleDestroy();
    });

    it('polls on NOTIFY and coalesces a burst of notifications into one poll', async () => {
      const { clients, prisma, relayQueue, pending, service } = await started();
      await jest.advanceTimersByTimeAsync(100);
      const before = prisma.$queryRaw.mock.calls.length;
      pending.push([event(20)]);

      clients[0].notify();
      clients[0].notify();
      clients[0].notify();
      clients[0].notify('some_other_channel');
      await jest.advanceTimersByTimeAsync(100);

      expect(prisma.$queryRaw.mock.calls.length).toBe(before + 1);
      expect(relayQueue.add).toHaveBeenCalledTimes(1);
      await service.onModuleDestroy();
    });

    it('falls back to polling every 15 seconds', async () => {
      const { prisma, service } = await started();
      await jest.advanceTimersByTimeAsync(100);
      const before = prisma.$queryRaw.mock.calls.length;

      await jest.advanceTimersByTimeAsync(15_000);
      expect(prisma.$queryRaw.mock.calls.length).toBe(before + 1);
      await jest.advanceTimersByTimeAsync(15_000);
      expect(prisma.$queryRaw.mock.calls.length).toBe(before + 2);
      await service.onModuleDestroy();
    });

    it('reconnects with backoff after losing the connection and polls to catch up', async () => {
      const { clients, listenFactory, prisma, service } = await started();
      await jest.advanceTimersByTimeAsync(100);
      const before = prisma.$queryRaw.mock.calls.length;

      clients[0].emit('error', new Error('connection terminated'));
      expect(clients[0].end).toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(999);
      expect(listenFactory).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1 + 100);
      expect(listenFactory).toHaveBeenCalledTimes(2);
      expect(clients[1].query).toHaveBeenCalledWith(`LISTEN ${OUTBOX_CHANNEL}`);
      expect(prisma.$queryRaw.mock.calls.length).toBe(before + 1);

      // Client mới nhận notify như thường.
      clients[1].notify();
      await jest.advanceTimersByTimeAsync(100);
      expect(prisma.$queryRaw.mock.calls.length).toBe(before + 2);
      await service.onModuleDestroy();
    });

    it('retries the connection when connect() fails', async () => {
      jest.useFakeTimers();
      const ctx = setup();
      let attempt = 0;
      ctx.listenFactory.mockImplementation(() => {
        const client = new FakeListenClient();
        if (attempt++ === 0)
          client.connect.mockRejectedValue(new Error('ECONNREFUSED'));
        ctx.clients.push(client);
        return client;
      });
      ctx.service.onModuleInit();
      await jest.advanceTimersByTimeAsync(1_100);

      expect(ctx.listenFactory).toHaveBeenCalledTimes(2);
      expect(ctx.clients[1].query).toHaveBeenCalledWith(
        `LISTEN ${OUTBOX_CHANNEL}`,
      );
      await ctx.service.onModuleDestroy();
    });

    it('closes the listener on shutdown and stops polling and reconnecting', async () => {
      const { clients, listenFactory, prisma, service } = await started();
      await jest.advanceTimersByTimeAsync(100);

      await service.onModuleDestroy();
      const after = prisma.$queryRaw.mock.calls.length;

      expect(clients[0].end).toHaveBeenCalled();
      clients[0].notify();
      await jest.advanceTimersByTimeAsync(60_000);
      expect(prisma.$queryRaw.mock.calls.length).toBe(after);
      expect(listenFactory).toHaveBeenCalledTimes(1);
    });
  });
});
