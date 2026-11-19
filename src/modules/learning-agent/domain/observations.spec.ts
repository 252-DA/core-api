import { learnerLoStates } from './learner-state';
import { normalizeAttempts, type AttemptEvidence } from './observations';

let seq = 0;
function attempt(over: Partial<AttemptEvidence>): AttemptEvidence {
  seq++;
  return {
    attemptId: `a${String(seq).padStart(3, '0')}`,
    quizId: `q${seq}`,
    loId: 'lo-1',
    type: 'MCQ_SINGLE',
    optionCount: 4,
    question: `Câu ${seq}`,
    isCorrect: true,
    gradingStatus: 'GRADED',
    attemptedAt: new Date(Date.UTC(2026, 10, 1, 0, seq)),
    source: 'practice',
    hidden: false,
    ...over,
  };
}

describe('normalizeAttempts', () => {
  it('chỉ lần trả lời đầu của một câu là bằng chứng; làm lại chỉ được đếm', () => {
    const first = attempt({
      quizId: 'q-x',
      question: 'Dữ liệu lớn là gì?',
      isCorrect: false,
    });
    const again = attempt({
      quizId: 'q-x',
      question: 'Dữ liệu lớn là gì?',
      isCorrect: true,
    });
    const result = normalizeAttempts([again, first]);
    expect(result.observations.map((o) => [o.attemptId, o.correct])).toEqual([
      [first.attemptId, false],
    ]);
    expect(result.repeats.get('lo-1')).toBe(1);
  });

  it('gộp câu trùng văn bản sau khi chuẩn hoá hoa thường và khoảng trắng', () => {
    const a = attempt({
      quizId: 'q-a',
      question: 'Min-hashing  dùng để làm gì?',
    });
    const b = attempt({
      quizId: 'q-b',
      question: 'min-hashing dùng để làm gì? ',
    });
    expect(normalizeAttempts([a, b]).observations).toHaveLength(1);
  });

  it('chờ chấm, chờ duyệt và bài kiểm tra chưa công bố là đang chờ, không phải sai', () => {
    const rows = [
      attempt({
        type: 'SHORT_ANSWER',
        optionCount: null,
        gradingStatus: 'PENDING',
        isCorrect: false,
      }),
      attempt({
        type: 'SHORT_ANSWER',
        optionCount: null,
        gradingStatus: 'NEEDS_REVIEW',
        isCorrect: false,
      }),
      attempt({ source: 'exam', hidden: true, isCorrect: false }),
    ];
    const result = normalizeAttempts(rows);
    expect(result.observations).toEqual([]);
    expect(result.pending.map((p) => p.reason)).toEqual([
      'grading',
      'review',
      'not_revealed',
    ]);
    const [state] = learnerLoStates(['lo-1'], result);
    expect(state.status).toBe('insufficient_evidence');
    expect(state.mastery).toBe(0.2);
    expect(state.pending).toEqual({ grading: 1, review: 1, not_revealed: 1 });
  });

  it('câu đã gặp lần đầu trong bài kiểm tra chưa công bố không thành câu mới khi làm lại ở bài luyện', () => {
    const exam = attempt({
      quizId: 'q-e',
      question: 'Kafka là gì?',
      source: 'exam',
      hidden: true,
    });
    const practice = attempt({ quizId: 'q-e', question: 'Kafka là gì?' });
    const result = normalizeAttempts([exam, practice]);
    expect(result.observations).toEqual([]);
    expect(result.pending).toHaveLength(1);
  });

  it('bỏ câu không gắn LO hoặc không rõ loại', () => {
    const rows = [attempt({ loId: null }), attempt({ type: 'ESSAY' })];
    expect(normalizeAttempts(rows).observations).toEqual([]);
  });

  it('dựng lại theo thời điểm làm bài, không theo thứ tự đọc từ DB', () => {
    const late = attempt({
      attemptedAt: new Date('2026-11-03T00:00:00Z'),
      isCorrect: true,
    });
    const early = attempt({
      attemptedAt: new Date('2026-11-01T00:00:00Z'),
      isCorrect: false,
    });
    const result = normalizeAttempts([late, early]);
    expect(result.observations.map((o) => o.correct)).toEqual([false, true]);
  });
});

describe('learnerLoStates', () => {
  it('tách theo LO; LO không có quan sát vẫn có mặt', () => {
    const rows = [
      attempt({ loId: 'lo-1', isCorrect: true }),
      attempt({ loId: 'lo-1', isCorrect: false }),
      attempt({ loId: 'lo-1', isCorrect: false }),
      attempt({ loId: 'lo-2', isCorrect: true }),
    ];
    const states = learnerLoStates(
      ['lo-1', 'lo-2', 'lo-3'],
      normalizeAttempts(rows),
    );
    expect(
      states.map((s) => [
        s.loId,
        s.observations,
        s.correct,
        s.consecutiveWrong,
        s.status,
      ]),
    ).toEqual([
      ['lo-1', 3, 1, 2, 'practicing'],
      ['lo-2', 1, 1, 0, 'practicing'],
      ['lo-3', 0, 0, 0, 'insufficient_evidence'],
    ]);
  });

  it('P(L) đã vượt ngưỡng nhưng mới hai quan sát thì vẫn là thiếu bằng chứng', () => {
    const rows = [1, 2].map(() =>
      attempt({ type: 'FILL_BLANK', optionCount: null }),
    );
    const [state] = learnerLoStates(['lo-1'], normalizeAttempts(rows));
    expect(state.mastery).toBeGreaterThan(0.95);
    expect(state.status).toBe('insufficient_evidence');
  });

  it('ghi lúc đạt lần đầu và giữ lại khi P(L) tụt sau đó', () => {
    const rows = [
      ...[1, 2, 3].map(() => attempt({ isCorrect: true })),
      attempt({ type: 'TRUE_FALSE', optionCount: 2, isCorrect: false }),
      attempt({ type: 'TRUE_FALSE', optionCount: 2, isCorrect: false }),
    ];
    const [state] = learnerLoStates(['lo-1'], normalizeAttempts(rows));
    expect(state.firstMasteredAt).toEqual(rows[2].attemptedAt);
    expect(state.status).toBe('practicing');
    expect(state.consecutiveWrong).toBe(2);
  });
});
