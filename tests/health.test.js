import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/app.js';
import { createAppError } from '../src/errors.js';
import { createRequest, createResponseCapture } from './helpers.js';

test('health route returns service and route group metadata', async () => {
  const app = createApp({
    pocketbaseBaseUrl: 'http://127.0.0.1:8090',
    apiKeyHeader: 'x-shutong49-api-key',
    workspaceDir: '/tmp/shutong49-health-test',
    serviceHost: '127.0.0.1',
    servicePort: 8787,
    publicBaseUrl: ''
  }, {
    pocketbaseClient: {
      async healthCheck() {
        return { code: 200, message: 'API is healthy.' };
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({ method: 'GET', url: '/api/health', headers: { host: '127.0.0.1:8787' } }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.routeGroups.write, '/api/write/*');
});

test('write route still requires API key auth before method validation', async () => {
  const app = createApp({
    pocketbaseBaseUrl: 'http://127.0.0.1:8090',
    apiKeyHeader: 'x-shutong49-api-key',
    workspaceDir: '/tmp/shutong49-write-test',
    serviceHost: '127.0.0.1',
    servicePort: 8787,
    publicBaseUrl: ''
  }, {
    pocketbaseClient: {
      async findUserByApiKey() {
        return {
          id: 'user_123',
          display_name: 'Verifier',
          api_key: 'valid-key'
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
    url: '/api/write/ping',
    headers: {
      host: '127.0.0.1:8787',
      'x-shutong49-api-key': 'valid-key'
    }
  }), response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.body.error, 'method_not_allowed');
});

test('health route returns structured diagnostic details when PocketBase is unavailable', async () => {
  const app = createApp({
    pocketbaseBaseUrl: 'http://127.0.0.1:8090',
    apiKeyHeader: 'x-shutong49-api-key',
    workspaceDir: '/tmp/shutong49-health-test-degraded',
    serviceHost: '127.0.0.1',
    servicePort: 8787,
    publicBaseUrl: ''
  }, {
    pocketbaseClient: {
      async healthCheck() {
        throw createAppError({
          message: 'PocketBase request failed during health_check.',
          statusCode: 502,
          code: 'pocketbase_request_failed',
          details: 'PocketBase request failed: 503',
          diagnostic: {
            operation: 'health_check',
            pocketbaseStatus: 503,
            pocketbaseMessage: 'service unavailable'
          }
        });
      }
    }
  });

  const response = createResponseCapture();
  await app(await createRequest({ method: 'GET', url: '/api/health', headers: { host: '127.0.0.1:8787' } }), response);

  assert.equal(response.statusCode, 502);
  assert.equal(response.body.status, 'degraded');
  assert.equal(response.body.error, 'pocketbase_unavailable');
  assert.equal(response.body.details, 'PocketBase request failed: 503');
  assert.equal(response.body.diagnostic.operation, 'health_check');
});
