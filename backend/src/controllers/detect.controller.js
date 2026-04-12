const fs = require('fs');
const fsp = require('fs/promises');
const {
  insertUploadedFileMeta,
  uploadVideo,
  uploadImage,
  upload,
  callAIDetection,
  callUploadAIMedia,
} = require('../services/detect.service');
const { normalizeDetectPayload } = require('../utils/detectPayload');
const { buildUploadedFileMeta } = require('../utils/uploadFileMeta');

/**
 * Kết hợp deepfake_ai + upload_ai: chỉ REAL khi cả hai REAL; một model FAKE → FAKE.
 */
function fuseDualDetectResults(deepRaw, uploadRaw) {
  const d = normalizeDetectPayload(deepRaw, 'deepfake_ai');
  const u = normalizeDetectPayload(uploadRaw, 'upload_ai');
  const finalFake = Boolean(d.isDeepfake || u.isDeepfake);
  let score;
  if (finalFake) {
    const df = d.isDeepfake ? d.score || 0 : 0;
    const uf = u.isDeepfake ? u.score || 0 : 0;
    score = Math.max(df, uf);
  } else {
    score = Math.min(d.score || 0.5, u.score || 0.5);
  }
  return {
    isDeepfake: finalFake,
    score,
    class: finalFake ? 'fake' : 'real',
    source: 'dual_fusion',
    fusion_rule: 'both_real_required_either_fake',
    media_type: u.media_type ?? d.media_type,
    frames_used: u.frames_used ?? d.frames_used,
    models: { deepfake_ai: d, upload_ai: u },
  };
}

function isSingleFaceRequiredError(err) {
  const msg = String(err?.message || '').toLowerCase();
  const detail = String(err?.upstreamBody?.detail || '').toLowerCase();
  const combined = `${msg} ${detail}`;
  if (
    err?.statusCode === 422 &&
    (combined.includes('face') || combined.includes('mediapipe'))
  ) {
    return true;
  }
  return (
    msg.includes('exactly one face') ||
    msg.includes('one face') ||
    msg.includes('status code 422') ||
    msg.includes('mediapipe')
  );
}

/** POST /detect — video: chỉ deepfake_ai (gateway). */
async function handleDetectVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "video"' });
    }
    const fileMeta = buildUploadedFileMeta(req.file, req.body);
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (video):', dbErr?.message);
    }

    let aiResult = { isDeepfake: false, score: 0.5 };
    try {
      const buffer = Buffer.isBuffer(req.file.buffer)
        ? req.file.buffer
        : await fsp.readFile(req.file.path);
      const raw = await callAIDetection(buffer, req.file.originalname, req.file.mimetype);
      aiResult = raw.class ? normalizeDetectPayload(raw, 'deepfake_ai') : raw;
    } catch (aiErr) {
      console.warn('AI detection skip (video):', aiErr?.message);
    }

    return res.json(aiResult);
  } catch (err) {
    console.error('Detect (video) error:', err);
    return res.status(500).json({ message: err?.message || 'Detection failed' });
  }
}

/** POST /detect-image — ảnh: chỉ deepfake_ai (gateway). */
async function handleDetectImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "image"' });
    }
    const fileMeta = buildUploadedFileMeta(req.file, req.body);
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (image):', dbErr?.message);
    }

    let aiResult = { isDeepfake: false, score: 0.5 };
    try {
      const buffer = Buffer.isBuffer(req.file.buffer)
        ? req.file.buffer
        : await fsp.readFile(req.file.path);
      const raw = await callAIDetection(buffer, req.file.originalname, req.file.mimetype);
      aiResult = raw.class ? normalizeDetectPayload(raw, 'deepfake_ai') : raw;
    } catch (aiErr) {
      console.warn('AI detection skip (image):', aiErr?.message);
    }

    return res.json(aiResult);
  } catch (err) {
    console.error('Detect (image) error:', err);
    return res.status(500).json({ message: err?.message || 'Detection failed' });
  }
}

/**
 * POST /upload-ai/detect — field "file" (ảnh hoặc video), fusion deepfake_ai + upload_ai.
 */
async function handleUploadAiFusion(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "file"' });
    }
    const mime = String(req.file.mimetype || '');
    if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
      return res.status(400).json({ message: 'File must be an image or video' });
    }

    const fileMeta = buildUploadedFileMeta(req.file, req.body);
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (upload-ai fusion):', dbErr?.message);
    }

    try {
      const buffer = Buffer.isBuffer(req.file.buffer)
        ? req.file.buffer
        : await fsp.readFile(req.file.path);
      const [deepRaw, uploadRaw] = await Promise.all([
        callAIDetection(buffer, req.file.originalname, req.file.mimetype),
        callUploadAIMedia(buffer, req.file.originalname, req.file.mimetype),
      ]);
      if (!deepRaw?.class || !uploadRaw?.class) {
        return res.status(502).json({ message: 'Dual detection: invalid response from one or both models' });
      }
      const aiResult = fuseDualDetectResults(deepRaw, uploadRaw);
      return res.json(aiResult);
    } catch (aiErr) {
      console.error('Dual upload detect failed:', aiErr?.message);
      if (mime.startsWith('image/') && isSingleFaceRequiredError(aiErr)) {
        return res.status(400).json({
          message:
            'The image must show exactly one clear face (no multiple faces or none detected). Please upload a different photo.',
        });
      }
      return res.status(502).json({
        message: aiErr?.message || 'Dual detection failed (deepfake_ai + upload_ai)',
      });
    }
  } catch (err) {
    console.error('upload-ai fusion error:', err);
    return res.status(500).json({ message: err?.message || 'Detection failed' });
  }
}

async function handleUploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Missing file field "file"' });
    }

    const fileMeta = buildUploadedFileMeta(req.file, req.body, { coerceUserIdString: true });
    const dbRecord = await insertUploadedFileMeta(fileMeta);

    return res.status(201).json({
      ok: true,
      file: fileMeta,
      db: dbRecord,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Upload failed' });
  }
}

module.exports = {
  handleDetectVideo,
  handleDetectImage,
  handleUploadAiFusion,
  handleUploadFile,
  uploadVideo,
  uploadImage,
  upload,
};
