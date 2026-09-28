import { BadRequestException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { QuizSnapshotItem } from './quiz-set.service';

export type QuizSetMode = 'practice' | 'exam';

/** Cài đặt đã kiểm tra, đúng dạng cột của bảng quiz_sets. */
export interface QuizSetSettings {
  mode: QuizSetMode;
  points_possible: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  shuffle: boolean;
  available_from: Date | null;
  available_until: Date | null;
  due_at: Date | null;
}

type SettingsRow = Omit<QuizSetSettings, 'points_possible' | 'mode'> & {
  mode: string;
  points_possible: Prisma.Decimal | number;
};

/** Nộp trễ do mạng/độ trễ đồng hồ vẫn được nhận trong khoảng này. */
export const SUBMIT_GRACE_MS = 60_000;

function intIn(value: unknown, min: number, max: number, label: string) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new BadRequestException(`${label} phải là số nguyên từ ${min} đến ${max}.`);
  return n;
}

function dateOrNull(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()))
    throw new BadRequestException(`${label} không hợp lệ.`);
  return date;
}

/**
 * Luyện tập giữ hành vi cũ nên bỏ qua mọi cài đặt thi. Kiểm tra bắt buộc có
 * hạn nộp vì đáp án chỉ mở cho sinh viên sau khi đóng bài.
 */
export function parseSettings(raw: unknown, now = new Date()): QuizSetSettings {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const mode = input.mode === undefined ? 'practice' : input.mode;
  if (mode !== 'practice' && mode !== 'exam')
    throw new BadRequestException('Chế độ phải là Luyện tập hoặc Kiểm tra.');
  const points =
    input.pointsPossible === undefined || input.pointsPossible === ''
      ? 100
      : Number(input.pointsPossible);
  if (!Number.isFinite(points) || points <= 0 || points > 1000)
    throw new BadRequestException('Điểm tối đa phải lớn hơn 0 và không quá 1000.');
  if (mode === 'practice')
    return {
      mode,
      points_possible: Math.round(points * 100) / 100,
      max_attempts: null,
      time_limit_minutes: null,
      shuffle: false,
      available_from: null,
      available_until: null,
      due_at: null,
    };

  const settings: QuizSetSettings = {
    mode,
    points_possible: Math.round(points * 100) / 100,
    max_attempts: intIn(input.maxAttempts, 1, 20, 'Số lần làm'),
    time_limit_minutes: intIn(input.timeLimitMinutes, 1, 600, 'Thời gian làm bài'),
    shuffle: input.shuffle === true || input.shuffle === 'true',
    available_from: dateOrNull(input.availableFrom, 'Thời điểm mở bài'),
    available_until: dateOrNull(input.availableUntil, 'Thời điểm đóng bài'),
    due_at: dateOrNull(input.dueAt, 'Hạn nộp'),
  };
  if (!settings.due_at)
    throw new BadRequestException('Bài kiểm tra cần hạn nộp.');
  if (settings.due_at <= now)
    throw new BadRequestException('Hạn nộp phải ở tương lai.');
  if (
    settings.available_from &&
    settings.available_until &&
    settings.available_from >= settings.available_until
  )
    throw new BadRequestException('Thời điểm mở bài phải trước thời điểm đóng bài.');
  if (settings.available_until && settings.due_at > settings.available_until)
    throw new BadRequestException('Hạn nộp không được sau thời điểm đóng bài.');
  if (settings.available_from && settings.due_at <= settings.available_from)
    throw new BadRequestException('Hạn nộp phải sau thời điểm mở bài.');
  return settings;
}

/**
 * Sau mốc này bài kiểm tra đóng: không mở lượt mới và sinh viên được xem đáp
 * án. Không đặt giờ đóng thì đóng đúng hạn nộp — nếu vẫn nhận nộp muộn sau
 * khi đã mở đáp án, sinh viên còn lượt có thể xem đáp án rồi làm lại.
 */
export function closesAt(set: Pick<SettingsRow, 'available_until' | 'due_at'>) {
  return set.available_until ?? set.due_at;
}

export function answersRevealed(set: SettingsRow, now = new Date()) {
  if (set.mode !== 'exam') return true;
  const close = closesAt(set);
  // Chờ hết khoảng nộp trễ để không ai còn đang nộp khi đáp án đã mở.
  return Boolean(close && now.getTime() >= close.getTime() + SUBMIT_GRACE_MS);
}

export type WindowState = 'not_open' | 'open' | 'closed';

export function windowState(set: SettingsRow, now = new Date()): WindowState {
  if (set.available_from && now < set.available_from) return 'not_open';
  const close = closesAt(set);
  if (set.mode === 'exam' && close && now >= close) return 'closed';
  return 'open';
}

export function settingsView(set: SettingsRow) {
  return {
    mode: set.mode as QuizSetMode,
    pointsPossible: Number(set.points_possible),
    maxAttempts: set.max_attempts,
    timeLimitMinutes: set.time_limit_minutes,
    shuffle: set.shuffle,
    availableFrom: set.available_from?.toISOString() ?? null,
    availableUntil: set.available_until?.toISOString() ?? null,
    dueAt: set.due_at?.toISOString() ?? null,
  };
}

export type ItemOrder = Array<{ quiz_id: string; options: Prisma.JsonValue }>;

function shuffled<T>(values: T[], rand: (n: number) => number): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Thứ tự câu và phương án của một lượt làm. Chấm bài so theo giá trị đáp án
 * (không theo vị trí) nên xáo phương án không ảnh hưởng tới điểm.
 */
export function itemOrder(
  items: QuizSnapshotItem[],
  shuffle: boolean,
  rand: (n: number) => number = randomInt,
): ItemOrder {
  const order = shuffle ? shuffled(items, rand) : items;
  return order.map((item) => ({
    quiz_id: item.quiz_id,
    options:
      shuffle && Array.isArray(item.options)
        ? shuffled(item.options, rand)
        : item.options,
  }));
}

/** Mốc hết giờ của phiên: giới hạn thời gian, nhưng không quá lúc đóng bài. */
export function sessionExpiry(set: SettingsRow, startedAt: Date): Date | null {
  const limit = set.time_limit_minutes
    ? new Date(startedAt.getTime() + set.time_limit_minutes * 60_000)
    : null;
  const lock = closesAt(set);
  if (limit && lock) return limit < lock ? limit : lock;
  return limit ?? lock ?? null;
}
