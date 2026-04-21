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
    publicBaseUrl: '',
    ownerSessionCookieName: 'shutong49_owner_session',
    ownerSessionMaxAgeSeconds: 43200
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
            title: 'Annual report',
            original_filename: '',
            content_hash: 'searchhash1234searchhash1234abcd',
            storage_path: '',
            mime_type: 'text/html',
            file_size: 0,
            html_content: '<p>report</p>',
            is_shared: true,
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
  assert.equal(response.body.items[0].title, 'Annual report');
});

test('query/search returns empty result with valid paging shape when no hits', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-search-empty'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents() {
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
    url: '/api/query/search?q=none',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.query, 'none');
  assert.deepEqual(response.body.items, []);
});

test('query/detail returns owner-scoped content detail', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-detail'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_detail_1');
        return {
          id: 'content_detail_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Detail',
          original_filename: '',
          content_hash: 'detailhash1234detailhash1234abcd',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>Detail</p>',
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
    url: '/api/query/detail/content_detail_1',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.contentId, 'content_detail_1');
  assert.equal(response.body.ownerUserId, 'user_123');
  assert.equal(response.body.htmlContent, '<p>Detail</p>');
});

test('query/detail blocks cross-user content access', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-detail-forbidden'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'foreign_content',
          owner_user_id: 'other_user',
          type: 'file',
          title: 'Foreign',
          original_filename: 'foreign.txt',
          content_hash: 'foreignhash1234foreignhash1234ab',
          storage_path: 'ff/file.txt',
          mime_type: 'text/plain',
          file_size: 1,
          html_content: '',
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
    url: '/api/query/detail/foreign_content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});

test('write/share creates share link for owned content and marks content shared', async () => {
  const updates = [];
  const app = createApp(createConfig('/tmp/shutong49-share-create'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_share_1',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Shareable',
          original_filename: 'demo.txt',
          content_hash: 'sharecontenthash1234sharecontentab',
          storage_path: 'aa/demo.txt',
          mime_type: 'text/plain',
          file_size: 9,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 13:00:00.000Z',
          updated: '2026-04-18 13:00:00.000Z'
        };
      },
      async findShareLinkByContentId() {
        return null;
      },
      async createShareLink(record) {
        assert.equal(record.content_id, 'content_share_1');
        return { id: 'share_1' };
      },
      async updateContent(id, record) {
        updates.push({ id, record });
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
      contentId: 'content_share_1'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_share_1');
  assert.equal(response.body.type, 'file');
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0], {
    id: 'content_share_1',
    record: { is_shared: true }
  });
});

test('public content hash returns rich text payload only when content is shared', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-html'), {
    pocketbaseClient: {
      async getContentByHash() {
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

test('web/list renders owner content list page with action-oriented layout', async () => {
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
  assert.match(response.rawBody, /Owner 内容列表/);
  assert.match(response.rawBody, /网页层内容/);
  assert.match(response.rawBody, /查看详情/);
  assert.match(response.rawBody, /打开公开页/);
});

test('web/list renders success flash from redirect params', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-list-flash'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents() {
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
    url: '/web/list?tone=success&title=%E5%B7%B2%E5%AE%8C%E6%88%90&message=%E5%88%A0%E9%99%A4%E5%AE%8C%E6%88%90',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /已完成/);
  assert.match(response.rawBody, /删除完成/);
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

test('web/detail renders rich text in sandboxed iframe and owner action panel', async () => {
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
  assert.match(response.rawBody, /Owner 操作/);
  assert.match(response.rawBody, /action="\/web\/action\/share\/revoke"/);
});

test('web owner share action redirects back to detail with success flash', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-action-share'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_share_web',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Share Me',
          original_filename: 'share.txt',
          content_hash: 'sharewebhash1234sharewebhash1234',
          storage_path: 'aa/share.txt',
          mime_type: 'text/plain',
          file_size: 8,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 15:30:00.000Z',
          updated: '2026-04-18 15:30:00.000Z'
        };
      },
      async findShareLinkByContentId() {
        return null;
      },
      async createShareLink() {
        return { id: 'share_web_1' };
      },
      async updateContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/action/share',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'contentId=content_share_web'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/detail\/content_share_web\?/);
  assert.match(response.headers.location, /tone=success/);
  assert.match(response.headers.location, /title=%E5%88%86%E4%BA%AB%E5%B7%B2%E5%88%9B%E5%BB%BA/);
});

