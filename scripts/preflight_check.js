import process from 'node:process';

import { loadConfig } from '../src/config.js';

const mode = process.argv[2] ?? '';

try {
  loadConfig(process.env, process.cwd(), {
    requirePocketbaseAdminCredentials: mode === 'service'
  });
} catch (error) {
  console.error(`[preflight:${mode || 'config'}] ${error.message}`);
  process.exit(1);
}
