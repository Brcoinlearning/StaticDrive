import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiKeyAuth } from '../src/auth/api-key-auth.js';
import { buildExpiredSessionCookie, buildSessionCookie, createSessionAuth, createSessionStore } from '../src/auth/session-auth.js';
import { PocketBaseClient } from '../src/pocketbase/client.js';
import { createResponseCapture } from './helpers.js';

test('apiKeyAuth returns auth context when users_api match exists', async () => {
  const auth = createApiKeyAuth({
    apiKeyHeader: 'x-shutong49-api-key',
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        assert.equal(apiKey, 'valid-key');
        return {
          id: 'user_123',
          display_name: 'Verifier',
          api_key: 'valid-key'
        };
      }
    }
  });

  const response = createResponseCapture();
  const context = await auth({ headers: { 'x-shutong49-api-key': 'valid-key' } }, response);

  assert.deepEqual(context, {
    apiKey: 'valid-key',
    user: {
      id: 'user_123',
      displayName: 'Verifier',
      apiKey: 'valid-key'
    }
  });
  assert.equal(response.statusCode, null);
});

test('apiKeyAuth rejects missing header', async () => {
  const auth = createApiKeyAuth({
    apiKeyHeader: 'x-shutong49-api-key',
    pocketbaseClient: {}
  });

  const response = createResponseCapture();
  const context = await auth({ headers: {} }, response);

  assert.equal(context, null);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, 'missing_api_key');
});

test('apiKeyAuth returns diagnostic details when PocketBase lookup fails', async () => {
  const auth = createApiKeyAuth({
    apiKeyHeader: 'x-shutong49-api-key',
    pocketbaseClient: {
      async findUserByApiKey() {
        const error = new Error('PocketBase request failed during find_user_by_api_key.');
        error.statusCode = 502;
        error.code = 'pocketbase_request_failed';
        error.details = 'PocketBase request failed: 400';
        error.diagnostic = {
          operation: 'find_user_by_api_key',
          pocketbaseStatus: 400,
          pocketbaseMessage: 'validation failed'
        };
        throw error;
      }
    }
  });

  const response = createResponseCapture();
  const context = await auth({ headers: { 'x-shutong49-api-key': 'bad-key' } }, response);

  assert.equal(context, null);
  assert.equal(response.statusCode, 502);
  assert.equal(response.body.error, 'pocketbase_unavailable');
  assert.equal(response.body.details, 'PocketBase request failed: 400');
  assert.equal(response.body.diagnostic.operation, 'find_user_by_api_key');
  assert.equal(response.body.diagnostic.pocketbaseStatus, 400);
});

test('PocketBaseClient raises structured diagnostic error on failed requests', async () => {
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url) {
      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        message: 'Something went wrong while processing your request.',
        data: {
          title: {
            code: 'validation_required',
            message: 'Missing required value.'
          }
        }
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  await assert.rejects(
    () => client.createContent({ title: '' }),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.equal(error.code, 'pocketbase_request_failed');
      assert.equal(error.details, 'PocketBase request failed: 400');
      assert.equal(error.diagnostic.operation, 'create_content');
      assert.equal(error.diagnostic.pocketbaseStatus, 400);
      assert.equal(error.diagnostic.pocketbaseData.title.code, 'validation_required');
      return true;
    }
  );
});

test('PocketBaseClient authenticates admin before querying users_api', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        items: [{ id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' }]
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  const user = await client.findUserByApiKey('valid-key');

  assert.equal(user.id, 'user_123');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'http://127.0.0.1:8090/api/admins/auth-with-password');
  assert.match(calls[1].url, /users_api\/records/);
  assert.equal(calls[1].options.headers.authorization, 'pb_admin_token');
});

test('PocketBaseClient reuses cached admin token', async () => {
  let adminAuthCount = 0;
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url) {
      if (url.endsWith('/api/admins/auth-with-password')) {
        adminAuthCount += 1;
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  await client.findUserByApiKey('valid-key');
  await client.findUserByApiKey('valid-key-2');

  assert.equal(adminAuthCount, 1);
});

test('PocketBaseClient builds owner-scoped content list query with search filter', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ items: [], page: 1, perPage: 10, totalItems: 0, totalPages: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  await client.listContents({ ownerUserId: 'user_123', page: 1, perPage: 10, search: '季度 报告' });

  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /contents\/records\?page=1&perPage=10&sort=-created&expand=owner_user_id&filter=/);
  assert.match(decodeURIComponent(calls[1].url), /owner_user_id = "user_123"/);
  assert.match(decodeURIComponent(calls[1].url), /title ~ "季度 报告"/);
  assert.match(decodeURIComponent(calls[1].url), /original_filename ~ "季度 报告"/);
  assert.equal(calls[1].options.headers.authorization, 'pb_admin_token');
});

test('PocketBaseClient fetches content detail by record id', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ id: 'content_123', owner_user_id: 'user_123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  const content = await client.getContentById('content_123');

  assert.equal(content.id, 'content_123');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'http://127.0.0.1:8090/api/collections/contents/records/content_123?expand=owner_user_id');
  assert.equal(calls[1].options.headers.authorization, 'pb_admin_token');
});

