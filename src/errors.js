function cleanObjectEntries(entries) {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export function createAppError({
  message,
  statusCode = 500,
  code = 'internal_error',
  details,
  diagnostic,
  cause,
  exposeDetails = true
}) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.diagnostic = diagnostic;
  error.exposeDetails = exposeDetails;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

export function getErrorDetails(error) {
  if (error?.details) {
    return error.details;
  }

  if (error?.exposeDetails === false) {
    return undefined;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return undefined;
}

export function getErrorDiagnostic(error) {
  if (error?.diagnostic && typeof error.diagnostic === 'object') {
    return error.diagnostic;
  }

  return undefined;
}

export function serializeErrorForLog(error, context = {}) {
  const diagnostic = getErrorDiagnostic(error);
  const cause = error?.cause;

  return cleanObjectEntries([
    ['event', 'request_error'],
    ['message', error?.message],
    ['statusCode', error?.statusCode],
    ['code', error?.code],
    ['details', getErrorDetails(error)],
    ['diagnostic', diagnostic],
    ['context', Object.keys(context).length ? context : undefined],
    ['cause', cause ? cleanObjectEntries([
      ['message', cause.message],
      ['code', cause.code],
      ['status', cause.status]
    ]) : undefined]
  ]);
}
