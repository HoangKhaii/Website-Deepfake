const os = require('os');

/** Chuẩn hóa hiển thị IPv4 từ dạng ::ffff:x.x.x.x */
function normalizeIp(ip) {
  if (ip == null || typeof ip !== 'string') return 'unknown';
  const t = ip.trim();
  if (!t) return 'unknown';
  if (t.startsWith('::ffff:')) return t.slice(7);
  return t;
}

/** IPv4 đầu tiên không phải internal (để thay thế khi client chỉ thấy localhost / ::1). */
function getPrimaryLanIPv4() {
  const nets = os.networkInterfaces();
  if (!nets) return null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function isLoopbackNormalized(ip) {
  if (!ip || ip === 'unknown') return false;
  const t = String(ip).trim().toLowerCase();
  return (
    t === '127.0.0.1' ||
    t === '::1' ||
    t === '0:0:0:0:0:0:0:1' ||
    t.startsWith('::1%')
  );
}

/**
 * IP client cho log / email cảnh báo.
 * Chỉ đọc X-Forwarded-For / X-Real-Ip khi Express `trust proxy` đã bật (tránh client giả IP).
 * Trình duyệt mở http://localhost:5173 thường ra ::1 — thay bằng IPv4 LAN máy chủ để email dễ đối chiếu.
 */
function getClientIp(req) {
  const trust = Boolean(req.app?.get?.('trust proxy'));
  let resolved;
  if (trust) {
    if (req.ip) resolved = req.ip;
    if (!resolved) {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        const first =
          typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : String(forwarded[0] || '').trim();
        if (first) resolved = first;
      }
    }
    if (!resolved) {
      const realIp = req.headers['x-real-ip'];
      if (realIp && typeof realIp === 'string' && realIp.trim()) {
        resolved = realIp.trim();
      }
    }
  }
  if (!resolved) {
    resolved = req.ip || req.socket?.remoteAddress;
  }
  const out = normalizeIp(resolved) || 'unknown';
  if (isLoopbackNormalized(out)) {
    const lan = getPrimaryLanIPv4();
    if (lan) return lan;
  }
  return out;
}

module.exports = { getClientIp, normalizeIp };
