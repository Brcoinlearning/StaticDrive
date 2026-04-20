import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createApp } from '../src/app.js';
import { createContentService } from '../src/content/service.js';
import { createRequest, createResponseCapture } from './helpers.js';

function createConfig(workspaceDir) {
  return {
    pocketbaseBaseUrl: 'http://127.0.0.1:8090',
    pocketbaseAdminEmail: 'admin@example.com',
    pocketbaseAdminPassword: 'secret',
    serviceHost: '127.0.0.1',
    servicePort: 8787,
    apiKeyHeader: 'x-shutong49-api-key',
    workspaceDir,
    publicBaseUrl: ''
  };
}

test('write/html creates unified rich_text content record', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-html'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.owner_user_id, 'user_123');
        assert.equal(record.type, 'rich_text');
        assert.equal(record.title, 'Hello HTML');
        assert.equal(record.html_content, '<p>body</p>');
        assert.equal(record.mime_type, 'text/html');
        assert.equal(record.is_shared, false);
        return { id: 'content_1' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/html',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Hello HTML',
      htmlContent: '<p>body</p>'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_1');
  assert.equal(response.body.type, 'rich_text');
  assert.match(response.body.contentHash, /^[a-f0-9]{32}$/);
  assert.equal(response.body.accessUrl, `http://127.0.0.1:8787/api/public/content/${response.body.contentHash}`);
});

test('write/file persists file and creates unified file content record', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-file-'));
  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.owner_user_id, 'user_123');
        assert.equal(record.type, 'file');
        assert.equal(record.original_filename, '测试 文件.txt');
        assert.equal(record.mime_type, 'text/plain');
        assert.equal(record.file_size, Buffer.byteLength('hello world'));
        assert.equal(record.is_shared, false);
        const absolutePath = path.join(workspaceDir, 'content-files', record.storage_path);
        assert.equal(fs.readFileSync(absolutePath, 'utf8'), 'hello world');
        return { id: 'content_2' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/file',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      filename: '测试 文件.txt',
      mimeType: 'text/plain',
      contentBase64: Buffer.from('hello world', 'utf8').toString('base64')
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_2');
  assert.equal(response.body.type, 'file');
});

test('write/file removes physical file when metadata write fails', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-file-fail-'));
  const contentService = createContentService({
    config: createConfig(workspaceDir),
    pocketbaseClient: {
      async createContent() {
        throw new Error('metadata write failed');
      }
    }
  });

  await assert.rejects(() => contentService.createFileContent({
    ownerUserId: 'user_123',
    filename: 'example.txt',
    mimeType: 'text/plain',
    contentBase64: Buffer.from('rollback me', 'utf8').toString('base64')
  }), /metadata write failed/);

  const storageRoot = path.join(workspaceDir, 'content-files');
  assert.equal(fs.readdirSync(storageRoot).length, 1);
  const leafDir = path.join(storageRoot, fs.readdirSync(storageRoot)[0]);
  assert.deepEqual(fs.readdirSync(leafDir), []);
});

test('write/html rejects missing title', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-html-missing-title'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/html',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: '   ',
      htmlContent: ''
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});

