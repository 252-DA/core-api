import { ForbiddenException } from '@nestjs/common';
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
    course_memberships: { findMany: jest.fn().mockResolvedValue([{ user_id: STUDENT }]) },
    lms_user_mappings: {
      findMany: jest.fn().mockResolvedValue([{ internal_user_id: STUDENT, display_name: 'An' }]),
    },
  };
  const authz = { assertCourseAccess: jest.fn().mockResolvedValue(undefined) };
  return { service: new LearnerModelService(prisma as any, authz as any), prisma, authz };
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

  it('kho luyện bỏ câu thuộc đề Kiểm tra và gộp câu trùng văn bản', async () => {
    const exam = set(EXAM, 'exam', [item('q1', LO1)]);
    const { service } = setup([], [exam]);
    const result = await service.courseMastery(claims(TEACHER, ['instructor']), { courseId: COURSE });
    const lo1 = result.los.find((lo) => lo.loId === LO1)!;
    expect(lo1.bank).toEqual({ practice: 2, byType: { MCQ_SINGLE: 2 }, inExam: 1, low: true });
    expect(result.students.map((s) => s.name)).toEqual(['An']);
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
});
