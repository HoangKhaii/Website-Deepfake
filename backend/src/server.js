const http = require('http');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const app = require('./app');
const { initDb, closeDb } = require('./config/db');

const PORT = process.env.PORT || 5000;
let server;

async function shutdown(signal) {
  try {
    console.log(`\n${signal} signal received: shutting down...`);
    await closeDb();
  } catch (err) {
    console.error('Error while closing DB:', err?.message || err);
  }

  if (!server) process.exit(0);

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  await initDb();

  server = http.createServer(app).listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';

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
}

start().catch((err) => {
  console.error('Failed to start server:', err?.message || err);
  process.exit(1);
});

module.exports = app;

