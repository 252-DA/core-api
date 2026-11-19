export interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export function loadRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    };
  } catch {
    // Fallback if URL is invalid or in a different format
    return {
      host: 'localhost',
      port: 6379,
    };
  }
}
