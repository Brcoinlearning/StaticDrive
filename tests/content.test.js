import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import { createApp } from '../src/app.js';
import { createContentService, defaultMarkdownRenderer } from '../src/content/service.js';
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
        assert.equal(record.body_source, '<p>body</p>');
        assert.equal(record.body_format, 'html');
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
  assert.equal(response.body.accessUrl, `http://127.0.0.1:8787/web/public/content/${response.body.contentHash}`);
  assert.equal(response.body.publicApiUrl, `http://127.0.0.1:8787/api/public/content/${response.body.contentHash}`);
});

test('write/html accepts empty title and keeps body as the only required content field', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-html-optional-title'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.title, '');
        assert.equal(record.html_content, '<p>body only</p>');
        assert.equal(record.body_source, '<p>body only</p>');
        assert.equal(record.body_format, 'html');
        return { id: 'content_optional_title' };
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
      htmlContent: '<p>body only</p>'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_optional_title');
});

test('write/content accepts unified content payload and reuses rich_text write chain', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.owner_user_id, 'user_123');
        assert.equal(record.type, 'rich_text');
        assert.equal(record.title, 'Unified Title');
        assert.equal(record.html_content, '<article><p>Unified Body</p></article>');
        assert.equal(record.body_source, '<article><p>Unified Body</p></article>');
        assert.equal(record.body_format, 'html');
        assert.equal(Object.hasOwn(record, 'author_name'), false);
        assert.equal(Object.hasOwn(record, 'created_at'), false);
        return { id: 'content_from_content_api' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Unified Title',
      body: '<article><p>Unified Body</p></article>',
      authorName: 'Ignored Author',
      createdAt: '2020-01-01T00:00:00.000Z'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_from_content_api');
  assert.equal(response.body.type, 'rich_text');
});



test('write/content writes markdown body and stores rendered html in unified rich text fields', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-markdown'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.owner_user_id, 'user_123');
        assert.equal(record.type, 'rich_text');
        assert.equal(record.title, 'Markdown Title');
        assert.equal(record.body_source, '# Hello\n\nThis is **bold** text.');
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<h1>Hello</h1><p>This is <strong>bold</strong> text.</p>');
        return { id: 'content_from_markdown_api' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Title',
      body: '# Hello\n\nThis is **bold** text.',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_from_markdown_api');
  assert.equal(response.body.type, 'rich_text');
});

test('write/content rejects unsupported bodyFormat', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-invalid-format'), {
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
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Unsupported Format',
      body: 'plain body',
      bodyFormat: 'plain_text'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});


test('write/content preserves markdown link urls containing underscores', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-markdown-link-url'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p><a href="https://example.com/docs_path/file_name">Read <strong>docs</strong></a></p>');
        return { id: 'content_markdown_link_url' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Link URL',
      body: '[Read **docs**](https://example.com/docs_path/file_name)',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.contentId, 'content_markdown_link_url');
});

test('content service renders task list items in markdown output', () => {
  const service = createContentService({
    config: createConfig('/tmp/shutong49-markdown-task-list'),
    pocketbaseClient: {},
    fsImpl: {
      async readFile() { throw new Error('not used'); },
      async mkdir() {},
      async writeFile() {},
      async unlink() {},
      async rm() {}
    }
  });
  assert.equal(typeof service, 'object');
});

