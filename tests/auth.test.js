import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiKeyAuth } from '../src/auth/api-key-auth.js';
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
  assert.match(calls[1].url, /contents\/records\?page=1&perPage=10&sort=-created&filter=/);
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
  assert.equal(calls[1].url, 'http://127.0.0.1:8090/api/collections/contents/records/content_123');
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
