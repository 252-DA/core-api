import type { documents } from '@prisma/client';

/** Nguồn, vai trò và chương của tài liệu — cho màn hình tài liệu của giảng viên. */
function placementFields(doc: documents) {
  return {
    source: doc.source,
    lms_module: doc.lms_module,
    lms_published: doc.lms_published,
    role: doc.role,
    role_provenance: doc.role_provenance,
    chapter_code: doc.chapter_code,
    chapter_provenance: doc.chapter_provenance,
    chapter_confidence:
      doc.chapter_confidence === null ? null : Number(doc.chapter_confidence),
    chapter_reason: doc.chapter_reason,
  };
}

export function toDocumentView(doc: documents & { _count: { chunks: number } }) {
  return {
    document_id: doc.document_id,
    title: doc.title,
    file_path: doc.file_path,
    mime_type: doc.mime_type,
    checksum: doc.checksum,
    course_id: doc.course_id,
    status: doc.status,
    created_by: doc.created_by,
    created_at: doc.created_at,
    chunks_count: doc._count.chunks,
    ...placementFields(doc),
  };
}
