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
