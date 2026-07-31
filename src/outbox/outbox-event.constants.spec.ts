import {
  getOutboxQueueName,
  normalizeOutboxEventType,
  OUTBOX_EVENT_ROUTES,
  OUTBOX_EVENT_TYPES,
  OUTBOX_QUEUE_NAMES,
} from './outbox-event.constants';

describe('outbox event contract', () => {
  it('locks the canonical wire values', () => {
    expect(OUTBOX_EVENT_TYPES).toEqual({
      HEADING_GRAPH_PROJECT: 'HEADING_GRAPH_PROJECT',
      CONCEPT_GRAPH_PROJECT: 'CONCEPT_GRAPH_PROJECT',
      DOCUMENT_DELETED: 'DOCUMENT_DELETED',
      CONTENT_GENERATION_REQUESTED: 'CONTENT_GENERATION_REQUESTED',
      LESSON_PUBLISHED: 'LESSON_PUBLISHED',
    });
  });

  it.each([
    ['heading_graph_project', OUTBOX_EVENT_TYPES.HEADING_GRAPH_PROJECT],
    ['concept_graph_project', OUTBOX_EVENT_TYPES.CONCEPT_GRAPH_PROJECT],
    ['document_deleted', OUTBOX_EVENT_TYPES.DOCUMENT_DELETED],
  ])('normalizes legacy event type %s', (legacy, canonical) => {
    expect(normalizeOutboxEventType(legacy)).toBe(canonical);
  });

  it('uses an explicit route for every canonical event', () => {
    expect(OUTBOX_EVENT_ROUTES).toEqual({
      HEADING_GRAPH_PROJECT: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
      CONCEPT_GRAPH_PROJECT: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
      DOCUMENT_DELETED: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
      CONTENT_GENERATION_REQUESTED: OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
      LESSON_PUBLISHED: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
    });

    for (const eventType of Object.values(OUTBOX_EVENT_TYPES)) {
      expect(getOutboxQueueName(eventType)).toBe(
        OUTBOX_EVENT_ROUTES[eventType],
      );
    }
  });

  it('rejects an unknown event instead of falling through to a queue', () => {
    expect(() => getOutboxQueueName('SOMETHING_NEW')).toThrow(
      'Unsupported outbox event type: SOMETHING_NEW',
    );
  });
});
