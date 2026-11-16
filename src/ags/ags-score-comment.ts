/** Một câu của lượt nộp được chọn để đẩy điểm. */
export interface ScoredItem {
  correct: boolean;
  /** Mã LO của câu (vd "LO2.3"); null khi câu không gắn LO. */
  loCode?: string | null;
  loStatement?: string | null;
}

const MAX_STATEMENT_CHARS = 70;

function shorten(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/**
 * Nhận xét ngắn đi kèm điểm, hiện ở khung bình luận của SpeedGrader:
 * "Đúng 7/10 câu. LO yếu nhất: LO2.3 – Phân biệt … (1/3 câu đúng)."
 *
 * LO yếu nhất là LO có tỉ lệ đúng thấp nhất trong lượt nộp; nhiều LO bằng nhau
 * thì lấy LO có nhiều câu sai hơn, rồi theo mã. Làm đúng hết thì không có LO
 * yếu để nêu. Trả null khi không có câu nào.
 */
export function buildScoreComment(items: ScoredItem[]): string | null {
  if (!items.length) return null;
  const correct = items.filter((item) => item.correct).length;
  const parts = [`Đúng ${correct}/${items.length} câu.`];

  const byLo = new Map<
    string,
    { statement: string; total: number; correct: number }
  >();
  for (const item of items) {
    if (!item.loCode) continue;
    const stat = byLo.get(item.loCode) ?? {
      statement: item.loStatement ?? '',
      total: 0,
      correct: 0,
    };
    stat.total += 1;
    if (item.correct) stat.correct += 1;
    byLo.set(item.loCode, stat);
  }
  const weakest = [...byLo.entries()]
    .filter(([, stat]) => stat.correct < stat.total)
    .sort(
      ([codeA, a], [codeB, b]) =>
        a.correct / a.total - b.correct / b.total ||
        b.total - b.correct - (a.total - a.correct) ||
        codeA.localeCompare(codeB, 'vi', { numeric: true }),
    )[0];
  if (weakest) {
    const [code, stat] = weakest;
    const statement = stat.statement
      ? ` – ${shorten(stat.statement, MAX_STATEMENT_CHARS)}`
      : '';
    parts.push(
      `LO yếu nhất: ${code}${statement} (${stat.correct}/${stat.total} câu đúng).`,
    );
  }
  return parts.join(' ');
}
