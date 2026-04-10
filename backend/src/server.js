const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');
const envLocalPath = path.join(backendRoot, '.env.local');

require('dotenv').config({ path: envPath, quiet: true });
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath, override: true, quiet: true });
}

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
    console.log(`🚀 Server listening on all interfaces (0.0.0.0:${PORT})`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${localIP}:${PORT}`);
    console.log(`📡 API Health check: http://${localIP}:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString('vi-VN')}`);
    const uploadUrl =
      process.env.UPLOAD_AI_PREDICT_URL || 'http://26.54.212.200:5002/api/predict (gateway default)';
    const gwUrl =
      process.env.AI_GATEWAY_DETECT_URL || 'http://26.54.212.200:5001/api/detect (default)';
    console.log(`🤖 upload_ai (landing): ${uploadUrl}`);
    console.log(`🤖 deepfake gateway (face): ${gwUrl}`);
    console.log('='.repeat(50));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err?.message || err);
  process.exit(1);
});

module.exports = app;

