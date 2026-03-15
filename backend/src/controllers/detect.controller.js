const path = require('path');
const fs = require('fs');
const { insertUploadedFileMeta, uploadVideo, uploadImage, upload, callAIDetection } = require('../services/detect.service');

async function handleDetectVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "video"' });
    }
    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: req.body.user_id || req.body.userId || null,
    };
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (video):', dbErr?.message);
    }

    // Gọi AI Gateway để phát hiện deepfake
    let aiResult = { isDeepfake: false, score: 0.5 };
    try {
      const buffer = fs.readFileSync(req.file.path);
      aiResult = await callAIDetection(buffer, req.file.originalname, req.file.mimetype);

      // Transform AI response về format chuẩn cho frontend
      // AI có thể trả về: { class, confidence, probabilities, ... }
      if (aiResult.class) {
        const confidence = aiResult.confidence || aiResult.probabilities?.[aiResult.class] || 0.5;
        aiResult = {
          isDeepfake: aiResult.class.toLowerCase().includes('fake') ||
                      aiResult.class.toLowerCase().includes('deepfake') ||
                      aiResult.class === 'fake',
          score: confidence,
          probabilities: aiResult.probabilities,
          class: aiResult.class
        };
      }
    } catch (aiErr) {
      console.warn('AI detection skip (video):', aiErr?.message);
    }

    return res.json(aiResult);
  } catch (err) {
    console.error('Detect (video) error:', err);
    return res.status(500).json({ message: err?.message || 'Detection failed' });
  }
}

async function handleDetectImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file field "image"' });
    }
    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: req.body.user_id || req.body.userId || null,
    };
    try {
      await insertUploadedFileMeta(fileMeta);
    } catch (dbErr) {
      console.warn('DB insert skip (image):', dbErr?.message);
    }

    // Gọi AI Gateway để phát hiện deepfake
    let aiResult = { isDeepfake: false, score: 0.5 };
    try {
      const buffer = fs.readFileSync(req.file.path);
      aiResult = await callAIDetection(buffer, req.file.originalname, req.file.mimetype);

      // Transform AI response về format chuẩn cho frontend
      // AI có thể trả về: { class, confidence, probabilities, ... }
      if (aiResult.class) {
        const confidence = aiResult.confidence || aiResult.probabilities?.[aiResult.class] || 0.5;
        aiResult = {
          isDeepfake: aiResult.class.toLowerCase().includes('fake') ||
                      aiResult.class.toLowerCase().includes('deepfake') ||
                      aiResult.class === 'fake',
          score: confidence,
          probabilities: aiResult.probabilities,
          class: aiResult.class
        };
      }
    } catch (aiErr) {
      console.warn('AI detection skip (image):', aiErr?.message);
    }

    return res.json(aiResult);
  } catch (err) {
    console.error('Detect (image) error:', err);
    return res.status(500).json({ message: err?.message || 'Detection failed' });
  }
}

async function handleUploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Missing file field "file"' });
    }

    const userId =
      req.body.user_id ||
      req.body.userId ||
      req.body.userID ||
      null;

    const fileMeta = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      relativePath: path.relative(process.cwd(), req.file.path),
      absolutePath: req.file.path,
      userId: userId ? String(userId) : null,
    };

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
  handleUploadFile,
  uploadVideo,
  uploadImage,
  upload,
};