test('web owner delete action redirects back to list with success flash', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-action-delete'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_delete_web',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Delete Me',
          original_filename: 'delete.txt',
          content_hash: 'deletewebhash1234deletewebhash12',
          storage_path: 'aa/delete.txt',
          mime_type: 'text/plain',
          file_size: 9,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 15:40:00.000Z',
          updated: '2026-04-18 15:40:00.000Z'
        };
      },
      async listShareLinksByContentId() {
        return [];
      },
      async deleteContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    },
    fsImpl: {
      async rm() {},
      async readFile() { return Buffer.from('x'); },
      async mkdir() {},
      async writeFile() {},
      async unlink() {}
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/action/delete',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'contentId=content_delete_web'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers.location, /title=%E5%86%85%E5%AE%B9%E5%B7%B2%E5%88%A0%E9%99%A4/);
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
      async unlink() {},
      async rm() {}
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
  assert.match(response.rawBody, /内容不可公开访问/);
});

test('public content hash blocks access when content is not shared', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-not-shared'), {
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_private_api',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Private API',
          original_filename: 'private.txt',
          content_hash: 'privateapihash1234privateapi1234',
          storage_path: 'aa/private.txt',
          mime_type: 'text/plain',
          file_size: 4,
          html_content: '',
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
    url: '/api/public/content/privateapihash1234privateapi1234',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});

test('public share hash returns file download payload', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-share-file'), {
    pocketbaseClient: {
      async findShareLinkByHash() {
        return {
          id: 'share_public_file',
          content_id: 'content_public_file',
          share_hash: 'sharehashfile1234sharehashfile12',
          is_revoked: false,
          created: '2026-04-18 16:20:00.000Z'
        };
      },
      async getContentById() {
        return {
          id: 'content_public_file',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Share File',
          original_filename: 'payload.txt',
          content_hash: 'publicfilehash1234publicfilehash12',
          storage_path: 'aa/payload.txt',
          mime_type: 'text/plain',
          file_size: 7,
          html_content: '',
          is_shared: true,
          created: '2026-04-18 16:20:00.000Z',
          updated: '2026-04-18 16:20:00.000Z'
        };
      },
      async healthCheck() {
        return { code: 200 };
      }
    },
    fsImpl: {
      async readFile() {
        return Buffer.from('payload', 'utf8');
      },
      async mkdir() {},
      async writeFile() {},
      async unlink() {},
      async rm() {}
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/public/share/sharehashfile1234sharehashfile12',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.rawBuffer.toString('utf8'), 'payload');
  assert.match(response.headers['content-disposition'], /payload.txt/);
});

test('public share hash returns gone when share is revoked', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-share-gone'), {
    pocketbaseClient: {
      async findShareLinkByHash() {
        return {
          id: 'share_revoked',
          content_id: 'content_revoked',
          share_hash: 'revokedsharehash1234revokedshare12',
          is_revoked: true,
          created: '2026-04-18 16:30:00.000Z'
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
    url: '/api/public/share/revokedsharehash1234revokedshare12',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 410);
  assert.equal(response.body.error, 'gone');
});

test('public share hash returns not found for unknown share', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-share-not-found'), {
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
    url: '/api/public/share/missinghash1234missinghash1234',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, 'not_found');
});

test('write/share/revoke revokes active share and public access becomes gone', async () => {
  let revoked = false;
  const app = createApp(createConfig('/tmp/shutong49-share-revoke'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_revoke_1',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Revoke',
          original_filename: 'revoke.txt',
          content_hash: 'revokehash1234revokehash1234abcd',
          storage_path: 'aa/revoke.txt',
          mime_type: 'text/plain',
          file_size: 6,
          html_content: '',
          is_shared: true,
          created: '2026-04-18 17:00:00.000Z',
          updated: '2026-04-18 17:00:00.000Z'
        };
      },
      async findShareLinkByContentId() {
        return {
          id: 'share_revoke_1',
          share_hash: 'revoke-share-hash',
          is_revoked: false
        };
      },
      async updateShareLink() {
        revoked = true;
      },
      async updateContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/share/revoke',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_revoke_1'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.revoked, true);
  assert.equal(revoked, true);
});