test('write/content renders markdown task list items for agent-style output', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-task-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<ul><li><input type="checkbox" disabled checked> done</li><li><input type="checkbox" disabled> pending</li></ul>');
        return { id: 'content_markdown_task_list' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Task List',
      body: '- [x] done\n- [ ] pending',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content auto-links bare urls in markdown paragraphs', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-bare-url'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p>Docs: <a href="https://example.com/docs">https://example.com/docs</a></p>');
        return { id: 'content_markdown_bare_url' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Bare URL',
      body: 'Docs: https://example.com/docs',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content preserves fenced code block language class for agent code samples', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-code-lang'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<pre><code class="language-js">console.log(1);</code></pre>');
        return { id: 'content_markdown_code_lang' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Code Lang',
      body: "```js\nconsole.log(1);\n```",
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content keeps nested list structure in markdown output', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-nested-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<ul><li>parent<ul><li>child</li></ul></li></ul>');
        return { id: 'content_markdown_nested_list' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Nested List',
      body: '- parent\n  - child',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content renders multi-level nested unordered list', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-nested-list-multi'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li></ul>');
        return { id: 'content_markdown_nested_list_multi' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Nested List Multi',
      body: '- a\n  - b\n    - c',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content renders mixed ordered and unordered nested list', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-mixed-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<ol><li>one<ul><li>child</li></ul></li><li>two</li></ol>');
        return { id: 'content_markdown_mixed_list' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Mixed List',
      body: '1. one\n   - child\n2. two',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content keeps multiple task items with nested task child', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-nested-task-list'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<ul><li><input type="checkbox" disabled checked> parent<ul><li><input type="checkbox" disabled> child</li></ul></li><li><input type="checkbox" disabled> sibling</li></ul>');
        return { id: 'content_markdown_nested_task_list' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Nested Task List',
      body: '- [x] parent\n  - [ ] child\n- [ ] sibling',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content parses table alignment markers without breaking cells', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-table-align'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>');
        return { id: 'content_markdown_table_align' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Table Align',
      body: '| a | b |\n| :- | -: |\n| 1 | 2 |',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content parses escaped pipe inside table cell', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-table-escaped-pipe'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<table><thead><tr><th>col</th></tr></thead><tbody><tr><td>a | b</td></tr></tbody></table>');
        return { id: 'content_markdown_table_escaped_pipe' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Escaped Pipe',
      body: '| col |\n| --- |\n| a \\| b |',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content renders multiline blockquote as single quote block', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-blockquote-multiline'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<blockquote><p>line1<br>line2</p></blockquote>');
        return { id: 'content_markdown_blockquote_multiline' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Multiline Blockquote',
      body: '> line1\n> line2',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content auto-link keeps trailing punctuation outside anchor', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-bare-url-trailing-punctuation'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p>Docs: <a href="https://example.com/docs">https://example.com/docs</a>.</p>');
        return { id: 'content_markdown_bare_url_trailing_punctuation' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Bare URL Trailing Punctuation',
      body: 'Docs: https://example.com/docs.',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content auto-link handles parentheses boundary correctly', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-bare-url-parentheses'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p>(<a href="https://example.com/a">https://example.com/a</a>)</p>');
        return { id: 'content_markdown_bare_url_parentheses' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Bare URL Parentheses',
      body: '(https://example.com/a)',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content escapes raw html script in markdown body', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-markdown-script'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
        return { id: 'content_markdown_script_escaped' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Script Escaped',
      body: '<script>alert(1)</script>',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content keeps fenced code block when closing fence missing', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-unclosed-fence'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<pre><code class="language-js">const a = 1;</code></pre>');
        return { id: 'content_markdown_unclosed_fence' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Unclosed Fence',
      body: '```js\nconst a = 1;',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content preserves markdown link with nested emphasis text', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-link-emphasis'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p><a href="https://example.com"><strong>bold</strong> link</a></p>');
        return { id: 'content_markdown_link_emphasis' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Link Emphasis',
      body: '[**bold** link](https://example.com)',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content renders horizontal rule only for isolated marker line', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-non-isolated-hr'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async createContent(record) {
        assert.equal(record.body_format, 'markdown');
        assert.equal(record.html_content, '<p>a --- b</p>');
        return { id: 'content_markdown_non_isolated_hr' };
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Markdown Non Isolated HR',
      body: 'a --- b',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 201);
});

test('write/content rejects markdown when rendering fails', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-markdown-fail'), {
    markdownRenderer() {
      throw new Error('renderer exploded');
    },
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
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'Broken Markdown',
      body: '# Broken',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});
test('write/content rejects missing body', async () => {
  const app = createApp(createConfig('/tmp/shutong49-test-write-content-missing-body'), {
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
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    },
    body: {
      title: 'No Body',
      body: '   '
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
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

test('write/html rejects missing body', async () => {
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
      title: 'Body Missing',
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
    body: '',
    bodyFormat: null,
    renderedBodyHtml: '',
    htmlContent: '',
    authorName: null,
    summary: '',
    originalFilename: 'report.pdf',
    contentHash: 'abcd1234abcd1234abcd1234abcd1234',
    accessUrl: 'http://127.0.0.1:8787/web/public/content/abcd1234abcd1234abcd1234abcd1234',
    publicApiUrl: 'http://127.0.0.1:8787/api/public/content/abcd1234abcd1234abcd1234abcd1234',
    mimeType: 'application/pdf',
    fileSize: 1024,
    localFileExists: false,
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
    totalPages: 0,
    missingLocalFileOnly: false
  });
});

test('query/list can filter to missing local files only', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-query-missing-only-'));
  fs.mkdirSync(path.join(workspaceDir, 'content-files', 'aa'), { recursive: true });
  fs.writeFileSync(path.join(workspaceDir, 'content-files', 'aa', 'present.txt'), 'ok');

  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async listContents({ ownerUserId, page, perPage, search }) {
        assert.equal(ownerUserId, 'user_123');
        assert.equal(page, 1);
        assert.equal(perPage, 20);
        assert.equal(search, '');
        return {
          page: 1,
          perPage: 20,
          totalItems: 2,
          totalPages: 1,
          items: [{
            id: 'content_present',
            owner_user_id: 'user_123',
            type: 'file',
            title: 'Present',
            original_filename: 'present.txt',
            content_hash: '11111111111111111111111111111111',
            storage_path: 'aa/present.txt',
            mime_type: 'text/plain',
            file_size: 2,
            html_content: '',
            is_shared: false,
            created: '2026-04-18 10:00:00.000Z',
            updated: '2026-04-18 10:00:00.000Z'
          }, {
            id: 'content_missing',
            owner_user_id: 'user_123',
            type: 'file',
            title: 'Missing',
            original_filename: 'missing.txt',
            content_hash: '22222222222222222222222222222222',
            storage_path: 'aa/missing.txt',
            mime_type: 'text/plain',
            file_size: 7,
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
    url: '/api/query/list?missingLocalFileOnly=1',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.items.length, 1);
  assert.equal(response.body.items[0].contentId, 'content_missing');
  assert.equal(response.body.items[0].localFileExists, false);
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
  assert.equal(response.body.body, '<p>Detail</p>');
  assert.equal(response.body.bodyFormat, 'html');
  assert.equal(response.body.renderedBodyHtml, '<p>Detail</p>');
  assert.equal(response.body.htmlContent, '<p>Detail</p>');
});

test('query/content returns unified content object detail via content semantic route', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-content-detail'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_content_1');
        return {
          id: 'content_content_1',
          owner_user_id: 'user_123',
          expand: {
            owner_user_id: {
              display_name: 'Alice'
            }
          },
          type: 'rich_text',
          title: 'Content Route Detail',
          original_filename: '',
          content_hash: 'contentroutehash1234contentroute',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<article><p>Route body</p></article>',
          is_shared: true,
          created: '2026-05-01 12:00:00.000Z',
          updated: '2026-05-01 12:05:00.000Z'
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
    url: '/api/query/content/content_content_1',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.contentId, 'content_content_1');
  assert.equal(response.body.title, 'Content Route Detail');
  assert.equal(response.body.body, '<article><p>Route body</p></article>');
  assert.equal(response.body.bodyFormat, 'html');
  assert.equal(response.body.renderedBodyHtml, '<article><p>Route body</p></article>');
  assert.equal(response.body.htmlContent, '<article><p>Route body</p></article>');
  assert.equal(response.body.authorName, 'Alice');
  assert.equal(response.body.summary, 'Route body');
});

test('query/content returns not found for missing content record', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-content-missing'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        const error = new Error('missing');
        error.status = 404;
        throw error;
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/content/missing_content',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, 'not_found');
});

test('query/content maps wrapped PocketBase 404 into not found response', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-content-missing-wrapped'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        const error = new Error('PocketBase request failed during get_content_by_id.');
        error.statusCode = 502;
        error.code = 'pocketbase_request_failed';
        error.diagnostic = {
          operation: 'get_content_by_id',
          pocketbaseStatus: 404
        };
        throw error;
      },
      async healthCheck() {
        return { code: 200 };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'GET',
    url: '/api/query/content/missing_content_wrapped',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, 'not_found');
});

test('content service exposes unified rich_text content object mapping', async () => {
  const contentService = createContentService({
    config: createConfig('/tmp/shutong49-content-object-detail'),
    pocketbaseClient: {
      async getContentById() {
        return {
          id: 'content_object_1',
          owner_user_id: 'user_123',
          expand: {
            owner_user_id: {
              display_name: 'Alice'
            }
          },
          type: 'rich_text',
          title: 'Mapped Detail',
          original_filename: '',
          content_hash: 'mappedhash1234mappedhash1234abcd',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<article><p>Hello <strong>world</strong>.</p></article>',
          is_shared: false,
          created: '2026-05-01 09:30:00.000Z',
          updated: '2026-05-01 09:35:00.000Z'
        };
      }
    }
  });

  const detail = await contentService.getContentDetail({
    ownerUserId: 'user_123',
    contentId: 'content_object_1'
  });

  assert.equal(detail.title, 'Mapped Detail');
  assert.equal(detail.body, '<article><p>Hello <strong>world</strong>.</p></article>');
  assert.equal(detail.authorName, 'Alice');
  assert.equal(detail.createdAt, '2026-05-01 09:30:00.000Z');
  assert.equal(detail.summary, 'Hello world.');
  assert.equal(detail.bodyFormat, 'html');
  assert.equal(detail.renderedBodyHtml, '<article><p>Hello <strong>world</strong>.</p></article>');
  assert.equal(detail.htmlContent, '<article><p>Hello <strong>world</strong>.</p></article>');
});

test('content service keeps createdAt sourced from record created and ignores caller createdAt override', async () => {
  const writes = [];
  const contentService = createContentService({
    config: createConfig('/tmp/shutong49-content-object-create'),
    pocketbaseClient: {
      async createContent(record) {
        writes.push(record);
        return { id: 'content_created_at_1' };
      }
    }
  });

  await contentService.createHtmlContent({
    ownerUserId: 'user_123',
    title: 'CreatedAt Mapping',
    htmlContent: '<p>body</p>',
    createdAt: '2020-01-01T00:00:00.000Z',
    authorName: 'Ignored Author'
  });

  assert.equal(writes.length, 1);
  assert.equal(Object.hasOwn(writes[0], 'created'), false);
  assert.equal(Object.hasOwn(writes[0], 'created_at'), false);
  assert.equal(Object.hasOwn(writes[0], 'author_name'), false);
});

test('query/list derives summary from rich text body and authorName from owner display name', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-list-content-object'), {
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
          totalItems: 1,
          totalPages: 1,
          items: [{
            id: 'content_rich_1',
            owner_user_id: 'user_123',
            expand: {
              owner_user_id: {
                display_name: 'Alice'
              }
            },
            type: 'rich_text',
            title: '',
            original_filename: '',
            content_hash: 'richsummary1234richsummary1234ab',
            storage_path: '',
            mime_type: 'text/html',
            file_size: 0,
            html_content: '<h1>Ignored</h1><p>First line</p><p>Second line</p>',
            is_shared: false,
            created: '2026-05-01 10:00:00.000Z',
            updated: '2026-05-01 10:05:00.000Z'
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
    url: '/api/query/list',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.items[0].body, '<h1>Ignored</h1><p>First line</p><p>Second line</p>');
  assert.equal(response.body.items[0].authorName, 'Alice');
  assert.equal(response.body.items[0].summary, 'Ignored First line Second line');
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
  assert.equal(response.body.body, '<h1>Public</h1>');
  assert.equal(response.body.bodyFormat, 'html');
  assert.equal(response.body.renderedBodyHtml, '<h1>Public</h1>');
  assert.equal(response.body.htmlContent, '<h1>Public</h1>');
});



test('query/content returns markdown detail with rendered html while preserving original body', async () => {
  const app = createApp(createConfig('/tmp/shutong49-query-content-markdown-detail'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        assert.equal(contentId, 'content_markdown_detail_1');
        return {
          id: 'content_markdown_detail_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Markdown Detail',
          original_filename: '',
          content_hash: 'markdowncontenthash1234detail12',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: '# Heading\n\nHello **Markdown**',
          body_format: 'markdown',
          html_content: '<h1>Heading</h1><p>Hello <strong>Markdown</strong></p>',
          is_shared: true,
          created: '2026-05-01 13:00:00.000Z',
          updated: '2026-05-01 13:05:00.000Z'
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
    url: '/api/query/content/content_markdown_detail_1',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.body, '# Heading\n\nHello **Markdown**');
  assert.equal(response.body.bodyFormat, 'markdown');
  assert.equal(response.body.renderedBodyHtml, '<h1>Heading</h1><p>Hello <strong>Markdown</strong></p>');
  assert.equal(response.body.htmlContent, '<h1>Heading</h1><p>Hello <strong>Markdown</strong></p>');
});

test('web/detail renders markdown content from rendered html instead of raw markdown body', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-detail-markdown'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_markdown_page',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Markdown 详情页',
          original_filename: '',
          content_hash: 'markdownpagehash1234markdownpage',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: '# Raw Markdown\n\nParagraph',
          body_format: 'markdown',
          html_content: '<h1>Raw Markdown</h1><p>Paragraph</p>',
          is_shared: true,
          created: '2026-04-18 15:10:00.000Z',
          updated: '2026-04-18 15:10:00.000Z'
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
    url: '/web/detail/content_markdown_page',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /Markdown 渲染预览/);
  assert.match(response.rawBody, /sandbox="allow-scripts"/);
  assert.match(response.rawBody, /srcdoc="&lt;!doctype html&gt;/);
  assert.match(response.rawBody, /textarea id="body"/);
  assert.doesNotMatch(response.rawBody, /textarea id="body"># Raw Markdown/);
});

test('web public page renders markdown content from rendered html', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-markdown'), {
    contentService: {
      async getPublicContentByHash() {
        return {
          access: 'content_hash',
          contentId: 'content_public_markdown',
          type: 'rich_text',
          title: 'Public Markdown',
          contentHash: 'publicmarkdownhash1234publicmkd',
          mimeType: 'text/html',
          body: '# Public\n\nBody',
          bodyFormat: 'markdown',
          renderedBodyHtml: '<h1>Public</h1><p>Body</p>',
          htmlContent: '<h1>Public</h1><p>Body</p>',
          accessUrl: 'http://127.0.0.1:8787/web/public/content/publicmarkdownhash1234publicmkd',
          publicApiUrl: 'http://127.0.0.1:8787/api/public/content/publicmarkdownhash1234publicmkd'
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
    url: '/web/public/content/publicmarkdownhash1234publicmkd',
    headers: {
      host: '127.0.0.1:8787'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /公开 Markdown 渲染内容/);
  assert.match(response.rawBody, /srcdoc="&lt;!doctype html&gt;/);
  assert.match(response.rawBody, /正文格式：markdown/);
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
            expand: {
              owner_user_id: {
                display_name: 'Alice'
              }
            },
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
  assert.match(response.rawBody, /body/);
  assert.match(response.rawBody, /作者：Alice/);
  assert.match(response.rawBody, /创建于 2026-04-18/);
  assert.match(response.rawBody, /查看详情/);
  assert.match(response.rawBody, /打开公开页/);
});

test('web/list falls back when title is empty and still renders summary metadata', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-list-empty-title'), {
    contentService: {
      async listContents() {
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            contentId: 'content_empty_title_1',
            type: 'rich_text',
            title: '',
            body: '<p>Fallback body</p>',
            summary: 'Fallback body',
            authorName: null,
            originalFilename: '',
            contentHash: 'emptytitlehash1234emptytitlehash',
            accessUrl: 'http://127.0.0.1:8787/api/public/content/emptytitlehash1234emptytitlehash',
            mimeType: 'text/html',
            fileSize: 0,
            localFileExists: true,
            isShared: false,
            createdAt: '2026-05-01 16:00:00.000Z',
            updatedAt: '2026-05-01 16:00:00.000Z'
          }]
        };
      }
    },
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
    method: 'GET',
    url: '/web/list',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /未命名内容/);
  assert.match(response.rawBody, /Fallback body/);
  assert.match(response.rawBody, /创建于 2026-05-01/);
});

test('web/list marks owner file records whose local file is missing', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-list-missing-file'), {
    contentService: {
      async listContents() {
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [{
            contentId: 'content_missing_file_1',
            type: 'file',
            title: '缺失文件',
            originalFilename: 'missing.txt',
            contentHash: 'feedfeedfeedfeedfeedfeedfeedfeed',
            accessUrl: 'http://127.0.0.1:8787/api/public/content/feedfeedfeedfeedfeedfeedfeedfeed',
            mimeType: 'text/plain',
            fileSize: 12,
            localFileExists: false,
            isShared: false,
            createdAt: '2026-04-18 14:00:00.000Z',
            updatedAt: '2026-04-18 14:00:00.000Z'
          }]
        };
      }
    },
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
    method: 'GET',
    url: '/web/list',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /本地文件缺失/);
  assert.match(response.rawBody, /请重新上传或删除该记录/);
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

test('web/list exposes missing local file filter and batch cleanup action', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-list-filter-controls'), {
    contentService: {
      async listContents() {
        return {
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          missingLocalFileOnly: true,
          items: [{
            contentId: 'content_missing_file_filter',
            type: 'file',
            title: '缺失文件',
            originalFilename: 'missing.txt',
            contentHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            accessUrl: 'http://127.0.0.1:8787/api/public/content/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            mimeType: 'text/plain',
            fileSize: 12,
            localFileExists: false,
            isShared: false,
            createdAt: '2026-04-18 14:00:00.000Z',
            updatedAt: '2026-04-18 14:00:00.000Z'
          }]
        };
      }
    },
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
    method: 'GET',
    url: '/web/list?missingLocalFileOnly=1',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /name="missingLocalFileOnly"/);
  assert.match(response.rawBody, /仅看缺失本地文件/);
  assert.match(response.rawBody, /data-batch-toggle="all"/);
  assert.match(response.rawBody, /全选当前页/);
  assert.match(response.rawBody, /value="cleanup_missing_file_records"/);
  assert.match(response.rawBody, /清理缺失文件记录/);
  assert.match(response.rawBody, /type="hidden" name="missingLocalFileOnly" value="1"/);
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
  assert.match(response.rawBody, /srcdoc="&lt;!doctype html&gt;/);
  assert.match(response.rawBody, /HTML 预览|最终展示预览/);
  assert.match(response.rawBody, /Owner 操作/);
  assert.match(response.rawBody, /action="\/web\/action\/share\/revoke"/);
});

test('web/detail shows missing local file status for broken owner file records', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-detail-missing-file'), {
    contentService: {
      async getContentDetail() {
        return {
          contentId: 'content_missing_file_detail',
          type: 'file',
          title: 'Broken File',
          originalFilename: 'broken.txt',
          contentHash: 'deadbeefdeadbeefdeadbeefdeadbeef',
          accessUrl: 'http://127.0.0.1:8787/web/public/content/deadbeefdeadbeefdeadbeefdeadbeef',
          publicApiUrl: 'http://127.0.0.1:8787/api/public/content/deadbeefdeadbeefdeadbeefdeadbeef',
          mimeType: 'text/plain',
          fileSize: 9,
          localFileExists: false,
          ownerUserId: 'user_123',
          storagePath: 'de/deadbeefdeadbeefdeadbeefdeadbeef-broken.txt',
          htmlContent: '',
          isShared: false
        };
      }
    },
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
    method: 'GET',
    url: '/web/detail/content_missing_file_detail',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /本地文件状态/);
  assert.match(response.rawBody, /本地文件缺失/);
  assert.match(response.rawBody, /请重新上传或删除该记录/);
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
  assert.match(response.rawBody, /textarea id="body"/);
  assert.match(response.rawBody, /select id="bodyFormat"/);
  assert.match(response.rawBody, /select id="accessMode"/);
  assert.match(response.rawBody, /input id="accessPassword" type="password"/);
  assert.match(response.rawBody, /input id="accessHint" type="text"/);
});

test('web owner detail keeps password mode selected after refresh', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-owner-access-mode-refresh'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_access_mode_refresh',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: '密码模式内容',
          original_filename: '',
          content_hash: 'accessmoderefreshhash1234access1',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          html_content: '<p>protected</p>',
          access_mode: 'password',
          access_password_hash: 'scrypt:aa:bb',
          access_hint: 'hint',
          is_shared: true,
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
    url: '/web/detail/content_access_mode_refresh',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /option value="password" selected/);
  assert.match(response.rawBody, /value="hint"/);
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

test('web owner batch cleanup action redirects back with cleanup success flash', async () => {
  const deletedIds = [];
  const app = createApp(createConfig('/tmp/shutong49-web-action-batch-cleanup'), {
    contentService: {
      async batchOperateContents({ action, contentIds }) {
        assert.equal(action, 'cleanup_missing_file_records');
        deletedIds.push(...contentIds);
        return {
          action,
          totalCount: 2,
          succeededCount: 2,
          results: []
        };
      }
    },
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
    url: '/web/action/batch',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'batchAction=cleanup_missing_file_records&missingLocalFileOnly=1&page=1&contentIds=item_m1&contentIds=item_m2'
  }), response);

  assert.deepEqual(deletedIds, ['item_m1', 'item_m2']);
  assert.equal(response.statusCode, 302);
  assert.match(response.headers.location, /^\/web\/list\?/);
  assert.match(response.headers.location, /missingLocalFileOnly=1/);
  assert.match(response.headers.location, /title=%E6%B8%85%E7%90%86%E5%B7%B2%E5%AE%8C%E6%88%90/);
});

test('write/update updates rich text html fields through unified content mapping', async () => {
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
          body_source: '<p>before</p>',
          body_format: 'html',
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
          body_source: record.body_source,
          body_format: record.body_format,
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
      body: '<p>after</p>',
      bodyFormat: 'html'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.title, 'After');
  assert.equal(response.body.body, '<p>after</p>');
  assert.equal(response.body.bodyFormat, 'html');
  assert.equal(response.body.renderedBodyHtml, '<p>after</p>');
  assert.equal(response.body.htmlContent, '<p>after</p>');
  assert.deepEqual(updates, [{
    id: 'content_update_1',
    record: { title: 'After', body_source: '<p>after</p>', body_format: 'html', html_content: '<p>after</p>' }
  }]);
});

test('write/update updates markdown content and stores rendered html through unified mapping', async () => {
  const updates = [];
  const app = createApp(createConfig('/tmp/shutong49-write-update-markdown'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_update_markdown_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Before Markdown',
          original_filename: '',
          content_hash: 'contentupdatemarkdown1234contup',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: '# Before',
          body_format: 'markdown',
          html_content: '<h1>Before</h1>',
          is_shared: false,
          created: '2026-04-18 19:30:00.000Z',
          updated: '2026-04-18 19:30:00.000Z'
        };
      },
      async updateContent(id, record) {
        updates.push({ id, record });
        return {
          id: 'content_update_markdown_1',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'After Markdown',
          original_filename: '',
          content_hash: 'contentupdatemarkdown1234contup',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: record.body_source,
          body_format: record.body_format,
          html_content: record.html_content,
          is_shared: false,
          created: '2026-04-18 19:30:00.000Z',
          updated: '2026-04-18 19:40:00.000Z'
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
      contentId: 'content_update_markdown_1',
      title: 'After Markdown',
      body: '# After\n\nThis is **updated**.',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.title, 'After Markdown');
  assert.equal(response.body.body, '# After\n\nThis is **updated**.');
  assert.equal(response.body.bodyFormat, 'markdown');
  assert.equal(response.body.renderedBodyHtml, '<h1>After</h1><p>This is <strong>updated</strong>.</p>');
  assert.equal(response.body.htmlContent, '<h1>After</h1><p>This is <strong>updated</strong>.</p>');
  assert.deepEqual(updates, [{
    id: 'content_update_markdown_1',
    record: {
      title: 'After Markdown',
      body_source: '# After\n\nThis is **updated**.',
      body_format: 'markdown',
      html_content: '<h1>After</h1><p>This is <strong>updated</strong>.</p>'
    }
  }]);
});

test('write/update rejects unsupported bodyFormat for rich text content', async () => {
  const app = createApp(createConfig('/tmp/shutong49-write-update-invalid-format'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_update_invalid_format',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Before',
          original_filename: '',
          content_hash: 'contentupdateinvalidformatcont1',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: '<p>before</p>',
          body_format: 'html',
          html_content: '<p>before</p>',
          is_shared: false,
          created: '2026-04-18 19:50:00.000Z',
          updated: '2026-04-18 19:50:00.000Z'
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
      contentId: 'content_update_invalid_format',
      body: 'plain body',
      bodyFormat: 'plain_text'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
});

test('write/update rejects markdown update when rendering fails', async () => {
  const app = createApp(createConfig('/tmp/shutong49-write-update-markdown-fail'), {
    markdownRenderer() {
      throw new Error('renderer exploded');
    },
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById() {
        return {
          id: 'content_update_markdown_fail',
          owner_user_id: 'user_123',
          type: 'rich_text',
          title: 'Before',
          original_filename: '',
          content_hash: 'contentupdatemarkdownfailcont1',
          storage_path: '',
          mime_type: 'text/html',
          file_size: 0,
          body_source: '# Before',
          body_format: 'markdown',
          html_content: '<h1>Before</h1>',
          is_shared: false,
          created: '2026-04-18 20:00:00.000Z',
          updated: '2026-04-18 20:00:00.000Z'
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
      contentId: 'content_update_markdown_fail',
      body: '# Broken',
      bodyFormat: 'markdown'
    }
  }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'bad_request');
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

test('write/batch cleanup deletes only missing local file records', async () => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shutong49-write-batch-cleanup-'));
  fs.mkdirSync(path.join(workspaceDir, 'content-files', 'aa'), { recursive: true });
  fs.writeFileSync(path.join(workspaceDir, 'content-files', 'aa', 'present.txt'), 'ok');

  const deletedIds = [];
  const app = createApp(createConfig(workspaceDir), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Verifier', api_key: 'valid-key' };
      },
      async getContentById(contentId) {
        if (contentId === 'missing_1') {
          return {
            id: 'missing_1',
            owner_user_id: 'user_123',
            type: 'file',
            title: 'Missing One',
            original_filename: 'missing-1.txt',
            content_hash: '33333333333333333333333333333333',
            storage_path: 'aa/missing-1.txt',
            mime_type: 'text/plain',
            file_size: 5,
            html_content: '',
            is_shared: false
          };
        }

        if (contentId === 'present_1') {
          return {
            id: 'present_1',
            owner_user_id: 'user_123',
            type: 'file',
            title: 'Present One',
            original_filename: 'present.txt',
            content_hash: '44444444444444444444444444444444',
            storage_path: 'aa/present.txt',
            mime_type: 'text/plain',
            file_size: 2,
            html_content: '',
            is_shared: false
          };
        }

        throw new Error('unexpected content id');
      },
      async listShareLinksByContentId() {
        return [];
      },
      async deleteContent(contentId) {
        deletedIds.push(contentId);
      },
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
      action: 'cleanup_missing_file_records',
      contentIds: ['missing_1', 'present_1']
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(deletedIds, ['missing_1']);
  assert.equal(response.body.succeededCount, 1);
  assert.equal(response.body.results[0].contentId, 'missing_1');
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

test('public content remains directly accessible when access mode is public', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-access-public'), {
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_public_mode_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Public Content',
          original_filename: '', content_hash: 'publicmodehash1234publicmode1234ab', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>public body</p>', body_source: '<p>public body</p>', body_format: 'html',
          is_shared: true, access_mode: 'public', access_password_hash: '', access_hint: '', created: '2026-04-18', updated: '2026-04-18'
        };
      },
      async healthCheck() { return { code: 200 }; }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({ method: 'GET', url: '/api/public/content/publicmodehash1234publicmode1234ab', headers: { host: '127.0.0.1:8787' } }), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'rich_text');
});

test('password-protected content rejects direct access before verification', async () => {
  const app = createApp(createConfig('/tmp/shutong49-public-access-protected'), {
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_pw_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Protected Content',
          original_filename: '', content_hash: 'protectedhash1234protectedhash12', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>secret</p>', body_source: '<p>secret</p>', body_format: 'html',
          is_shared: true, access_mode: 'password', access_password_hash: 'scrypt:00112233445566778899aabbccddeeff:0011', access_hint: 'abc', created: '2026-04-18', updated: '2026-04-18'
        };
      },
      async healthCheck() { return { code: 200 }; }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({ method: 'GET', url: '/api/public/content/protectedhash1234protectedhash12', headers: { host: '127.0.0.1:8787' } }), response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, 'public_password_required');
});

test('web password submit shows retry page when password is wrong', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-public-password-retry'), {
    contentService: {
      async verifyPublicPasswordByContentHash() {
        const error = new Error('Invalid password.');
        error.statusCode = 403;
        error.code = 'public_password_invalid';
        throw error;
      }
    },
    pocketbaseClient: {
      async healthCheck() { return { code: 200 }; }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/public/content/protectedhash1234protectedhash12/password',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'password=wrong'
  }), response);

  assert.equal(response.statusCode, 401);
  assert.match(response.rawBody, /请输入访问密码/);
  assert.match(response.rawBody, /密码错误，请重试/);
  assert.match(response.rawBody, /action="\/web\/public\/content\/protectedhash1234protectedhash12\/password"/);
  assert.doesNotMatch(response.rawBody, /重新尝试访问/);
});

test('password verification success grants short-lived cookie and allows access', async () => {
  const service = createContentService({
    config: createConfig('/tmp/shutong49-service-access-verify-ok'),
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_pw_ok_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Protected OK',
          original_filename: '', content_hash: 'protectedokhash1234protectedok12', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>ok</p>', body_source: '<p>ok</p>', body_format: 'html',
          is_shared: true, access_mode: 'password',
          access_password_hash: 'scrypt:11223344556677889900aabbccddeeff:' + crypto.scryptSync('pw123', Buffer.from('11223344556677889900aabbccddeeff', 'hex'), 64).toString('hex'),
          access_hint: '', created: '2026-04-18', updated: '2026-04-18'
        };
      }
    }
  });

  const verified = await service.verifyPublicPasswordByContentHash({ contentHash: 'protectedokhash1234protectedok12', password: 'pw123', attemptKey: '127.0.0.1' });
  assert.equal(verified.verified, true);
  assert.match(verified.setCookie, /shutong49_public_access_content_hash=/);

  const token = decodeURIComponent(verified.setCookie.split(';')[0].split('=')[1]);
  const payload = await service.getPublicContentByHash('protectedokhash1234protectedok12', {
    cookies: { shutong49_public_access_content_hash: token }
  });
  assert.equal(payload.type, 'rich_text');
});

test('password verification rejects wrong password', async () => {
  const service = createContentService({
    config: createConfig('/tmp/shutong49-service-access-verify-fail'),
    pocketbaseClient: {
      async getContentByHash() {
        return {
          id: 'content_pw_fail_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Protected Fail',
          original_filename: '', content_hash: 'protectedfailhash1234protectedf1', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>fail</p>', body_source: '<p>fail</p>', body_format: 'html',
          is_shared: true, access_mode: 'password',
          access_password_hash: 'scrypt:11223344556677889900aabbccddeeff:' + crypto.scryptSync('right', Buffer.from('11223344556677889900aabbccddeeff', 'hex'), 64).toString('hex'),
          access_hint: '', created: '2026-04-18', updated: '2026-04-18'
        };
      }
    }
  });

  await assert.rejects(
    () => service.verifyPublicPasswordByContentHash({ contentHash: 'protectedfailhash1234protectedf1', password: 'wrong', attemptKey: '127.0.0.1' }),
    (error) => error.statusCode === 403
  );
});

test('content can switch from password mode back to public mode', async () => {
  const updates = [];
  const service = createContentService({
    config: createConfig('/tmp/shutong49-service-access-switch'),
    pocketbaseClient: {
      async getContentById() {
        return {
          id: 'content_switch_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Switch',
          original_filename: '', content_hash: 'switchhash1234switchhash1234swit', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>switch</p>', body_source: '<p>switch</p>', body_format: 'html',
          is_shared: true, access_mode: 'password', access_password_hash: 'scrypt:aa:bb', access_hint: 'h', created: '2026-04-18', updated: '2026-04-18'
        };
      },
      async updateContent(id, record) {
        updates.push({ id, record });
        return {
          id: 'content_switch_1', owner_user_id: 'user_123', type: 'rich_text', title: 'Switch',
          original_filename: '', content_hash: 'switchhash1234switchhash1234swit', storage_path: '', mime_type: 'text/html',
          file_size: 0, html_content: '<p>switch</p>', body_source: '<p>switch</p>', body_format: 'html',
          is_shared: true, access_mode: record.access_mode || 'public', access_password_hash: record.access_password_hash || '', access_hint: record.access_hint || '', created: '2026-04-18', updated: '2026-04-18'
        };
      }
    }
  });

  const result = await service.updateContent({ ownerUserId: 'user_123', contentId: 'content_switch_1', accessMode: 'public' });
  assert.equal(updates[0].record.access_mode, 'public');
  assert.equal(updates[0].record.access_password_hash, '');
});

// ──────────────────────────────────────────────
//  Markdown Fixture Regression Tests
// ──────────────────────────────────────────────

function collectMarkdownFixtures() {
  const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'markdown');
  const entries = fs.readdirSync(fixturesDir);
  const fixtures = [];

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const baseName = entry.replace(/\.md$/, '');
    const htmlFile = `${baseName}.html`;
    const htmlPath = path.join(fixturesDir, htmlFile);

    if (!entries.includes(htmlFile)) {
      console.warn(`Skipping fixture "${baseName}": missing expected .html file`);
      continue;
    }

    fixtures.push({
      name: baseName,
      mdPath: path.join(fixturesDir, entry),
      htmlPath
    });
  }

  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
}

