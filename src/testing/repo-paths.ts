import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function findContractsDir(startDir: string): string {
  let dir = resolve(startDir);
  let parent = dirname(dir);
  while (!existsSync(join(dir, 'contracts', 'integration-events'))) {
    if (parent === dir) {
      return join(resolve(startDir), '__missing_contracts__');
    }
    dir = parent;
    parent = dirname(dir);
  }
  return join(dir, 'contracts');
}

/**
 * Tìm thư mục `contracts/` ở gốc mono-repo; nếu không có (checkout riêng
 * `core-api`), trả về đường dẫn không tồn tại để spec hợp đồng giữ hành vi skip.
 */
export const CONTRACTS_DIR = findContractsDir(__dirname);