test('write/delete removes file, revokes share links, and deletes metadata', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-delete-'));
  const storageRoot = path.join(workspaceDir, 'content-files', 'aa');
  fs.mkdirSync(storageRoot, { recursive: true });
  fs.writeFileSync(path.join(storageRoot, 'delete-me.txt'), 'delete me');

  const revokedIds = [];
  let deletedId = null;
  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_delete_1',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Delete',
          original_filename: 'delete-me.txt',
          content_hash: 'deletehash1234deletehash1234abcd',
          storage_path: 'aa/delete-me.txt',
          mime_type: 'text/plain',
          file_size: 9,
          html_content: '',
          is_shared: true,
          created: '2026-04-18 18:00:00.000Z',
          updated: '2026-04-18 18:00:00.000Z'
        };
      },
      async listShareLinksByContentId() {
        return [
          { id: 'share_delete_1', is_revoked: false },
          { id: 'share_delete_2', is_revoked: true }
        ];
      },
      async updateShareLink(id) {
        revokedIds.push(id);
      },
      async deleteContent(id) {
        deletedId = id;
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
      contentId: 'content_delete_1'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(revokedIds, ['share_delete_1']);
  assert.equal(deletedId, 'content_delete_1');
  assert.equal(fs.existsSync(path.join(storageRoot, 'delete-me.txt')), false);
  assert.equal(response.body.removedFile, true);
});

test('write/delete rejects cross-user content delete', async () => {
  const app = createApp(createConfig('/tmp/shutong49-delete-forbidden'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'foreign_delete',
          owner_user_id: 'other_user',
          type: 'file',
          title: 'Foreign Delete',
          original_filename: 'foreign.txt',
          content_hash: 'foreigndeletehash1234foreignde12',
          storage_path: 'aa/foreign.txt',
          mime_type: 'text/plain',
          file_size: 4,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 18:10:00.000Z',
          updated: '2026-04-18 18:10:00.000Z'
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
      contentId: 'foreign_delete'
    }
  }), response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'forbidden');
});

