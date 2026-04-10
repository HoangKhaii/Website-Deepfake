/** Chỉ trả về trường an toàn cho client (Interface segregation) */
function toSafeUser(row) {
  if (!row) return null;
  const { password_hash, face_enroll_hash, ...rest } = row;
  return rest;
}

module.exports = { toSafeUser };
