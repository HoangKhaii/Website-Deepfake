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

module.exports = router;