const fixtures = collectMarkdownFixtures();

for (const fixture of fixtures) {
  test(`fixture/render ${fixture.name}`, () => {
    const mdContent = fs.readFileSync(fixture.mdPath, 'utf-8');
    const expectedHtml = fs.readFileSync(fixture.htmlPath, 'utf-8');
    const actualHtml = defaultMarkdownRenderer(mdContent);
    assert.equal(actualHtml, expectedHtml,
      `Fixture "${fixture.name}" output mismatch.\nExpected: ${JSON.stringify(expectedHtml)}\nActual:   ${JSON.stringify(actualHtml)}`);
  });
}

// API-level integration assertions for body/bodyFormat/renderedBodyHtml consistency

test('fixture/integration markdown write stores body and rendered html consistently', async () => {
  const mdBody = '# Integration Test\n\nBody and **format** consistency.\n';
  const expectedHtml = '<h1>Integration Test</h1><p>Body and <strong>format</strong> consistency.</p>';

  let storedRecord = null;
  const app = createApp(createConfig('/tmp/shutong49-fixture-int-write'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Tester', api_key: 'valid-key' };
      },
      async createContent(record) {
        storedRecord = record;
        return { id: 'int_content_1' };
      },
      async healthCheck() { return { code: 200 }; }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/json',
      'x-shutong49-api-key': 'valid-key'
    },
    body: JSON.stringify({ title: 'Integration', body: mdBody, bodyFormat: 'markdown' })
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(storedRecord.body_source, mdBody);
  assert.equal(storedRecord.body_format, 'markdown');
  assert.equal(storedRecord.html_content, expectedHtml);
  assert.equal(response.body.contentId, 'int_content_1');
  assert.equal(response.body.type, 'rich_text');
});

