import { BadRequestException } from '@nestjs/common';

/**
 * Năm kiểu câu hỏi và dạng `options` / `correct_answer` của từng kiểu.
 *
 *   MCQ_SINGLE    options: 4 chuỗi        correct_answer: chuỗi (một phương án)
 *   MCQ_MULTI     options: 4–6 chuỗi      correct_answer: mảng phương án đúng
 *   TRUE_FALSE    options: ["Đúng","Sai"] correct_answer: "Đúng" | "Sai"
 *   FILL_BLANK    options: null           correct_answer: mảng các cách viết chấp nhận
 *   SHORT_ANSWER  options: null           correct_answer: { model_answer, rubric[] }
 *
 * Câu trả lời người học gửi lên (`chosenAnswer`) lần lượt là: chuỗi, mảng
 * chuỗi, chuỗi, chuỗi, chuỗi. Tự luận ngắn do worker chấm bằng LLM.
 */
export const QUESTION_TYPES = [
  'MCQ_SINGLE',
  'MCQ_MULTI',
  'TRUE_FALSE',
  'FILL_BLANK',
  'SHORT_ANSWER',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const TRUE_FALSE_OPTIONS = ['Đúng', 'Sai'];
const BLANK = /_{3,}/;

export function isQuestionType(value: unknown): value is QuestionType {
  return QUESTION_TYPES.includes(value as QuestionType);
}

export type AnswerKey = { options: unknown; correct_answer: unknown };

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function distinctTexts(values: unknown, min: number, max: number, label: string) {
  if (!Array.isArray(values) || values.length < min || values.length > max)
    throw new BadRequestException(`${label} phải có ${min === max ? min : `${min}–${max}`} mục.`);
  const out = values.map(text);
  if (out.some((v) => !v)) throw new BadRequestException(`${label} không được để trống.`);
  if (new Set(out.map((v) => v.toLocaleLowerCase('vi'))).size !== out.length)
    throw new BadRequestException(`${label} phải khác nhau.`);
  return out;
}

/**
 * Kiểm tra và chuẩn hoá đáp án theo kiểu câu. Mọi chỗ ghi `quiz_items` từ phía
 * giảng viên đi qua đây, nên dữ liệu trong bảng luôn đúng dạng ở trên.
 */
export function normalizeAnswerKey(
  type: string,
  question: string,
  key: AnswerKey,
): AnswerKey {
  switch (type) {
    case 'MCQ_SINGLE': {
      const options = distinctTexts(key.options, 4, 4, 'Phương án');
      const correct = text(key.correct_answer);
      if (!options.includes(correct))
        throw new BadRequestException('Đáp án đúng phải là một trong các phương án.');
      return { options, correct_answer: correct };
    }
    case 'MCQ_MULTI': {
      const options = distinctTexts(key.options, 4, 6, 'Phương án');
      const chosen = Array.isArray(key.correct_answer) ? key.correct_answer.map(text) : [];
      // Giữ thứ tự của phương án: chấm so theo tập nên thứ tự không đổi điểm.
      const correct = options.filter((o) => chosen.includes(o));
      if (correct.length !== new Set(chosen).size || !correct.length)
        throw new BadRequestException('Đáp án đúng phải là các phương án có trong câu.');
      if (correct.length === options.length)
        throw new BadRequestException('Phải có ít nhất một phương án sai.');
      return { options, correct_answer: correct };
    }
    case 'TRUE_FALSE': {
      const correct = text(key.correct_answer);
      if (!TRUE_FALSE_OPTIONS.includes(correct))
        throw new BadRequestException('Đáp án câu Đúng/Sai phải là "Đúng" hoặc "Sai".');
      return { options: TRUE_FALSE_OPTIONS, correct_answer: correct };
    }
    case 'FILL_BLANK': {
      if (!BLANK.test(question))
        throw new BadRequestException('Câu điền khuyết phải có chỗ trống "____".');
      const raw = typeof key.correct_answer === 'string' ? [key.correct_answer] : key.correct_answer;
      return { options: null, correct_answer: distinctTexts(raw, 1, 10, 'Đáp án chấp nhận') };
    }
    case 'SHORT_ANSWER': {
      const value = (key.correct_answer ?? {}) as Record<string, unknown>;
      const modelAnswer = text(value.model_answer);
      if (!modelAnswer) throw new BadRequestException('Thiếu bài làm mẫu.');
      const rubric = distinctTexts(value.rubric, 1, 6, 'Ý chấm điểm');
      return { options: null, correct_answer: { model_answer: modelAnswer, rubric } };
    }
    default:
      throw new BadRequestException(`Kiểu câu hỏi không hỗ trợ: ${type}`);
  }
}

/** So khớp điền khuyết: bỏ hoa thường, khoảng trắng thừa, dấu câu ở hai đầu. */
export function normalizeBlank(value: unknown) {
  return text(value)
    .normalize('NFC')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .replace(/^["'“”‘’(\s]+|["'“”‘’)\s.,;:!?]+$/g, '');
}

export type ItemGrade = {
  /** 0–100. */
  score: number;
  isCorrect: boolean;
  /** Tự luận chờ worker chấm: score/isCorrect chỉ là giá trị tạm. */
  pending: boolean;
};

const graded = (ok: boolean): ItemGrade => ({ score: ok ? 100 : 0, isCorrect: ok, pending: false });

export function gradeAnswer(
  item: { type: string; correct_answer: unknown },
  chosen: unknown,
): ItemGrade {
  switch (item.type) {
    case 'MCQ_MULTI': {
      const correct = Array.isArray(item.correct_answer) ? item.correct_answer : [];
      if (!Array.isArray(chosen)) return graded(false);
      const picked = new Set(chosen.map((c) => JSON.stringify(c)));
      return graded(
        picked.size === chosen.length &&
          picked.size === correct.length &&
          correct.every((c) => picked.has(JSON.stringify(c))),
      );
    }
    case 'FILL_BLANK': {
      const accepted = Array.isArray(item.correct_answer)
        ? item.correct_answer
        : [item.correct_answer];
      const answer = normalizeBlank(chosen);
      return graded(Boolean(answer) && accepted.some((a) => normalizeBlank(a) === answer));
    }
    case 'SHORT_ANSWER':
      // Bỏ trống thì 0 điểm ngay, không tốn một lần gọi LLM.
      return text(chosen) ? { score: 0, isCorrect: false, pending: true } : graded(false);
    default:
      // MCQ_SINGLE, TRUE_FALSE: so theo giá trị phương án, không theo vị trí.
      return graded(JSON.stringify(chosen) === JSON.stringify(item.correct_answer));
  }
}

/** Không xáo Đúng/Sai: thứ tự cố định dễ đọc hơn và không đổi gì về độ khó. */
export function shufflesOptions(type: string) {
  return type === 'MCQ_SINGLE' || type === 'MCQ_MULTI';
}
