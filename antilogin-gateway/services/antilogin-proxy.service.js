const axios = require('axios');
const FormData = require('form-data');
const {
  SILENT_FACE_SERVER,
  PREDICT_URL,
  REQUEST_TIMEOUT_MS,
} = require('../config/antiSpoofEndpoints');

/**
 * Forward multipart file → POST /predict (field "file") giống api/app.py
 */
async function forwardPredict(buffer, filename, mimetype) {
  const formData = new FormData();
  formData.append('file', buffer, {
    filename: filename || 'frame.jpg',
    contentType: mimetype || 'image/jpeg',
  });

  const response = await axios.post(PREDICT_URL, formData, {
    headers: formData.getHeaders(),
    timeout: REQUEST_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

module.exports = {
  forwardPredict,
  PREDICT_URL,
  SILENT_FACE_SERVER,
};