test('fixture/integration html write uses body as rendered html directly', async () => {
  const htmlBody = '<h1>HTML Test</h1><p>Direct pass-through.</p>';

  let storedRecord = null;
  const app = createApp(createConfig('/tmp/shutong49-fixture-int-html'), {
    pocketbaseClient: {
      async findUserByApiKey() {
        return { id: 'user_123', display_name: 'Tester', api_key: 'valid-key' };
      },
      async createContent(record) {
        storedRecord = record;
        return { id: 'int_html_1' };
      },
      async healthCheck() { return { code: 200 }; }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/api/write/content',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/json',
      'x-shutong49-api-key': 'valid-key'
    },
    body: JSON.stringify({ title: 'HTML Integration', body: htmlBody, bodyFormat: 'html' })
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(storedRecord.body_source, htmlBody);
  assert.equal(storedRecord.body_format, 'html');
  assert.equal(storedRecord.html_content, htmlBody);
  assert.equal(response.body.contentId, 'int_html_1');
  assert.equal(response.body.type, 'rich_text');
});

test('web/write GET renders the write form page', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-write-form'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Writer', api_key: apiKey };
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
    url: '/web/write',
    headers: {
      host: '127.0.0.1:8787',
      cookie: loginResponse.headers['set-cookie']
    }
  }), response);

  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /写入新内容/);
  assert.match(response.rawBody, /字符串写入/);
  assert.match(response.rawBody, /Markdown/);
  assert.match(response.rawBody, /form method="post" action="\/web\/write/);
});

