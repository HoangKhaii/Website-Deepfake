const express = require('express');
const multer = require('multer');
const uploadProxy = require('../services/upload-proxy.service');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

/**
 * POST /api/predict — multipart field "file" (giống FastAPI upload_ai)
 */
router.post('/predict', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'Missing file field "file"' });
    }

    const data = await uploadProxy.forwardPredict(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    return res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    const payload = error.response?.data || { detail: error.message || 'Proxy error' };
    console.error('[upload-ai-gateway] forward error:', error.message);
    return res.status(status).json(
      typeof payload === 'object' ? payload : { detail: String(payload) }
    );
  }
});

module.exports = router;
