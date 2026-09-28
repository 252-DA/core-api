import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  function setup(events: Array<Record<string, unknown>>) {
    const outboxEvents = {
      findMany: jest.fn().mockResolvedValue(events),
      updateMany: jest.fn().mockResolvedValue({ count: events.length }),
      update: jest.fn().mockResolvedValue({}),
    };
    const prisma = {
      outbox_events: outboxEvents,
      $transaction: jest.fn(
        async (
          callback: (client: {
            outbox_events: typeof outboxEvents;
          }) => Promise<unknown>,
        ) => callback({ outbox_events: outboxEvents }),
      ),
    };
    const relayQueue = {
      add: jest.fn().mockResolvedValue({ id: 'relay-job' }),
    };
    const contentGenerationQueue = {
      add: jest.fn().mockResolvedValue({ id: 'generation-job' }),
    };
    const service = new OutboxService(
      prisma as never,
      relayQueue as never,
      contentGenerationQueue as never,
    );

    return { service, outboxEvents, relayQueue, contentGenerationQueue };
  }

  it('routes content-generation requests to the content_generation queue', async () => {
    const event = {
      event_id: '00000000-0000-0000-0000-000000000001',
      event_type: 'CONTENT_GENERATION_REQUESTED',
      aggregate_type: 'content_generation_request',
      aggregate_id: '00000000-0000-0000-0000-000000000002',
      payload: {
        request_id: '00000000-0000-0000-0000-000000000002',
        course_id: '00000000-0000-0000-0000-000000000003',
        type: 'quiz',
        scope: { target_kind: 'lo', target_code: 'L.O.1.1' },
      },
      retry_count: 0,
    };
    const { service, relayQueue, contentGenerationQueue, outboxEvents } = setup(
      [event],
    );

    await service.pollAndRelay();

    expect(contentGenerationQueue.add).toHaveBeenCalledWith(
      'CONTENT_GENERATION_REQUESTED',
      {
        event_id: event.event_id,
        event_type: event.event_type,
        aggregate_type: event.aggregate_type,
        aggregate_id: event.aggregate_id,
        payload: event.payload,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    expect(relayQueue.add).not.toHaveBeenCalled();
    expect(outboxEvents.update).toHaveBeenCalledWith({
      where: { event_id: event.event_id },
      data: expect.objectContaining({
        status: 'PROCESSED',
        retry_count: 1,
      }),
    });
  });

  it('keeps non-generation events on the relay queue', async () => {
    const event = {
      event_id: '00000000-0000-0000-0000-000000000004',
      event_type: 'LESSON_PUBLISHED',
      aggregate_type: 'lesson',
      aggregate_id: '00000000-0000-0000-0000-000000000005',
      payload: { lesson_id: '00000000-0000-0000-0000-000000000005' },
      retry_count: 0,
    };
    const { service, relayQueue, contentGenerationQueue } = setup([event]);

    await service.pollAndRelay();

    expect(relayQueue.add).toHaveBeenCalledWith(
      'LESSON_PUBLISHED',
      expect.objectContaining({ event_id: event.event_id }),
      expect.any(Object),
    );
    expect(contentGenerationQueue.add).not.toHaveBeenCalled();
  });
});
