import { BadRequestException } from '@nestjs/common';

/**
 * Parse query param số nguyên không bắt buộc; chuỗi rỗng coi như không truyền,
 * giá trị không phải số nguyên trả HTTP 400 thay vì âm thầm truyền NaN xuống service.
 */
export function parseOptionalInt(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new BadRequestException(`${field} must be an integer`);
  }
  return parsed;
}

/**
 * Đọc query param chuỗi bắt buộc; thiếu, rỗng, chỉ có khoảng trắng hoặc truyền
 * lặp thành mảng đều trả HTTP 400 thay vì đi tiếp vào Prisma với `undefined`.
 */
export function requireQueryString(
  value: string | string[] | undefined,
  field: string,
): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }
  return trimmed;
}
