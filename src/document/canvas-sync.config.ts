export const CANVAS_SYNC_CONFIG = Symbol('CANVAS_SYNC_CONFIG');

export interface CanvasSyncConfig {
  enabled: boolean;
  intervalMs: number;
  launchCooldownMs: number;
}

function positiveMs(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error(
      'Canvas sync intervals must be positive integers (milliseconds).',
    );
  }
  return result;
}

export function canvasSyncConfig(): CanvasSyncConfig {
  return {
    enabled:
      process.env.CANVAS_AUTO_SYNC_ENABLED !== 'false' &&
      !!process.env.CANVAS_API_TOKEN &&
      !!(process.env.CANVAS_API_URL || process.env.LTI_PLATFORM_URL),
    intervalMs: positiveMs(process.env.CANVAS_SYNC_INTERVAL_MS, 15 * 60_000),
    launchCooldownMs: positiveMs(
      process.env.CANVAS_SYNC_LAUNCH_COOLDOWN_MS,
      2 * 60_000,
    ),
  };
}
