const { query } = require('../config/db');

async function findUserByEmail(email) {
  const normalized = String(email || '').trim();
  if (!normalized) return null;
  const { rows } = await query(
    `SELECT user_id, email, face_image, face_enroll_hash, full_name, role, status, created_at, last_login
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [normalized]
  );
  return rows?.[0] || null;
}

async function updateUserFace(userId, faceImagePath, enrollHash) {
  await query(
    `UPDATE users
     SET face_image = $1,
         face_enroll_hash = $2,
         status = 'active'
     WHERE user_id = $3`,
    [faceImagePath, enrollHash, userId]
  );
}

async function activateUserIfPendingFace(userId) {
  await query(`UPDATE users SET status = 'active' WHERE user_id = $1`, [userId]);
}

module.exports = {
  findUserByEmail,
  updateUserFace,
  activateUserIfPendingFace,
};