test('PocketBaseClient queries content by content_hash', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ items: [{ id: 'content_hash_match' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  const content = await client.getContentByHash('hash_123');

  assert.equal(content.id, 'content_hash_match');
  assert.equal(calls.length, 2);
  assert.match(decodeURIComponent(calls[1].url), /content_hash = "hash_123"/);
});

test('PocketBaseClient creates and queries share links', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.endsWith('/api/collections/share_links/records')) {
        return new Response(JSON.stringify({ id: 'share_123' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ items: [{ id: 'share_123', share_hash: 'share_hash_123' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  const created = await client.createShareLink({ content_id: 'content_123', share_hash: 'share_hash_123', is_revoked: false });
  const byContent = await client.findShareLinkByContentId('content_123');
  const byHash = await client.findShareLinkByHash('share_hash_123');

  assert.equal(created.id, 'share_123');
  assert.equal(byContent.id, 'share_123');
  assert.equal(byHash.id, 'share_123');
  assert.match(decodeURIComponent(calls[2].url), /content_id = "content_123"/);
  assert.match(decodeURIComponent(calls[3].url), /share_hash = "share_hash_123"/);
});

test('PocketBaseClient updates content sharing flag', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ id: 'content_123', is_shared: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
  });

  const updated = await client.updateContent('content_123', { is_shared: true });

  assert.equal(updated.is_shared, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'http://127.0.0.1:8090/api/collections/contents/records/content_123');
  assert.equal(calls[1].options.method, 'PATCH');
});

test('PocketBaseClient lists share links, updates share link, and deletes content', async () => {
  const calls = [];
  const client = new PocketBaseClient({
    baseUrl: 'http://127.0.0.1:8090',
    adminEmail: 'admin@example.com',
    adminPassword: 'secret-pass',
    async fetchImpl(url, options = {}) {
      calls.push({ url, options });

      if (url.endsWith('/api/admins/auth-with-password')) {
        return new Response(JSON.stringify({ token: 'pb_admin_token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.includes('/api/collections/share_links/records?page=1&perPage=50')) {
        return new Response(JSON.stringify({ items: [{ id: 'share_123', is_revoked: false }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.endsWith('/api/collections/share_links/records/share_123')) {
        return new Response(JSON.stringify({ id: 'share_123', is_revoked: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.endsWith('/api/collections/contents/records/content_123')) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const shareLinks = await client.listShareLinksByContentId('content_123', { includeRevoked: true });
  const updated = await client.updateShareLink('share_123', { is_revoked: true });
  await client.deleteContent('content_123');

  assert.equal(shareLinks.length, 1);
  assert.equal(updated.is_revoked, true);
  assert.match(decodeURIComponent(calls[1].url), /content_id = "content_123"/);
  assert.equal(calls[2].options.method, 'PATCH');
  assert.equal(calls[3].options.method, 'DELETE');
});


test('apiKeyAuth can allow missing header without writing 401', async () => {
  const auth = createApiKeyAuth({
    apiKeyHeader: 'x-shutong49-api-key',
    pocketbaseClient: {},
    allowMissing: true
  });

  const response = createResponseCapture();
  const context = await auth({ headers: {} }, response);

  assert.equal(context, null);
  assert.equal(response.statusCode, null);
});

test('session store creates, reads, and deletes session', async () => {
  const store = createSessionStore();
  const token = store.createSession({
    user: { id: 'user_123', displayName: 'Verifier', apiKey: 'valid-key' },
    apiKey: 'valid-key',
    maxAgeMs: 60_000
  });

  const session = store.getSession(token);
  assert.equal(session.user.id, 'user_123');
  assert.equal(session.apiKey, 'valid-key');

  store.deleteSession(token);
  assert.equal(store.getSession(token), null);
});

test('session auth reads owner session from cookie header', async () => {
  const store = createSessionStore();
  const token = store.createSession({
    user: { id: 'user_123', displayName: 'Verifier', apiKey: 'valid-key' },
    apiKey: 'valid-key',
    maxAgeMs: 60_000
  });
  const auth = createSessionAuth({
    cookieName: 'shutong49_owner_session',
    sessionStore: store
  });

  const context = await auth({
    headers: {
      cookie: 'shutong49_owner_session=' + token
    }
  });

  assert.equal(context.user.id, 'user_123');
  assert.equal(context.apiKey, 'valid-key');
  assert.equal(context.sessionToken, token);
});

test('session cookie helpers build set-cookie values', async () => {
  assert.match(buildSessionCookie({
    cookieName: 'shutong49_owner_session',
    token: 'token123',
    maxAgeSeconds: 3600
  }), /HttpOnly/);
  assert.match(buildSessionCookie({
    cookieName: 'shutong49_owner_session',
    token: 'token123',
    maxAgeSeconds: 3600
  }), /Max-Age=3600/);
  assert.match(buildExpiredSessionCookie('shutong49_owner_session'), /Max-Age=0/);
});
