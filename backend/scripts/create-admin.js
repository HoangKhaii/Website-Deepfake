/**
 * Tạo tài khoản admin trong PostgreSQL.
 * Chạy: node scripts/create-admin.js
 * Mặc định: email=admindeepfake, password=@Admin123
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const bcrypt = require('bcrypt');
const { query } = require('../db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admindeepfake';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@Admin123';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await query(
    `INSERT INTO users (username, email, password_hash, role, full_name, status)
     VALUES ($1, $2, $3, 'admin', 'Admin', 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = 'admin'`,
    [ADMIN_EMAIL, ADMIN_EMAIL, hash]
  );
  console.log('Admin user created/updated:', ADMIN_EMAIL);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
