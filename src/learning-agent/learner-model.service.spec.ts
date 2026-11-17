import { ForbiddenException } from '@nestjs/common';
import { AuthzService } from '../auth/authz.service';
import { LearnerModelService } from './learner-model.service';
import type { BffClaims } from '../auth/bff-claims';

const COURSE = '00000000-0000-0000-0000-000000000001';
const STUDENT = '00000000-0000-0000-0000-000000000002';
const TEACHER = '00000000-0000-0000-0000-000000000003';
const PRACTICE = '00000000-0000-0000-0000-000000000004';
const EXAM = '00000000-0000-0000-0000-000000000005';
const LO1 = '00000000-0000-0000-0000-000000000006';
const LO2 = '00000000-0000-0000-0000-000000000007';

const claims = (sub: string, roles: string[]): BffClaims => ({
  sub,
  courseId: COURSE,
  scope: 'course',
  roles,
  jti: 't',
  iat: 0,
  exp: 1,
});

const item = (quiz_id: string, lo_id: string, question = `Câu ${quiz_id}`) => ({
  quiz_id,
  lo_id,
  type: 'MCQ_SINGLE',
  question,
  options: ['a', 'b', 'c', 'd'],
  correct_answer: 'a',
  explanation: null,
  bloom_level: 2,
  source_chunk_ids: [],
});

function set(quiz_set_id: string, mode: string, items: ReturnType<typeof item>[], closesAt?: Date) {
  return {
    quiz_set_id,
    course_id: COURSE,
    mode,
    items,
    deleted_at: null,
    available_from: null,
    available_until: closesAt ?? null,
    due_at: null,
    points_possible: 100,
    max_attempts: null,
    time_limit_minutes: null,
    shuffle: false,
  };
}

function attempt(n: number, quiz_id: string, setId: string | null, isCorrect: boolean, bank = item(quiz_id, LO1)) {
  return {
    attempt_id: `a${n}`,
    user_id: STUDENT,
    quiz_id,
    is_correct: isCorrect,
    grading_status: 'GRADED',
    attempted_at: new Date(Date.UTC(2026, 10, 1, 0, n)),
    quiz_items: bank,
    lti_resource_links: setId ? { target_kind: 'quiz_set', target_id: setId } : null,
  };
}

function setup(attempts: ReturnType<typeof attempt>[], sets: ReturnType<typeof set>[]) {
  const prisma = {
    learning_outcomes: {
      findMany: jest.fn().mockResolvedValue([
        { lo_id: LO2, code: 'L.O.1.10', parent_code: 'L.O.1', statement_vi: 'B', bloom_level: 2 },
        { lo_id: LO1, code: 'L.O.1.2', parent_code: 'L.O.1', statement_vi: 'A', bloom_level: 2 },
      ]),
    },
    quiz_sets: { findMany: jest.fn().mockResolvedValue(sets) },
    quiz_attempts: { findMany: jest.fn().mockResolvedValue(attempts) },
    quiz_items: {
      findMany: jest.fn().mockResolvedValue([
        item('q1', LO1),
        item('q2', LO1),
        item('q2-copy', LO1, 'Câu q2'),
        item('q3', LO1),
        item('q4', LO2),
      ]),
    },
    lms_user_mappings: {
      findMany: jest.fn().mockResolvedValue([{ internal_user_id: STUDENT, display_name: 'An' }]),
    },
  };
  const authz = {
    assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    assertSessionCourse: AuthzService.prototype.assertSessionCourse,
  };
  // Mẫu số lớp lấy từ danh sách lớp (membership learner đang hoạt động), không từ lượt làm bài.
  const roster = { activeLearnerIds: jest.fn().mockResolvedValue([STUDENT]) };
  return {
    service: new LearnerModelService(prisma as any, authz as any, roster as any),
    prisma,
    authz,
    roster,
  };
}

