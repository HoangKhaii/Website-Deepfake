/**
 * Xác minh token reCAPTCHA v2/v3 với Google siteverify (SRP).
 */
const axios = require('axios');

const SITE_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * @param {string} token
 * @param {string} [remoteIp]
 * @returns {Promise<{ ok: boolean, errorCodes?: string[] }>}
 */
async function verifyRecaptchaToken(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || typeof secret !== 'string') {
    return { ok: false, errorCodes: ['missing-secret'] };
  }
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { ok: false, errorCodes: ['missing-input-response'] };
  }

  const params = new URLSearchParams();
  params.append('secret', secret.trim());
  params.append('response', token.trim());
  if (remoteIp && remoteIp !== 'unknown') {
    params.append('remoteip', remoteIp);
  }

  try {
    const { data } = await axios.post(SITE_VERIFY_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 12000,
    });
    if (data && data.success === true) {
      return { ok: true };
    }
    return { ok: false, errorCodes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : [] };
  } catch (err) {
    return { ok: false, errorCodes: ['network-error'] };
  }
}

module.exports = { verifyRecaptchaToken };
