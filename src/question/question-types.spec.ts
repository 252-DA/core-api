import { BadRequestException } from '@nestjs/common';
import { gradeAnswer, normalizeAnswerKey, normalizeBlank } from './question-types';

describe('normalizeAnswerKey', () => {
  it('MCQ_SINGLE: 4 phương án khác nhau, đáp án nằm trong phương án', () => {
    expect(
      normalizeAnswerKey('MCQ_SINGLE', 'Q', {
        options: [' a ', 'b', 'c', 'd'],
        correct_answer: 'a',
      }),
    ).toEqual({ options: ['a', 'b', 'c', 'd'], correct_answer: 'a' });
    expect(() =>
      normalizeAnswerKey('MCQ_SINGLE', 'Q', { options: ['a', 'A', 'c', 'd'], correct_answer: 'a' }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeAnswerKey('MCQ_SINGLE', 'Q', { options: ['a', 'b', 'c', 'd'], correct_answer: 'x' }),
    ).toThrow(BadRequestException);
  });

  it('MCQ_MULTI: đáp án theo thứ tự phương án, phải còn ít nhất một phương án sai', () => {
    expect(
      normalizeAnswerKey('MCQ_MULTI', 'Q', {
        options: ['a', 'b', 'c', 'd', 'e'],
        correct_answer: ['d', 'b'],
      }),
    ).toEqual({ options: ['a', 'b', 'c', 'd', 'e'], correct_answer: ['b', 'd'] });
    expect(() =>
      normalizeAnswerKey('MCQ_MULTI', 'Q', {
        options: ['a', 'b', 'c', 'd'],
        correct_answer: ['a', 'b', 'c', 'd'],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      normalizeAnswerKey('MCQ_MULTI', 'Q', {
        options: ['a', 'b', 'c', 'd'],
        correct_answer: ['a', 'z'],
      }),
    ).toThrow(BadRequestException);
  });

  it('TRUE_FALSE: luôn ghi phương án cố định', () => {
    expect(
      normalizeAnswerKey('TRUE_FALSE', 'Q', { options: ['x'], correct_answer: 'Sai' }),
    ).toEqual({ options: ['Đúng', 'Sai'], correct_answer: 'Sai' });
    expect(() =>
      normalizeAnswerKey('TRUE_FALSE', 'Q', { options: null, correct_answer: 'True' }),
    ).toThrow(BadRequestException);
  });

  it('FILL_BLANK: câu phải có chỗ trống, đáp án là danh sách', () => {
    expect(
      normalizeAnswerKey('FILL_BLANK', 'Cây n đỉnh có ____ cạnh.', {
        options: ['ignored'],
        correct_answer: 'n-1',
      }),
    ).toEqual({ options: null, correct_answer: ['n-1'] });
    expect(() =>
      normalizeAnswerKey('FILL_BLANK', 'Không có chỗ trống', { options: null, correct_answer: ['x'] }),
    ).toThrow(BadRequestException);
  });

  it('SHORT_ANSWER: cần bài mẫu và 1–6 ý chấm', () => {
    expect(
      normalizeAnswerKey('SHORT_ANSWER', 'Q', {
        options: null,
        correct_answer: { model_answer: ' Mẫu ', rubric: ['Ý 1', 'Ý 2'] },
      }),
    ).toEqual({ options: null, correct_answer: { model_answer: 'Mẫu', rubric: ['Ý 1', 'Ý 2'] } });
    expect(() =>
      normalizeAnswerKey('SHORT_ANSWER', 'Q', {
        options: null,
        correct_answer: { model_answer: '', rubric: ['Ý 1'] },
      }),
    ).toThrow(BadRequestException);
  });

  it('từ chối kiểu không hỗ trợ', () => {
    expect(() => normalizeAnswerKey('ESSAY', 'Q', { options: null, correct_answer: null })).toThrow(
      BadRequestException,
    );
  });
});

describe('gradeAnswer', () => {
  it('MCQ_SINGLE và TRUE_FALSE so theo giá trị như trước', () => {
    expect(gradeAnswer({ type: 'MCQ_SINGLE', correct_answer: 'b' }, 'b')).toEqual({
      score: 100,
      isCorrect: true,
      pending: false,
    });
    expect(gradeAnswer({ type: 'TRUE_FALSE', correct_answer: 'Sai' }, 'Đúng').isCorrect).toBe(false);
  });

  it('MCQ_MULTI: đúng khi chọn đủ và chỉ đúng các phương án đúng, không kể thứ tự', () => {
    const item = { type: 'MCQ_MULTI', correct_answer: ['a', 'c'] };
    expect(gradeAnswer(item, ['c', 'a']).isCorrect).toBe(true);
    expect(gradeAnswer(item, ['a']).isCorrect).toBe(false);
    expect(gradeAnswer(item, ['a', 'b', 'c']).isCorrect).toBe(false);
    expect(gradeAnswer(item, ['a', 'a']).isCorrect).toBe(false);
    expect(gradeAnswer(item, 'a').isCorrect).toBe(false);
  });

  it('FILL_BLANK: chuẩn hoá hoa thường, khoảng trắng và dấu câu', () => {
    const item = { type: 'FILL_BLANK', correct_answer: ['Đồ thị liên thông', 'connected graph'] };
    expect(gradeAnswer(item, '  đồ   thị Liên thông. ').isCorrect).toBe(true);
    expect(gradeAnswer(item, '"Connected graph"').isCorrect).toBe(true);
    expect(gradeAnswer(item, 'đồ thị').isCorrect).toBe(false);
    expect(gradeAnswer(item, '').isCorrect).toBe(false);
    expect(normalizeBlank('  N-1 ;')).toBe('n-1');
  });

  it('SHORT_ANSWER: chờ worker chấm, trừ khi bỏ trống', () => {
    const item = { type: 'SHORT_ANSWER', correct_answer: { model_answer: 'x', rubric: ['x'] } };
    expect(gradeAnswer(item, 'Bài làm')).toEqual({ score: 0, isCorrect: false, pending: true });
    expect(gradeAnswer(item, '   ')).toEqual({ score: 0, isCorrect: false, pending: false });
  });
});
