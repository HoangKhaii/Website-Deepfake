const express = require('express');
const multer = require('multer');
const aiService = require('../services/ai.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    console.error('Error in detect endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/** Kiểm tra mặt thật (liveness): real vs ảnh chụp */
router.post('/liveness', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const { buffer, originalname, mimetype } = req.file;
    const result = await aiService.checkLiveness(buffer, originalname, mimetype);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in liveness endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/** So sánh hai ảnh khuôn mặt (stored vs current) */
router.post('/compare-faces', upload.fields([{ name: 'image1' }, { name: 'image2' }]), async (req, res) => {
  try {
    if (!req.files?.image1?.[0] || !req.files?.image2?.[0]) {
      return res.status(400).json({ error: 'Need both image1 and image2' });
    }
    const f1 = req.files.image1[0];
    const f2 = req.files.image2[0];
    const result = await aiService.compareFaces(f1.buffer, f2.buffer, f1.originalname, f2.originalname);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in compare-faces endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
