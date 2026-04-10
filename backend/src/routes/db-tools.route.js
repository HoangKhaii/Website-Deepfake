const express = require('express');
const {
  dbTime,
  listTables,
  describeTableSchema,
  sampleTableRows,
} = require('../controllers/db-tools.controller');
const { query } = require('../config/db');

const router = express.Router();

router.get('/db/time', dbTime);
router.get('/db/tables', listTables);
router.get('/db/table/:table/schema', describeTableSchema);
router.get('/db/table/:table/sample', sampleTableRows);

// Migration: Add google_id column
router.post('/db/migrate/google-id', async (req, res) => {
  try {
    // Check if google_id column exists
    const checkResult = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'google_id'
    `);
    if (checkResult.rows.length > 0) {
      return res.json({ ok: true, message: 'Column google_id already exists' });
    }
    // Add google_id column
    await query(`
      ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE
    `);
    return res.json({ ok: true, message: 'Column google_id added successfully' });
  } catch (err) {
    console.error('Add google_id column error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to add column' });
  }
});

// Migration: Add purpose column to otp table
router.post('/db/migrate/otp-purpose', async (req, res) => {
  try {
    const checkResult = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'otp' AND column_name = 'purpose'
    `);
    if (checkResult.rows.length > 0) {
      return res.json({ ok: true, message: 'Column purpose already exists' });
    }
    await query(`
      ALTER TABLE otp ADD COLUMN purpose VARCHAR(50) DEFAULT 'login'
    `);
    return res.json({ ok: true, message: 'Column purpose added successfully' });
  } catch (err) {
    console.error('Add purpose column error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to add column' });
  }
});

// Migration: Add face_image column to users table
router.post('/db/migrate/face-image', async (req, res) => {
  try {
    const checkResult = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'face_image'
    `);
    if (checkResult.rows.length > 0) {
      return res.json({ ok: true, message: 'Column face_image already exists' });
    }
    await query(`
      ALTER TABLE users ADD COLUMN face_image TEXT
    `);
    return res.json({ ok: true, message: 'Column face_image added successfully' });
  } catch (err) {
    console.error('Add face_image column error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to add column' });
  }
});

router.post('/db/migrate/face-enroll-hash', async (req, res) => {
  try {
    const checkResult = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'face_enroll_hash'
    `);
    if (checkResult.rows.length > 0) {
      return res.json({ ok: true, message: 'Column face_enroll_hash already exists' });
    }
    await query(`ALTER TABLE users ADD COLUMN face_enroll_hash TEXT`);
    return res.json({ ok: true, message: 'Column face_enroll_hash added successfully' });
  } catch (err) {
    console.error('Add face_enroll_hash column error:', err);
    return res.status(500).json({ message: err?.message || 'Failed to add column' });
  }
});

module.exports = router;

