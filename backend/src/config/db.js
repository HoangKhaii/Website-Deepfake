const { Pool } = require('pg');

let pool = null;

function buildPgConfig() {
  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (connectionString) {
    const sslEnabled = String(process.env.PGSSL || '').toLowerCase() === 'true';
    return {
      connectionString,
      ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  const host = (process.env.PGHOST || '').trim();
  const database = (process.env.PGDATABASE || '').trim();
  const user = (process.env.PGUSER || '').trim();
  const password = process.env.PGPASSWORD ?? '';
  const portRaw = (process.env.PGPORT || '').trim();

  // Nếu chưa cấu hình gì thì không tự đoán để tránh connect nhầm.
  if (!host && !database && !user && !portRaw && !password) return null;

  const sslEnabled = String(process.env.PGSSL || '').toLowerCase() === 'true';
  const port = portRaw ? Number(portRaw) : undefined;

  return {
    host: host || undefined,
    database: database || undefined,
    user: user || undefined,
    password: password || undefined,
    port: Number.isFinite(port) ? port : undefined,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

async function initDb() {
  if (pool) return pool;

  const config = buildPgConfig();
  if (!config) {
    console.warn('⚠️ PostgreSQL not configured (set DATABASE_URL or PG* env vars). Skipping DB connect.');
    return null;
  }

  try {
    pool = new Pool(config);
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected successfully');

    const { rows } = await pool.query('SELECT NOW() AS now');
    console.log(`🟢 DB Time: ${rows?.[0]?.now}`);

    return pool;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err?.message || err);
    // Không crash server; cho phép API khác chạy.
    try {
      await pool?.end?.();
    } catch {
      // ignore
    }
    pool = null;
    return null;
  }
}

async function closeDb() {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end();
}

async function getPool() {
  const p = await initDb();
  return p;
}

async function query(text, params) {
  const p = await getPool();
  if (!p) {
    const err = new Error('Database error: PostgreSQL is not configured. Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, PGPASSWORD in your .env file.');
    err.code = 'DB_NOT_READY';
    throw err;
  }
  return p.query(text, params);
}

module.exports = { initDb, closeDb, getPool, query };

