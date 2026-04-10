function notFound(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

function safeJson(value) {
  if (value == null) return undefined;
  if (typeof value === 'object') return value;
  return { detail: String(value) };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Error:', err.stack || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An error occurred on the server';

  const payload = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message,
    ...(err.code ? { code: err.code } : {}),
    timestamp: new Date().toISOString(),
  };

  // Keep compatibility: only include extra debug fields in development.
  if (process.env.NODE_ENV === 'development') {
    if (err.stack) payload.stack = err.stack;
    if (err.upstreamBody) payload.upstream = safeJson(err.upstreamBody);
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };

