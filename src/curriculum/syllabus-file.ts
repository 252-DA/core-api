/**
 * Tìm file đề cương đính kèm trong trang "Chương trình học" (syllabus) của Canvas.
 *
 * Canvas lưu trang này dạng HTML; file đính kèm là link tới
 * `/courses/:course_id/files/:file_id` (href) hoặc
 * `/api/v1/courses/:course_id/files/:file_id` (data-api-endpoint).
 */

export type CanvasFile = {
  id: number | string;
  display_name: string;
  filename?: string;
  'content-type'?: string;
  size?: number;
  url?: string;
  updated_at?: string;
};

const FILE_LINK = /\/(?:api\/v1\/)?(?:courses\/\d+\/)?files\/(\d+)/g;

// DcmhExtractor đọc bố cục trang bằng PyMuPDF nên chỉ nhận PDF.
const SUPPORTED_MIME = new Set(['application/pdf']);
const SUPPORTED_EXTENSIONS = ['.pdf'];

const SYLLABUS_NAME = /dcmh|syllabus|de[\s._-]*cuong|đề[\s._-]*cương/i;

/** Id các file được link trong HTML, theo thứ tự xuất hiện, không trùng. */
export function fileIdsInSyllabus(html: string | null | undefined): string[] {
  if (!html) return [];
  const ids: string[] = [];
  for (const match of html.matchAll(FILE_LINK)) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

export function isSupportedSyllabusFile(file: CanvasFile): boolean {
  const mime = file['content-type']?.toLowerCase();
  if (mime && SUPPORTED_MIME.has(mime)) return true;
  const name = (file.filename || file.display_name || '').toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Trang syllabus có thể đính kèm nhiều file (slide, bài tập...). Ưu tiên file
 * có tên giống đề cương; không có thì lấy file PDF đầu tiên trong trang.
 */
export function pickSyllabusFile(files: CanvasFile[]): CanvasFile | null {
  const supported = files.filter(isSupportedSyllabusFile);
  // Tên upload từ macOS thường ở dạng NFD (dấu tách khỏi chữ cái).
  const named = supported.find((file) =>
    SYLLABUS_NAME.test(`${file.display_name} ${file.filename ?? ''}`.normalize('NFC')),
  );
  return named ?? supported[0] ?? null;
}
