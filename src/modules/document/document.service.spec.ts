import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AuthzService } from '../../auth/authz.service';
import type { BffClaims } from '../../auth/bff-claims';

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
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      chunks: { findMany: jest.fn().mockResolvedValue([]) },
      outbox_events: { deleteMany: jest.fn(), create: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation(async (callback) => callback(prisma)),
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
      isCourseStaff: jest.fn().mockResolvedValue(true),
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
    await expect(
      service.deleteCanvasDocument('course-1', 'doc-other'),
    ).rejects.toThrow('Canvas document not found');
    expect(prisma.documents.findFirst).toHaveBeenCalledWith({
      where: {
        document_id: 'doc-other',
        course_id: 'course-1',
        source: 'canvas',
        deleted_at: null,
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('preserves deletion outbox behavior for system sync without requiring user claims', async () => {
    const { service, prisma, authz } = setup();
    prisma.documents.findFirst.mockResolvedValue({
      document_id: 'doc-1',
      course_id: 'course-1',
      source: 'canvas',
    });
    await service.deleteCanvasDocument('course-1', 'doc-1');
    expect(authz.assertCourseAccess).not.toHaveBeenCalled();
    expect(prisma.outbox_events.create).toHaveBeenCalledWith({
      data: {
        event_type: 'DOCUMENT_DELETED',
        aggregate_type: 'document',
        aggregate_id: 'doc-1',
        payload: { document_id: 'doc-1', course_id: 'course-1' },
      },
    });
    expect(prisma.documents.update).toHaveBeenCalledWith({
      where: { document_id: 'doc-1' },
      data: { deleted_at: expect.any(Date) },
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
      processing_generation: 1,
    });

    await service.confirmUpload(claims, document.document_id);

    expect(queue.add).toHaveBeenCalledWith(
      'process_document',
      expect.objectContaining({
        storage_key: document.file_path,
        file_name: 'syllabus.pdf',
        processing_generation: 1,
      }),
      expect.any(Object),
    );
    // QUEUED và lượt mới trong cùng một câu UPDATE.
    expect(prisma.documents.update).toHaveBeenCalledWith({
      where: { document_id: document.document_id },
      data: {
        status: 'QUEUED',
        processing_generation: { increment: 1 },
        processing_seq: 0,
      },
    });
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

  it('counts only live chunks (soft-deleted ones no longer count) in the list and in the detail', async () => {
    const { service, prisma } = setup();
    const liveOnly = {
      _count: { select: { chunks: { where: { deleted_at: null } } } },
    };
    prisma.documents.findMany.mockResolvedValue([storedDocument]);
    prisma.documents.findFirst.mockResolvedValue(storedDocument);

    const [listed] = await service.listDocuments(
      claims,
      storedDocument.course_id,
    );
    const detail = await service.getDocument(
      claims,
      storedDocument.document_id,
    );

    expect(prisma.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: liveOnly }),
    );
    expect(prisma.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ include: liveOnly }),
    );
    // Số đếm trả về là số Prisma đếm theo bộ lọc trên.
    expect(listed.chunks_count).toBe(12);
    expect(detail.chunks_count).toBe(12);
  });

  it('lists documents hidden on the LMS only to course staff', async () => {
    const { service, prisma, authz } = setup();
    const hiddenFilter = {
      OR: [{ lms_published: null }, { lms_published: true }],
    };

    authz.isCourseStaff.mockResolvedValue(false);
    await service.listDocuments(claims, storedDocument.course_id);
    expect(prisma.documents.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining(hiddenFilter) }),
    );

    authz.isCourseStaff.mockResolvedValue(true);
    await service.listDocuments(claims, storedDocument.course_id);
    const where = prisma.documents.findMany.mock.calls[1][0].where;
    expect(where).not.toHaveProperty('OR');
  });
});

