function notFound(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} không tồn tại`,
    timestamp: new Date().toISOString(),
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Error:', err.stack || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Đã xảy ra lỗi trên server';

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { notFound, errorHandler };

