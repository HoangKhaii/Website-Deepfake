const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

const PLACEHOLDER_IDS = ['', 'your-google-client-id', 'your-google-client-secret'];
const BCRYPT_ROUNDS = 10;
const GOOGLE_PENDING_TTL_MS = 30 * 60 * 1000;
const pendingGoogleStore = new Map(); // email -> { googleId, full_name, createdAt, expiresAt }

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function setPendingGoogleProfile(email, payload) {
  const normalized = normalizeEmail(email);
  const now = Date.now();
  pendingGoogleStore.set(normalized, {
    ...payload,
    email: normalized,
    createdAt: payload?.createdAt || new Date(now).toISOString(),
    expiresAt: new Date(now + GOOGLE_PENDING_TTL_MS).toISOString(),
  });
}

function getPendingGoogleProfile(email) {
  const normalized = normalizeEmail(email);
  const draft = pendingGoogleStore.get(normalized);
  if (!draft) return null;
  if (new Date(draft.expiresAt).getTime() < Date.now()) {
    pendingGoogleStore.delete(normalized);
    return null;
  }
  return draft;
}

function clearPendingGoogleProfile(email) {
  pendingGoogleStore.delete(normalizeEmail(email));
}
function isPlaceholder(val) {
  return !val || PLACEHOLDER_IDS.some((p) => String(val).trim() === p);
}
/** 是否已配置有效的 Google OAuth 凭据（非 .env 占位符） */
function isGoogleAuthConfigured() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return !isPlaceholder(id) && !isPlaceholder(secret);
}

function toSafeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

async function initializeGoogleAuth(passport) {
  if (!isGoogleAuthConfigured()) {
    console.warn(
      '[Google OAuth] 未配置：请在 .env 中填写真实的 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET，并在 Google Cloud Console 创建 OAuth 2.0 凭据。'
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const fallbackName = [profile.name?.givenName, profile.name?.familyName]
            .filter(Boolean)
            .join(' ')
            .trim();
          const name = profile.displayName || fallbackName || null;

          if (!email) {
            return done(new Error('No email found from Google account'));
          }

          // Check if user exists
          let { rows } = await query(
            `SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1`,
            [googleId, email.toLowerCase()]
          );

          let user = rows[0];

          if (!user) {
            // Chưa lưu DB: chỉ tạo bản nháp Google, chờ FaceScan thành công mới tạo user.
            setPendingGoogleProfile(email, {
              googleId,
              full_name: name,
            });
            return done(null, {
              user_id: null,
              email: normalizeEmail(email),
              full_name: name,
              role: 'user',
              status: 'pending_face',
              pending_google: true,
            });
          } else if (!user.google_id) {
            // User exists but not linked to Google, link them
            await query(
              `UPDATE users SET google_id = $1 WHERE user_id = $2`,
              [googleId, user.user_id]
            );
            user.google_id = googleId;
          }

          // Bất kể đăng nhập bằng Google, nếu chưa có ảnh mặt thì buộc đi qua FaceScan trước.
          if (!user.face_image && user.status !== 'pending_face') {
            const { rows: statusRows } = await query(
              `UPDATE users SET status = 'pending_face' WHERE user_id = $1 RETURNING *`,
              [user.user_id]
            );
            user = statusRows[0] || user;
          }

          return done(null, toSafeUser(user));
        } catch (err) {
          console.error('Google Auth error:', err);
          return done(err);
        }
      }
    )
  );

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await query(
        `SELECT * FROM users WHERE user_id = $1 LIMIT 1`,
        [id]
      );
      done(null, rows[0] ? toSafeUser(rows[0]) : null);
    } catch (err) {
      done(err);
    }
  });
}

// Generate JWT token for Google-authenticated user
function generateTokenForUser(user) {
  const payload = { email: user.email };
  if (user.user_id) payload.userId = user.user_id;
  if (user.pending_google) payload.pendingGoogle = true;
  const expiresIn = user.pending_google ? '30m' : '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = {
  initializeGoogleAuth,
  generateTokenForUser,
  isGoogleAuthConfigured,
  getPendingGoogleProfile,
  clearPendingGoogleProfile,
};
