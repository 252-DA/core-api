import {
  answersRevealed,
  itemOrder,
  parseSettings,
  sessionExpiry,
  windowState,
} from './quiz-set-exam';
import type { QuizSnapshotItem } from './quiz-set.service';

const NOW = new Date('2026-09-27T10:00:00Z');
const at = (iso: string) => new Date(iso);

function row(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'exam',
    points_possible: 10,
    max_attempts: 1,
    time_limit_minutes: 30,
    shuffle: true,
    available_from: null,
    available_until: null,
    due_at: at('2026-09-30T16:59:00Z'),
    ...overrides,
  } as Parameters<typeof windowState>[0];
}

describe('parseSettings', () => {
  it('luyện tập bỏ qua mọi cài đặt thi, mặc định 100 điểm', () => {
    expect(
      parseSettings({ mode: 'practice', maxAttempts: 1, timeLimitMinutes: 5 }, NOW),
    ).toMatchObject({
      mode: 'practice',
      points_possible: 100,
      max_attempts: null,
      time_limit_minutes: null,
      due_at: null,
    });
    expect(parseSettings(undefined, NOW).mode).toBe('practice');
  });

  it('nhận cài đặt kiểm tra hợp lệ', () => {
    expect(
      parseSettings(
        {
          mode: 'exam',
          pointsPossible: 10,
          maxAttempts: '2',
          timeLimitMinutes: 45,
          shuffle: 'true',
          availableFrom: '2026-09-28T01:00:00.000Z',
          availableUntil: '2026-09-30T17:00:00.000Z',
          dueAt: '2026-09-30T16:59:00.000Z',
        },
        NOW,
      ),
    ).toEqual({
      mode: 'exam',
      points_possible: 10,
      max_attempts: 2,
      time_limit_minutes: 45,
      shuffle: true,
      available_from: at('2026-09-28T01:00:00.000Z'),
      available_until: at('2026-09-30T17:00:00.000Z'),
      due_at: at('2026-09-30T16:59:00.000Z'),
    });
  });

  it.each([
    [{ mode: 'exam' }, 'hạn nộp'],
    [{ mode: 'exam', dueAt: '2026-09-26T00:00:00Z' }, 'tương lai'],
    [
      { mode: 'exam', dueAt: '2026-10-02T00:00:00Z', availableUntil: '2026-10-01T00:00:00Z' },
      'sau thời điểm đóng',
    ],
    [
      {
        mode: 'exam',
        dueAt: '2026-10-02T00:00:00Z',
        availableFrom: '2026-10-01T00:00:00Z',
        availableUntil: '2026-09-30T00:00:00Z',
      },
      'trước thời điểm đóng',
    ],
    [{ mode: 'exam', dueAt: '2026-10-02T00:00:00Z', maxAttempts: 0 }, 'Số lần làm'],
    [{ mode: 'exam', dueAt: '2026-10-02T00:00:00Z', timeLimitMinutes: 1.5 }, 'Thời gian'],
    [{ mode: 'exam', dueAt: 'không-phải-ngày' }, 'Hạn nộp'],
    [{ mode: 'quiz' }, 'Chế độ'],
    [{ pointsPossible: 0 }, 'Điểm tối đa'],
  ])('từ chối %j', (input, message) => {
    expect(() => parseSettings(input, NOW)).toThrow(message);
  });
});

describe('khung giờ và mở đáp án', () => {
  it('đóng theo available_until, nếu không có thì theo hạn nộp', () => {
    const set = row({ available_until: at('2026-10-01T00:00:00Z') });
    expect(answersRevealed(set, at('2026-09-30T23:00:00Z'))).toBe(false);
    // Đợi hết khoảng nộp trễ 60 giây rồi mới mở đáp án.
    expect(answersRevealed(set, at('2026-10-01T00:00:30Z'))).toBe(false);
    expect(answersRevealed(set, at('2026-10-01T00:01:00Z'))).toBe(true);
    expect(answersRevealed(row(), at('2026-09-30T17:00:00Z'))).toBe(true);
    expect(answersRevealed(row({ mode: 'practice', due_at: null }), NOW)).toBe(true);
  });

  it('chưa mở, đang mở, đã đóng', () => {
    const set = row({
      available_from: at('2026-09-28T00:00:00Z'),
      available_until: at('2026-09-29T00:00:00Z'),
    });
    expect(windowState(set, NOW)).toBe('not_open');
    expect(windowState(set, at('2026-09-28T12:00:00Z'))).toBe('open');
    expect(windowState(set, at('2026-09-29T00:00:00Z'))).toBe('closed');
    // Không đặt giờ đóng: bài đóng đúng hạn nộp, vì đáp án mở ngay sau đó.
    expect(windowState(row(), at('2026-09-30T16:58:00Z'))).toBe('open');
    expect(windowState(row(), at('2026-09-30T16:59:00Z'))).toBe('closed');
    expect(windowState(row({ mode: 'practice', due_at: null }), at('2026-10-05T00:00:00Z'))).toBe('open');
  });

  it('hết giờ theo giới hạn thời gian nhưng không quá lúc đóng bài', () => {
    const start = at('2026-09-28T23:50:00Z');
    expect(sessionExpiry(row(), start)).toEqual(at('2026-09-29T00:20:00Z'));
    expect(
      sessionExpiry(row({ available_until: at('2026-09-29T00:00:00Z') }), start),
    ).toEqual(at('2026-09-29T00:00:00Z'));
    // Không giới hạn giờ: phiên vẫn kết thúc lúc bài đóng (ở đây là hạn nộp).
    expect(sessionExpiry(row({ time_limit_minutes: null }), start)).toEqual(
      at('2026-09-30T16:59:00Z'),
    );
    // Bắt đầu sát hạn nộp: bị cắt ở hạn nộp, không được làm đủ 30 phút.
    expect(sessionExpiry(row(), at('2026-09-30T16:50:00Z'))).toEqual(
      at('2026-09-30T16:59:00Z'),
    );
  });
});

describe('itemOrder', () => {
  const items = ['a', 'b', 'c'].map((id) => ({
    quiz_id: id,
    options: [`${id}1`, `${id}2`, `${id}3`],
  })) as unknown as QuizSnapshotItem[];

  it('giữ nguyên thứ tự khi không xáo', () => {
    expect(itemOrder(items, false)).toEqual(
      items.map((i) => ({ quiz_id: i.quiz_id, options: i.options })),
    );
  });

  it('xáo câu và phương án nhưng không mất hoặc lặp phần tử', () => {
    // Fisher–Yates với rand luôn chọn 0 → đảo vòng, dễ kiểm tra.
    const order = itemOrder(items, true, () => 0);
    expect(order.map((o) => o.quiz_id)).toEqual(['b', 'c', 'a']);
    for (const o of order) {
      const source = items.find((i) => i.quiz_id === o.quiz_id)!;
      expect([...(o.options as string[])].sort()).toEqual(
        [...(source.options as string[])].sort(),
      );
      expect(o.options).not.toEqual(source.options);
    }
  });
});
