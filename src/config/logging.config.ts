export interface LoggingConfig {
  APP__LOG_LEVEL?: string;
  APP__JSON_LOGS?: string;
}

export function loadLoggingConfig(): NodeJS.ProcessEnv {
  return {
    APP__LOG_LEVEL: process.env.APP__LOG_LEVEL,
    APP__JSON_LOGS: process.env.APP__JSON_LOGS,
  };
}
