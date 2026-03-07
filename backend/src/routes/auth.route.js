const express = require('express');
const { register, login, otpSend, otpVerify, getMe } = require('../controllers/auth.controller');
const { authJWT } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', otpSend);
router.post('/otp/verify', otpVerify);
router.get('/me', authJWT, getMe);

module.exports = router;

