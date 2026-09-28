import {
  fileIdsInSyllabus,
  isSupportedSyllabusFile,
  pickSyllabusFile,
  type CanvasFile,
} from './syllabus-file';

describe('fileIdsInSyllabus', () => {
  it('reads file ids from Canvas file links in document order, without duplicates', () => {
    const html = `
      <p>Đề cương: <a class="instructure_file_link" href="https://canvas.example/courses/1/files/42?wrap=1"
         data-api-endpoint="https://canvas.example/api/v1/courses/1/files/42">DCMH.CO3137.pdf</a></p>
      <p>Slide: <a href="/courses/1/files/7/download?download_frd=1">Ch1.pdf</a></p>
      <img src="/files/9/preview">`;

    expect(fileIdsInSyllabus(html)).toEqual(['42', '7', '9']);
  });

  it('returns nothing for an empty or link-free syllabus', () => {
    expect(fileIdsInSyllabus(null)).toEqual([]);
    expect(fileIdsInSyllabus('<p>Chưa có đề cương</p>')).toEqual([]);
  });

  it('ignores links that are not Canvas files', () => {
    expect(fileIdsInSyllabus('<a href="/courses/1/pages/intro">Intro</a>')).toEqual([]);
  });
});

describe('pickSyllabusFile', () => {
  const file = (id: number, name: string, mime = 'application/pdf'): CanvasFile => ({
    id,
    display_name: name,
    'content-type': mime,
  });

  it('prefers a file named like a syllabus over earlier attachments', () => {
    const picked = pickSyllabusFile([
      file(7, 'Ch1_Big Data Intro.pdf'),
      file(42, 'DCMH.CO3137_Big Data.pdf'),
    ]);
    expect(picked?.id).toBe(42);
  });

  it('matches Vietnamese names with or without diacritics', () => {
    expect(pickSyllabusFile([file(1, 'slide.pdf'), file(2, 'Đề cương môn học.pdf')])?.id).toBe(2);
    expect(pickSyllabusFile([file(1, 'slide.pdf'), file(3, 'de_cuong_CO3137.pdf')])?.id).toBe(3);
    expect(
      pickSyllabusFile([file(1, 'slide.pdf'), file(4, 'Đề cương.pdf'.normalize('NFD'))])?.id,
    ).toBe(4);
  });

  it('falls back to the first PDF when no name looks like a syllabus', () => {
    expect(pickSyllabusFile([file(5, 'notes.docx', 'application/msword'), file(6, 'a.pdf')])?.id).toBe(6);
  });

  it('never picks a file the extractor cannot read', () => {
    expect(
      pickSyllabusFile([file(8, 'DCMH.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')]),
    ).toBeNull();
  });
});

describe('isSupportedSyllabusFile', () => {
  it('accepts a PDF by extension when Canvas reports a generic MIME type', () => {
    expect(
      isSupportedSyllabusFile({ id: 1, display_name: 'DCMH.PDF', 'content-type': 'application/octet-stream' }),
    ).toBe(true);
  });
});
