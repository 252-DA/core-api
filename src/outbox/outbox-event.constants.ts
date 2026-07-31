export const OUTBOX_EVENT_TYPES = {
  HEADING_GRAPH_PROJECT: 'HEADING_GRAPH_PROJECT',
  CONCEPT_GRAPH_PROJECT: 'CONCEPT_GRAPH_PROJECT',
  DOCUMENT_DELETED: 'DOCUMENT_DELETED',
  CONTENT_GENERATION_REQUESTED: 'CONTENT_GENERATION_REQUESTED',
  LESSON_PUBLISHED: 'LESSON_PUBLISHED',
} as const;

export type OutboxEventType =
  (typeof OUTBOX_EVENT_TYPES)[keyof typeof OUTBOX_EVENT_TYPES];

export const OUTBOX_QUEUE_NAMES = {
  CONTENT_GENERATION: 'content_generation',
  OUTBOX_RELAY: 'outbox_relay',
} as const;

export type OutboxQueueName =
  (typeof OUTBOX_QUEUE_NAMES)[keyof typeof OUTBOX_QUEUE_NAMES];

const LEGACY_EVENT_TYPES: Readonly<Record<string, OutboxEventType>> = {
  heading_graph_project: OUTBOX_EVENT_TYPES.HEADING_GRAPH_PROJECT,
  concept_graph_project: OUTBOX_EVENT_TYPES.CONCEPT_GRAPH_PROJECT,
  document_deleted: OUTBOX_EVENT_TYPES.DOCUMENT_DELETED,
};

export const OUTBOX_EVENT_ROUTES = {
  [OUTBOX_EVENT_TYPES.HEADING_GRAPH_PROJECT]: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
  [OUTBOX_EVENT_TYPES.CONCEPT_GRAPH_PROJECT]: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
  [OUTBOX_EVENT_TYPES.DOCUMENT_DELETED]: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
  [OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED]:
    OUTBOX_QUEUE_NAMES.CONTENT_GENERATION,
  [OUTBOX_EVENT_TYPES.LESSON_PUBLISHED]: OUTBOX_QUEUE_NAMES.OUTBOX_RELAY,
} as const satisfies Readonly<Record<OutboxEventType, OutboxQueueName>>;

export function normalizeOutboxEventType(eventType: string): OutboxEventType {
  const normalized = LEGACY_EVENT_TYPES[eventType] ?? eventType;
  switch (normalized) {
    case OUTBOX_EVENT_TYPES.HEADING_GRAPH_PROJECT:
    case OUTBOX_EVENT_TYPES.CONCEPT_GRAPH_PROJECT:
    case OUTBOX_EVENT_TYPES.DOCUMENT_DELETED:
    case OUTBOX_EVENT_TYPES.CONTENT_GENERATION_REQUESTED:
    case OUTBOX_EVENT_TYPES.LESSON_PUBLISHED:
      return normalized;
    default:
      throw new Error(`Unsupported outbox event type: ${eventType}`);
  }
}

export function getOutboxQueueName(eventType: string): OutboxQueueName {
  return OUTBOX_EVENT_ROUTES[normalizeOutboxEventType(eventType)];
}
