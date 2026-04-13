const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const authRoutes = require('./routes/auth.route');
const detectRoutes = require('./routes/detect.route');
const dbToolsRoutes = require('./routes/db-tools.route');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { initializeGoogleAuth } = require('./config/passport-google');

const app = express();

// Sau reverse proxy (nginx, Caddy, Cloudflare): bật để req.ip / req.ips đúng — email cảnh báo hiển thị IP thật.
// Không bật nếu API exposed trực tiếp ra internet (client có thể gửi X-Forwarded-For giả).
// .env: TRUST_PROXY=1 (một hop) hoặc số hop; TRUST_PROXY=0 / false để tắt.
(function applyTrustProxy() {
  const raw = String(process.env.TRUST_PROXY ?? '').trim().toLowerCase();
  if (raw === '' || raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') return;
  if (raw === '1' || raw === 'true' || raw === 'yes') {
    app.set('trust proxy', 1);
    return;
  }
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n > 0) app.set('trust proxy', n);
  }
})();

// Initialize Passport
app.use(passport.initialize());
initializeGoogleAuth(passport);

// Rate limiting - Chống brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // 5 lần thử
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // 10 lần gửi OTP
  message: { message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 100, // 100 requests/phút
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers với Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: '*', // Có thể thu hẹp trong production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// HTTP request logger
app.use(morgan('dev'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (nếu có)
app.use(express.static(path.resolve(__dirname, '..', 'public')));

// Route chính - trả về HTML cho trình duyệt
app.get('/', (req, res) => {
  const PORT = process.env.PORT || 5000;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
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
        <div class="status">✓ Connected successfully</div>
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

// API routes
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

apiRouter.get('/info', (req, res) => {
  const PORT = process.env.PORT || 5000;
  res.json({
    server: 'Deepfake Detection API',
    version: '1.0.0',
    port: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/', detectRoutes);
apiRouter.use('/', dbToolsRoutes);

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