test('write/html returns structured diagnostics and logs request context on downstream failure', async () => {
  const app = createApp(createConfig('/tmp/shutong49-write-html-diagnostic'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent() {
        const error = new Error('PocketBase request failed during create_content.');
        error.statusCode = 502;
        error.code = 'pocketbase_request_failed';
        error.details = 'PocketBase request failed: 400';
        error.diagnostic = {
          operation: 'create_content',
          pocketbaseStatus: 400,
          pocketbaseMessage: 'Something went wrong while processing your request.'
        };
        throw error;
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  const originalConsoleError = console.error;
  const calls = [];
  console.error = (message) => calls.push(message);

  try {
    await app(await createRequest({
      method: 'POST',
      url: '/api/write/html',
      headers: {
        host: '127.0.0.1:8787',
        'x-shutong49-api-key': 'valid-key'
      },
      body: {
        title: 'Broken HTML',
        htmlContent: '<p>test</p>'
      }
    }), response);
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 502);
  assert.equal(response.body.error, 'pocketbase_request_failed');
  assert.equal(response.body.message, 'Content write failed.');
  assert.equal(response.body.details, 'PocketBase request failed: 400');
  assert.equal(response.body.diagnostic.operation, 'create_content');
  assert.equal(calls.length, 1);

  const log = JSON.parse(calls[0]);
  assert.equal(log.event, 'request_error');
  assert.equal(log.code, 'pocketbase_request_failed');
  assert.equal(log.context.method, 'POST');
  assert.equal(log.context.url, '/api/write/html');
  assert.equal(log.diagnostic.operation, 'create_content');
});

test('write/file retries when content_hash conflicts', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-file-conflict-'));
  let attempts = 0;
  const originalRandomBytes = Buffer.from;

  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        attempts += 1;
        if (attempts === 1) {
          const error = new Error('PocketBase request failed: 400');
          error.status = 400;
          error.payload = { data: { content_hash: { code: 'validation_not_unique' } } };
          throw error;
        }

        const absolutePath = path.join(workspaceDir, 'content-files', record.storage_path);
        assert.equal(fs.readFileSync(absolutePath, 'utf8'), 'retry me');
        return { id: 'content_retry' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/file',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      filename: 'retry.txt',
      mimeType: 'text/plain',
      contentBase64: Buffer.from('retry me', 'utf8').toString('base64')
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_retry');
  assert.equal(attempts, 2);
});

test('write/file rejects invalid base64 payload', async () => {
  const app = createApp(createConfig('/tmp/shutong49-invalid-base64'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/file',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      filename: 'bad.txt',
      contentBase64: '%%%not-base64%%'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});

test('query/list returns owner-scoped content summaries', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents({ ownerUserId, page, perPage, search }) {
        assert.equal(ownerUserId, 'user_123');
        assert.equal(page, 2);
        assert.equal(perPage, 5);
        assert.equal(search, '');
        return {
          page: 2,
          perPage: 5,
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'content_10',
            owner_user_id: 'user_123',
            type: 'file',
            title: 'Quarterly Report',
            original_filename: 'report.pdf',
            content_hash: 'abcd1234abcd1234abcd1234abcd1234',
            storage_path: 'ab/hash-report.pdf',
            mime_type: 'application/pdf',
            file_size: 1024,
            html_content: '',
            is_shared: false,
            created: '2026-04-18 10:00:00.000Z',
            updated: '2026-04-18 10:00:00.000Z'
          }]
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/list?page=2&perPage=5',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.items.length, 1);
  assert.deepEqual(response.body.items[0], {
    contentId: 'content_10',
    type: 'file',
    title: 'Quarterly Report',
    originalFilename: 'report.pdf',
    contentHash: 'abcd1234abcd1234abcd1234abcd1234',
    accessUrl: 'http://127.0.0.1:8787/api/public/content/abcd1234abcd1234abcd1234abcd1234',
    mimeType: 'application/pdf',
    fileSize: 1024,
    isShared: false,
    createdAt: '2026-04-18 10:00:00.000Z',
    updatedAt: '2026-04-18 10:00:00.000Z'
  });
});

test('query/list returns empty items for owner with no content', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-empty-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents({ ownerUserId, search }) {
        assert.equal(ownerUserId, 'user_123');
        assert.equal(search, '');
        return {
          page: 1,
          perPage: 20,
          totalItems: 0,
          totalPages: 0,
          items: []
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/list',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    items: [],
    page: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 0
  });
});

test('query/search returns owner-scoped matches and paging shape', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-search'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents({ ownerUserId, page, perPage, search }) {
        assert.equal(ownerUserId, 'user_123');
        assert.equal(page, 1);
        assert.equal(perPage, 20);
        assert.equal(search, 'report');
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'content_search',
            owner_user_id: 'user_123',
            type: 'rich_text',
            title: 'report draft',
            original_filename: '',
            content_hash: 'feed1234feed1234feed1234feed1234',
            storage_path: '',
            mime_type: 'text/html',
            file_size: 0,
            html_content: '<p>draft</p>',
            is_shared: false,
            created: '2026-04-18 11:00:00.000Z',
            updated: '2026-04-18 11:00:00.000Z'
          }]
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/search?q=report',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.query, 'report');
  assert.equal(response.body.items.length, 1);
  assert.equal(response.body.items[0].type, 'rich_text');
  assert.equal(response.body.items[0].title, 'report draft');
});

