/**
 * Độ dài chuỗi trong payload của worker, tính theo code point.
 *
 * Worker (Python) cắt chuỗi theo code point, JSON Schema `maxLength` đếm code
 * point và `varchar(n)` của Postgres đếm ký tự (cũng là code point), còn
 * `String.length` của JS đếm UTF-16 code unit: ký tự ngoài BMP (chữ toán học
 * như 𝑓(𝑥), emoji) chiếm 2 đơn vị. Kiểm bằng `.length` thì chuỗi worker đã cắt
 * đúng giới hạn vẫn bị từ chối và cả kết quả thất bại. Mọi chỗ kiểm giới hạn độ
 * dài payload worker dùng các hàm dưới đây, không dùng `.length`.
 */

/** Số code point của chuỗi. Surrogate lẻ (không thành cặp) tính là một. */
export function codePointLength(text: string): number {
  let length = text.length;
  for (let i = 0; i < text.length - 1; i += 1) {
    const high = text.charCodeAt(i);
    if (high >= 0xd800 && high <= 0xdbff) {
      const low = text.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        length -= 1;
        i += 1;
      }
    }
  }
  return length;
}

/** `text` dài tối đa `max` code point. UTF-16 ngắn thì code point càng ngắn: khỏi đếm. */
export function isWithinCodePoints(text: string, max: number): boolean {
  return text.length <= max || codePointLength(text) <= max;
}

/** Cắt còn tối đa `max` code point, không bao giờ cắt đôi một cặp surrogate. */
export function clipCodePoints(text: string, max: number): string {
  if (isWithinCodePoints(text, max)) return text;
  let end = 0;
  for (let count = 0; count < max && end < text.length; count += 1) {
    const high = text.charCodeAt(end);
    const low = end + 1 < text.length ? text.charCodeAt(end + 1) : 0;
    end +=
      high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff
        ? 2
        : 1;
  }
  return text.slice(0, end);
}
