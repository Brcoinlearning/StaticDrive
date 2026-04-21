import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../src/config.js';

test('loadConfig returns defaults with resolved workspace path', () => {
  const config = loadConfig({}, '/tmp/shutong49');

  assert.equal(config.pocketbaseBaseUrl, 'http://127.0.0.1:8090');
  assert.equal(config.pocketbaseAdminEmail, '');
  assert.equal(config.pocketbaseAdminPassword, '');
  assert.equal(config.serviceHost, '127.0.0.1');
  assert.equal(config.servicePort, 8787);
  assert.equal(config.apiKeyHeader, 'x-shutong49-api-key');
  assert.equal(config.workspaceDir, '/tmp/shutong49/workspace');
  assert.equal(config.ownerSessionCookieName, 'shutong49_owner_session');
  assert.equal(config.ownerSessionMaxAgeSeconds, 43200);
});

test('loadConfig honors explicit env values', () => {
  const config = loadConfig({
    PB_BASE_URL: 'http://127.0.0.1:9090/',
    PB_ADMIN_EMAIL: 'admin@example.com',
    PB_ADMIN_PASSWORD: 'secret-pass',
    PUBLIC_BASE_URL: 'https://example.com/',
    SERVICE_HOST: '0.0.0.0',
    SERVICE_PORT: '3001',
    API_KEY_HEADER: 'X-Custom-Key',
    WORKSPACE_DIR: './custom-workspace',
    OWNER_SESSION_COOKIE_NAME: 'custom_owner_session',
    OWNER_SESSION_MAX_AGE_SECONDS: '7200'
  }, '/srv/app');

  assert.equal(config.pocketbaseBaseUrl, 'http://127.0.0.1:9090');
  assert.equal(config.pocketbaseAdminEmail, 'admin@example.com');
  assert.equal(config.pocketbaseAdminPassword, 'secret-pass');
  assert.equal(config.serviceHost, '0.0.0.0');
  assert.equal(config.servicePort, 3001);
  assert.equal(config.apiKeyHeader, 'x-custom-key');
  assert.equal(config.workspaceDir, '/srv/app/custom-workspace');
  assert.equal(config.publicBaseUrl, 'https://example.com');
  assert.equal(config.ownerSessionCookieName, 'custom_owner_session');
  assert.equal(config.ownerSessionMaxAgeSeconds, 7200);
});

test('loadConfig resolves workspace inside current worktree root', () => {
  const config = loadConfig({ WORKSPACE_DIR: './workspace' }, '/repo/.worktrees/t1-pocketbase-base');

  assert.equal(config.workspaceDir, '/repo/.worktrees/t1-pocketbase-base/workspace');
});

test('loadConfig keeps public base url optional and trims trailing slash', () => {
  const config = loadConfig({ PUBLIC_BASE_URL: 'https://example.com/' }, '/srv/app');

  assert.equal(config.publicBaseUrl, 'https://example.com');
});

test('loadConfig requires PocketBase admin credentials when service preflight requests them', () => {
  assert.throws(
    () => loadConfig({}, '/srv/app', { requirePocketbaseAdminCredentials: true }),
    /PB_ADMIN_EMAIL is required to start the business shell\./
  );

  assert.throws(
    () => loadConfig({ PB_ADMIN_EMAIL: 'admin@example.com' }, '/srv/app', { requirePocketbaseAdminCredentials: true }),
    /PB_ADMIN_PASSWORD is required to start the business shell\./
  );
});
