export type InvalidInputSqlState = '22P02' | '22021';

const INVALID_INPUT_SQLSTATES = new Set<string>(['22P02', '22021']);

/** Không dùng isPlainObject: không loại trừ mảng vì chỉ đọc thuộc tính đối tượng lỗi driver. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractSqlState(cause: unknown): InvalidInputSqlState | null {
  if (!isRecord(cause)) return null;
  const raw =
    typeof cause.originalCode === 'string'
      ? cause.originalCode
      : typeof cause.code === 'string'
        ? cause.code
        : null;
  if (raw && INVALID_INPUT_SQLSTATES.has(raw)) {
    return raw as InvalidInputSqlState;
  }
  return null;
}

/**
 * Nhận diện lỗi Postgres/Prisma khi DB từ chối giá trị đầu vào sai định dạng
 * (22P02: sai cú pháp kiểu dữ liệu; 22021: byte UTF-8 không hợp lệ như 0x00).
 * Đọc thuộc tính trực tiếp thay vì dùng instanceof để tránh lệch prototype.
 */
export function detectInvalidInputSqlState(
  error: unknown,
): InvalidInputSqlState | null {
  if (!isRecord(error)) return null;

  // Dạng A: Prisma bọc lỗi driver trong PrismaClientKnownRequestError (P2007).
  if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2007') {
    const meta = isRecord(error.meta) ? error.meta : null;
    const driverError =
      meta && isRecord(meta.driverAdapterError)
        ? meta.driverAdapterError
        : null;
    return driverError ? extractSqlState(driverError.cause) : null;
  }

  // Dạng B: lỗi DriverAdapterError ném trực tiếp từ @prisma/adapter-pg.
  if (error.name === 'DriverAdapterError') {
    return extractSqlState(error.cause);
  }

  return null;
}

/**
 * Trả về tên bảng/model Prisma từ meta.modelName (nếu có) để ghi vào log warning.
 */
export function getPrismaErrorModel(error: unknown): string | undefined {
  if (!isRecord(error) || !isRecord(error.meta)) return undefined;
  const modelName = error.meta.modelName;
  return typeof modelName === 'string' && modelName.length > 0
    ? modelName
    : undefined;
}
