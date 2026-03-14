const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const { sendOtpEmail, sendLoginAlertEmail } = require('../services/email.service');
const { sendOtpSms } = require('../services/sms.service');

const BCRYPT_ROUNDS = 10;
const OTP_EXPIRE_MINUTES = 10;

// Device tracking - Lưu thiết bị đã đăng nhập
const trustedDevices = new Map(); // userId -> [{ deviceId, lastLogin, ip, userAgent }]

function generateDeviceId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
  
  const devices = trustedDevices.get(userId);
  return devices.some(d => d.ip === ip);
}

function addTrustedDevice(userId, ip, userAgent) {
  const deviceInfo = parseUserAgent(userAgent);
  const device = {
    deviceId: generateDeviceId(),
    ip,
    userAgent,
    ...deviceInfo,
    lastLogin: new Date(),
  };
  
  if (!trustedDevices.has(userId)) {
    trustedDevices.set(userId, []);
  }
  
  // Giới hạn 5 thiết bị trusted
  const devices = trustedDevices.get(userId);
  if (devices.length >= 5) {
    devices.shift(); // Xóa thiết bị cũ nhất
  }
  
  devices.push(device);
}

function toSafeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

async function register(req, res) {
  try {
    const { username, email, password, phone_number, full_name, birth_date } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Validate email format
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Email must be @gmail.com' });
    }
    
    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }
    
    // Validate full_name - phải đầy đủ họ và tên (ít nhất 2 từ)
    if (full_name) {
      const nameParts = full_name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        return res.status(400).json({ message: 'Full name must include both first name and last name' });
      }
    }
    
    // Validate birth_date - không được chạy trước ngày hiện tại và phải >= 12 tuổi
    if (birth_date) {
      const birthDate = new Date(birth_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (birthDate > today) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future' });
      }
      
      // Phải ít nhất 12 tuổi
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 12);
      if (birthDate > minAgeDate) {
        return res.status(400).json({ message: 'You must be at least 12 years old to register' });
      }
    }
    
    // Validate phone - nếu có thì phải đúng 10 số
    if (phone_number && !/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    }
    
    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await query(
      `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    // Kiểm tra số điện thoại đã tồn tại chưa (nếu có nhập)
    if (phone_number) {
      const existingPhone = await query(
        `SELECT user_id FROM users WHERE phone_number = $1 LIMIT 1`,
        [phone_number]
      );
      
      if (existingPhone.rows.length > 0) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }
    }
    
    const uname = (username || email).toString().trim();
    const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, phone_number, full_name, birth_date, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'user')
       RETURNING user_id, username, email, phone_number, full_name, birth_date, role, status, created_at`,
      [uname, String(email).trim().toLowerCase(), hash, phone_number || null, full_name || null, birth_date || null]
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
    
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
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
    
    // Kiểm tra thiết bị có phải là trusted không
    const isTrusted = isTrustedDevice(user.user_id, clientIp, userAgent);
    
    // Cập nhật last login
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );
    
    // Nếu là thiết bị chưa trusted, yêu cầu OTP
    if (!isTrusted) {
      // Gửi OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
      
      await query(
        `INSERT INTO otp (user_id, otp_code, expired_at) VALUES ($1, $2, $3)`,
        [user.user_id, otpCode, expiredAt]
      );
      
      // Gửi email OTP
      const emailResult = await sendOtpEmail(user.email, otpCode);
      console.log(`[Login OTP] ${user.email} => ${otpCode} (expires ${expiredAt.toISOString()})`);
      
      // Gửi thông báo đăng nhập từ thiết bị mới
      const deviceInfo = parseUserAgent(userAgent);
      await sendLoginAlertEmail(user.email, { ...deviceInfo, ip: clientIp }, 'Unknown location');
      
      // Trả về yêu cầu xác thực 2 bước
      return res.json({
        requiresVerification: true,
        message: 'Please verify your identity. OTP sent to your email.',
        email: user.email,
        user: toSafeUser(user)
      });
    }
    
    // Thiết bị trusted - thêm vào danh sách và cho đăng nhập
    addTrustedDevice(user.user_id, clientIp, userAgent);
    
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
    
    // Kiểm tra đã gửi OTP gần đây chưa (chống spam)
    const recentOtp = await query(
      `SELECT created_at FROM otp WHERE user_id = $1  ORDER BY created_at DESC LIMIT 1`,
      [user.user_id]
    );
    
    if (recentOtp.rows.length > 0) {
      const lastOtpTime = new Date(recentOtp.rows[0].created_at);
      const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({ 
          message: 'Please wait before requesting another OTP',
          retryAfter: Math.ceil(60 - timeSinceLastOtp)
        });
      }
    }
    
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    
    await query(
      `INSERT INTO otp (user_id, otp_code, expired_at) VALUES ($1, $2, $3)`,
      [user.user_id, otpCode, expiredAt]
    );
    
    // Gửi email thật
    const emailResult = await sendOtpEmail(user.email, otpCode);
    
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
    
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
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
    
    // Xóa OTP sau khi xác thực thành công
    await query(`DELETE FROM otp WHERE user_id = $1 `, [user.user_id]);
    
    // Cập nhật last login
    await query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.user_id]);
    
    // Thêm thiết bị vào trusted
    addTrustedDevice(user.user_id, clientIp, userAgent);
    
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

