export function createResponseCapture() {
  return {
    statusCode: null,
    headers: null,
    body: null,
    rawBuffer: Buffer.alloc(0),
    rawBody: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.rawBuffer = typeof body === 'string'
        ? Buffer.from(body, 'utf8')
        : Buffer.isBuffer(body)
          ? body
          : Buffer.from(body ?? '');
      this.rawBody = this.rawBuffer.toString('utf8');
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
