const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

const BCRYPT_ROUNDS = 10;
const OTP_EXPIRE_MINUTES = 10;

function toSafeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

async function register(req, res) {
  try {
    const { username, email, password, phone_number, full_name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const uname = (username || email).toString().trim();
    const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, phone_number, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING user_id, username, email, phone_number, full_name, role, status, created_at`,
      [uname, String(email).trim().toLowerCase(), hash, phone_number || null, full_name || null]
    );
    const user = rows[0];
    if (!user) return res.status(500).json({ message: 'Registration failed' });
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({ user: toSafeUser(user), token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ message: err?.message || 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const { rows } = await query(
      `SELECT user_id, username, email, password_hash, phone_number, full_name, role, status, created_at, last_login
       FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is disabled' });
    }
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: err?.message || 'Login failed' });
  }
}

async function otpSend(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const { rows } = await query(
      `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Email not registered' });
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    await query(
      `INSERT INTO otp (user_id, otp_code, expired_at) VALUES ($1, $2, $3)`,
      [user.user_id, otpCode, expiredAt]
    );
    console.log(`[OTP] ${email} => ${otpCode} (expires ${expiredAt.toISOString()})`);
    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error('OTP send error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
}

async function otpVerify(req, res) {
  try {
    const { email, otp_code } = req.body || {};
    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Email and otp_code are required' });
    }
    const { rows } = await query(
      `SELECT u.user_id, u.username, u.email, u.phone_number, u.full_name, u.role, u.status, u.created_at, u.last_login
       FROM users u
       INNER JOIN otp o ON o.user_id = u.user_id
       WHERE u.email = $1 AND o.otp_code = $2 AND o.expired_at > CURRENT_TIMESTAMP
       ORDER BY o.created_at DESC LIMIT 1`,
      [String(email).trim().toLowerCase(), String(otp_code).trim()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.user_id]);
    await query(`DELETE FROM otp WHERE user_id = $1`, [user.user_id]);
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ user: toSafeUser(user), token });
  } catch (err) {
    console.error('OTP verify error:', err);
    return res.status(500).json({ message: err?.message || 'Verification failed' });
  }
}

async function getMe(req, res) {
  try {
    const { rows } = await query(
      `SELECT user_id, username, email, phone_number, full_name, role, status, created_at, last_login
       FROM users WHERE user_id = $1 LIMIT 1`,
      [req.userId]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ message: err?.message || 'Failed' });
  }
}

module.exports = {
  register,
  login,
  otpSend,
  otpVerify,
  getMe,
};

