import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { createApp } from './app.js';
import { loadConfig } from './config.js';

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv(path.join(rootDir, '.env'));

const config = loadConfig(process.env, rootDir);
fs.mkdirSync(config.workspaceDir, { recursive: true });

const app = createApp(config);
const server = http.createServer(app);

server.listen(config.servicePort, config.serviceHost, () => {
  console.log(`Business shell listening on http://${config.serviceHost}:${config.servicePort}`);
});
