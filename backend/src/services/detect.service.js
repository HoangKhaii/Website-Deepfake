const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../config/db');
const {
  quoteIdent,
  ensurePublicTable,
  getPublicTableColumns,
} = require('../utils/pg-utils');

// ===================== PHẦN MỚI: GỌI AI GATEWAY =====================
const axios = require('axios');
const FormData = require('form-data');

// URL của ai-gateway (chạy cùng máy backend, cổng 5001)
const GATEWAY_URL = 'http://localhost:5001/api/detect';

/**
 * Gửi ảnh lên ai-gateway, gateway sẽ chuyển tiếp đến máy AI
 * @param {Buffer} imageBuffer - Dữ liệu ảnh (buffer)
 * @param {string} filename - Tên file gốc
 * @param {string} mimetype - Loại MIME
 * @returns {Promise<Object>} - Kết quả từ AI (class, confidence, probabilities,...)
 */
async function callAIDetection(imageBuffer, filename, mimetype) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename,
      contentType: mimetype,
    });

    const response = await axios.post(GATEWAY_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000, // 15 giây
    });

    return response.data;
  } catch (error) {
    console.error('❌ Lỗi gọi AI gateway:', error.message);
    throw new Error(`AI detection failed: ${error.message}`);
  }
}
// ===================== KẾT THÚC PHẦN MỚI =====================

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginal = Buffer.from(file.originalname, 'utf8')
      .toString('base64')
      .replace(/[/+=]/g, '');
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${timestamp}-${safeOriginal.slice(0, 16)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const uploadVideo = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('video');
const uploadImage = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('image');

async function insertUploadedFileMeta(meta) {
  const table = 'uploaded_files';

  const exists = await ensurePublicTable(table);
  if (!exists) {
    console.warn(`Table "${table}" does not exist, skipping metadata insert.`);
    return null;
  }
  if (!meta.userId) {
    return null;
  }

  const columns = await getPublicTableColumns(table);
  const available = new Set(columns.map((c) => c.column_name));

  const mappings = [
    {
      metaKey: 'originalName',
      aliases: ['original_name', 'originalFilename', 'original_file_name'],
    },
    {
      metaKey: 'storedName',
      aliases: ['stored_name', 'filename', 'file_name'],
    },
    {
      metaKey: 'mimeType',
      aliases: ['mime_type', 'content_type', 'file_type'],
    },
    {
      metaKey: 'size',
      aliases: ['size', 'file_size'],
    },
    {
      metaKey: 'relativePath',
      aliases: ['file_path', 'path', 'storage_path', 'relative_path'],
    },
    {
      metaKey: 'userId',
      aliases: ['user_id', 'owner_id'],
    },
  ];

  const insertCols = [];
  const values = [];

  for (const m of mappings) {
    const value = meta[m.metaKey];
    if (value === undefined || value === null) continue;

    const col = m.aliases.find((name) => available.has(name));
    if (!col) continue;

    insertCols.push(quoteIdent(col));
    values.push(value);
  }

  if (insertCols.length === 0) {
    console.warn(`No matching columns found in "${table}" for provided metadata.`);
    return null;
  }

  const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
  const sql = `INSERT INTO ${quoteIdent(table)} (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

  try {
    const { rows } = await query(sql, values);
    return rows?.[0] || null;
  } catch (err) {
    console.error('Failed to insert into uploaded_files:', err);
    return null;
  }
}

module.exports = {
  upload,
  uploadVideo,
  uploadImage,
  insertUploadedFileMeta,
  callAIDetection, // 👈 thêm export hàm mới
};