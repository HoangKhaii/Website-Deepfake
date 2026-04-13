/**
 * Email Service — OTP and notification emails via SMTP (e.g. Gmail).
 */

const nodemailer = require('nodemailer');

const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"DeepCheck" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return { ok: false, error: err.message };
  }
}

async function sendOtpEmail(email, otpCode) {
  const subject = 'DeepCheck — Your verification code';
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
              <tr>
                <td style="background: linear-gradient(135deg, #238636, #2ea043); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">DeepCheck</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Deepfake Detection Platform</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Verification code</h2>
                  <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px; text-align: center;">
                    Your one-time code is:
                  </p>
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
                    This code expires in <strong>10 minutes</strong>.
                  </p>
                  <p style="color: #ef4444; margin: 20px 0 0 0; font-size: 13px; text-align: center;">
                    If you did not request this code, you can ignore this email.
                  </p>
                </td>
              </tr>
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

async function sendMfaEmail(email, codes) {
  const subject = 'DeepCheck — Sign-in from a new device';
  const [code1, code2, code3] = codes;

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
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb, #10b981); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Verify new device</h1>
                  <p style="color: #e5e7eb; margin: 8px 0 0; font-size: 14px;">
                    We detected a sign-in from an unfamiliar device. Pick the code that matches one of the options below.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 28px 32px;">
                  <p style="color: #4b5563; margin: 0 0 18px 0; font-size: 15px;">
                    On the sign-in screen you will see <strong>three code choices</strong>. Select the one that matches <strong>one of the codes</strong> below:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 10px 0 20px 0;">
                    <tr>
                      <td align="center" style="padding: 6px;">
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 24px; display: inline-block;">
                          <span style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: 4px;">${code1}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 6px;">
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 24px; display: inline-block;">
                          <span style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: 4px;">${code2}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 6px;">
                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 24px; display: inline-block;">
                          <span style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: 4px;">${code3}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #6b7280; margin: 0; font-size: 13px; text-align: center;">
                    Codes are valid for <strong>10 minutes</strong>. If this was not you, change your password immediately.
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

async function sendLoginAlertEmail(email, deviceInfo) {
  const subject = 'DeepCheck — New device sign-in alert';
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
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Security alert</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">New sign-in to your account</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #1f2937; margin: 0 0 20px 0; font-size: 16px;">
                    We detected a new sign-in to your DeepCheck account:
                  </p>
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Device</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${deviceInfo.browser} on ${deviceInfo.os}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">IP address</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${deviceInfo.ip}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${new Date().toLocaleString()}</td>
                      </tr>
                    </table>
                  </div>
                  <p style="color: #ef4444; margin: 20px 0; font-size: 14px;">
                    If this was not you, change your password right away.
                  </p>
                </td>
              </tr>
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
  sendMfaEmail,
  sendLoginAlertEmail,
  transporter,
};
