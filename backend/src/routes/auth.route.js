const express = require('express');
const passport = require('passport');
const { register, login, otpSend, otpVerify, getMe, registerOtpSend, registerOtpVerify, registerFace, verifyFace } = require('../controllers/auth.controller');
const { authJWT } = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');
const { generateTokenForUser, isGoogleAuthConfigured } = require('../config/passport-google');

const router = express.Router();

// Rate limiting cho auth routes
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

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/otp/send', otpLimiter, otpSend);
router.post('/otp/verify', otpVerify);

// Register with OTP
router.post('/register-otp/send', otpLimiter, registerOtpSend);
router.post('/register-otp/verify', registerOtpVerify);

// Face registration and verification
router.post('/register-face', registerFace);
router.post('/verify-face', verifyFace);

router.get('/me', authJWT, getMe);

// Google OAuth routes
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
router.get('/google', (req, res, next) => {
  if (!isGoogleAuthConfigured()) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  async (req, res) => {
    try {
      const token = generateTokenForUser(req.user);
      res.redirect(`${frontendUrl}/?google_auth=success&token=${token}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect(`${frontendUrl}/?error=google_auth_failed`);
    }
  }
);

module.exports = router;

