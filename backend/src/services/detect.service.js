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
const FormData = require('form-data');
const { axiosClient } = require('../lib/http/axiosClient');

/** Giữ status + detail từ ai-gateway / FastAPI khi axios nhận lỗi HTTP. */
function toGatewayAxiosError(error, label) {
  if (error.response) {
    const { status, data } = error.response;
    const detailStr =
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.error === 'string'
          ? data.error
          : null;
    const msg = detailStr || `${label}: HTTP ${status}`;
    const err = new Error(msg);
    err.statusCode = status;
    err.upstreamBody = data && typeof data === 'object' ? data : { detail: data };
    return err;
  }
  const err = new Error(`${label}: ${error.message}`);
  err.statusCode = 502;
  return err;
}

// --- deepfake_ai: ai-gateway (chỉ upload ảnh/video + so khớp mặt khi FACE_COMPARE_MODE=gateway) ---
const GATEWAY_URL = process.env.AI_GATEWAY_DETECT_URL || 'http://26.54.212.200:5001/api/detect';
const GATEWAY_COMPARE_URL =
  process.env.AI_GATEWAY_COMPARE_URL || 'http://26.54.212.200:5001/api/compare-faces';

// --- upload_ai: upload-ai-gateway (5002) — chỉ fusion upload landing ---
const UPLOAD_AI_PREDICT_URL =
  process.env.UPLOAD_AI_PREDICT_URL || 'http://26.54.212.200:5002/api/predict';

/**
 * Đăng ký / đăng nhập mặt — Silent-Face qua antilogin-gateway (multipart `file` → POST /api/predict).
 * Gọi thẳng FastAPI: ANTI_SPOOF_PREDICT_URL=http://host:8010/predict
 */
const ANTI_SPOOF_PREDICT_URL = (
  process.env.ANTI_SPOOF_PREDICT_URL ||
  process.env.ANTILOGIN_GATEWAY_PREDICT_URL ||
  'http://26.54.212.200:5003/api/predict'
).trim();

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

    const isVideo = String(mimetype || '').startsWith('video/');
    const timeoutMs = isVideo ? 300000 : 15000;

    const response = await axiosClient.post(GATEWAY_URL, formData, {
      headers: formData.getHeaders(),
      timeout: timeoutMs,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw toGatewayAxiosError({ response }, 'AI detection failed');
  } catch (error) {
    console.error('❌ AI gateway error:', error.message);
    throw toGatewayAxiosError(error, 'AI detection failed');
  }
}

/**
 * Ảnh hoặc video — gọi FastAPI upload_ai (dùng song song với gateway deepfake cho fusion landing).
 */
async function callUploadAIMedia(mediaBuffer, filename, mimetype) {
  try {
    const formData = new FormData();
    formData.append('file', mediaBuffer, {
      filename,
      contentType: mimetype || 'application/octet-stream',
    });

    const isVideo = String(mimetype || '').startsWith('video/');
    const timeoutMs = isVideo ? 300000 : 120000;

    const response = await axiosClient.post(UPLOAD_AI_PREDICT_URL, formData, {
      headers: formData.getHeaders(),
      timeout: timeoutMs,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw toGatewayAxiosError({ response }, 'Upload AI detection failed');
  } catch (error) {
    console.error('❌ upload_ai (FastAPI) error:', error.message);
    throw toGatewayAxiosError(error, 'Upload AI detection failed');
  }
}

/**
 * Gửi 2 ảnh khuôn mặt lên ai-gateway để so sánh (cùng người hay không)
 * @param {Buffer} image1Buffer - Ảnh 1 (vd: mặt đã lưu trong DB)
 * @param {Buffer} image2Buffer - Ảnh 2 (vd: mặt vừa quét khi đăng nhập)
 * @returns {Promise<{ match: boolean }>}
 */
async function callAIFaceCompare(image1Buffer, image2Buffer) {
  try {
    const formData = new FormData();
    formData.append('image1', image1Buffer, { filename: 'face1.jpg', contentType: 'image/jpeg' });
    formData.append('image2', image2Buffer, { filename: 'face2.jpg', contentType: 'image/jpeg' });

    const response = await axiosClient.post(GATEWAY_COMPARE_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw toGatewayAxiosError({ response }, 'Face compare failed');
  } catch (error) {
    console.error('❌ AI compare faces error:', error.message);
    throw toGatewayAxiosError(error, 'Face compare failed');
  }
}

/**
 * Silent-Face-Anti-Spoofing (PAD) — bắt buộc cho đăng ký/đăng nhập mặt.
 * @returns {Promise<object>}
 */
async function callAntiSpoofPredict(buffer, filename, mimetype) {
  try {
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: filename || 'frame.jpg',
      contentType: mimetype || 'image/jpeg',
    });
    const response = await axiosClient.post(ANTI_SPOOF_PREDICT_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 25000,
    });
    if (response.status >= 200 && response.status < 300) return response.data;
    throw toGatewayAxiosError({ response }, 'Anti-spoof failed');
  } catch (error) {
    console.error('❌ Anti-spoof API:', error.message);
    throw toGatewayAxiosError(error, 'Anti-spoof failed');
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
  callAIDetection,
  callUploadAIMedia,
  callAIFaceCompare,
  callAntiSpoofPredict,
};