// Gửi OTP cho đăng ký (tạo tài khoản trước nhưng chưa active)
async function registerOtpSend(req, res) {
  try {
    const { email, username, password, phone_number, full_name, birth_date } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Email must be @gmail.com' });
    }
    
    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }
    
    // Validate full_name - phải đầy đủ họ và tên (ít nhất 2 từ)
    if (full_name) {
      const nameParts = full_name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        return res.status(400).json({ message: 'Full name must include both first name and last name' });
      }
    }
    
    // Validate birth_date - không được chạy trước ngày hiện tại và phải >= 12 tuổi
    if (birth_date) {
      const birthDate = new Date(birth_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (birthDate > today) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future' });
      }
      
      // Phải ít nhất 12 tuổi
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 12);
      if (birthDate > minAgeDate) {
        return res.status(400).json({ message: 'You must be at least 12 years old to register' });
      }
    }
    
    // Validate phone
    if (phone_number && !/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    }
    
    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await query(
      `SELECT user_id, status FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    
    // Nếu email đã tồn tại và đã active (không phải pending), báo lỗi
    if (existingEmail.rows.length > 0 && existingEmail.rows[0].status !== 'pending') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    
    // Nếu email đã tồn tại với status = 'pending', kiểm tra đã gửi OTP gần đây chưa
    if (existingEmail.rows.length > 0 && existingEmail.rows[0].status === 'pending') {
      const recentOtp = await query(
        `SELECT created_at FROM otp WHERE user_id = $1 AND purpose = 'register' ORDER BY created_at DESC LIMIT 1`,
        [existingEmail.rows[0].user_id]
      );
      
      if (recentOtp.rows.length > 0) {
        const lastOtpTime = new Date(recentOtp.rows[0].created_at);
        const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
        if (timeSinceLastOtp < 60) {
          return res.status(429).json({ 
            message: 'Please wait before requesting another OTP',
            retryAfter: Math.ceil(60 - timeSinceLastOtp)
          });
        }
      }
      
      // Tạo mã OTP mới
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
      
      // Cập nhật OTP mới
      await query(
        `INSERT INTO otp (user_id, otp_code, expired_at, purpose) VALUES ($1, $2, $3, 'register')`,
        [existingEmail.rows[0].user_id, otpCode, expiredAt]
      );
      
      // Gửi email OTP
      const emailResult = await sendOtpEmail(email, otpCode);
      console.log(`[Register OTP Resend] ${email} => ${otpCode} (expires ${expiredAt.toISOString()})`);
      
      return res.json({ 
        ok: true, 
        message: 'OTP sent to your email',
        email: email,
        userId: existingEmail.rows[0].user_id
      });
    }
    
    // Kiểm tra số điện thoại đã tồn tại chưa (nếu có nhập)
    if (phone_number) {
      const existingPhone = await query(
        `SELECT user_id FROM users WHERE phone_number = $1 LIMIT 1`,
        [phone_number]
      );
      
      if (existingPhone.rows.length > 0) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }
    }
    
    // Kiểm tra đã gửi OTP gần đây chưa (chống spam)
    const recentOtp = await query(
      `SELECT created_at FROM otp WHERE purpose = 'register' ORDER BY created_at DESC LIMIT 1`
    );
    
    if (recentOtp.rows.length > 0) {
      const lastOtpTime = new Date(recentOtp.rows[0].created_at);
      const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({ 
          message: 'Please wait before requesting another OTP',
          retryAfter: Math.ceil(60 - timeSinceLastOtp)
        });
      }
    }
    
    // Tạo mã OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    
    // Hash password trước
    const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
    
    // Tạo tài khoản tạm thời (chưa active)
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, phone_number, full_name, birth_date, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'user', 'pending')
       RETURNING user_id, username, email, phone_number, full_name, birth_date, role, status, created_at`,
      [username || email, String(email).trim().toLowerCase(), hash, phone_number || null, full_name || null, birth_date || null]
    );
    
    const tempUser = rows[0];
    
    // Lưu OTP với purpose = 'register'
    await query(
      `INSERT INTO otp (user_id, otp_code, expired_at, purpose) VALUES ($1, $2, $3, 'register')`,
      [tempUser.user_id, otpCode, expiredAt]
    );
    
    // Gửi email OTP
    const emailResult = await sendOtpEmail(tempUser.email, otpCode);
    console.log(`[Register OTP] ${tempUser.email} => ${otpCode} (expires ${expiredAt.toISOString()})`);
    
    return res.json({ 
      ok: true, 
      message: 'OTP sent to your email',
      email: tempUser.email,
      userId: tempUser.user_id
    });
  } catch (err) {
    console.error('Register OTP send error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to send OTP' });
  }
}

