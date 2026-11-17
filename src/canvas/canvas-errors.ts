import { BadGatewayException } from '@nestjs/common';
import { errorMessage } from '../common/utils/errors';

/** Lỗi khi gọi REST API của Canvas; `canvasStatus` rỗng nếu không nhận được phản hồi HTTP. */
export class CanvasApiError extends BadGatewayException {
  constructor(
    message: string,
    readonly canvasStatus?: number,
  ) {
    super(message);
  }
}

export const CANVAS_TOKEN_INVALID_MESSAGE =
  'Token Canvas hết hạn hoặc không hợp lệ';
export const CANVAS_UNREACHABLE_MESSAGE = 'Không kết nối được Canvas';

const UNREACHABLE_STATUSES = [502, 503, 504];
const UNREACHABLE_PATTERN =
  /ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|fetch failed|Không kết nối được Canvas/i;
const STATUS_PATTERN = /HTTP (\d{3})/;

/** Mã HTTP Canvas trả về, nếu thông báo lỗi có nêu (lỗi chưa qua CanvasApiError). */
function statusOf(error: unknown): number | undefined {
  if (error instanceof CanvasApiError) return error.canvasStatus;
  const match = errorMessage(error).match(STATUS_PATTERN);
  return match ? Number(match[1]) : undefined;
}

/**
 * Thông báo cho giảng viên về một lỗi gọi Canvas: token sai, Canvas không với
 * tới được, hoặc giữ nguyên thông báo gốc. Chi tiết kỹ thuật vẫn nằm trong log.
 */
export function describeCanvasError(error: unknown): string {
  const message = errorMessage(error);
  const status = statusOf(error);
  if (status === 401) return CANVAS_TOKEN_INVALID_MESSAGE;
  if (status !== undefined && UNREACHABLE_STATUSES.includes(status))
    return CANVAS_UNREACHABLE_MESSAGE;
  if (status === undefined && UNREACHABLE_PATTERN.test(message))
    return CANVAS_UNREACHABLE_MESSAGE;
  return message;
}
