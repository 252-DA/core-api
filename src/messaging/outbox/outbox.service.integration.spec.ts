import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createPgListenClient } from './outbox-listener';
import { OutboxService } from './outbox.service';

/**
 * Chạy thật trên PostgreSQL đã áp đủ migration (có trigger NOTIFY). Bỏ qua khi
 * không đặt OUTBOX_IT_DATABASE_URL, để `npx jest` mặc định không cần DB.
 *
 *   OUTBOX_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_s \
 *     npx jest src/messaging/outbox/outbox.service.integration.spec.ts
 *
 * Test XOÁ toàn bộ outbox_events của DB đó: chỉ trỏ vào DB tạm.
 */
const url = process.env.OUTBOX_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('OutboxService on PostgreSQL', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM outbox_events');
  });

  function queues() {
    const make = () => ({
      add: jest
        .fn<Promise<{ id: string }>, [string, { event_id: string }, unknown]>()
        .mockResolvedValue({ id: 'job' }),
    });
    return {
      relay: make(),
      generation: make(),
      grading: make(),
      essay: make(),
    };
  }

  function service(
    q = queues(),
    listenFactory?: () => ReturnType<typeof createPgListenClient>,
  ) {
    return new OutboxService(
      prisma as never,
      q.relay as never,
      q.generation as never,
      q.grading as never,
      q.essay as never,
      undefined,
      listenFactory,
    );
  }

  async function insert(
    eventType: string,
    extra: Record<string, string> = {},
  ): Promise<string> {
    const columns = ['event_type', 'payload', ...Object.keys(extra)];
    const values = [`'${eventType}'`, `'{}'::jsonb`, ...Object.values(extra)];
    const [{ event_id }] = await prisma.$queryRawUnsafe<{ event_id: string }[]>(
      `INSERT INTO outbox_events (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING event_id::text`,
    );
    return event_id;
  }

  async function row(eventId: string) {
    const [r] = await prisma.$queryRawUnsafe<
      Array<{
        status: string;
        retry_count: number;
        last_error: string | null;
        locked_at: Date | null;
        locked_by: string | null;
        processed_at: Date | null;
        retry_in_s: number;
      }>
    >(
      `SELECT status, retry_count, last_error, locked_at, locked_by, processed_at,
              EXTRACT(EPOCH FROM next_retry_at - now())::float8 AS retry_in_s
         FROM outbox_events WHERE event_id = $1::uuid`,
      eventId,
    );
    return r;
  }

  it('relays a pending event and marks it PROCESSED without counting a failure', async () => {
    const q = queues();
    const id = await insert('LESSON_PUBLISHED');

    await service(q).pollAndRelay();

    expect(q.relay.add).toHaveBeenCalledWith(
      'LESSON_PUBLISHED',
      expect.objectContaining({ event_id: id }),
      expect.objectContaining({ jobId: id }),
    );
    const r = await row(id);
    expect(r).toMatchObject({
      status: 'PROCESSED',
      retry_count: 0,
      locked_at: null,
      locked_by: null,
    });
    expect(r.processed_at).toBeInstanceOf(Date);
  });

  it('backs off after a failed queue.add and only retries once next_retry_at is due', async () => {
    const q = queues();
    q.relay.add.mockRejectedValueOnce(new Error('redis down'));
    const svc = service(q);
    const id = await insert('LESSON_PUBLISHED');

    await svc.pollAndRelay();
    let r = await row(id);
    expect(r).toMatchObject({
      status: 'PENDING',
      retry_count: 1,
      last_error: 'redis down',
      locked_at: null,
    });
    expect(r.retry_in_s).toBeGreaterThan(1);
    expect(r.retry_in_s).toBeLessThanOrEqual(2.5);

    // Chưa đến hạn: không nhặt lại.
    await svc.pollAndRelay();
    expect(q.relay.add).toHaveBeenCalledTimes(1);

    await prisma.$executeRawUnsafe(
      `UPDATE outbox_events SET next_retry_at = now() - interval '1 second' WHERE event_id = $1::uuid`,
      id,
    );
    await svc.pollAndRelay();
    expect(q.relay.add).toHaveBeenCalledTimes(2);
    r = await row(id);
    expect(r).toMatchObject({ status: 'PROCESSED', retry_count: 1 });
  });

  it('moves the event to DEAD_LETTER on the 10th failure', async () => {
    const q = queues();
    q.relay.add.mockRejectedValue(new Error('still down'));
    const id = await insert('LESSON_PUBLISHED', { retry_count: '9' });

    await service(q).pollAndRelay();

    expect(await row(id)).toMatchObject({
      status: 'DEAD_LETTER',
      retry_count: 10,
      last_error: 'still down',
    });
    // DEAD_LETTER không bao giờ được nhặt lại.
    await prisma.$executeRawUnsafe(
      `UPDATE outbox_events SET next_retry_at = now() - interval '1 day'`,
    );
    await service(q).pollAndRelay();
    expect(q.relay.add).toHaveBeenCalledTimes(1);
  });

  it('reclaims PROCESSING rows by locked_at, not occurred_at', async () => {
    const q = queues();
    const stale = await insert('STALE', {
      status: `'PROCESSING'`,
      locked_at: `now() - interval '11 minutes'`,
      locked_by: `'dead-host:1'`,
      occurred_at: `now()`,
    });
    const fresh = await insert('FRESH', {
      status: `'PROCESSING'`,
      locked_at: `now() - interval '1 minute'`,
      locked_by: `'other-host:2'`,
      occurred_at: `now() - interval '3 days'`,
    });

    await service(q).pollAndRelay();

    expect(q.relay.add.mock.calls.map((c) => c[0])).toEqual(['STALE']);
    expect((await row(stale)).status).toBe('PROCESSED');
    expect(await row(fresh)).toMatchObject({
      status: 'PROCESSING',
      locked_by: 'other-host:2',
    });
  });

  it('does not relay the same event twice when two services poll at once', async () => {
    const q = queues();
    for (let i = 0; i < 25; i += 1) await insert(`E${i}`);

    await Promise.all([service(q).pollAndRelay(), service(q).pollAndRelay()]);

    const names = q.relay.add.mock.calls.map((c) => c[0]);
    expect(names).toHaveLength(25);
    expect(new Set(names).size).toBe(25);
  });

  it('wakes up on NOTIFY from an INSERT without waiting for the fallback poll', async () => {
    const q = queues();
    const svc = service(q, () => createPgListenClient(url));
    svc.onModuleInit();
    try {
      // Đợi LISTEN sẵn sàng và lượt poll lúc khởi động chạy xong.
      await waitFor(() => svc['listener']?.connected === true);
      await svc.pollAndRelay();
      expect(q.relay.add).not.toHaveBeenCalled();

      const id = await insert('NOTIFIED');
      await waitFor(() => q.relay.add.mock.calls.length === 1, 3_000);
      expect((await row(id)).status).toBe('PROCESSED');
    } finally {
      await svc.onModuleDestroy();
    }
  });

  it('reconnects LISTEN after the server kills the session', async () => {
    const q = queues();
    const svc = service(q, () => createPgListenClient(url));
    svc.onModuleInit();
    try {
      await waitFor(() => svc['listener']?.connected === true);
      await svc.pollAndRelay();

      await prisma.$queryRawUnsafe(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
          WHERE application_name = 'core-api-outbox-listener' AND pid <> pg_backend_pid()`,
      );
      await waitFor(() => svc['listener']?.connected === false, 3_000);
      // Backoff lần đầu 1s.
      await waitFor(() => svc['listener']?.connected === true, 5_000);

      await insert('AFTER_RECONNECT');
      await waitFor(() => q.relay.add.mock.calls.length === 1, 3_000);
      expect(q.relay.add.mock.calls[0][0]).toBe('AFTER_RECONNECT');
    } finally {
      await svc.onModuleDestroy();
    }
  });
});

async function waitFor(check: () => boolean, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`condition not met within ${timeoutMs}ms`);
}
