const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { initDb, closeDb, query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'deepcheck-secret-change-in-production';
const BCRYPT_ROUNDS = 10;
const OTP_EXPIRE_MINUTES = 10;

// ==================== FILE UPLOAD CONFIG ====================
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginal = Buffer.from(file.originalname, 'utf8')
      .toString('base64')
      .replace(/[/+=]/g, '');
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${timestamp}-${safeOriginal.slice(0, 16)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const uploadVideo = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('video');
const uploadImage = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('image');

const app = express();
const PORT = process.env.PORT || 5000;
let server;

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
    timestamp: new Date().toISOString(),
  });
});

// ==================== AUTH (users, otp) ====================
function toSafeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

function authJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId ?? payload.sub;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// POST /api/auth/register — body: username, email, password, phone_number?, full_name?
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, phone_number, full_name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const uname = (username || email).toString().trim();
    const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, phone_number, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING user_id, username, email, phone_number, full_name, role, status, created_at`,
      [uname, String(email).trim().toLowerCase(), hash, phone_number || null, full_name || null]
    );
    const user = rows[0];
    if (!user) return res.status(500).json({ message: 'Registration failed' });
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user: toSafeUser(user), token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: err?.message || 'Registration failed' });
  }
});

// POST /api/auth/login — body: email, password
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { rows } = await query(
      `SELECT user_id, username, email, password_hash, phone_number, full_name, role, status, created_at, last_login
       FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is disabled' });
    }
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err?.message || 'Login failed' });
  }
});

// POST /api/auth/otp/send — body: email (tạo OTP lưu DB, gửi mock)
apiRouter.post('/auth/otp/send', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const { rows } = await query(
      `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Email not registered' });
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    await query(
      `INSERT INTO otp (user_id, otp_code, expired_at) VALUES ($1, $2, $3)`,
      [user.user_id, otpCode, expiredAt]
    );
    console.log(`[OTP] ${email} => ${otpCode} (expires ${expiredAt.toISOString()})`);
    res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/otp/verify — body: email, otp_code
apiRouter.post('/auth/otp/verify', async (req, res) => {
  try {
    const { email, otp_code } = req.body || {};
    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Email and otp_code are required' });
    }
    const { rows } = await query(
      `SELECT u.user_id, u.username, u.email, u.phone_number, u.full_name, u.role, u.status, u.created_at, u.last_login
       FROM users u
       INNER JOIN otp o ON o.user_id = u.user_id
       WHERE u.email = $1 AND o.otp_code = $2 AND o.expired_at > CURRENT_TIMESTAMP
       ORDER BY o.created_at DESC LIMIT 1`,
      [String(email).trim().toLowerCase(), String(otp_code).trim()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.user_id]);
    await query(`DELETE FROM otp WHERE user_id = $1`, [user.user_id]);
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: err?.message || 'Verification failed' });
  }
});

// GET /api/auth/me — header Authorization: Bearer <token>
apiRouter.get('/auth/me', authJWT, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT user_id, username, email, phone_number, full_name, role, status, created_at, last_login
       FROM users WHERE user_id = $1 LIMIT 1`,
      [req.userId]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: err?.message || 'Failed' });
  }
});

// Deepfake detection endpoints (frontend DeepCheck gọi đến đây)
apiRouter.post('/detect', uploadVideo, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "video"' });
    }
    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: req.body.user_id || req.body.userId || null,
    };
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (video):', dbErr?.message);
    }
    res.json({ isDeepfake: false, score: 0.5 });
  } catch (err) {
    console.error('Detect (video) error:', err);
    res.status(500).json({ message: err?.message || 'Detection failed' });
  }
});

apiRouter.post('/detect-image', uploadImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "image"' });
    }
    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: req.body.user_id || req.body.userId || null,
    };
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (image):', dbErr?.message);
    }
    res.json({ isDeepfake: false, score: 0.5 });
  } catch (err) {
    console.error('Detect (image) error:', err);
    res.status(500).json({ message: err?.message || 'Detection failed' });
  }
});

// File upload endpoint
apiRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Missing file field "file"' });
    }

    const userId =
      req.body.user_id ||
      req.body.userId ||
      req.body.userID ||
      null;

    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: userId ? String(userId) : null,
    };

    const dbRecord = await insertUploadedFileMeta(fileMeta);

    res.status(201).json({
      ok: true,
      file: fileMeta,
      db: dbRecord,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Upload failed' });
  }
});