test('health route returns service and route group metadata', async () => {
  const app = createApp(createConfig('/tmp/shutong49-health'), {
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200, message: 'healthy' };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/health',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.service, 'business-shell');
  assert.equal(response.body.routeGroups.write, '/api/write/*');
  assert.equal(response.body.routeGroups.ownerActions, '/web/action/*');
  assert.equal(response.body.routeGroups.ownerBatch, '/web/action/batch');
});

test('write route still requires API key auth before method validation', async () => {
  const app = createApp(createConfig('/tmp/shutong49-auth-order'), {
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/write/html',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, 'missing_api_key');
});


test('web owner detail renders update panel for rich text content', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-owner-update-panel'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_update_panel',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: '可更新富文本',
          original_filename: '',
          content_hash: 'updatepanelhash1234updatepanel12',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>before</p>',
          is_shared: false,
          created: '2026-04-18 15:45:00.000Z',
          updated: '2026-04-18 15:45:00.000Z'
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
    url: '/web/detail/content_update_panel',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /内容更新/);
  assert.match(response.rawBody, /action="\/web\/action\/update"/);
  assert.match(response.rawBody, /textarea id="htmlContent"/);
});

test('web owner batch action redirects back to list with success flash', async () => {
  const sharedIds = [];
  const app = createApp(createConfig('/tmp/shutong49-web-action-batch'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        return {
          id: contentId,
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Batch Item',
          original_filename: contentId + '.txt',
          content_hash: contentId.padEnd(32, 'a').slice(0, 32),
          storage_path: 'aa/' + contentId + '.txt',
          mime_type: 'text/plain',
          file_size: 10,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 15:50:00.000Z',
          updated: '2026-04-18 15:50:00.000Z'
        };
      },
      async findShareLinkByContentId() {
        return null;
      },
      async createShareLink(record) {
        sharedIds.push(record.content_id);
        return { id: 'share_' + record.content_id };
      },
      async updateContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/action/batch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'batchAction=share&contentIds=item_1&contentIds=item_2'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers.location, /title=%E6%89%B9%E9%87%8F%E5%88%86%E4%BA%AB%E5%B7%B2%E5%AE%8C%E6%88%90/);
  assert.deepEqual(sharedIds, ['item_1', 'item_2']);
});

test('write/update updates rich text content fields', async () => {
  const updates = [];
  const app = createApp(createConfig('/tmp/shutong49-write-update'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_update_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Before',
          original_filename: '',
          content_hash: 'contentupdatehash1234contentupd',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>before</p>',
          is_shared: false,
          created: '2026-04-18 19:00:00.000Z',
          updated: '2026-04-18 19:00:00.000Z'
        };
      },
      async updateContent(id, record) {
        updates.push({ id, record });
        return {
          id: 'content_update_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: record.title,
          original_filename: '',
          content_hash: 'contentupdatehash1234contentupd',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: record.html_content,
          is_shared: false,
          created: '2026-04-18 19:00:00.000Z',
          updated: '2026-04-18 19:10:00.000Z'
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
    url: '/api/write/update',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_update_1',
      title: 'After',
      htmlContent: '<p>after</p>'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.title, 'After');
  assert.equal(response.body.htmlContent, '<p>after</p>');
  assert.deepEqual(updates, [{
    id: 'content_update_1',
    record: { title: 'After', html_content: '<p>after</p>' }
  }]);
});

test('write/update rejects html update for file content', async () => {
  const app = createApp(createConfig('/tmp/shutong49-write-update-file'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_file_update',
          owner_user_id: 'user_123',
          type: 'file',
          title: 'File Before',
          original_filename: 'demo.txt',
          content_hash: 'fileupdatehash1234fileupdatehash',
          storage_path: 'aa/demo.txt',
          mime_type: 'text/plain',
          file_size: 5,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 19:20:00.000Z',
          updated: '2026-04-18 19:20:00.000Z'
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
    url: '/api/write/update',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      contentId: 'content_file_update',
      title: 'File After',
      htmlContent: '<p>not allowed</p>'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});

test('write/batch shares multiple owned contents', async () => {
  const sharedIds = [];
  const app = createApp(createConfig('/tmp/shutong49-write-batch'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        return {
          id: contentId,
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Batch ' + contentId,
          original_filename: contentId + '.txt',
          content_hash: contentId.padEnd(32, 'b').slice(0, 32),
          storage_path: 'aa/' + contentId + '.txt',
          mime_type: 'text/plain',
          file_size: 10,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 19:30:00.000Z',
          updated: '2026-04-18 19:30:00.000Z'
        };
      },
      async findShareLinkByContentId() {
        return null;
      },
      async createShareLink(record) {
        sharedIds.push(record.content_id);
        return { id: 'share_' + record.content_id };
      },
      async updateContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/batch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      action: 'share',
      contentIds: ['batch_1', 'batch_2', 'batch_2']
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.action, 'share');
  assert.equal(response.body.totalCount, 2);
  assert.equal(response.body.succeededCount, 2);
  assert.deepEqual(sharedIds, ['batch_1', 'batch_2']);
});


test('web owner batch revoke action redirects back to list with success flash', async () => {
  const revokedIds = [];
  const app = createApp(createConfig('/tmp/shutong49-web-action-batch-revoke'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        return {
          id: contentId,
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Batch Revoke Item',
          original_filename: contentId + '.txt',
          content_hash: contentId.padEnd(32, 'c').slice(0, 32),
          storage_path: 'aa/' + contentId + '.txt',
          mime_type: 'text/plain',
          file_size: 10,
          html_content: '',
          is_shared: true,
          created: '2026-04-18 15:55:00.000Z',
          updated: '2026-04-18 15:55:00.000Z'
        };
      },
      async findShareLinkByContentId(contentId) {
        return { id: 'share_' + contentId, share_hash: 'hash_' + contentId, is_revoked: false };
      },
      async updateShareLink(id) {
        revokedIds.push(id);
      },
      async updateContent() {},
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/action/batch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'batchAction=share_revoke&contentIds=item_a&contentIds=item_b'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers.location, /title=%E6%89%B9%E9%87%8F%E6%92%A4%E9%94%80%E5%88%86%E4%BA%AB%E5%B7%B2%E5%AE%8C%E6%88%90/);
  assert.deepEqual(revokedIds, ['share_item_a', 'share_item_b']);
});

test('web owner batch delete action redirects back to list with success flash', async () => {
  const deletedIds = [];
  const app = createApp(createConfig('/tmp/shutong49-web-action-batch-delete'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        return {
          id: contentId,
          owner_user_id: 'user_123',
          type: 'file',
          title: 'Batch Delete Item',
          original_filename: contentId + '.txt',
          content_hash: contentId.padEnd(32, 'd').slice(0, 32),
          storage_path: 'aa/' + contentId + '.txt',
          mime_type: 'text/plain',
          file_size: 10,
          html_content: '',
          is_shared: false,
          created: '2026-04-18 15:58:00.000Z',
          updated: '2026-04-18 15:58:00.000Z'
        };
      },
      async listShareLinksByContentId() {
        return [];
      },
      async deleteContent(id) {
        deletedIds.push(id);
      },
      async healthCheck() {
        return { code: 200 };
      }
    },
    fsImpl: {
      async rm() {},
      async readFile() { return Buffer.from('x'); },
      async mkdir() {},
      async writeFile() {},
      async unlink() {}
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/action/batch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'batchAction=delete&contentIds=item_x&contentIds=item_y'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers.location, /title=%E6%89%B9%E9%87%8F%E5%88%A0%E9%99%A4%E5%B7%B2%E5%AE%8C%E6%88%90/);
  assert.deepEqual(deletedIds, ['item_x', 'item_y']);
});


test('web auth login page renders API key form', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-login-page'), {
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/auth/login',
    headers: { host: '127.0.0.1:8787' }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /进入 Owner 控制台/);
  assert.match(response.rawBody, /API Key 登录/);
});

test('web auth login reads API key from form body and sets owner session cookie', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-login'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        assert.equal(apiKey, 'valid-key');
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
    url: '/web/auth/login',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'x-shutong49-api-key=valid-key'
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers['set-cookie'], /shutong49_owner_session=/);
});