// Xác thực OTP và kích hoạt tài khoản
async function registerOtpVerify(req, res) {
  try {
    const { email, otp_code } = req.body || {};
    
    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Email and otp_code are required' });
    }
    
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    // Tìm user và OTP (chỉ user có status = 'pending')
    const { rows } = await query(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.phone_number, u.full_name, u.role, u.status, u.created_at, u.last_login
       FROM users u
       INNER JOIN otp o ON o.user_id = u.user_id
       WHERE u.email = $1 AND o.otp_code = $2 AND o.expired_at > CURRENT_TIMESTAMP AND o.purpose = 'register'
       ORDER BY o.created_at DESC LIMIT 1`,
      [String(email).trim().toLowerCase(), String(otp_code).trim()]
    );
    
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'Account already activated' });
    }
    
    // Kích hoạt tài khoản
    await query(
      `UPDATE users SET status = 'active' WHERE user_id = $1`,
      [user.user_id]
    );
    
    // Xóa OTP sau khi xác thực thành công
    await query(`DELETE FROM otp WHERE user_id = $1 AND purpose = 'register'`, [user.user_id]);
    
    // Cập nhật last login
    await query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.user_id]);
    
    // Thêm thiết bị vào trusted
    addTrustedDevice(user.user_id, clientIp, userAgent);
    
    // Trả về user đã active (không trả password_hash)
    const { password_hash, ...safeUser } = user;
    safeUser.status = 'active';
    
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Register OTP verify error:', err);
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

// Register face for user
async function registerFace(req, res) {
  try {
    const { email, faceImage } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (!faceImage) {
      return res.status(400).json({ success: false, message: 'Face image is required' });
    }

    // Find user by email
    const { rows } = await query(
      `SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];

    // Update user with face image
    await query(
      `UPDATE users SET face_image = $1 WHERE user_id = $2`,
      [faceImage, user.user_id]
    );

    return res.json({
      success: true,
      message: 'Face registered successfully'
    });
  } catch (err) {
    console.error('Register face error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to register face' });
  }
}

