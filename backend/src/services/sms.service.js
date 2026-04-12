/**
 * SMS Service - Gửi OTP qua SMS
 * Sử dụng Twilio hoặc các provider khác
 */

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Tạo client (nếu có cấu hình)
let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// Hàm gửi SMS
async function sendSms(to, message) {
  // Nếu không có cấu hình Twilio, log ra console (cho dev)
  if (!client) {
    console.log(`[SMS Dev] Send to ${to}: ${message}`);
    return { ok: true, dev: true };
  }

  try {
    // Format số điện thoại (thêm +84 nếu là số Việt Nam)
    let formattedPhone = to;
    if (to.startsWith('0')) {
      formattedPhone = '+84' + to.substring(1);
    }

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`[SMS] Sent to ${to}: ${result.sid}`);
    return { ok: true, messageId: result.sid };
  } catch (err) {
    console.error('[SMS] Send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

// Gửi OTP qua SMS
async function sendOtpSms(phone, otpCode) {
  const message = `DeepCheck: Ma xac nhan cua ban la ${otpCode}. Ma het han sau 1 phut.`;
  return sendSms(phone, message);
}

module.exports = {
  sendSms,
  sendOtpSms,
  isConfigured: !!client,
};
