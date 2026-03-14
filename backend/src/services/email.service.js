/**
 * Email Service - Gửi email OTP và thông báo
 * Sử dụng Gmail SMTP để gửi email
 */

const nodemailer = require('nodemailer');

// Cấu hình SMTP từ .env
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

// Hàm gửi email chung
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"DeepCheck" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Đã gửi đến ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Gửi thất bại:', err.message);
    return { ok: false, error: err.message };
  }
}

// Gửi mã OTP qua email
async function sendOtpEmail(email, otpCode) {
  const subject = 'DeepCheck - Mã xác nhận của bạn';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #238636, #2ea043); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">DeepCheck</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Deepfake Detection Platform</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Mã xác nhận</h2>
                  
                  <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px; text-align: center;">
                    Mã xác nhận một lần của bạn là:
                  </p>
                  
                  <!-- OTP Code Box -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #238636; border-radius: 12px; padding: 20px 40px; display: inline-block;">
                          <span style="font-size: 36px; font-weight: bold; color: #238636; letter-spacing: 8px;">${otpCode}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #9ca3af; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                    Mã này sẽ hết hạn sau <strong>10 phút</strong>
                  </p>
                  
                  <p style="color: #ef4444; margin: 20px 0 0 0; font-size: 13px; text-align: center;">
                    Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                  <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    © 2024 DeepCheck. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

// Gửi email cảnh báo đăng nhập từ thiết bị mới
async function sendLoginAlertEmail(email, deviceInfo, location) {
  const subject = 'DeepCheck - Cảnh báo đăng nhập từ thiết bị mới';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Cảnh báo bảo mật</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Phát hiện đăng nhập từ thiết bị mới</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1f2937; margin: 0 0 20px 0; font-size: 16px;">
                    Chúng tôi phát hiện một đăng nhập mới vào tài khoản DeepCheck của bạn:
                  </p>
                  
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Thiết bị</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${deviceInfo.browser} trên ${deviceInfo.os}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Địa chỉ IP</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${deviceInfo.ip}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Vị trí</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${location}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Thời gian</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${new Date().toLocaleString()}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #ef4444; margin: 20px 0; font-size: 14px;">
                    Nếu đây không phải bạn, vui lòng thay đổi mật khẩu ngay lập tức.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                  <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    © 2024 DeepCheck. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendLoginAlertEmail,
  transporter,
};
