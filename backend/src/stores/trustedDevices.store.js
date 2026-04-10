/**
 * Theo dõi thiết bị đã xác thực OTP — tách khỏi auth.controller (SRP).
 */
const trustedDevices = new Map();

function generateDeviceId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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

function isTrustedDevice(userId, ip, userAgent) {
  if (!trustedDevices.has(userId)) return false;
  const key = deviceKey(ip, userAgent);
  const devices = trustedDevices.get(userId);
  return devices.some((d) => d.deviceKey === key);
}

function addTrustedDevice(userId, ip, userAgent) {
  const key = deviceKey(ip, userAgent);
  const deviceInfo = parseUserAgent(userAgent);
  const device = {
    deviceId: generateDeviceId(),
    deviceKey: key,
    ip,
    userAgent,
    ...deviceInfo,
    lastLogin: new Date(),
  };

  if (!trustedDevices.has(userId)) {
    trustedDevices.set(userId, []);
  }

  const devices = trustedDevices.get(userId);
  const existing = devices.findIndex((d) => d.deviceKey === key);
  if (existing >= 0) devices.splice(existing, 1);
  if (devices.length >= 5) devices.shift();
  devices.push(device);
}

module.exports = {
  isTrustedDevice,
  addTrustedDevice,
  parseUserAgent,
  deviceKey,
};
