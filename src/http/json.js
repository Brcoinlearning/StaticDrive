export function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(body));
}

export async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    error.code = 'invalid_json';
    throw error;
  }
}

export function badRequest(response, message, details) {
  json(response, 400, {
    error: 'bad_request',
    message,
    ...(details ? { details } : {})
  });
}

export function serverError(response, message, details) {
  json(response, 500, {
    error: 'internal_error',
    message,
    ...(details ? { details } : {})
  });
}

export function notFound(response) {
  json(response, 404, {
    error: 'not_found',
    message: 'Route not found.'
  });
}

export function methodNotAllowed(response) {
  json(response, 405, {
    error: 'method_not_allowed',
    message: 'Method not allowed.'
  });
}

export function forbidden(response, message = 'Forbidden.') {
  json(response, 403, {
    error: 'forbidden',
    message
  });
}

export function gone(response, message = 'Resource is no longer available.') {
  json(response, 410, {
    error: 'gone',
    message
  });
}