test('query/search returns empty result with valid paging shape when no hits', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-search-empty'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents({ search }) {
        assert.equal(search, 'nomatch');
        return {
          page: 1,
          perPage: 20,
          totalItems: 0,
          totalPages: 0,
          items: []
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/search?q=nomatch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    query: 'nomatch',
    items: [],
    page: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 0
  });
});

test('public list returns only shared content summaries', async () => {
  const contentService = createContentService({
    config: createConfig('/tmp/shutong49-public-list'),
    pocketbaseClient: {
      async listPublicContents({ page, perPage, search }) {
        assert.equal(page, 1);
        assert.equal(perPage, 20);
        assert.equal(search, '');
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'public_1',
            type: 'rich_text',
            title: '公开文章',
            original_filename: '',
            content_hash: 'publichash123456publichash123456',
            mime_type: 'text/html',
            file_size: 0,
            is_shared: true,
            created: '2026-04-19 11:00:00.000Z',
            updated: '2026-04-19 11:00:00.000Z'
          }]
        };
      }
    }
  });

  const result = await contentService.listPublicContents({});
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].contentId, 'public_1');
  assert.equal(result.items[0].publicPageUrl, '/web/public/content/publichash123456publichash123456');
});

test('public search returns shared matches with public detail urls', async () => {
  const contentService = createContentService({
    config: createConfig('/tmp/shutong49-public-search'),
    pocketbaseClient: {
      async listPublicContents({ search }) {
        assert.equal(search, '公开');
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'public_2',
            type: 'file',
            title: '公开文件',
            original_filename: 'public.txt',
            content_hash: 'publicsearch123456publicsearch12',
            mime_type: 'text/plain',
            file_size: 12,
            is_shared: true,
            created: '2026-04-19 11:00:00.000Z',
            updated: '2026-04-19 11:00:00.000Z'
          }]
        };
      }
    }
  });

  const result = await contentService.searchPublicContents({ q: '公开' });
  assert.equal(result.query, '公开');
  assert.equal(result.items[0].publicPageUrl, '/web/public/content/publicsearch123456publicsearch12');
});

test('query/detail returns owner-scoped content detail', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-detail'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_123');
        return {
          id: 'content_123',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Detail Page',
          original_filename: '',
          content_hash: 'face1234face1234face1234face1234',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<h1>Detail</h1>',
          is_shared: false,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:10:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/detail/content_123',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.contentId, 'content_123');
  assert.equal(response.body.ownerUserId, 'user_123');
  assert.equal(response.body.htmlContent, '<h1>Detail</h1>');
});