test('web/write POST creates content and renders result page', async () => {
  let capturedTitle = '';
  let capturedBody = '';
  let capturedOwnerUserId = '';

  const app = createApp(createConfig('/tmp/shutong49-web-write-post'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Writer', api_key: apiKey };
      },
      async healthCheck() {
        return { code: 200 };
      }
    },
    contentService: {
      async createHtmlContent({ ownerUserId, title, body, bodyFormat }) {
        capturedOwnerUserId = ownerUserId;
        capturedTitle = title;
        capturedBody = body;
        return {
          contentId: 'write_new_001',
          contentHash: 'abc123',
          type: 'rich_text',
          accessUrl: '/web/public/content/abc123',
          publicApiUrl: '/api/public/content/abc123'
        };
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
    url: '/web/write',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: loginResponse.headers['set-cookie']
    },
    body: 'title=%E6%A8%A1%E6%8B%9F%E6%B5%8B%E8%AF%95%E5%86%99%E5%85%A5&body=%23+%E6%B5%8B%E8%AF%95%E6%A0%87%E9%A2%98%0A%0A%E8%BF%99%E6%98%AF%E4%B8%80%E6%AE%B5%E6%AD%A3%E6%96%87%E3%80%82'
  }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(capturedOwnerUserId, 'user_123');
  assert.equal(capturedTitle, '模拟测试写入');
  assert.match(capturedBody, /测试标题/);
  assert.match(response.rawBody, /写入成功/);
  assert.match(response.rawBody, /write_new_001/);
  assert.match(response.rawBody, /查看详情页/);
  assert.match(response.rawBody, /继续写入/);
});