describe('DocumentService hidden (lms_published = false) documents', () => {
  const COURSE = '00000000-0000-0000-0000-000000000001';
  const OTHER_COURSE = '00000000-0000-0000-0000-0000000000ff';
  const USER = '00000000-0000-0000-0000-000000000009';

  function claimsFor(overrides: Partial<BffClaims> = {}): BffClaims {
    return {
      sub: USER,
      roles: [],
      scope: 'course',
      jti: 'test-jti',
      iat: 0,
      exp: 1,
      ...overrides,
    };
  }

  function document(lmsPublished: boolean | null) {
    return {
      document_id: '00000000-0000-0000-0000-000000000003',
      course_id: COURSE,
      title: 'Đáp án giữa kỳ',
      file_path: 'documents/course-1/doc-1/answers.pdf',
      mime_type: 'application/pdf',
      checksum: null,
      status: 'DONE',
      created_by: USER,
      created_at: new Date(0),
      source: 'canvas',
      lms_module: 'Tuần 8',
      lms_published: lmsPublished,
      role: 'lecture',
      role_provenance: 'inferred',
      chapter_code: null,
      chapter_provenance: null,
      chapter_confidence: null,
      chapter_reason: null,
      _count: { chunks: 3 },
    };
  }

  /** Dùng AuthzService thật trên prisma giả, để quy tắc theo từng vai trò được kiểm tra thật. */
  function setup(
    opts: { memberships?: string[]; lmsRole?: string | null } = {},
  ) {
    const memberships = opts.memberships ?? [];
    const prisma = {
      documents: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      chunks: { findMany: jest.fn().mockResolvedValue([{ chunk_id: 'c1' }]) },
      course_memberships: {
        findFirst: jest.fn().mockImplementation(async ({ where }) => {
          if (where.course_id !== COURSE) return null;
          const wanted: string[] | undefined = where.role?.in;
          const role = memberships.find((r) => !wanted || wanted.includes(r));
          return role ? { role } : null;
        }),
      },
      lms_user_mappings: {
        findFirst: jest
          .fn()
          .mockResolvedValue(opts.lmsRole ? { role: opts.lmsRole } : null),
      },
    };
    const storage = {
      createPresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('http://minio:9000/download'),
    };
    const service = new DocumentService(
      prisma as never,
      new AuthzService(prisma as never) as never,
      { add: jest.fn() } as never,
      storage as never,
    );
    return { service, prisma, storage };
  }

  it('answers 404 to a learner for a hidden document, for the document, its chunks and its file', async () => {
    const { service, prisma, storage } = setup({ memberships: ['learner'] });
    prisma.documents.findFirst.mockResolvedValue(document(false));
    const id = document(false).document_id;

    await expect(service.getDocument(claimsFor(), id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.getDocumentChunks(claimsFor(), id),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.getDocumentFileUrl(claimsFor(), id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.chunks.findMany).not.toHaveBeenCalled();
    expect(storage.createPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('also hides a hidden document from an observer', async () => {
    const { service, prisma } = setup({ memberships: ['observer'] });
    prisma.documents.findFirst.mockResolvedValue(document(false));

    await expect(
      service.getDocument(claimsFor(), document(false).document_id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not tell a non-member that a hidden document exists', async () => {
    const { service, prisma } = setup({ memberships: [] });
    prisma.documents.findFirst.mockResolvedValue(document(false));

    await expect(
      service.getDocument(claimsFor(), document(false).document_id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([['instructor'], ['ta']])(
    'lets a course %s read a hidden document',
    async (role) => {
      const { service, prisma, storage } = setup({ memberships: [role] });
      prisma.documents.findFirst.mockResolvedValue(document(false));
      const id = document(false).document_id;

      await expect(service.getDocument(claimsFor(), id)).resolves.toMatchObject(
        {
          document_id: id,
          lms_published: false,
        },
      );
      await expect(
        service.getDocumentChunks(claimsFor(), id),
      ).resolves.toHaveLength(1);
      await expect(
        service.getDocumentFileUrl(claimsFor(), id),
      ).resolves.toMatchObject({
        url: 'http://minio:9000/download',
      });
      expect(storage.createPresignedDownloadUrl).toHaveBeenCalled();
    },
  );

  it('lets platform admin scope read a hidden document without any membership', async () => {
    const { service, prisma } = setup({ memberships: [] });
    prisma.documents.findFirst.mockResolvedValue(document(false));

    await expect(
      service.getDocument(
        claimsFor({ scope: 'admin' }),
        document(false).document_id,
      ),
    ).resolves.toMatchObject({ lms_published: false });
  });

  it('lets an LMS administrator who is a member of the course read a hidden document', async () => {
    const { service, prisma } = setup({
      memberships: ['learner'],
      lmsRole: 'administrator',
    });
    prisma.documents.findFirst.mockResolvedValue(document(false));

    await expect(
      service.getDocument(claimsFor(), document(false).document_id),
    ).resolves.toMatchObject({ lms_published: false });
  });

  it('still needs course membership for an LMS administrator (staff status is not course access)', async () => {
    const { service, prisma } = setup({
      memberships: [],
      lmsRole: 'administrator',
    });
    prisma.documents.findFirst.mockResolvedValue(document(false));

    await expect(
      service.getDocument(claimsFor(), document(false).document_id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([[true], [null]])(
    'keeps lms_published = %s readable by a learner',
    async (published) => {
      const { service, prisma, storage } = setup({ memberships: ['learner'] });
      prisma.documents.findFirst.mockResolvedValue(document(published));
      const id = document(published).document_id;

      await expect(service.getDocument(claimsFor(), id)).resolves.toMatchObject(
        { document_id: id },
      );
      await expect(
        service.getDocumentChunks(claimsFor(), id),
      ).resolves.toHaveLength(1);
      await expect(
        service.getDocumentFileUrl(claimsFor(), id),
      ).resolves.toMatchObject({
        url: 'http://minio:9000/download',
      });
      expect(storage.createPresignedDownloadUrl).toHaveBeenCalled();
    },
  );

  it('keeps the 403 for a learner of another course on a visible document', async () => {
    const { service, prisma } = setup({ memberships: [] });
    prisma.documents.findFirst.mockResolvedValue({
      ...document(true),
      course_id: OTHER_COURSE,
    });

    await expect(
      service.getDocument(claimsFor(), document(true).document_id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('hides lms_published = false documents from an observer listing, not from staff', async () => {
    const observer = setup({ memberships: ['observer'] });
    await observer.service.listDocuments(claimsFor(), COURSE);
    expect(observer.prisma.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ lms_published: null }, { lms_published: true }],
        }),
      }),
    );

    const instructor = setup({ memberships: ['instructor'] });
    await instructor.service.listDocuments(claimsFor(), COURSE);
    const where = instructor.prisma.documents.findMany.mock.calls[0][0].where;
    expect(where).toEqual({ course_id: COURSE, deleted_at: null });
  });
});
