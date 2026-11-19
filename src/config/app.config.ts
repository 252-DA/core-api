import { readEnv } from './env';

export interface AppConfig {
  port: number;
}

export function loadAppConfig(): AppConfig {
  const rawPort = readEnv('PORT');
  return {
    port: rawPort ? parseInt(rawPort, 10) : 4000,
  };
}
