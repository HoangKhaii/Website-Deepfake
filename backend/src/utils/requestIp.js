const os = require('os');

/** Chuẩn hóa hiển thị IPv4 từ dạng ::ffff:x.x.x.x */
function normalizeIp(ip) {
  if (ip == null || typeof ip !== 'string') return 'unknown';
  const t = ip.trim();
  if (!t) return 'unknown';
  if (t.startsWith('::ffff:')) return t.slice(7);
  return t;
}

/** 10/8, 172.16–31, 192.168/16 — LAN Wi‑Fi / router thường gặp */
function isRfc1918IPv4(addr) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(addr || '').trim());
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Radmin VPN và nhiều overlay dùng 26.0.0.0/8 — không ưu tiên khi đã có Wi‑Fi / RFC1918 */
function isRadminOrSimilarPublicRange(addr) {
  return /^26\./.test(String(addr || '').trim());
}

function isWifiAdapterName(name) {
  const n = String(name || '').toLowerCase();
  return /\bwi-?fi\b/.test(n) || /\bwireless\b/.test(n) || /\bwlan\b/.test(n);
}

function isEthernetAdapterName(name) {
  const n = String(name || '').toLowerCase();
  if (!n.includes('ethernet')) return false;
  return !isLikelyVirtualVpnAdapterName(name);
}

/** Bỏ qua VPN / ảo hóa để ưu tiên Wi‑Fi / Ethernet thật */
function isLikelyVirtualVpnAdapterName(name) {
  const n = String(name || '').toLowerCase();
  if (/\bradmin\b/.test(n)) return true;
  if (/\bhamachi\b|\blogmein\b/.test(n)) return true;
  if (/\btailscale\b|\bzerotier\b|\bwireguard\b|\bopenvpn\b/.test(n)) return true;
  if (/\bnordvpn\b|\bprotonvpn\b|\bexpressvpn\b/.test(n)) return true;
  if (/\bvethernet\b|\bhyper-v\b|\bvirtual switch\b/.test(n)) return true;
  if (/\bwsl\b|\bdocker\b|\bvmware\b|\bvirtualbox\b|\bnpcap\b/.test(n)) return true;
  if (/\bvpn\b/.test(n) && /\b(client|virtual|tunnel|radmin)\b/.test(n)) return true;
  if (/^unknown adapter vpn/.test(n)) return true;
  return false;
}

/**
 * IPv4 “mạng nhà” để thay loopback trong email — ưu tiên Wi‑Fi / LAN 192.168.x, không lấy Radmin trước.
 */
function getPrimaryLanIPv4() {
  const nets = os.networkInterfaces();
  if (!nets) return null;

  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (!net || net.internal) continue;
      if (net.family !== 'IPv4' && net.family !== 4) continue;
      const address = net.address;
      if (!address) continue;
      const vpn = isLikelyVirtualVpnAdapterName(name);
      const wifi = isWifiAdapterName(name);
      const eth = isEthernetAdapterName(name);
      const rfc = isRfc1918IPv4(address);
      const radminLike = isRadminOrSimilarPublicRange(address);

      let rank = 200;
      if (vpn) rank += 100;
      if (radminLike) rank += 80;

      if (wifi && rfc) rank = Math.min(rank, 0);
      else if (wifi && !radminLike) rank = Math.min(rank, 15);
      else if (wifi) rank = Math.min(rank, 35);

      if (eth && rfc) rank = Math.min(rank, 20);
      else if (eth && !radminLike) rank = Math.min(rank, 40);

      if (!vpn && rfc && !wifi && !eth) rank = Math.min(rank, 50);
      else if (!vpn && rfc) rank = Math.min(rank, 55);

      if (!vpn && !radminLike && !rfc) rank = Math.min(rank, 70);

      candidates.push({ name, address, rank });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((x, y) => x.rank - y.rank || String(x.name).localeCompare(String(y.name)));
  return candidates[0].address;
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

module.exports = { getClientIp, normalizeIp, getPrimaryLanIPv4 };
