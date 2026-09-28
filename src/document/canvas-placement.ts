/**
 * Vai trò và chương của một file Canvas, suy từ tên module và tên file.
 *
 * Giảng viên không nhất thiết xếp module theo chương: có lớp dồn hết slide vào
 * một module "Slides", tài liệu tham khảo vào "References". Tên module chỉ là
 * một tín hiệu; không suy được thì để worker khớp nội dung với đề cương.
 */

export type DocumentRole = 'lecture' | 'reference' | 'exercise';
export type ChapterUnit = 'chapter' | 'session' | 'week';
export type ChapterRef = { unit: ChapterUnit; number: number };

export type ModuleClass = {
  role: DocumentRole;
  chapterRef: ChapterRef | null;
};

export type SessionRow = { session_no: number | null; chapter_code: string | null };

const MAX_UNIT_NUMBER = 30;

// Thứ tự quan trọng: "Bài tập 3" là bài tập chứ không phải "Bài 3".
const EXERCISE = /bài tập|bai tap|\blab\b|labs|thí nghiệm|thi nghiem|thực hành|thuc hanh|assignment|exercise|practice|homework/;
const REFERENCE = /tham khảo|tham khao|reference|giáo trình|giao trinh|textbook|reading|sách|\bsach\b|tài liệu đọc|tai lieu doc|bibliography/;

const UNIT_PATTERNS: Array<{ unit: ChapterUnit; pattern: RegExp }> = [
  { unit: 'week', pattern: /(?:^|[^a-z])(?:tuần|tuan|week|wk|w)[\s._-]*0*(\d{1,2})(?!\d)/ },
  { unit: 'session', pattern: /(?:^|[^a-z])(?:buổi|buoi|session)[\s._-]*0*(\d{1,2})(?!\d)/ },
  {
    unit: 'chapter',
    pattern: /(?:^|[^a-z])(?:chương|chuong|chapter|chap|ch|bài|bai|lecture|lec|unit)[\s._:-]*0*(\d{1,2})(?!\d)/,
  },
];

function normalize(value: string) {
  return value.normalize('NFC').toLowerCase();
}

function unitRef(value: string): ChapterRef | null {
  const text = normalize(value);
  for (const { unit, pattern } of UNIT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const number = Number(match[1]);
      if (number >= 1 && number <= MAX_UNIT_NUMBER) return { unit, number };
    }
  }
  return null;
}

export function classifyModule(name: string): ModuleClass {
  const text = normalize(name);
  if (EXERCISE.test(text)) return { role: 'exercise', chapterRef: unitRef(name) };
  if (REFERENCE.test(text)) return { role: 'reference', chapterRef: null };
  return { role: 'lecture', chapterRef: unitRef(name) };
}

/** "Ch1_Big Data Intro.pdf", "Lec03.pptx", "Slide_Chuong4.pdf", "Tuan5.pdf". */
export function chapterRefFromFileName(fileName: string): ChapterRef | null {
  const base = fileName.replace(/\.[a-z0-9]{1,5}$/i, '');
  return unitRef(base);
}

/**
 * Quy tuần/buổi ra chương theo bảng lịch học (mục 6) của đề cương. Một chương
 * có thể trải nhiều buổi ("13, 14" lưu session_no = 13), nên buổi n thuộc hàng
 * có session_no lớn nhất mà ≤ n. Mỗi tuần một buổi.
 */
export function resolveChapterCode(
  ref: ChapterRef,
  sessions: SessionRow[],
  chapterCodes: Set<string>,
): string | null {
  if (ref.unit === 'chapter') {
    const code = String(ref.number);
    // Chưa có đề cương thì chưa kiểm tra được; giữ gợi ý để dùng khi đề cương về.
    return chapterCodes.size === 0 || chapterCodes.has(code) ? code : null;
  }
  const row = sessions
    .filter((s) => s.session_no !== null && s.session_no <= ref.number)
    .sort((a, b) => (b.session_no ?? 0) - (a.session_no ?? 0))[0];
  return row?.chapter_code ?? null;
}

export function describeRef(ref: ChapterRef) {
  const label = { chapter: 'chương', session: 'buổi', week: 'tuần' }[ref.unit];
  return `${label} ${ref.number}`;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.md'];
const SUPPORTED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/markdown',
]);

/** Định dạng mà pipeline chunking đọc được (PDF, DOCX, PPTX, Markdown). */
export function isSupportedDocument(fileName: string, mimeType?: string | null) {
  if (mimeType && SUPPORTED_MIME.has(mimeType.toLowerCase())) return true;
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
