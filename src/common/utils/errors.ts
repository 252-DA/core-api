export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function errorNameAndMessage(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}
