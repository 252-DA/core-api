export function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
