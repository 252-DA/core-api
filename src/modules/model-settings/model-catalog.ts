import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Bản sao danh mục model của ai-sdk (ai-sdk/src/ai_runtime/catalog.py), sinh
 * bằng scripts/check_model_catalog.py vào contracts/proto/ — thư mục mà
 * docker-compose mount vào /app/proto. Đây là danh sách duy nhất core-api
 * dùng để quyết định tên profile nào được ghi vào llm_model_bindings.
 */
export type ModelProfile = { name: string; provider: string; model: string };
export type ModelTask = { task: string; default_profile: string; use_cases: string[] };
export type ModelCatalog = { profiles: ModelProfile[]; tasks: ModelTask[] };

const CATALOG_PATH = resolve(process.cwd(), 'proto/llm_model_catalog.json');

let cached: ModelCatalog | null = null;

export function loadModelCatalog(): ModelCatalog {
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as Partial<ModelCatalog>;
  if (!Array.isArray(raw.profiles) || !Array.isArray(raw.tasks)) {
    throw new Error(`${CATALOG_PATH} thiếu profiles hoặc tasks`);
  }
  cached = { profiles: raw.profiles, tasks: raw.tasks };
  return cached;
}
