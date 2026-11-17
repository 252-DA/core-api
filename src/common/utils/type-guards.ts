export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isIntIn(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function extraKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
): string[] {
  return Object.keys(obj).filter((key) => !allowed.includes(key));
}