test('query/detail blocks cross-user content access', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-detail-forbidden'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_999',
          owner_user_id: 'user_other',
          type: 'file',
          title: 'Other User File',
          original_filename: 'other.txt',
          content_hash: 'beef1234beef1234beef1234beef1234',
          storage_path: 'be/beef-other.txt',
          mime_type: 'text/plain',
          file_size: 12,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:10:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/detail/content_999',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});

test('write/share creates share link for owned content and marks content shared', async () => {
  const app = createApp(createConfig('/tmp/shutong49-share-create'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_123');
        return {
          id: 'content_123',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Shared Note',
          original_filename: '',
          content_hash: '11112222333344445555666677778888',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>share me</p>',
          is_shared: false,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:00:00.000Z'
        };
      },
      async findShareLinkByContentId(contentId) {
        assert.equal(contentId, 'content_123');
        return null;
      },
      async createShareLink(record) {
        assert.equal(record.content_id, 'content_123');
        assert.equal(record.is_revoked, false);
        return { id: 'share_123' };
      },
      async updateContent(contentId, patch) {
        assert.equal(contentId, 'content_123');
        assert.deepEqual(patch, { is_shared: true });
        return { id: 'content_123', is_shared: true };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/share',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_123'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_123');
  assert.equal(response.body.shareId, 'share_123');
  assert.match(response.body.shareHash, /^[a-f0-9]{32}$/);
  assert.equal(response.body.shareUrl, `http://127.0.0.1:8787/api/public/share/${response.body.shareHash}`);
});

test('public content hash returns rich text payload only when content is shared', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-html'), {
    pocketbaseClient: {
      async getContentByHash(contentHash) {
        assert.equal(contentHash, 'htmlhash1234567890htmlhash123456');
        return {
          id: 'content_html',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Public HTML',
          original_filename: '',
          content_hash: 'htmlhash1234567890htmlhash123456',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<h1>Public</h1>',
          is_shared: true,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/content/htmlhash1234567890htmlhash123456',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'rich_text');
  assert.equal(response.body.access, 'content_hash');
  assert.equal(response.body.htmlContent, '<h1>Public</h1>');
});

test('web/list renders owner content list page', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents() {
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'content_page_1',
            owner_user_id: 'user_123',
            type: 'rich_text',
            title: '网页层内容',
            original_filename: '',
            content_hash: '12341234123412341234123412341234',
            storage_path: '',
            mime_type: 'text/html',
            file_size: 0,
            html_content: '<p>body</p>',
            is_shared: true,
            created: '2026-04-18 14:00:00.000Z',
            updated: '2026-04-18 14:00:00.000Z'
          }]
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/list',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /text\/html/);
  assert.match(response.rawBody, /内容列表/);
  assert.match(response.rawBody, /网页层内容/);
  assert.match(response.rawBody, /\/web\/detail\/content_page_1/);
});

test('web public list renders shared content discovery page', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-list'), {
    contentService: {
      async listPublicContents() {
        return {
          items: [{
            contentId: 'content_public_page_1',
            type: 'rich_text',
            title: '公开页面内容',
            originalFilename: '',
            contentHash: 'publicpagehash123456publicpage12',
            publicPageUrl: '/web/public/content/publicpagehash123456publicpage12',
            mimeType: 'text/html',
            fileSize: 0
          }],
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1
        };
      }
    },
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/public/list',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /公开内容列表/);
  assert.match(response.rawBody, /公开页面内容/);
  assert.match(response.rawBody, /\/web\/public\/content\/publicpagehash123456publicpage12/);
  assert.match(response.rawBody, /action="\/web\/public\/search"/);
});

test('web public search renders only public discovery results', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-search'), {
    contentService: {
      async searchPublicContents({ q }) {
        assert.equal(q, '公开');
        return {
          query: '公开',
          items: [{
            contentId: 'content_public_search_1',
            type: 'file',
            title: '公开搜索命中',
            originalFilename: 'shared.txt',
            contentHash: 'publicsearchhash123456public12',
            publicPageUrl: '/web/public/content/publicsearchhash123456public12',
            mimeType: 'text/plain',
            fileSize: 12
          }],
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1
        };
      }
    },
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/public/search?q=%E5%85%AC%E5%BC%80',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /公开搜索结果/);
  assert.match(response.rawBody, /公开搜索命中/);
  assert.match(response.rawBody, /shared.txt/);
  assert.match(response.rawBody, /\/web\/public\/content\/publicsearchhash123456public12/);
});

test('web/detail renders rich text in sandboxed iframe', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-detail'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_html_page',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'HTML 详情页',
          original_filename: '',
          content_hash: 'abcdabcdabcdabcdabcdabcdabcdabcd',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<script>alert(1)</script><h1>Hello</h1>',
          is_shared: true,
          created: '2026-04-18 15:00:00.000Z',
          updated: '2026-04-18 15:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/detail/content_html_page',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /<iframe class="preview" sandbox=""/);
  assert.match(response.rawBody, /srcdoc="&lt;script&gt;alert\(1\)&lt;\/script&gt;&lt;h1&gt;Hello&lt;\/h1&gt;"/);
});

