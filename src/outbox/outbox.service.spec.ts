import type { Queue } from 'bullmq';
import type { PrismaService } from '../prisma/prisma.service';
import type { MetricsService } from '../metrics/metrics.service';
import {
  OUTBOX_EVENT_TYPES,
  OUTBOX_QUEUE_NAMES,
} from './outbox-event.constants';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { OutboxService } from './outbox.service';

interface OutboxEventFixture {
  event_id: string;
  event_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  retry_count: number | null;
}

function eventFixture(
  overrides: Partial<OutboxEventFixture> = {},
): OutboxEventFixture {
  return {
    event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    event_type: OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
    aggregate_type: 'document',
    aggregate_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    payload: { document_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
    retry_count: 0,
    ...overrides,
  };
}

describe('OutboxService', () => {
  let queryRaw: jest.Mock;
  let update: jest.Mock;
  let transaction: jest.Mock;
  let outboxRelayAdd: jest.Mock;
  let contentGenerationAdd: jest.Mock;
  let incrementOutboxEventFailed: jest.Mock;
  let service: OutboxService;
  let claimedQuery: string;

  beforeEach(() => {
    claimedQuery = '';
    queryRaw = jest.fn((strings: TemplateStringsArray) => {
      claimedQuery = strings.join(' ');
      return Promise.resolve([]);
    });
    update = jest.fn().mockResolvedValue({});
    transaction = jest.fn((callback: (tx: object) => unknown) =>
      callback({
        $queryRaw: queryRaw,
        outbox_events: { update },
      }),
    );
    outboxRelayAdd = jest.fn().mockResolvedValue({ id: 'relay-job' });
    contentGenerationAdd = jest.fn().mockResolvedValue({ id: 'content-job' });

    const prisma = {
      $transaction: transaction,
    } as unknown as PrismaService;
    const outboxRelayQueue = {
      add: outboxRelayAdd,
    } as unknown as Queue;
    const contentGenerationQueue = {
      add: contentGenerationAdd,
    } as unknown as Queue;
    incrementOutboxEventFailed = jest.fn();
    const metrics = {
      incrementOutboxEventFailed,
    } as unknown as MetricsService;

    service = new OutboxService(
      prisma,
      outboxRelayQueue,
      contentGenerationQueue,
      metrics,
    );
  });

  it('claims rows atomically with skip-locked semantics', async () => {
    await service.pollAndRelay();

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(claimedQuery).toContain('FOR UPDATE SKIP LOCKED');
    expect(claimedQuery).toContain("WHERE status = 'PENDING'");
    expect(claimedQuery).not.toContain("SET status = 'PROCESSING'");
  });

  it('normalizes a legacy graph event and relays it idempotently', async () => {
    const event = eventFixture({ event_type: 'document_deleted' });
    queryRaw.mockResolvedValue([event]);

    await service.pollAndRelay();

    expect(outboxRelayAdd).toHaveBeenCalledWith(
      OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
      {
        event_id: event.event_id,
        event_type: OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        payload: event.payload,
      },
      {
        jobId: event.event_id,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    expect(contentGenerationAdd).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { event_id: event.event_id },
      data: {
        status: 'PROCESSED',
        last_error: null,
        processed_at: expect.any(Date) as Date,
      },
    });
    expect(outboxRelayAdd.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
  });

  it('routes content generation only to its dedicated queue', async () => {
    const event = eventFixture({
      event_type: OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED,
      aggregate_type: 'content_generation_request',
    });
    queryRaw.mockResolvedValue([event]);

    await service.pollAndRelay();

    expect(contentGenerationAdd).toHaveBeenCalledWith(
      OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED,
      expect.objectContaining({
        event_id: event.event_id,
        event_type: OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED,
      }),
      expect.objectContaining({ jobId: event.event_id }),
    );
    expect(outboxRelayAdd).not.toHaveBeenCalled();
  });

  it('does not enqueue or process an unknown event', async () => {
    const event = eventFixture({ event_type: 'UNKNOWN_EVENT' });
    queryRaw.mockResolvedValue([event]);

    await service.pollAndRelay();

    expect(outboxRelayAdd).not.toHaveBeenCalled();
    expect(contentGenerationAdd).not.toHaveBeenCalled();
    expect(incrementOutboxEventFailed).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { event_id: event.event_id },
      data: {
        status: 'PENDING',
        retry_count: 1,
        last_error: 'Unsupported outbox event type: UNKNOWN_EVENT',
        processed_at: null,
      },
    });
  });

  it('keeps relay failures pending and fails the final attempt', async () => {
    const event = eventFixture({ retry_count: 4 });
    queryRaw.mockResolvedValue([event]);
    outboxRelayAdd.mockRejectedValue(new Error('redis unavailable'));

    await service.pollAndRelay();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { event_id: event.event_id },
      data: {
        status: 'FAILED',
        retry_count: 5,
        last_error: 'redis unavailable',
        processed_at: null,
      },
    });
    expect(incrementOutboxEventFailed).toHaveBeenCalledTimes(1);
    expect(incrementOutboxEventFailed).toHaveBeenCalledWith(
      OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
    );
  });

  it('propagates a status-write failure so the database transaction rolls back', async () => {
    const event = eventFixture();
    queryRaw.mockResolvedValue([event]);
    update.mockRejectedValue(new Error('database write failed'));

    await expect(service.pollAndRelay()).rejects.toThrow(
      'database write failed',
    );

    expect(outboxRelayAdd).toHaveBeenCalledWith(
      OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
      expect.any(Object),
      expect.objectContaining({ jobId: event.event_id }),
    );
  });

  it('has a queue constant for each injected queue', () => {
    expect(OUTBOX_QUEUE_NAMES).toEqual({
      CONTENT_GENERATION: 'content_generation',
      OUTBOX_RELAY: 'outbox_relay',
    });
  });
});
