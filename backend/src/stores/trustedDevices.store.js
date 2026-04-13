/**
 * Thiết bị đã xác thực OTP — lưu PostgreSQL (survive restart), tối đa 5 máy/user.
 */
const { query } = require('../config/db');

function deviceKey(ip, userAgent) {
  return `${ip}|${userAgent || ''}`;
}

function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return { browser, os };
}

const MAX_DEVICES_PER_USER = 5;

async function isTrustedDevice(userId, ip, userAgent) {
  const key = deviceKey(ip, userAgent);
  try {
    const { rows } = await query(
      `SELECT 1 FROM trusted_devices WHERE user_id = $1 AND device_key = $2 LIMIT 1`,
      [userId, key]
    );
    return rows.length > 0;
  } catch (err) {
    console.warn('[trustedDevices] isTrustedDevice query failed:', err?.message || err);
    return false;
  }
}

async function addTrustedDevice(userId, ip, userAgent) {
  const key = deviceKey(ip, userAgent);
  const ua = String(userAgent || '').slice(0, 2000);
  const lastIp = String(ip || '').slice(0, 128);
  try {
    await query(
      `INSERT INTO trusted_devices (user_id, device_key, last_ip, user_agent, last_seen)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, device_key)
       DO UPDATE SET last_ip = EXCLUDED.last_ip, user_agent = EXCLUDED.user_agent, last_seen = CURRENT_TIMESTAMP`,
      [userId, key, lastIp, ua]
    );
    const { rows } = await query(
      `SELECT id FROM trusted_devices WHERE user_id = $1 ORDER BY last_seen ASC`,
      [userId]
    );
    if (rows.length > MAX_DEVICES_PER_USER) {
      const excess = rows.slice(0, rows.length - MAX_DEVICES_PER_USER).map((r) => r.id);
      await query(`DELETE FROM trusted_devices WHERE id = ANY($1::int[])`, [excess]);
    }
  } catch (err) {
    console.warn('[trustedDevices] addTrustedDevice failed:', err?.message || err);
  }
}

/** Xóa toàn bộ thiết bị tin cậy (ví dụ sau đổi mật khẩu — bật bằng env). */
async function revokeAllTrustedDevicesForUser(userId) {
  try {
    await query(`DELETE FROM trusted_devices WHERE user_id = $1`, [userId]);
  } catch (err) {
    console.warn('[trustedDevices] revokeAll failed:', err?.message || err);
  }
}

module.exports = {
  isTrustedDevice,
  addTrustedDevice,
  parseUserAgent,
  deviceKey,
  revokeAllTrustedDevicesForUser,
};
