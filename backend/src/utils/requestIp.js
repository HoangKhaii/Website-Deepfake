/** Trích IP client — một trách nhiệm (SRP), dùng chọn auth / rate limit sau này */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim() || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
}

module.exports = { getClientIp };
