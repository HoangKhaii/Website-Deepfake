const express = require('express');
const multer = require('multer');
const aiService = require('../services/ai.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploadTwo = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
]);

router.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { buffer, originalname, mimetype } = req.file;

    const aiResult = await aiService.callAIDetection(
      buffer,
      originalname,
      mimetype
    );

    res.json({
      success: true,
      ...aiResult
    });
  } catch (error) {
    console.error('Error in detect endpoint:', error.message);
    const code = error.statusCode || 500;
    const body = error.upstream || { detail: error.message };
    res.status(code).json(body);
  }
});

router.post('/compare-faces', uploadTwo, async (req, res) => {
  try {
    const f1 = req.files?.image1?.[0];
    const f2 = req.files?.image2?.[0];
    if (!f1 || !f2) {
      return res.status(400).json({ error: 'Need both image1 and image2' });
    }

    const result = await aiService.callAICompareFaces(f1.buffer, f2.buffer);
    const payload = result && typeof result === 'object' ? result : {};
    res.json({
      success: true,
      match: payload.match === true,
      score: typeof payload.score === 'number' ? payload.score : undefined,
      threshold: typeof payload.threshold === 'number' ? payload.threshold : undefined,
      model: payload.model,
    });
  } catch (error) {
    console.error('Error in compare-faces endpoint:', error.message);
    const code = error.statusCode || 500;
    const body = error.upstream || { detail: error.message };
    res.status(code).json(body);
  }
});

module.exports = router;
