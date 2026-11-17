import { buildScoreComment, type ScoredItem } from './ags-score-comment';

const item = (
  correct: boolean,
  loCode: string | null = null,
  loStatement: string | null = null,
): ScoredItem => ({ correct, loCode, loStatement });

describe('buildScoreComment', () => {
  it('đếm số câu đúng và nêu LO có tỉ lệ đúng thấp nhất', () => {
    const comment = buildScoreComment([
      item(true, 'LO1.1', 'Định nghĩa tiến trình'),
      item(true, 'LO1.1', 'Định nghĩa tiến trình'),
      item(false, 'LO2.3', 'Phân biệt tiến trình và luồng'),
      item(true, 'LO2.3', 'Phân biệt tiến trình và luồng'),
      item(false, 'LO3.1', 'Lập lịch CPU'),
    ]);
    expect(comment).toBe(
      'Đúng 3/5 câu. LO yếu nhất: LO3.1 – Lập lịch CPU (0/1 câu đúng).',
    );
  });

  it('hòa tỉ lệ thì lấy LO sai nhiều câu hơn, rồi theo mã', () => {
    const moreWrong = buildScoreComment([
      item(false, 'LO1.1'),
      item(true, 'LO1.1'),
      item(false, 'LO2.1'),
      item(false, 'LO2.1'),
      item(true, 'LO2.1'),
      item(true, 'LO2.1'),
    ]);
    // Cả hai 50% nhưng LO2.1 sai 2 câu, LO1.1 sai 1 câu.
    expect(moreWrong).toContain('LO yếu nhất: LO2.1 (2/4 câu đúng)');

    const byCode = buildScoreComment([
      item(false, 'LO10.1'),
      item(false, 'LO2.1'),
    ]);
    expect(byCode).toContain('LO yếu nhất: LO2.1');
  });

  it('làm đúng hết thì không nêu LO yếu', () => {
    expect(buildScoreComment([item(true, 'LO1.1'), item(true, 'LO1.2')])).toBe(
      'Đúng 2/2 câu.',
    );
  });

  it('câu không gắn LO chỉ tính vào số câu đúng', () => {
    expect(buildScoreComment([item(false), item(true)])).toBe('Đúng 1/2 câu.');
  });

  it('rút gọn mô tả LO quá dài và gộp khoảng trắng', () => {
    const long = `Phân tích   ${'rất dài '.repeat(30)}`;
    const comment = buildScoreComment([item(false, 'LO1.1', long)])!;
    const statement = comment.split(' – ')[1].split(' (')[0];
    expect(statement.length).toBeLessThanOrEqual(70);
    expect(statement.endsWith('…')).toBe(true);
    expect(comment).not.toMatch(/\s{2,}/);
  });

  it('thiếu mô tả LO vẫn nêu mã LO', () => {
    expect(buildScoreComment([item(false, 'LO4.2', null)])).toBe(
      'Đúng 0/1 câu. LO yếu nhất: LO4.2 (0/1 câu đúng).',
    );
  });

  it('không có câu nào thì không có nhận xét', () => {
    expect(buildScoreComment([])).toBeNull();
  });
});
