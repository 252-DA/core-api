-- Canonicalize the three event names emitted by the original Python pipeline.
-- The UPDATE is intentionally safe to run again.
UPDATE outbox_events
SET event_type = CASE event_type
    WHEN 'heading_graph_project' THEN 'HEADING_GRAPH_PROJECT'
    WHEN 'concept_graph_project' THEN 'CONCEPT_GRAPH_PROJECT'
    WHEN 'document_deleted' THEN 'DOCUMENT_DELETED'
    ELSE event_type
END
WHERE event_type IN (
    'heading_graph_project',
    'concept_graph_project',
    'document_deleted'
);

-- PostgreSQL is the cross-language contract between TypeScript producers and
-- Python consumers. NOT VALID allows the constraint to be installed before its
-- explicit validation while still checking concurrent writes.
ALTER TABLE outbox_events
    DROP CONSTRAINT IF EXISTS outbox_events_event_type_check;

ALTER TABLE outbox_events
    ADD CONSTRAINT outbox_events_event_type_check
    CHECK (
        event_type IN (
            'HEADING_GRAPH_PROJECT',
            'CONCEPT_GRAPH_PROJECT',
            'DOCUMENT_DELETED',
            'CONTENT_GENERATION_REQUESTED',
            'LESSON_PUBLISHED'
        )
    ) NOT VALID;

ALTER TABLE outbox_events
    VALIDATE CONSTRAINT outbox_events_event_type_check;
