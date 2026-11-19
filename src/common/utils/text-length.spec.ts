import {
  clipCodePoints,
  codePointLength,
  isWithinCodePoints,
} from './text-length';

describe('text length by code point', () => {
  const MATH_F = '𝑓'; // U+1D453: ngoài BMP, 2 đơn vị UTF-16
  const EMOJI = '😀';

  it('counts a non-BMP character once, unlike String.length', () => {
    expect(MATH_F.length).toBe(2);
    expect(codePointLength(MATH_F)).toBe(1);
    expect(codePointLength('𝑓(𝑥)')).toBe(4);
    expect(codePointLength(`a${EMOJI}b`)).toBe(3);
    expect(codePointLength('')).toBe(0);
    expect(codePointLength('Tiếng Việt có dấu')).toBe(
      'Tiếng Việt có dấu'.length,
    );
  });

  it('counts a lone surrogate as one', () => {
    expect(codePointLength('\ud835')).toBe(1);
    expect(codePointLength('\udc53\ud835')).toBe(2);
    expect(codePointLength(`\ud835${MATH_F}`)).toBe(2);
  });

  it('accepts a string cut exactly at the limit by code point', () => {
    const atLimit = MATH_F.repeat(300);
    expect(atLimit.length).toBe(600);
    expect(isWithinCodePoints(atLimit, 300)).toBe(true);
    expect(isWithinCodePoints(`${atLimit}x`, 300)).toBe(false);
    expect(isWithinCodePoints(`${atLimit}${MATH_F}`, 300)).toBe(false);
  });

  it('keeps the ASCII boundary exact', () => {
    expect(isWithinCodePoints('a'.repeat(255), 255)).toBe(true);
    expect(isWithinCodePoints('a'.repeat(256), 255)).toBe(false);
  });

  it('clips without splitting a surrogate pair', () => {
    expect(clipCodePoints('abc', 5)).toBe('abc');
    expect(clipCodePoints('abcdef', 3)).toBe('abc');
    expect(clipCodePoints(`${EMOJI}${EMOJI}${EMOJI}`, 2)).toBe(
      `${EMOJI}${EMOJI}`,
    );
    // Cắt giữa chuỗi có cặp surrogate: kết quả vẫn là chuỗi Unicode hợp lệ.
    const clipped = clipCodePoints(`a${MATH_F}b${MATH_F}c`, 3);
    expect(clipped).toBe(`a${MATH_F}b`);
    expect(codePointLength(clipped)).toBe(3);
    expect(clipCodePoints('x', 0)).toBe('');
    expect(clipCodePoints(EMOJI, 0)).toBe('');
  });
});