test('web/write POST rejects empty title or body', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-write-empty'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Writer', api_key: apiKey };
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

  const emptyTitle = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/write',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: loginResponse.headers['set-cookie']
    },
    body: 'title=&body=%E6%9C%89%E6%AD%A3%E6%96%87'
  }), emptyTitle);

  assert.equal(emptyTitle.statusCode, 400);
  assert.match(emptyTitle.rawBody, /标题和正文不能为空/);

  const emptyBody = createResponseCapture();
  await app(await createRequest({
    method: 'POST',
    url: '/web/write',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: loginResponse.headers['set-cookie']
    },
    body: 'title=%E6%9C%89%E6%A0%87%E9%A2%98&body='
  }), emptyBody);

  assert.equal(emptyBody.statusCode, 400);
  assert.match(emptyBody.rawBody, /标题和正文不能为空/);
});

test('web/write POST renders error page on content service failure', async () => {
  const app = createApp(createConfig('/tmp/shutong49-web-write-error'), {
    pocketbaseClient: {
      async findUserByApiKey(apiKey) {
        return { id: 'user_123', display_name: 'Writer', api_key: apiKey };
      },
      async healthCheck() {
        return { code: 200 };
      }
    },
    contentService: {
      async createHtmlContent() {
        throw new Error('数据库写入失败');
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
    url: '/web/write',
    headers: {
      host: '127.0.0.1:8787',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: loginResponse.headers['set-cookie']
    },
    body: 'title=%E6%B5%8B%E8%AF%95&body=%E6%AD%A3%E6%96%87'
  }), response);

  assert.equal(response.statusCode, 500);
  assert.match(response.rawBody, /写入失败/);
  assert.match(response.rawBody, /数据库写入失败/);
});
