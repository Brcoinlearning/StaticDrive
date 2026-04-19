import { json } from '../http/json.js';

export function createApiKeyAuth({ apiKeyHeader, pocketbaseClient }) {
  return async function apiKeyAuth(request, response) {
    const apiKey = request.headers[apiKeyHeader];

    if (!apiKey || Array.isArray(apiKey)) {
      json(response, 401, {
        error: 'missing_api_key',
        message: `Missing API key header: ${apiKeyHeader}`
      });
      return null;
    }

    try {
      const user = await pocketbaseClient.findUserByApiKey(apiKey);

      if (!user) {
        json(response, 401, {
          error: 'invalid_api_key',
          message: 'API key is invalid.'
        });
        return null;
      }

      return {
        apiKey,
        user: {
          id: user.id,
          displayName: user.display_name,
          apiKey: user.api_key
        }
      };
    } catch (error) {
      json(response, 502, {
        error: 'pocketbase_unavailable',
        message: 'PocketBase lookup failed.',
        details: error.message
      });
      return null;
    }
  };
}