test('web auth login redirects back with error when form API key is missing', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-login-missing'), {
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/auth/login',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: ''
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/auth\/login\?/);
  assert.match(response.headers.location, /title=%E7%99%BB%E5%BD%95%E5%A4%B1%E8%B4%A5/);
  assert.equal(response.headers['set-cookie'], undefined);
});

test('owner page accepts session cookie without API key header', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-session-owner'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Verifier', api_key: apiKey };
      },
      async listContents() {
        return { items: [], page: 1, perPage: 20, totalItems: 0, totalPages: 0 };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const loginResponse = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/auth/login',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'x-shutong49-api-key=valid-key'
  }), loginResponse);

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/list',
    headers: {
      host: '127.0.0.1:8787',
      cookie: loginResponse.headers['set-cookie']
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /Owner 内容列表/);
  assert.match(response.rawBody, /凭据与会话/);
});

test('credential page renders current owner identity from session', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-credential'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Verifier', api_key: apiKey };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const loginResponse = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/auth/login',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'x-shutong49-api-key=valid-key'
  }), loginResponse);

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/web/credential',
    headers: {
      host: '127.0.0.1:8787',
      cookie: loginResponse.headers['set-cookie']
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /Owner 凭据与会话/);
  assert.match(response.rawBody, /Verifier/);
  assert.match(response.rawBody, /shutong49_owner_session/);
});

test('web auth logout clears owner session cookie', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-logout'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Verifier', api_key: apiKey };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const loginResponse = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/auth/login',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'x-shutong49-api-key=valid-key'
  }), loginResponse);

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/auth/logout',
    headers: {
      host: '127.0.0.1:8787',
      cookie: loginResponse.headers['set-cookie']
    }
  }), response);

  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/auth\/login\?/);
  assert.match(response.headers['set-cookie'], /Max-Age=0/);
});
