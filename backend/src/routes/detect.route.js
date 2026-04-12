const express = require('express');
const {
  handleDetectVideo,
  handleDetectImage,
  handleUploadAiFusion,
  handleUploadFile,
  uploadVideo,
  uploadImage,
  upload,
} = require('../controllers/detect.controller');

const router = express.Router();

// deepfake_ai (gateway) — có thể dùng khi bạn gọi trực tiếp từ tool/test; login mặt dùng auth + gateway trong auth.controller
router.post('/detect', uploadVideo, handleDetectVideo);
router.post('/detect-image', uploadImage, handleDetectImage);

// Landing: một endpoint upload — field "file" (image/* hoặc video/*), fusion 2 model
router.post('/upload-ai/detect', upload.single('file'), handleUploadAiFusion);

router.post('/upload', upload.single('file'), handleUploadFile);

module.exports = router;

