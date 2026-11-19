export interface EssayConfig {
  pollIntervalMs: number;
}

export function loadEssayConfig(): EssayConfig {
  return {
    pollIntervalMs: Number(process.env.ESSAY_POLL_INTERVAL_MS) || 10_000,
  };
}