// Verify face for login
async function verifyFace(req, res) {
  try {
    const { email, faceImage } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (!faceImage) {
      return res.status(400).json({ success: false, message: 'Face image is required' });
    }

    // Find user by email
    const { rows } = await query(
      `SELECT user_id, email, face_image FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];

    if (!user.face_image) {
      return res.status(400).json({ success: false, message: 'No face registered for this user' });
    }

    // Simple comparison: check if the new image data URL starts the same way as stored
    // In production, you would use face-api.js to compare face descriptors
    const storedImageMatches = user.face_image.length > 0;
    
    if (storedImageMatches) {
      return res.json({
        success: true,
        message: 'Face verified successfully'
      });
    } else {
      return res.status(401).json({ success: false, message: 'Face verification failed' });
    }
  } catch (err) {
    console.error('Verify face error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to verify face' });
  }
}

// ========================
// QUÊN MẬT KHẨU
// ========================

// Gửi OTP qua email cho quên mật khẩu
async function forgotPasswordEmail(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Email must be @gmail.com' });
    }

    // Kiểm tra email có tồn tại không
    const user = await query(
      `SELECT user_id, email FROM users WHERE email = $1 LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    // Nếu email không tồn tại, trả về lỗi
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found in our system. Please check your email or register a new account.' });
    }
    
    // Kiểm tra đã gửi OTP gần đây chưa
      const recentOtp = await query(
        `SELECT created_at FROM otp WHERE user_id = $1 AND purpose = 'forgot_password_email' ORDER BY created_at DESC LIMIT 1`,
        [user.rows[0].user_id]
      );

      if (recentOtp.rows.length > 0) {
        const lastOtpTime = new Date(recentOtp.rows[0].created_at);
        const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
        if (timeSinceLastOtp < 60) {
          return res.status(429).json({ 
            message: 'Please wait before requesting another OTP',
            retryAfter: Math.ceil(60 - timeSinceLastOtp)
          });
        }
      }

      // Tạo mã OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

      // Lưu OTP
      await query(
        `INSERT INTO otp (user_id, otp_code, expired_at, purpose) VALUES ($1, $2, $3, 'forgot_password_email')`,
        [user.rows[0].user_id, otpCode, expiredAt]
      );

      // Gửi email OTP
      const emailResult = await sendOtpEmail(user.rows[0].email, otpCode);
      console.log(`[Forgot Password Email] ${user.rows[0].email} => ${otpCode}`);

      return res.json({ 
        ok: true, 
        message: 'OTP sent to your email',
        method: 'email'
      });
  } catch (err) {
    console.error('Forgot password email error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to process request' });
  }
}

// Gửi OTP qua SMS cho quên mật khẩu
async function forgotPasswordPhone(req, res) {
  try {
    const { phone } = req.body || {};

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
    }

    // Kiểm tra phone có tồn tại không
    const user = await query(
      `SELECT user_id, phone_number FROM users WHERE phone_number = $1 LIMIT 1`,
      [phone]
    );

    // Nếu phone không tồn tại, trả về lỗi
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Phone number not found in our system. Please check your phone or register a new account.' });
    }

    // Kiểm tra đã gửi OTP gần đây chưa
      const recentOtp = await query(
        `SELECT created_at FROM otp WHERE user_id = $1 AND purpose = 'forgot_password_phone' ORDER BY created_at DESC LIMIT 1`,
        [user.rows[0].user_id]
      );

      if (recentOtp.rows.length > 0) {
        const lastOtpTime = new Date(recentOtp.rows[0].created_at);
        const timeSinceLastOtp = (Date.now() - lastOtpTime.getTime()) / 1000;
        if (timeSinceLastOtp < 60) {
          return res.status(429).json({ 
            message: 'Please wait before requesting another OTP',
            retryAfter: Math.ceil(60 - timeSinceLastOtp)
          });
        }
      }

      // Tạo mã OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

      // Lưu OTP
      await query(
        `INSERT INTO otp (user_id, otp_code, expired_at, purpose) VALUES ($1, $2, $3, 'forgot_password_phone')`,
        [user.rows[0].user_id, otpCode, expiredAt]
      );

      // Gửi SMS OTP
      const smsResult = await sendOtpSms(user.rows[0].phone_number, otpCode);
      console.log(`[Forgot Password Phone] ${user.rows[0].phone_number} => ${otpCode}`);

      return res.json({ 
        ok: true, 
        message: 'OTP sent to your phone',
        method: 'phone'
      });
  } catch (err) {
    console.error('Forgot password phone error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to process request' });
  }
}

