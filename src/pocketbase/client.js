function escapeFilterValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(`PocketBase request failed: ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export class PocketBaseClient {
  constructor({ baseUrl, adminEmail = '', adminPassword = '', fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.adminEmail = adminEmail;
    this.adminPassword = adminPassword;
    this.fetchImpl = fetchImpl;
    this.adminToken = null;
  }

  async authenticateAdmin() {
    if (!this.adminEmail || !this.adminPassword) {
      throw new Error('PocketBase admin credentials are required for protected collection access.');
    }

    const response = await this.fetchImpl(`${this.baseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        identity: this.adminEmail,
        password: this.adminPassword
      })
    });
    const payload = await parseResponse(response);
    this.adminToken = payload.token;
    return this.adminToken;
  }

  async getAdminToken() {
    if (this.adminToken) {
      return this.adminToken;
    }

    return this.authenticateAdmin();
  }

  async healthCheck() {
    const response = await this.fetchImpl(`${this.baseUrl}/api/health`);
    return parseResponse(response);
  }

  async findUserByApiKey(apiKey) {
    const adminToken = await this.getAdminToken();
    const filter = encodeURIComponent(`api_key = "${escapeFilterValue(apiKey)}"`);
    const url = `${this.baseUrl}/api/collections/users_api/records?page=1&perPage=1&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });
    const payload = await parseResponse(response);
    return payload.items?.[0] ?? null;
  }

  async createContent(record) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/contents/records`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      },
      body: JSON.stringify(record)
    });

    return parseResponse(response);
  }

  async listContents({ ownerUserId, page = 1, perPage = 20, search = '' }) {
    const adminToken = await this.getAdminToken();
    const filterParts = [`owner_user_id = "${escapeFilterValue(ownerUserId)}"`];

    if (search) {
      const escapedSearch = escapeFilterValue(search);
      filterParts.push(`(title ~ "${escapedSearch}" || original_filename ~ "${escapedSearch}")`);
    }

    const filter = encodeURIComponent(filterParts.join(' && '));
    const url = `${this.baseUrl}/api/collections/contents/records?page=${page}&perPage=${perPage}&sort=-created&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });

    return parseResponse(response);
  }

  async getContentById(contentId) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/contents/records/${contentId}`, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });

    return parseResponse(response);
  }

  async getContentByHash(contentHash) {
    const adminToken = await this.getAdminToken();
    const filter = encodeURIComponent(`content_hash = "${escapeFilterValue(contentHash)}"`);
    const url = `${this.baseUrl}/api/collections/contents/records?page=1&perPage=1&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });
    const payload = await parseResponse(response);
    return payload.items?.[0] ?? null;
  }

  async updateContent(contentId, record) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/contents/records/${contentId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      },
      body: JSON.stringify(record)
    });

    return parseResponse(response);
  }

  async findShareLinkByContentId(contentId) {
    const adminToken = await this.getAdminToken();
    const filter = encodeURIComponent(`content_id = "${escapeFilterValue(contentId)}" && is_revoked = false`);
    const url = `${this.baseUrl}/api/collections/share_links/records?page=1&perPage=1&sort=-created&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });
    const payload = await parseResponse(response);
    return payload.items?.[0] ?? null;
  }

  async listShareLinksByContentId(contentId, { includeRevoked = false } = {}) {
    const adminToken = await this.getAdminToken();
    const filterParts = [`content_id = "${escapeFilterValue(contentId)}"`];
    if (!includeRevoked) {
      filterParts.push('is_revoked = false');
    }

    const filter = encodeURIComponent(filterParts.join(' && '));
    const url = `${this.baseUrl}/api/collections/share_links/records?page=1&perPage=50&sort=-created&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });
    const payload = await parseResponse(response);
    return payload.items ?? [];
  }

  async findShareLinkByHash(shareHash) {
    const adminToken = await this.getAdminToken();
    const filter = encodeURIComponent(`share_hash = "${escapeFilterValue(shareHash)}"`);
    const url = `${this.baseUrl}/api/collections/share_links/records?page=1&perPage=1&filter=${filter}`;
    const response = await this.fetchImpl(url, {
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });
    const payload = await parseResponse(response);
    return payload.items?.[0] ?? null;
  }

  async createShareLink(record) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/share_links/records`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      },
      body: JSON.stringify(record)
    });

    return parseResponse(response);
  }

  async updateShareLink(shareLinkId, record) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/share_links/records/${shareLinkId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      },
      body: JSON.stringify(record)
    });

    return parseResponse(response);
  }

  async deleteContent(contentId) {
    const adminToken = await this.getAdminToken();
    const response = await this.fetchImpl(`${this.baseUrl}/api/collections/contents/records/${contentId}`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        authorization: adminToken
      }
    });

    return parseResponse(response);
  }
}
