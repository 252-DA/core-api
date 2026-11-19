import { ForbiddenException } from '@nestjs/common';
import type { BffClaims } from '../../auth/bff-claims';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const claims: BffClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    roles: ['instructor'],
    scope: 'course',
    jti: 'test-jti',
    iat: 0,
    exp: 1,
  };
  const courseId = '00000000-0000-0000-0000-000000000001';

  function setup() {
    const tx = {
      quiz_items: {
        update: jest.fn().mockImplementation(async ({ where, data }) => ({
          quiz_id: where.quiz_id,
          ...data,
        })),
        findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) => ({
          quiz_id: where.quiz_id,
          current_version_id: 'v-after',
        })),
      },
      lesson_cards: {
        update: jest.fn().mockImplementation(async ({ where, data }) => ({
          card_id: where.card_id,
          ...data,
        })),
      },
      review_audit_logs: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      quiz_items: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      lesson_cards: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const bankAccess = {
      assertRole: jest
        .fn()
        .mockResolvedValue({ bank: { bank_id: 'b1' }, role: 'EDIT' }),
      assertAll: jest.fn().mockResolvedValue(undefined),
      viewer: jest.fn().mockResolvedValue({
        userId: claims.sub,
        isAdmin: false,
        isLearnerOnly: false,
        staffCourseIds: new Set([courseId]),
        subjectCodes: new Set(),
      }),
      visibleWhere: jest.fn().mockReturnValue({ deleted_at: null }),
    };
    const service = new ReviewService(
      prisma as never,
      authz as never,
      bankAccess as never,
    );
    return { service, prisma, tx, authz, bankAccess };
  }

  it('validates answer key before approving a single quiz item', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findFirst.mockResolvedValue({
      quiz_id: 'q1',
      course_id: courseId,
      type: 'MCQ_SINGLE',
      question: 'Thủ đô Việt Nam là gì?',
      options: ['Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ'],
      correct_answer: 'TP.HCM', // Không nằm trong options
      status: 'GENERATED_DRAFT',
    });

    await expect(service.approveQuizItem(claims, 'q1')).rejects.toThrow();
    expect(tx.quiz_items.update).not.toHaveBeenCalled();
  });

  it('approves multiple quiz items atomically in one transaction', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: 'q1',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 1?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        status: 'GENERATED_DRAFT',
      },
      {
        quiz_id: 'q2',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 2?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'D',
        status: 'GENERATED_DRAFT',
      },
    ]);

    await expect(
      service.approveQuizItems(claims, ['q1', 'q2']),
    ).resolves.toEqual({ approved: 2 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.quiz_items.update).toHaveBeenCalledTimes(2);
    expect(tx.review_audit_logs.create).toHaveBeenCalledTimes(2);
  });

  it('aborts batch approval before transaction if any item has an invalid answer key', async () => {
    const { service, prisma, tx } = setup();
    prisma.quiz_items.findMany.mockResolvedValue([
      {
        quiz_id: 'q1',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 1?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        status: 'GENERATED_DRAFT',
      },
      {
        quiz_id: 'q2',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Câu 2?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'Z', // Sai đáp án
        status: 'GENERATED_DRAFT',
      },
    ]);

    await expect(
      service.approveQuizItems(claims, ['q1', 'q2']),
    ).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.quiz_items.update).not.toHaveBeenCalled();
  });

  describe('verification record after an instructor edit', () => {
    const evidence = {
      criterion: 'source_grounding',
      judge_verdict: 'supported',
      judge_reason: 'Khớp slide 12.',
    };
    const aiQuiz = {
      quiz_id: 'q1',
      course_id: courseId,
      type: 'MCQ_SINGLE',
      question: 'Dijkstra cần gì?',
      options: ['Không âm', 'Âm', 'Bằng 0', 'Tuỳ ý'],
      correct_answer: 'Không âm',
      status: 'GENERATED_DRAFT',
      verification_status: 'VERIFIED',
      verification_evidence: evidence,
    };

    it('marks an edited AI quiz item UNVERIFIED and keeps the evidence, flagged as superseded', async () => {
      const { service, prisma, tx } = setup();
      prisma.quiz_items.findFirst.mockResolvedValue(aiQuiz);

      await service.updateQuizItem(claims, 'q1', {
        question: 'Dijkstra yêu cầu gì về trọng số?',
      });

      const [{ data }] = tx.quiz_items.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data).toMatchObject({
        status: 'REVIEWING',
        verification_status: 'UNVERIFIED',
      });
      expect(data.verification_evidence).toEqual({
        ...evidence,
        superseded_by_edit_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T/,
        ) as string,
      });
      // Một mốc thời gian cho cả lần sửa.
      expect(
        (data.verification_evidence as { superseded_by_edit_at: string })
          .superseded_by_edit_at,
      ).toBe((data.updated_at as Date).toISOString());
    });

    it('keeps the first superseded timestamp when edited again', async () => {
      const { service, prisma, tx } = setup();
      prisma.quiz_items.findFirst.mockResolvedValue({
        ...aiQuiz,
        verification_status: 'UNVERIFIED',
        verification_evidence: {
          ...evidence,
          superseded_by_edit_at: '2026-11-01T00:00:00.000Z',
        },
      });

      await service.updateQuizItem(claims, 'q1', {
        explanation: 'Slide 12 và 13.',
      });

      const [{ data }] = tx.quiz_items.update.mock.calls[0] as [
        { data: { verification_evidence: Record<string, unknown> } },
      ];
      expect(data.verification_evidence.superseded_by_edit_at).toBe(
        '2026-11-01T00:00:00.000Z',
      );
    });

    it.each([
      ['no evidence (instructor-written item)', null],
      ['evidence of an unexpected shape', ['legacy']],
    ])(
      'marks UNVERIFIED but leaves the evidence column alone for %s',
      async (_label, stored) => {
        const { service, prisma, tx } = setup();
        prisma.quiz_items.findFirst.mockResolvedValue({
          ...aiQuiz,
          verification_status: 'UNVERIFIED',
          verification_evidence: stored,
        });

        await service.updateQuizItem(claims, 'q1', {
          explanation: 'Thêm giải thích.',
        });

        const [{ data }] = tx.quiz_items.update.mock.calls[0] as [
          { data: Record<string, unknown> },
        ];
        expect(data.verification_status).toBe('UNVERIFIED');
        expect(data).not.toHaveProperty('verification_evidence');
      },
    );

    it('does the same for an edited lesson card', async () => {
      const { service, prisma, tx } = setup();
      prisma.lesson_cards.findFirst.mockResolvedValue({
        card_id: 'c1',
        course_id: courseId,
        status: 'GENERATED_DRAFT',
        content: { key_insight: 'cũ' },
        verification_status: 'FLAGGED',
        verification_evidence: evidence,
      });

      await service.updateCard(claims, 'c1', { key_insight: 'mới' });

      const [{ data }] = tx.lesson_cards.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data).toMatchObject({
        status: 'REVIEWING',
        verification_status: 'UNVERIFIED',
      });
      expect(data.verification_evidence).toMatchObject({
        ...evidence,
        superseded_by_edit_at: expect.any(String) as string,
      });
    });

    it('leaves the record alone for approve and reject (content unchanged)', async () => {
      const { service, prisma, tx } = setup();
      prisma.quiz_items.findFirst.mockResolvedValue(aiQuiz);

      await service.approveQuizItem(claims, 'q1');
      await service.rejectQuizItem(claims, 'q1', 'sai');

      for (const [{ data }] of tx.quiz_items.update.mock.calls as [
        { data: Record<string, unknown> },
      ][]) {
        expect(data).not.toHaveProperty('verification_status');
        expect(data).not.toHaveProperty('verification_evidence');
        expect(data).not.toHaveProperty('updated_by');
        expect(data).not.toHaveProperty('provenance');
      }
    });

    it('sets updated_by, resets provenance, re-reads current_version_id and logs version transition', async () => {
      const { service, prisma, tx } = setup();
      prisma.quiz_items.findFirst.mockResolvedValue({
        ...aiQuiz,
        current_version_id: 'v-before',
      });
      tx.quiz_items.findUniqueOrThrow.mockResolvedValue({
        ...aiQuiz,
        question: 'Câu đã sửa?',
        current_version_id: 'v-after',
      });

      const result = await service.updateQuizItem(claims, 'q1', {
        question: 'Câu đã sửa?',
      });

      expect(tx.quiz_items.update).toHaveBeenCalledWith({
        where: { quiz_id: 'q1' },
        data: expect.objectContaining({
          updated_by: claims.sub,
          provenance: {},
        }),
      });
      expect(tx.quiz_items.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { quiz_id: 'q1' },
      });
      expect(result.current_version_id).toBe('v-after');
      expect(tx.review_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'EDIT_QUIZ',
          raw_changes: expect.objectContaining({
            before_version_id: 'v-before',
            after_version_id: 'v-after',
          }),
        }),
      });
    });
  });

  describe('bank permission enforcement and bankId filter', () => {
    it('rejects review operations with 403 when caller lacks EDIT permission on bank', async () => {
      const { service, prisma, tx, bankAccess } = setup();
      prisma.quiz_items.findFirst.mockResolvedValue({
        quiz_id: 'q1',
        bank_id: 'b-other',
        course_id: courseId,
        type: 'MCQ_SINGLE',
        question: 'Q?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        status: 'GENERATED_DRAFT',
      });
      bankAccess.assertRole.mockRejectedValue(
        new ForbiddenException('Bạn không có quyền sửa ngân hàng câu hỏi này.'),
      );

      await expect(
        service.updateQuizItem(claims, 'q1', { question: 'Sửa?' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.approveQuizItem(claims, 'q1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.rejectQuizItem(claims, 'q1', 'sai')).rejects.toThrow(
        ForbiddenException,
      );
      expect(bankAccess.assertRole).toHaveBeenCalledWith(
        claims,
        'b-other',
        'EDIT',
      );
      expect(tx.quiz_items.update).not.toHaveBeenCalled();
    });

    it('checks bankAccess.assertAll(EDIT) on batch approval', async () => {
      const { service, prisma, tx, bankAccess } = setup();
      prisma.quiz_items.findMany.mockResolvedValue([
        {
          quiz_id: 'q1',
          bank_id: 'b1',
          course_id: courseId,
          type: 'MCQ_SINGLE',
          question: 'Q1?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          status: 'GENERATED_DRAFT',
        },
        {
          quiz_id: 'q2',
          bank_id: 'b2',
          course_id: courseId,
          type: 'MCQ_SINGLE',
          question: 'Q2?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'B',
          status: 'GENERATED_DRAFT',
        },
      ]);
      bankAccess.assertAll.mockRejectedValueOnce(
        new ForbiddenException('forbidden'),
      );

      await expect(
        service.approveQuizItems(claims, ['q1', 'q2']),
      ).rejects.toThrow(ForbiddenException);
      expect(bankAccess.assertAll).toHaveBeenCalledWith(
        claims,
        ['b1', 'b2'],
        'EDIT',
      );
      expect(tx.quiz_items.update).not.toHaveBeenCalled();
    });

    it('listDrafts filters by bankId (checking VIEW) and scopes by visibleWhere otherwise', async () => {
      const { service, prisma, bankAccess } = setup();
      prisma.quiz_items.findMany.mockResolvedValue([]);

      await service.listDrafts(claims, courseId, 'quiz', 'b-1');
      expect(bankAccess.assertRole).toHaveBeenCalledWith(claims, 'b-1', 'VIEW');
      expect(prisma.quiz_items.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ bank_id: 'b-1' }),
        }),
      );

      await service.listDrafts(claims, courseId, 'quiz');
      expect(bankAccess.visibleWhere).toHaveBeenCalled();
      expect(prisma.quiz_items.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            course_id: courseId,
            question_banks: { deleted_at: null },
          }),
        }),
      );
    });
  });
});
