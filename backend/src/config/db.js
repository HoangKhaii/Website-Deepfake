const { Pool } = require('pg');

let pool = null;

/** Thiết bị tin cậy sau OTP — lưu DB để không mất khi restart server (tránh báo “thiết bị lạ” oan). */
async function ensureTrustedDevicesTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        device_key TEXT NOT NULL,
        last_ip TEXT,
        user_agent TEXT,
        last_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT trusted_devices_user_device UNIQUE (user_id, device_key)
      )
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices (user_id)`
    );
  } catch (err) {
    console.warn('⚠️ trusted_devices table ensure failed:', err?.message || err);
  }
}

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

    await ensureTrustedDevicesTable(pool);

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

