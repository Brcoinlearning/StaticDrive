import path from 'node:path';
import process from 'node:process';

function requireString(value, fallback) {
  const resolved = value ?? fallback;
  return typeof resolved === 'string' ? resolved.trim() : '';
}

function toNumber(value, fallback) {
  const source = value ?? fallback;
  const parsed = Number(source);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric configuration value: ${source}`);
  }

  return parsed;
}

export function loadConfig(env = process.env, cwd = process.cwd(), options = {}) {
  const pocketbaseBaseUrl = requireString(env.PB_BASE_URL, 'http://127.0.0.1:8090');
  const pocketbaseAdminEmail = requireString(env.PB_ADMIN_EMAIL, '');
  const pocketbaseAdminPassword = requireString(env.PB_ADMIN_PASSWORD, '');
  const serviceHost = requireString(env.SERVICE_HOST, '127.0.0.1');
  const apiKeyHeader = requireString(env.API_KEY_HEADER, 'x-shutong49-api-key').toLowerCase();
  const workspaceDirInput = requireString(env.WORKSPACE_DIR, './workspace');
  const publicBaseUrl = requireString(env.PUBLIC_BASE_URL, '');
  const ownerSessionCookieName = requireString(env.OWNER_SESSION_COOKIE_NAME, 'shutong49_owner_session');
  const ownerSessionMaxAgeSeconds = toNumber(env.OWNER_SESSION_MAX_AGE_SECONDS, 43200);

  if (!pocketbaseBaseUrl) {
    throw new Error('PB_BASE_URL is required.');
  }

  if (!apiKeyHeader) {
    throw new Error('API_KEY_HEADER is required.');
  }

  if (options.requirePocketbaseAdminCredentials) {
    if (!pocketbaseAdminEmail) {
      throw new Error('PB_ADMIN_EMAIL is required to start the business shell.');
    }

    if (!pocketbaseAdminPassword) {
      throw new Error('PB_ADMIN_PASSWORD is required to start the business shell.');
    }
  }

  return {
    pocketbaseBaseUrl: pocketbaseBaseUrl.replace(/\/$/, ''),
    pocketbaseAdminEmail,
    pocketbaseAdminPassword,
    serviceHost,
    servicePort: toNumber(env.SERVICE_PORT, 8787),
    apiKeyHeader,
    workspaceDir: path.resolve(cwd, workspaceDirInput),
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ''),
    ownerSessionCookieName,
    ownerSessionMaxAgeSeconds
  };
}
