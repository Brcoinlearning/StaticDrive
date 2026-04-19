export function createResponseCapture() {
  return {
    statusCode: null,
    headers: null,
    body: null,
    rawBody: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.rawBody = typeof body === 'string' ? body : body?.toString?.('utf8') ?? '';
      const contentType = this.headers?.['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        this.body = JSON.parse(this.rawBody);
        return;
      }

      this.body = this.rawBody;
    }
  };
}

export async function createRequest({ method = 'GET', url = '/', headers = {}, body } = {}) {
  async function* bodyStream() {
    if (body !== undefined) {
      yield Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    }
  }

  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: bodyStream
  };
}
