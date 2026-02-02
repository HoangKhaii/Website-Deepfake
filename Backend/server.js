const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
// Security headers với Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Cho phép inline styles cho HTML
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: '*', // Cho phép tất cả origins (có thể thay đổi trong production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// HTTP request logger
app.use(morgan('dev'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (nếu có)
app.use(express.static('public'));

// ==================== ROUTES ====================
// Route chính - trả về HTML cho trình duyệt
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deepfake Detection - Server</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          max-width: 500px;
        }
        h1 { margin-top: 0; }
        .status {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #4CAF50;
          border-radius: 25px;
          margin: 1rem 0;
          font-weight: bold;
        }
        .info {
          margin-top: 1rem;
          font-size: 0.9rem;
          opacity: 0.9;
        }
        .info p {
          margin: 0.5rem 0;
        }
        a {
          color: #fff;
          text-decoration: underline;
          transition: opacity 0.3s;
        }
        a:hover {
          opacity: 0.8;
        }
        .endpoints {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        .endpoint-item {
          margin: 0.5rem 0;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Server Node.js</h1>
        <div class="status">✓ Đã kết nối thành công!</div>
        <div class="info">
          <p><strong>Port:</strong> ${PORT}</p>
          <p><strong>Status:</strong> Running</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <div class="endpoints">
          <h3>📡 API Endpoints:</h3>
          <div class="endpoint-item">
            <a href="/api/health">GET /api/health</a>
          </div>
          <div class="endpoint-item">
            <a href="/api/info">GET /api/info</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Server info endpoint
apiRouter.get('/info', (req, res) => {
  res.json({
    server: 'Deepfake Detection API',
    version: '1.0.0',
    port: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRouter);

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} không tồn tại`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Đã xảy ra lỗi trên server';
  
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVER START ====================
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server - bind to 0.0.0.0 để cho phép truy cập từ mọi địa chỉ IP
const server = app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Tìm địa chỉ IP local
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }
  
  console.log('='.repeat(50));
  console.log(`🚀 Server đang chạy trên tất cả interfaces (0.0.0.0:${PORT})`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log(`📡 API Health check: http://${localIP}:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString('vi-VN')}`);
  console.log('='.repeat(50));
});

module.exports = app;
