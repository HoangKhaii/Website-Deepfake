const express = require('express');
const {
  handleDetectVideo,
  handleDetectImage,
  handleUploadFile,
  uploadVideo,
  uploadImage,
  upload,
} = require('../controllers/detect.controller');

const router = express.Router();

router.post('/detect', uploadVideo, handleDetectVideo);
router.post('/detect-image', uploadImage, handleDetectImage);
router.post('/upload', upload.single('file'), handleUploadFile);

module.exports = router;