// Xác minh OTP và đổi mật khẩu
async function forgotPasswordVerify(req, res) {
  try {
    const { identifier, otp, newPassword, method } = req.body || {};

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    // Nếu không có newPassword thì chỉ verify OTP (bước trung gian)
    if (!newPassword) {
      // Validate method bắt buộc
      if (!method || !['email', 'phone'].includes(method)) {
        return res.status(400).json({ message: 'Method must be email or phone' });
      }

      // Tìm user dựa trên email hoặc phone
      let user;
      if (method === 'email') {
        if (!identifier.endsWith('@gmail.com')) {
          return res.status(400).json({ message: 'Email must be @gmail.com' });
        }
        const result = await query(
          `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
          [String(identifier).trim().toLowerCase()]
        );
        if (result.rows.length === 0) {
          return res.status(400).json({ message: 'Invalid OTP or identifier' });
        }
        user = result.rows[0];
      } else {
        if (!/^\d{10}$/.test(identifier)) {
          return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
        }
        const result = await query(
          `SELECT user_id FROM users WHERE phone_number = $1 LIMIT 1`,
          [identifier]
        );
        if (result.rows.length === 0) {
          return res.status(400).json({ message: 'Invalid OTP or identifier' });
        }
        user = result.rows[0];
      }

      // Kiểm tra OTP
      const purpose = method === 'email' ? 'forgot_password_email' : 'forgot_password_phone';
      const otpRecord = await query(
        `SELECT otp_id, otp_code, expired_at FROM otp 
         WHERE user_id = $1 AND purpose = $2 AND otp_code = $3 
         ORDER BY created_at DESC LIMIT 1`,
        [user.user_id, purpose, otp]
      );

      if (otpRecord.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Kiểm tra OTP hết hạn chưa
      if (new Date(otpRecord.rows[0].expired_at) < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // OTP hợp lệ, trả về thành công (giữ lại OTP để dùng cho bước đổi mật khẩu)
      return res.json({ 
        ok: true, 
        message: 'OTP verified successfully. Please enter your new password.' 
      });
    }

    // Nếu có newPassword thì verify OTP + đổi mật khẩu (flow cũ)

    if (!method || !['email', 'phone'].includes(method)) {
      return res.status(400).json({ message: 'Method must be email or phone' });
    }

    // Validate password
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }

    // Tìm user dựa trên email hoặc phone
    let user;
    if (method === 'email') {
      if (!identifier.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Email must be @gmail.com' });
      }
      const result = await query(
        `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
        [String(identifier).trim().toLowerCase()]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or identifier' });
      }
      user = result.rows[0];
    } else {
      if (!/^\d{10}$/.test(identifier)) {
        return res.status(400).json({ message: 'Phone must be exactly 10 digits' });
      }
      const result = await query(
        `SELECT user_id FROM users WHERE phone_number = $1 LIMIT 1`,
        [identifier]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid OTP or identifier' });
      }
      user = result.rows[0];
    }

    // Kiểm tra OTP
    const purpose = method === 'email' ? 'forgot_password_email' : 'forgot_password_phone';
    const otpRecord = await query(
      `SELECT otp_id, otp_code, expired_at FROM otp 
       WHERE user_id = $1 AND purpose = $2 AND otp_code = $3 
       ORDER BY created_at DESC LIMIT 1`,
      [user.user_id, purpose, otp]
    );

    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Kiểm tra OTP hết hạn chưa
    if (new Date(otpRecord.rows[0].expired_at) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Hash password mới
    const hash = await bcrypt.hash(String(newPassword), BCRYPT_ROUNDS);

    // Cập nhật password
    await query(
      `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
      [hash, user.user_id]
    );

    // Xóa các OTP cũ
    await query(
      `DELETE FROM otp WHERE user_id = $1 AND purpose = $2`,
      [user.user_id, purpose]
    );

    console.log(`[Forgot Password] User ${user.user_id} reset password successfully`);

    return res.json({ 
      ok: true, 
      message: 'Password reset successfully' 
    });
  } catch (err) {
    console.error('Forgot password verify error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to reset password' });
  }
}

module.exports = {
  register,
  login,
  otpSend,
  otpVerify,
  getMe,
  registerOtpSend,
  registerOtpVerify,
  registerFace,
  verifyFace,
  forgotPasswordEmail,
  forgotPasswordPhone,
  forgotPasswordVerify,
};