describe('LearnerModelService', () => {
  it('dựng mức nắm từ lượt làm, xếp LO theo mã số', async () => {
    const practice = set(PRACTICE, 'practice', [item('q1', LO1), item('q2', LO1), item('q3', LO1)]);
    const { service } = setup(
      [attempt(1, 'q1', PRACTICE, true), attempt(2, 'q2', PRACTICE, true), attempt(3, 'q3', PRACTICE, true)],
      [practice],
    );
    const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
    expect(result.los.map((lo) => lo.code)).toEqual(['L.O.1.2', 'L.O.1.10']);
    expect(result.los[0]).toMatchObject({ observations: 3, status: 'mastered' });
    expect(result.los[1]).toMatchObject({ observations: 0, status: 'insufficient_evidence', mastery: 0.2 });
  });

  it('lấy LO theo snapshot của đề, không theo ngân hàng đã sửa sau', async () => {
    const practice = set(PRACTICE, 'practice', [item('q1', LO2)]);
    const { service } = setup([attempt(1, 'q1', PRACTICE, true, item('q1', LO1))], [practice]);
    const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
    expect(result.los.find((lo) => lo.loId === LO2)?.observations).toBe(1);
    expect(result.los.find((lo) => lo.loId === LO1)?.observations).toBe(0);
  });

  it('bài kiểm tra chưa công bố đáp án là đang chờ, kể cả với giảng viên', async () => {
    const exam = set(EXAM, 'exam', [item('q1', LO1)], new Date(Date.now() + 3600_000));
    const { service } = setup([attempt(1, 'q1', EXAM, false)], [exam]);
    const mine = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
    expect(mine.los[0]).toMatchObject({ observations: 0, pending: { not_revealed: 1 } });
    const staff = await service.courseMastery(claims(TEACHER, ['instructor']), { courseId: COURSE });
    expect(staff.students[0].los[0]).toMatchObject({ observations: 0, pending: { not_revealed: 1 } });
  });

  it('sau khi công bố, câu kiểm tra được tính như bằng chứng', async () => {
    const exam = set(EXAM, 'exam', [item('q1', LO1)], new Date(Date.now() - 3600_000));
    const { service } = setup([attempt(1, 'q1', EXAM, false)], [exam]);
    const mine = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
    expect(mine.los[0]).toMatchObject({ observations: 1, consecutiveWrong: 1 });
  });

  describe('giờ đóng theo Assignment Canvas', () => {
    const canvasLink = (lockAt: Date | null, synced = true) =>
      ({
        target_kind: 'quiz_set',
        target_id: EXAM,
        assignment_synced_at: synced ? new Date() : null,
        assignment_due_at: lockAt,
        assignment_unlock_at: null,
        assignment_lock_at: lockAt,
        assignment_allowed_attempts: null,
      }) as never;
    const examAttempt = (link: unknown) =>
      ({ ...attempt(1, 'q1', EXAM, false), lti_resource_links: link }) as ReturnType<typeof attempt>;

    it('Canvas dời giờ đóng sớm lại thì đáp án đã công bố, dù đề còn hạn lúc Deep Linking', async () => {
      const exam = set(EXAM, 'exam', [item('q1', LO1)], new Date(Date.now() + 3600_000));
      const { service } = setup(
        [examAttempt(canvasLink(new Date(Date.now() - 3600_000)))],
        [exam],
      );
      const mine = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(mine.los[0]).toMatchObject({ observations: 1, consecutiveWrong: 1 });
    });

    it('Canvas gia hạn thì đáp án chưa công bố, dù đề đã hết hạn lúc Deep Linking', async () => {
      const exam = set(EXAM, 'exam', [item('q1', LO1)], new Date(Date.now() - 3600_000));
      const { service } = setup(
        [examAttempt(canvasLink(new Date(Date.now() + 3600_000)))],
        [exam],
      );
      const mine = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(mine.los[0]).toMatchObject({ observations: 0, pending: { not_revealed: 1 } });
    });

    it('link chưa đọc từ Canvas thì vẫn theo cài đặt của đề', async () => {
      const exam = set(EXAM, 'exam', [item('q1', LO1)], new Date(Date.now() - 3600_000));
      const { service } = setup(
        [examAttempt(canvasLink(new Date(Date.now() + 3600_000), false))],
        [exam],
      );
      const mine = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(mine.los[0]).toMatchObject({ observations: 1 });
    });
  });

  it('kho luyện bỏ câu thuộc đề Kiểm tra và gộp câu trùng văn bản', async () => {
    const exam = set(EXAM, 'exam', [item('q1', LO1)]);
    const { service } = setup([], [exam]);
    const result = await service.courseMastery(claims(TEACHER, ['instructor']), { courseId: COURSE });
    const lo1 = result.los.find((lo) => lo.loId === LO1)!;
    expect(lo1.bank).toEqual({ practice: 2, byType: { MCQ_SINGLE: 2 }, inExam: 1, low: true });
    expect(result.students.map((s) => s.name)).toEqual(['An']);
  });

  it('bảng cả lớp có cả sinh viên chưa làm bài và người đã rời lớp nhưng còn bằng chứng', async () => {
    const OTHER = '00000000-0000-0000-0000-000000000008';
    const LEFT = '00000000-0000-0000-0000-000000000009';
    const practice = set(PRACTICE, 'practice', [item('q1', LO1)]);
    const { service, prisma, roster } = setup([{ ...attempt(1, 'q1', PRACTICE, true), user_id: LEFT }], [practice]);
    roster.activeLearnerIds.mockResolvedValue([STUDENT, OTHER]);
    prisma.lms_user_mappings.findMany.mockResolvedValue([
      { internal_user_id: STUDENT, display_name: 'An' },
      { internal_user_id: OTHER, display_name: 'Bình' },
      { internal_user_id: LEFT, display_name: 'Cường' },
    ]);
    const result = await service.courseMastery(claims(TEACHER, ['instructor']), { courseId: COURSE });
    expect(roster.activeLearnerIds).toHaveBeenCalledWith(COURSE);
    expect(result.students.map((s) => s.name)).toEqual(['An', 'Bình', 'Cường']);
    expect(result.students.find((s) => s.userId === OTHER)!.los[0]).toMatchObject({ observations: 0 });
    expect(result.students.find((s) => s.userId === LEFT)!.los[0]).toMatchObject({ observations: 1 });
  });

  it('xem của sinh viên khác cần quyền giảng viên/trợ giảng', async () => {
    const { service, authz } = setup([], []);
    await service.summary(claims(TEACHER, ['instructor']), { courseId: COURSE, userId: STUDENT });
    expect(authz.assertCourseAccess).toHaveBeenCalledWith(expect.anything(), COURSE, ['instructor', 'ta']);
  });

  it('từ chối khoá không khớp phiên', async () => {
    const { service } = setup([], []);
    await expect(
      service.summary(claims(STUDENT, ['learner']), { courseId: '00000000-0000-0000-0000-0000000000ff' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('tính kết quả bài micro-content gắn lo_id vào mức đạt LO của người học', async () => {
    const { service, prisma } = setup([], []);
    (prisma as Record<string, unknown>).micro_content_answers = {
      findMany: jest.fn().mockResolvedValue([
        {
          answer_id: 'mc-ans-1',
          question_id: 'mc-q-1',
          is_correct: true,
          grading_status: 'GRADED',
          created_at: new Date('2026-11-15T10:00:00Z'),
          attempt: {
            user_id: STUDENT,
            submitted_at: new Date('2026-11-15T10:00:00Z'),
            micro_contents: { lo_id: LO1 },
          },
          question: {
            type: 'MCQ_SINGLE',
            options: ['A', 'B', 'C', 'D'],
            question: 'RDD là gì?',
          },
        },
        {
          answer_id: 'mc-ans-2',
          question_id: 'mc-q-2',
          is_correct: true,
          grading_status: 'GRADED',
          created_at: new Date('2026-11-15T10:01:00Z'),
          attempt: {
            user_id: STUDENT,
            submitted_at: new Date('2026-11-15T10:01:00Z'),
            micro_contents: { lo_id: LO1 },
          },
          question: {
            type: 'TRUE_FALSE',
            options: ['Đúng', 'Sai'],
            question: 'Spark chạy in-memory.',
          },
        },
        {
          answer_id: 'mc-ans-3',
          question_id: 'mc-q-3',
          is_correct: false,
          grading_status: 'PENDING',
          created_at: new Date('2026-11-15T10:02:00Z'),
          attempt: {
            user_id: STUDENT,
            submitted_at: new Date('2026-11-15T10:02:00Z'),
            micro_contents: { lo_id: LO1 },
          },
          question: {
            type: 'SHORT_ANSWER',
            options: null,
            question: 'Giải thích lazy evaluation.',
          },
        },
      ]),
    };

    const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
    const lo1 = result.los.find((lo) => lo.loId === LO1)!;

    expect(lo1.observations).toBe(2);
    expect(lo1.mastery).toBeGreaterThan(0.5);
    expect(lo1.pending).toMatchObject({ grading: 1, not_revealed: 0, review: 0 });
  });

  describe('lịch ôn và planner', () => {
    const masteredPractice = () =>
      set(PRACTICE, 'practice', [item('q1', LO1), item('q2', LO1), item('q3', LO1)]);

    it('LO đã đạt có lịch ôn; quá hạn thì planner đề xuất ôn (A4)', async () => {
      const { service } = setup(
        [
          attempt(1, 'q1', PRACTICE, true),
          attempt(2, 'q2', PRACTICE, true),
          attempt(3, 'q3', PRACTICE, true),
        ],
        [masteredPractice()],
      );
      const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      const lo1 = result.los.find((lo) => lo.loId === LO1)!;
      // Lần đạt đầu 2026-11-01, hộp đầu nhắc sau 1 ngày nên giờ đã quá hạn.
      expect(lo1.review).toMatchObject({ loId: LO1, box: 0, needsRecheck: false, due: true });
      expect(result.los.find((lo) => lo.loId === LO2)!.review).toBeNull();
      expect(result.plan).toMatchObject({ action: 'A4', loId: LO1, rule: 'R1', reason: 'review_due' });
    });

    it('LO chưa đạt và còn câu chưa gặp thì planner đề xuất luyện tiếp (A1)', async () => {
      const { service } = setup([attempt(1, 'q1', PRACTICE, false)], [masteredPractice()]);
      const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(result.los.find((lo) => lo.loId === LO1)!.review).toBeNull();
      expect(result.plan).toMatchObject({ action: 'A1', loId: LO1, rule: 'R4', reason: 'need_evidence' });
    });

    it('sai liên tiếp mà thiếu nguồn thì rơi về luyện tiếp và báo thiếu nguồn', async () => {
      const { service } = setup(
        [attempt(1, 'q1', PRACTICE, false), attempt(2, 'q2', PRACTICE, false)],
        [masteredPractice()],
      );
      const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(result.plan).toMatchObject({ action: 'A1', rule: 'R4', reason: 'need_evidence' });
      expect(result.plan.issues).toContainEqual({ loId: LO1, issue: 'missing_source' });
    });

    it('có nguồn gắn LO thì planner đề xuất xem lại nguồn (A3)', async () => {
      const { service, prisma } = setup(
        [attempt(1, 'q1', PRACTICE, false), attempt(2, 'q2', PRACTICE, false)],
        [masteredPractice()],
      );
      (prisma as Record<string, unknown>).chunk_lo_mappings = {
        findMany: jest.fn().mockResolvedValue([{ lo_id: LO1 }]),
      };
      const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(result.plan).toMatchObject({ action: 'A3', loId: LO1, rule: 'R3', reason: 'wrong_streak' });
    });

    it('đủ giới hạn câu trong ngày thì chỉ còn nghỉ (A0)', async () => {
      const rows = Array.from({ length: 30 }, (_, i) => ({
        ...attempt(i + 1, `qt${i}`, PRACTICE, true, item(`qt${i}`, LO2)),
        attempted_at: new Date(),
      }));
      const practice = set(PRACTICE, 'practice', rows.map((row) => row.quiz_items));
      const { service } = setup(rows, [practice]);
      const result = await service.summary(claims(STUDENT, ['learner']), { courseId: COURSE });
      expect(result.plan).toMatchObject({ action: 'A0', loId: null, rule: 'R0', reason: 'daily_limit' });
    });
  });
});
