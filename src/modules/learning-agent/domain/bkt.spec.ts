import { BKT_DEFAULTS, bktUpdate, guessFor, meetsCriterion } from './bkt';
import {
  bktPolicy,
  consecutiveCorrectPolicy,
  emaPolicy,
  replay,
  type PolicyObservation,
} from './mastery-policy';
import type { QuestionType } from '../../question/question-types';

const obs = (type: QuestionType, correct: boolean): PolicyObservation => ({
  type,
  optionCount: type === 'MCQ_SINGLE' ? 4 : type === 'TRUE_FALSE' ? 2 : null,
  correct,
});

/** Số câu đúng liên tiếp từ P(L₀) đến khi P(L) vượt ngưỡng. */
function correctUntil(type: QuestionType, threshold: number) {
  let p = BKT_DEFAULTS.prior;
  let n = 0;
  while (p < threshold) {
    p = bktUpdate(p, true, guessFor(type, obs(type, true).optionCount));
    n++;
  }
  return n;
}

describe('BKT', () => {
  it('G theo loại câu; MCQ_SINGLE là 1/k theo số phương án', () => {
    expect(guessFor('TRUE_FALSE', 2)).toBe(0.5);
    expect(guessFor('MCQ_SINGLE', 4)).toBe(0.25);
    expect(guessFor('MCQ_SINGLE', 5)).toBe(0.2);
    expect(guessFor('MCQ_SINGLE', null)).toBe(0.25);
    expect(guessFor('MCQ_MULTI', null)).toBe(0.1);
    expect(guessFor('FILL_BLANK', null)).toBe(0.05);
    expect(guessFor('SHORT_ANSWER', null)).toBe(0.05);
  });

  it('khớp ví dụ tính ở §7.5 của báo cáo', () => {
    const history = [
      obs('MCQ_SINGLE', true),
      obs('SHORT_ANSWER', false),
      obs('TRUE_FALSE', false),
      obs('MCQ_SINGLE', true),
      obs('FILL_BLANK', true),
    ];
    const policy = bktPolicy();
    let p = policy.initial();
    const trace = history.map((o) => (p = policy.update(p, o)));
    expect(trace.map((v) => Number(v.toFixed(3)))).toEqual([0.553, 0.248, 0.203, 0.556, 0.964]);
    expect(replay(policy, history).firstMasteredAt).toBe(5);
  });

  it('số câu đúng liên tiếp để vượt ngưỡng khớp bảng §6.4', () => {
    const types: QuestionType[] = ['TRUE_FALSE', 'MCQ_SINGLE', 'MCQ_MULTI', 'FILL_BLANK', 'SHORT_ANSWER'];
    expect(types.map((t) => correctUntil(t, 0.95))).toEqual([6, 3, 2, 2, 2]);
    expect(types.map((t) => correctUntil(t, 0.98))).toEqual([7, 4, 3, 2, 2]);
    // Với n_min = 3: hai câu điền khuyết đúng đã vượt 0.95 nhưng chưa được công nhận.
    expect(
      types.map((t) => replay(bktPolicy(), Array.from({ length: 10 }, () => obs(t, true))).firstMasteredAt),
    ).toEqual([6, 3, 3, 3, 3]);
  });

  it('đủ xác suất nhưng thiếu số quan sát thì chưa đạt', () => {
    expect(meetsCriterion(0.99, 2)).toBe(false);
    expect(meetsCriterion(0.99, 3)).toBe(true);
    expect(meetsCriterion(0.94, 10)).toBe(false);
  });

  it('cùng lịch sử cho cùng kết quả', () => {
    const history = [obs('MCQ_SINGLE', true), obs('TRUE_FALSE', false), obs('FILL_BLANK', true)];
    expect(replay(bktPolicy(), history)).toEqual(replay(bktPolicy(), history));
  });
});

describe('Chính sách đối chứng', () => {
  it('N-CCR: ba câu đúng liên tiếp, sai thì đếm lại', () => {
    const policy = consecutiveCorrectPolicy(3);
    const history = [true, true, false, true, true, true].map((c) => obs('TRUE_FALSE', c));
    expect(replay(policy, history).firstMasteredAt).toBe(6);
    expect(policy.estimate(replay(policy, history).state)).toBeNull();
  });

  it('EMA: dừng khi trung bình trượt vượt ngưỡng và đủ quan sát', () => {
    const policy = emaPolicy(0.5, 0.8, 3);
    // 0.5 → 0.75 → 0.875: vượt 0.8 ở câu thứ ba.
    const history = [true, true, true].map((c) => obs('MCQ_SINGLE', c));
    expect(replay(policy, history).firstMasteredAt).toBe(3);
    expect(replay(policy, history).state).toBeCloseTo(0.875);
  });
});
