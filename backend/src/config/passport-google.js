const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

const PLACEHOLDER_IDS = ['', 'your-google-client-id', 'your-google-client-secret'];
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
          const name = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName;

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
            // Create new user
            const username = email.split('@')[0] + '_' + Date.now().toString(36);
            const { rows: newRows } = await query(
              `INSERT INTO users (username, email, google_id, full_name, role, status)
               VALUES ($1, $2, $3, $4, 'user', 'active')
               RETURNING *`,
              [username, email.toLowerCase(), googleId, name || null]
            );
            user = newRows[0];
          } else if (!user.google_id) {
            // User exists but not linked to Google, link them
            await query(
              `UPDATE users SET google_id = $1 WHERE user_id = $2`,
              [googleId, user.user_id]
            );
            user.google_id = googleId;
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
  return jwt.sign(
    { userId: user.user_id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  initializeGoogleAuth,
  generateTokenForUser,
  isGoogleAuthConfigured,
};
