import { DocumentService } from './document.service';

describe('DocumentService', () => {
  const claims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['instructor'],
    scope: 'course' as const,
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };

  function setup() {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ id: '00000000-0000-0000-0000-000000000003' }]),
      documents: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      chunks: { findMany: jest.fn().mockResolvedValue([]) },
      outbox_events: { deleteMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (callback) => callback(prisma)),
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const storage = {
      createPresignedUploadUrl: jest
        .fn()
        .mockResolvedValue('http://minio:9000/upload'),
      createPresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('http://minio:9000/download'),
    };
    const service = new DocumentService(
      prisma as never,
      authz as never,
      queue as never,
      storage as never,
    );

    return { service, prisma, queue, storage, authz };
  }

  it('does not create a document when object storage is unavailable', async () => {
    const { service, prisma, storage } = setup();
    storage.createPresignedUploadUrl.mockRejectedValue(
      new Error('storage unavailable'),
    );

    await expect(
      service.createUploadSession(claims, {
        courseId: '00000000-0000-0000-0000-000000000001',
        title: 'Syllabus',
        fileName: 'syllabus.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toThrow('storage unavailable');

    expect(prisma.documents.create).not.toHaveBeenCalled();
  });

  it('scopes system deletion to a live Canvas document in the requested course', async () => {
    const { service, prisma } = setup();
    prisma.documents.findFirst.mockResolvedValue(null);
    await expect(service.deleteCanvasDocument('course-1', 'doc-other')).rejects.toThrow('Canvas document not found');
    expect(prisma.documents.findFirst).toHaveBeenCalledWith({ where: {
      document_id: 'doc-other', course_id: 'course-1', source: 'canvas', deleted_at: null,
    } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('preserves deletion outbox behavior for system sync without requiring user claims', async () => {
    const { service, prisma, authz } = setup();
    prisma.documents.findFirst.mockResolvedValue({ document_id: 'doc-1', course_id: 'course-1', source: 'canvas' });
    await service.deleteCanvasDocument('course-1', 'doc-1');
    expect(authz.assertCourseAccess).not.toHaveBeenCalled();
    expect(prisma.outbox_events.create).toHaveBeenCalledWith({ data: {
      event_type: 'DOCUMENT_DELETED', aggregate_type: 'document', aggregate_id: 'doc-1',
      payload: { document_id: 'doc-1', course_id: 'course-1' },
    } });
    expect(prisma.documents.update).toHaveBeenCalledWith({
      where: { document_id: 'doc-1' }, data: { deleted_at: expect.any(Date) },
    });
  });

  it('uses the original storage filename in the processing job', async () => {
    const { service, prisma, queue } = setup();
    const document = {
      document_id: '00000000-0000-0000-0000-000000000003',
      course_id: '00000000-0000-0000-0000-000000000001',
      title: 'Tên tài liệu tùy chỉnh',
      file_path:
        'documents/00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000003/syllabus.pdf',
      status: 'UPLOADING',
      created_by: claims.sub,
    };
    prisma.documents.findFirst.mockResolvedValue(document);
    prisma.documents.update.mockResolvedValue({
      ...document,
      status: 'QUEUED',
    });

    await service.confirmUpload(claims, document.document_id);

    expect(queue.add).toHaveBeenCalledWith(
      'process_document',
      expect.objectContaining({
        storage_key: document.file_path,
        file_name: 'syllabus.pdf',
      }),
      expect.any(Object),
    );
  });
  const storedDocument = {
    document_id: '00000000-0000-0000-0000-000000000003',
    course_id: '00000000-0000-0000-0000-000000000001',
    title: 'Chương 1',
    file_path: 'documents/course-1/doc-1/ch1.pdf',
    mime_type: 'application/pdf',
    checksum: null,
    status: 'DONE',
    created_by: claims.sub,
    created_at: new Date(0),
    source: 'upload',
    lms_module: null,
    lms_published: null,
    role: 'lecture',
    role_provenance: 'inferred',
    chapter_code: null,
    chapter_provenance: null,
    chapter_confidence: null,
    chapter_reason: null,
    _count: { chunks: 12 },
  };

  it('narrows chunks to one page when a page is requested', async () => {
    const { service, prisma } = setup();
    prisma.documents.findFirst.mockResolvedValue(storedDocument);

    await service.getDocumentChunks(claims, storedDocument.document_id, 7);

    expect(prisma.chunks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          document_id: storedDocument.document_id,
          deleted_at: null,
          page_number: 7,
        }),
      }),
    );
  });

  it('reads the whole document when no page is requested', async () => {
    const { service, prisma } = setup();
    prisma.documents.findFirst.mockResolvedValue(storedDocument);

    await service.getDocumentChunks(claims, storedDocument.document_id);

    const where = prisma.chunks.findMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('page_number');
  });

  it('rejects a page index that cannot exist', async () => {
    const { service, prisma } = setup();
    prisma.documents.findFirst.mockResolvedValue(storedDocument);

    await expect(
      service.getDocumentChunks(claims, storedDocument.document_id, 0),
    ).rejects.toThrow('page');
    expect(prisma.chunks.findMany).not.toHaveBeenCalled();
  });

  it('signs a read URL for the stored object, not for the title', async () => {
    const { service, prisma, storage } = setup();
    prisma.documents.findFirst.mockResolvedValue(storedDocument);

    const result = await service.getDocumentFileUrl(
      claims,
      storedDocument.document_id,
    );

    expect(storage.createPresignedDownloadUrl).toHaveBeenCalledWith(
      storedDocument.file_path,
      expect.any(Number),
    );
    expect(result).toMatchObject({
      url: 'http://minio:9000/download',
      mime_type: 'application/pdf',
      file_name: 'ch1.pdf',
    });
  });

  it('does not sign a read URL while the object is still being uploaded', async () => {
    const { service, prisma, storage } = setup();
    prisma.documents.findFirst.mockResolvedValue({
      ...storedDocument,
      status: 'UPLOADING',
    });

    await expect(
      service.getDocumentFileUrl(claims, storedDocument.document_id),
    ).rejects.toThrow('chưa upload xong');
    expect(storage.createPresignedDownloadUrl).not.toHaveBeenCalled();
  });
});
