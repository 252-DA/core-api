import { BadRequestException } from '@nestjs/common';

/** Ma trận đề: mỗi ô là số câu của một LO ở một mức Bloom (1–6). */
export interface QuizBlueprint {
  cells: Array<{ lo_id: string; bloom_level: number; count: number }>;
  source_document_ids: string[];
}

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const MAX_CELLS = 120;

/**
 * Ma trận chỉ để đối chiếu (hiện trên trang kết quả), đề thật là danh sách câu
 * đã duyệt — nên sai ma trận là lỗi đầu vào, không phải lý do đổi câu hỏi.
 */
export function parseBlueprint(
  raw: unknown,
  allowedLoIds: Set<string>,
): QuizBlueprint | null {
  if (raw === undefined || raw === null) return null;
  const input = raw as { cells?: unknown; source_document_ids?: unknown };
  if (typeof raw !== 'object' || !Array.isArray(input.cells))
    throw new BadRequestException('Ma trận đề không hợp lệ.');
  if (input.cells.length > MAX_CELLS)
    throw new BadRequestException(`Ma trận đề tối đa ${MAX_CELLS} ô.`);
  const seen = new Set<string>();
  const cells = input.cells.map((cell) => {
    const c = cell as { lo_id?: unknown; bloom_level?: unknown; count?: unknown };
    const loId = String(c?.lo_id ?? '');
    const bloom = Number(c?.bloom_level);
    const count = Number(c?.count);
    if (
      !UUID.test(loId) ||
      !allowedLoIds.has(loId) ||
      !Number.isInteger(bloom) ||
      bloom < 1 ||
      bloom > 6 ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 50 ||
      seen.has(`${loId}:${bloom}`)
    )
      throw new BadRequestException('Ô trong ma trận đề không hợp lệ hoặc LO không thuộc các chương đã chọn.');
    seen.add(`${loId}:${bloom}`);
    return { lo_id: loId, bloom_level: bloom, count };
  });
  const docs = Array.isArray(input.source_document_ids) ? input.source_document_ids : [];
  if (docs.length > 30 || !docs.every((d) => typeof d === 'string' && UUID.test(d)))
    throw new BadRequestException('Danh sách tài liệu nguồn không hợp lệ.');
  return { cells, source_document_ids: [...new Set(docs as string[])] };
}
