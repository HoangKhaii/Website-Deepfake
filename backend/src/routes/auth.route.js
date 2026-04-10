const express = require('express');
const passport = require('passport');
const multer = require('multer');
const { register, login, otpSend, otpVerify, getMe, registerOtpSend, registerOtpVerify, registerFace, verifyFace, forgotPasswordEmail, forgotPasswordVerify } = require('../controllers/auth.controller');
const { authJWT } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');
const { generateTokenForUser, isGoogleAuthConfigured } = require('../config/passport-google');

const router = express.Router();
const faceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 30,
    /** PNG pipeline giống test_webcam có thể > 3MB/frame */
    fileSize: 6 * 1024 * 1024,
  },
});

// --- Rate limit ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // 5 lần thử đăng nhập
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // 10 lần gửi OTP/giờ
  message: { message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Auth: register, login, OTP ---
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/otp/send', otpLimiter, otpSend);
router.post('/otp/verify', otpVerify);

// --- Register with OTP ---
router.post('/register-otp/send', otpLimiter, registerOtpSend);
router.post('/register-otp/verify', registerOtpVerify);

// --- Face ---
router.post('/register-face', faceUpload.any(), registerFace);
router.post('/verify-face', faceUpload.any(), verifyFace);

router.get('/me', authJWT, getMe);

// --- Google OAuth ---
function resolveFrontendUrl() {
  const fallback = 'http://26.54.212.200:5173';
  const raw = String(process.env.FRONTEND_URL || fallback).trim();
  // Defensive: tolerate `.env` values with inline comments/spaces.
  const cleaned = raw.split(/\s+/)[0].replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(cleaned)) return fallback;
  return cleaned || fallback;
}

const frontendUrl = resolveFrontendUrl();

router.get('/google', (req, res, next) => {
  if (!isGoogleAuthConfigured()) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      if (err) console.error('Google callback auth error:', err);
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
    try {
      const token = generateTokenForUser(user);
      return res.redirect(`${frontendUrl}/?google_auth=success&token=${encodeURIComponent(token)}`);
    } catch (tokenErr) {
      console.error('Google callback token error:', tokenErr);
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  })(req, res, next);
});

// --- Forgot password (chỉ email) ---
router.post('/forgot-password/email', otpLimiter, forgotPasswordEmail);
router.post('/forgot-password/verify', forgotPasswordVerify);

module.exports = router;