// DB time endpoint (test DB connection)
apiRouter.get('/db/time', async (req, res) => {
  try {
    const { rows } = await query('SELECT NOW() AS now');
    res.json({ ok: true, now: rows?.[0]?.now });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
});

// List public tables (quick data smoke-test)
apiRouter.get('/db/tables', async (req, res) => {
  try {
    const { rows } = await query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
      `
    );
    res.json({ ok: true, tables: rows.map((r) => r.table_name) });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
});

function quoteIdent(ident) {
  return `"${String(ident).replace(/"/g, '""')}"`;
}

function clampInt(value, { min, max, fallback }) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

async function ensurePublicTable(tableName) {
  const { rows } = await query(
    `
    SELECT 1 AS ok
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = $1
    LIMIT 1
    `,
    [tableName]
  );
  return rows.length > 0;
}

async function getPublicTableColumns(tableName) {
  const { rows } = await query(
    `
    SELECT column_name, data_type, is_nullable, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    [tableName]
  );
  return rows;
}

function buildRedactor(columns) {
  const sensitive = new Set(
    columns
      .map((c) => String(c.column_name))
      .filter((name) => /pass(word)?|token|secret|otp|hash/i.test(name))
  );

  return (row) => {
    if (!row || typeof row !== 'object') return row;
    const out = { ...row };
    for (const key of Object.keys(out)) {
      if (sensitive.has(key)) out[key] = '[REDACTED]';
    }
    return out;
  };
}

async function insertUploadedFileMeta(meta) {
  const table = 'uploaded_files';

  const exists = await ensurePublicTable(table);
  if (!exists) {
    console.warn(`Table "${table}" does not exist, skipping metadata insert.`);
    return null;
  }
  if (!meta.userId) {
    return null;
  }

  const columns = await getPublicTableColumns(table);
  const available = new Set(columns.map((c) => c.column_name));

  const mappings = [
    {
      metaKey: 'originalName',
      aliases: ['original_name', 'originalFilename', 'original_file_name'],
    },
    {
      metaKey: 'storedName',
      aliases: ['stored_name', 'filename', 'file_name'],
    },
    {
      metaKey: 'mimeType',
      aliases: ['mime_type', 'content_type', 'file_type'],
    },
    {
      metaKey: 'size',
      aliases: ['size', 'file_size'],
    },
    {
      metaKey: 'relativePath',
      aliases: ['file_path', 'path', 'storage_path', 'relative_path'],
    },
    {
      metaKey: 'userId',
      aliases: ['user_id', 'owner_id'],
    },
  ];

  const insertCols = [];
  const values = [];

  let paramIndex = 1;
  for (const m of mappings) {
    const value = meta[m.metaKey];
    if (value === undefined || value === null) continue;

    const col = m.aliases.find((name) => available.has(name));
    if (!col) continue;

    insertCols.push(quoteIdent(col));
    values.push(value);
    paramIndex += 1;
  }

  if (insertCols.length === 0) {
    console.warn(`No matching columns found in "${table}" for provided metadata.`);
    return null;
  }

  const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
  const sql = `INSERT INTO ${quoteIdent(table)} (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

  try {
    const { rows } = await query(sql, values);
    return rows?.[0] || null;
  } catch (err) {
    console.error('Failed to insert into uploaded_files:', err);
    return null;
  }
}

// Describe table schema (columns)
apiRouter.get('/db/table/:table/schema', async (req, res) => {
  try {
    const table = String(req.params.table || '').trim();
    if (!table) return res.status(400).json({ ok: false, error: 'Missing table' });

    const exists = await ensurePublicTable(table);
    if (!exists) return res.status(404).json({ ok: false, error: 'Table not found' });

    const columns = await getPublicTableColumns(table);
    res.json({
      ok: true,
      table,
      columns: columns.map(({ column_name, data_type, is_nullable, ordinal_position }) => ({
        column_name,
        data_type,
        is_nullable,
        ordinal_position,
      })),
    });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
});

// Sample rows from a table (default limit=10, max=100)
apiRouter.get('/db/table/:table/sample', async (req, res) => {
  try {
    const table = String(req.params.table || '').trim();
    if (!table) return res.status(400).json({ ok: false, error: 'Missing table' });

    const limit = clampInt(req.query.limit, { min: 1, max: 100, fallback: 10 });
    const offset = clampInt(req.query.offset, { min: 0, max: 100000, fallback: 0 });

    const exists = await ensurePublicTable(table);
    if (!exists) return res.status(404).json({ ok: false, error: 'Table not found' });

    const columns = await getPublicTableColumns(table);
    const redact = buildRedactor(columns);

    const sql = `SELECT * FROM ${quoteIdent(table)} LIMIT $1 OFFSET $2`;
    const { rows } = await query(sql, [limit, offset]);

    res.json({
      ok: true,
      table,
      limit,
      offset,
      rows: rows.map(redact),
    });
  } catch (err) {
    const status = err?.code === 'DB_NOT_READY' ? 503 : 500;
    res.status(status).json({ ok: false, error: err?.message || 'DB error' });
  }
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

// Graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  // Connect DB (non-fatal if DB is down/misconfigured)
  await initDb();

  // Start server - bind to 0.0.0.0 để cho phép truy cập từ mọi địa chỉ IP
  server = app.listen(PORT, '0.0.0.0', () => {
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
}

start().catch((err) => {
  console.error('Failed to start server:', err?.message || err);
  process.exit(1);
});

module.exports = app;
