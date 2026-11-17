import {
  chapterRefFromFileName,
  classifyModule,
  isSupportedDocument,
  resolveChapterCode,
} from './canvas-placement';

describe('classifyModule', () => {
  it.each([
    ['Chương 1. Giới thiệu', 'lecture', { unit: 'chapter', number: 1 }],
    ['Chapter 03 - Dimensionality reduction', 'lecture', { unit: 'chapter', number: 3 }],
    ['Tuần 5', 'lecture', { unit: 'week', number: 5 }],
    ['Buổi 12: PageRank', 'lecture', { unit: 'session', number: 12 }],
    ['Slides', 'lecture', null],
    ['Bài giảng', 'lecture', null],
    ['References', 'reference', null],
    ['Tài liệu tham khảo', 'reference', null],
    ['Giáo trình', 'reference', null],
    ['Bài tập lớn', 'exercise', null],
    // Số thứ tự bài lab không phải số chương.
    ['Lab 2 - Kafka', 'exercise', null],
  ])('%s → %s', (name, role, chapterRef) => {
    expect(classifyModule(name)).toEqual({ role, chapterRef });
  });

  it('does not read "Bài tập 3" as chapter 3 lecture', () => {
    expect(classifyModule('Bài tập 3').role).toBe('exercise');
  });

  it('handles decomposed Vietnamese names (NFD from macOS)', () => {
    expect(classifyModule('Tài liệu tham khảo'.normalize('NFD')).role).toBe('reference');
  });
});

describe('chapterRefFromFileName', () => {
  it.each([
    ['Ch1_Big Data Intro.pdf', { unit: 'chapter', number: 1 }],
    ['Lec03.pptx', { unit: 'chapter', number: 3 }],
    ['Slide_Chuong4.pdf', { unit: 'chapter', number: 4 }],
    ['chapter-10-pagerank.pdf', { unit: 'chapter', number: 10 }],
    ['Tuan5.pdf', { unit: 'week', number: 5 }],
  ])('%s', (name, ref) => {
    expect(chapterRefFromFileName(name)).toEqual(ref);
  });

  it.each(['DCMH.CO3137_Big Data.pdf', 'mmds.pdf', 'Big Data Intro.pdf', 'Chapter 99.pdf'])(
    'finds nothing in %s',
    (name) => {
      expect(chapterRefFromFileName(name)).toBeNull();
    },
  );
});

describe('resolveChapterCode', () => {
  // CO3137: chương 13 chiếm buổi 13–14 (lưu session_no 13), chương 14 ở buổi 15.
  const sessions = [
    { session_no: 1, chapter_code: '1' },
    { session_no: 12, chapter_code: '12' },
    { session_no: 13, chapter_code: '13' },
    { session_no: 15, chapter_code: '14' },
  ];
  const chapters = new Set(Array.from({ length: 14 }, (_, i) => String(i + 1)));

  it('keeps a chapter number that exists in the syllabus', () => {
    expect(resolveChapterCode({ unit: 'chapter', number: 3 }, sessions, chapters)).toBe('3');
    expect(resolveChapterCode({ unit: 'chapter', number: 20 }, sessions, chapters)).toBeNull();
  });

  it('maps a week or session inside a multi-session chapter', () => {
    expect(resolveChapterCode({ unit: 'session', number: 14 }, sessions, chapters)).toBe('13');
    expect(resolveChapterCode({ unit: 'week', number: 15 }, sessions, chapters)).toBe('14');
  });

  it('keeps the hint when no syllabus has been applied yet', () => {
    expect(resolveChapterCode({ unit: 'chapter', number: 3 }, [], new Set())).toBe('3');
    expect(resolveChapterCode({ unit: 'week', number: 3 }, [], new Set())).toBeNull();
  });
});

describe('isSupportedDocument', () => {
  it('accepts formats the chunking pipeline parses', () => {
    expect(isSupportedDocument('a.pdf')).toBe(true);
    expect(isSupportedDocument('a.PPTX')).toBe(true);
    expect(isSupportedDocument('notes', 'text/markdown')).toBe(true);
    expect(isSupportedDocument('lecture.mp4', 'video/mp4')).toBe(false);
    expect(isSupportedDocument('data.zip')).toBe(false);
  });
});
