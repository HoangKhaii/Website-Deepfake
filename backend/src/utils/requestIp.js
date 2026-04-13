/** Chuẩn hóa hiển thị IPv4 từ dạng ::ffff:x.x.x.x */
function normalizeIp(ip) {
  if (ip == null || typeof ip !== 'string') return 'unknown';
  const t = ip.trim();
  if (!t) return 'unknown';
  if (t.startsWith('::ffff:')) return t.slice(7);
  return t;
}

/**
 * IP client cho log / email cảnh báo.
 * Chỉ đọc X-Forwarded-For / X-Real-Ip khi Express `trust proxy` đã bật (tránh client giả IP).
 */
function getClientIp(req) {
  const trust = Boolean(req.app?.get?.('trust proxy'));
  if (trust) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first =
        typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : String(forwarded[0] || '').trim();
      if (first) return normalizeIp(first);
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string' && realIp.trim()) {
      return normalizeIp(realIp.trim());
    }
  }
  const fromReq = req.ip || req.socket?.remoteAddress;
  return normalizeIp(fromReq) || 'unknown';
}

module.exports = { getClientIp, normalizeIp };