test('web public share page renders downloadable file link', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-file'), {
    pocketbaseClient: {
      async findShareLinkByHash() {
        return {
          id: 'share_file_1',
          content_id: 'content_file_1',
          share_hash: 'sharehash1234sharehash1234share',
          is_revoked: false,
          created: '2026-04-18 16:00:00.000Z'
        };
      },
      async getContentById() {
        return {
          id: 'content_file_1',
          owner_user_id: 'user_123',
          type: 'file',
          title: '下载样例',
          original_filename: 'demo.txt',
          content_hash: 'filehash1234filehash1234filehash',
          storage_path: 'aa/demo.txt',
          mime_type: 'text/plain',
          file_size: 12,
          html_content: '',
          is_shared: true,
          created: '2026-04-18 16:00:00.000Z',
          updated: '2026-04-18 16:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    },
    fsImpl: {
      async readFile() {
        return Buffer.from('hello web dl', 'utf8');
      },
      async mkdir() {},
      async writeFile() {},
      async unlink() {}
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/public/share/sharehash1234sharehash1234share',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /公开文件/);
  assert.match(response.rawBody, /下载原始文件/);
  assert.match(response.rawBody, /href="http:\/\/127.0.0.1:8787\/api\/public\/content\/filehash1234filehash1234filehash"/);
});

test('web public content page returns html error page for unshared content', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-forbidden'), {
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_private',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Private',
          original_filename: '',
          content_hash: 'privatehash1234privatehash1234ab',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>private</p>',
          is_shared: false,
          created: '2026-04-18 16:00:00.000Z',
          updated: '2026-04-18 16:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/public/content/privatehash1234privatehash1234ab',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.match(response.headers['content-type'], /text\/html/);
  assert.match(response.rawBody, /内容不可公开访问/);
});

test('public content hash blocks access when content is not shared', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-block'), {
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_private',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Private HTML',
          original_filename: '',
          content_hash: 'privatehash123456privatehash123456',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>private</p>',
          is_shared: false,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/content/privatehash123456privatehash123456',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});

test('public share hash returns binary file download response', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-public-file-'));
  const absoluteFile = path.join(workspaceDir, 'content-files', 'ab', 'file.bin');
  fs.mkdirSync(path.dirname(absoluteFile), { recursive: true });
  fs.writeFileSync(absoluteFile, 'hello shared file', 'utf8');

  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findShareLinkByHash(shareHash) {
        assert.equal(shareHash, 'sharehash123456sharehash123456');
        return {
          id: 'share_file',
          content_id: 'content_file',
          share_hash: 'sharehash123456sharehash123456',
          is_revoked: false
        };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_file');
        return {
          id: 'content_file',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Shared File',
          original_filename: '共享 文件.txt',
          content_hash: 'filehash123456filehash123456file',
          storage_path: path.join('ab', 'file.bin'),
          mime_type: 'text/plain',
          file_size: Buffer.byteLength('hello shared file'),
          html_content: '',
          is_shared: true,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/sharehash123456sharehash123456',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /^text\/plain/);
  assert.equal(response.headers['content-length'], String(Buffer.byteLength('hello shared file')));
  assert.match(response.headers['content-disposition'], /attachment; filename\*=UTF-8''/);
  assert.equal(response.rawBody, 'hello shared file');
});

test('public content hash returns binary bytes identical to stored file', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-public-file-identical-'));
  const originalBytes = Buffer.from([0x00, 0x01, 0x41, 0x42, 0xff, 0x10, 0x20, 0x7f]);
  const absoluteFile = path.join(workspaceDir, 'content-files', 'cd', 'file.bin');
  fs.mkdirSync(path.dirname(absoluteFile), { recursive: true });
  fs.writeFileSync(absoluteFile, originalBytes);

  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async getContentByHash(contentHash) {
        assert.equal(contentHash, 'binaryhash123456binaryhash123456');
        return {
          id: 'content_binary',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Binary File',
          original_filename: 'binary.bin',
          content_hash: 'binaryhash123456binaryhash123456',
          storage_path: path.join('cd', 'file.bin'),
          mime_type: 'application/octet-stream',
          file_size: originalBytes.byteLength,
          html_content: '',
          is_shared: true,
          created: '2026-04-19 10:00:00.000Z',
          updated: '2026-04-19 10:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/content/binaryhash123456binaryhash123456',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'], /^application\/octet-stream/);
  assert.equal(response.headers['content-length'], String(originalBytes.byteLength));
  assert.deepEqual(response.rawBuffer, originalBytes);
});

test('public share hash returns gone when share is revoked', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-revoked'), {
    pocketbaseClient: {
      async findShareLinkByHash() {
        return {
          id: 'share_revoked',
          content_id: 'content_123',
          share_hash: 'revokedhash123456revokedhash1234',
          is_revoked: true
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/revokedhash123456revokedhash1234',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 410);
  assert.equal(response.body.error, 'gone');
});

test('public share hash returns not found for unknown share', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-missing-share'), {
    pocketbaseClient: {
      async findShareLinkByHash() {
        return null;
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/missingshare123456missingshare12',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, 'not_found');
});

test('write/share/revoke revokes active share and public access becomes gone', async () => {
  const app = createApp(createConfig('/tmp/shutong49-share-revoke'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_123',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Shared Note',
          original_filename: '',
          content_hash: '11112222333344445555666677778888',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>share me</p>',
          is_shared: true,
          created: '2026-04-18 12:00:00.000Z',
          updated: '2026-04-18 12:00:00.000Z'
        };
      },
      async findShareLinkByContentId(contentId) {
        assert.equal(contentId, 'content_123');
        return {
          id: 'share_123',
          content_id: 'content_123',
          share_hash: 'sharehash123456sharehash123456',
          is_revoked: false
        };
      },
      async updateShareLink(shareId, patch) {
        assert.equal(shareId, 'share_123');
        assert.deepEqual(patch, { is_revoked: true });
        return { id: 'share_123', is_revoked: true };
      },
      async updateContent(contentId, patch) {
        assert.equal(contentId, 'content_123');
        assert.deepEqual(patch, { is_shared: false });
        return { id: 'content_123', is_shared: false };
      },
      async findShareLinkByHash(shareHash) {
        assert.equal(shareHash, 'sharehash123456sharehash123456');
        return {
          id: 'share_123',
          content_id: 'content_123',
          share_hash: 'sharehash123456sharehash123456',
          is_revoked: true
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const revokeResponse = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/share/revoke',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_123'
    }
  }), revokeResponse);

  assert.equal(revokeResponse.statusCode, 200);
  assert.equal(revokeResponse.body.revoked, true);
  assert.equal(revokeResponse.body.shareId, 'share_123');

  const publicResponse = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/sharehash123456sharehash123456',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), publicResponse);

  assert.equal(publicResponse.statusCode, 410);
  assert.equal(publicResponse.body.error, 'gone');
});

test('write/delete removes file, revokes share links, and deletes metadata', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-delete-file-'));
  const absoluteFile = path.join(workspaceDir, 'content-files', 'aa', 'aa-demo.txt');
  fs.mkdirSync(path.dirname(absoluteFile), { recursive: true });
  fs.writeFileSync(absoluteFile, 'delete me', 'utf8');

  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_file_delete');
        return {
          id: 'content_file_delete',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Delete Me',
          original_filename: 'demo.txt',
          content_hash: 'deletehash123456deletehash123456',
          storage_path: path.join('aa', 'aa-demo.txt'),
          mime_type: 'text/plain',
          file_size: Buffer.byteLength('delete me'),
          html_content: '',
          is_shared: true,
          created: '2026-04-18 17:00:00.000Z',
          updated: '2026-04-18 17:00:00.000Z'
        };
      },
      async listShareLinksByContentId(contentId, options) {
        assert.equal(contentId, 'content_file_delete');
        assert.deepEqual(options, { includeRevoked: true });
        return [{ id: 'share_a', is_revoked: false }, { id: 'share_b', is_revoked: true }];
      },
      async updateShareLink(shareId, patch) {
        assert.equal(shareId, 'share_a');
        assert.deepEqual(patch, { is_revoked: true });
        return { id: 'share_a', is_revoked: true };
      },
      async deleteContent(contentId) {
        assert.equal(contentId, 'content_file_delete');
        return {};
      },
      async findShareLinkByHash() {
        return null;
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const deleteResponse = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/delete',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_file_delete'
    }
  }), deleteResponse);

  assert.equal(deleteResponse.statusCode, 200);
  assert.equal(deleteResponse.body.deleted, true);
  assert.equal(deleteResponse.body.revokedShareCount, 2);
  assert.equal(deleteResponse.body.removedFile, true);
  assert.equal(fs.existsSync(absoluteFile), false);

  const publicResponse = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/share-after-delete',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), publicResponse);

  assert.equal(publicResponse.statusCode, 404);
  assert.equal(publicResponse.body.error, 'not_found');
});

test('write/delete rejects cross-user content delete', async () => {
  const app = createApp(createConfig('/tmp/shutong49-delete-forbidden'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_foreign',
          owner_user_id: 'user_other',
          type: 'file',
          title: 'Other User File',
          original_filename: 'other.txt',
          content_hash: 'otherhash123456otherhash123456',
          storage_path: 'bb/other.txt',
          mime_type: 'text/plain',
          file_size: 1,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 17:00:00.000Z',
          updated: '2026-04-18 17:00:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/delete',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_foreign'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});
