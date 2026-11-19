export interface DatabaseConfig {
  url?: string;
}

export function loadDatabaseConfig(): DatabaseConfig {
  return {
    url: process.env.DATABASE_URL,
  };
}
