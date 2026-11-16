import { createHash } from 'node:crypto';

/** uuid.NAMESPACE_URL của Python (RFC 4122, phụ lục C). */
const NAMESPACE_URL = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');
const HEX32 = /^[0-9a-f]{32}$/;

function format(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** uuid5(NAMESPACE_URL, name) như Python `uuid.uuid5`. */
export function uuid5Url(name: string): string {
  const hash = createHash('sha1')
    .update(Buffer.concat([NAMESPACE_URL, Buffer.from(name, 'utf8')]))
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  return format(bytes.toString('hex'));
}

/**
 * Như `stable_uuid` của packages-ai (postgres_repository_utils.py): chuỗi đã là
 * UUID thì giữ (dạng chuẩn, chữ thường), không thì uuid5 URL. Id các bảng đề
 * cương trên DB đều sinh bằng hàm này từ trước khi core-api ghi đề cương; sinh
 * khác đi thì áp lại đề cương sẽ đẻ hàng mới thay vì cập nhật hàng cũ.
 */
export function stableUuid(value: string): string {
  // Chép cách uuid.UUID() của Python đọc chuỗi: bỏ 'urn:' / 'uuid:', ngoặc
  // nhọn hai đầu và dấu gạch, còn đúng 32 chữ số hex thì là UUID.
  const hex = value
    .split('urn:')
    .join('')
    .split('uuid:')
    .join('')
    .replace(/^[{}]+|[{}]+$/g, '')
    .replace(/-/g, '')
    .toLowerCase();
  return HEX32.test(hex) ? format(hex) : uuid5Url(value);
}

/**
 * Id dòng đề cương, đúng công thức của DcmhExtractor trước đây
 * (`<course_id>:<mã>` cho LO/AO, `<course_id>:CH<mã chương>`), với course_id là
 * học phần của lần nạp. Đã đối chiếu với 18 LO, 14 chương, 2 AO trên DB dev.
 */
export const curriculumIds = {
  learningOutcome: (courseId: string, code: string) =>
    stableUuid(`${courseId}:${code}`),
  assessment: (courseId: string, code: string) =>
    stableUuid(`${courseId}:${code}`),
  chapter: (courseId: string, code: string) =>
    stableUuid(`${courseId}:CH${code}`),
};
