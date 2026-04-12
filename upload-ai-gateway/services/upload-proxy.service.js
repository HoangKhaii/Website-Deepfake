const axios = require('axios');
const FormData = require('form-data');
const {
  UPLOAD_AI_SERVER,
  PREDICT_URL,
  REQUEST_TIMEOUT_IMAGE_MS,
  REQUEST_TIMEOUT_VIDEO_MS,
} = require('../config/uploadEndpoints');

/**
 * Forward multipart file tới upload_ai (cùng API với predict.py — field "file")
 */
async function forwardPredict(buffer, filename, mimetype) {
  const formData = new FormData();
  formData.append('file', buffer, {
    filename: filename || 'upload.bin',
    contentType: mimetype || 'application/octet-stream',
  });

  const isVideo = String(mimetype || '').startsWith('video/');
  const timeoutMs = isVideo ? REQUEST_TIMEOUT_VIDEO_MS : REQUEST_TIMEOUT_IMAGE_MS;

  const response = await axios.post(PREDICT_URL, formData, {
    headers: formData.getHeaders(),
    timeout: timeoutMs,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

module.exports = {
  forwardPredict,
  PREDICT_URL,
  UPLOAD_AI_SERVER,
};
