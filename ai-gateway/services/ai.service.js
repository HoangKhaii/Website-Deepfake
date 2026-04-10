const axios = require('axios');
const FormData = require('form-data');
const { AI_PREDICT_URL, AI_COMPARE_URL, REQUEST_TIMEOUT_MS } = require('../config/aiEndpoints');

/**
 * Giữ nguyên status + body từ FastAPI (422 detail, 400, v.v.) thay vì luôn 500.
 */
function toUpstreamError(error, fallbackLabel) {
  if (error.response) {
    const { status, data } = error.response;
    const err = new Error(
      typeof data?.detail === 'string'
        ? data.detail
        : typeof data?.message === 'string'
          ? data.message
          : error.message || fallbackLabel
    );
    err.statusCode = status;
    err.upstream = data && typeof data === 'object' ? data : { detail: data };
    return err;
  }
  const err = new Error(error.message || fallbackLabel);
  err.statusCode = 502;
  err.upstream = { detail: err.message };
  return err;
}

async function callAIDetection(imageBuffer, filename, mimetype) {
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename,
      contentType: mimetype,
    });

    const isVideo = String(mimetype || '').startsWith('video/');
    const timeoutMs = isVideo ? 300000 : REQUEST_TIMEOUT_MS;

    const response = await axios.post(AI_PREDICT_URL, formData, {
      headers: formData.getHeaders(),
      timeout: timeoutMs,
    });

    return response.data;
  } catch (error) {
    console.error('❌ AI service error:', error.message);
    throw toUpstreamError(error, 'AI detection failed');
  }
}

async function callAICompareFaces(image1Buffer, image2Buffer) {
  try {
    const formData = new FormData();
    formData.append('image1', image1Buffer, { filename: 'face1.jpg', contentType: 'image/jpeg' });
    formData.append('image2', image2Buffer, { filename: 'face2.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(AI_COMPARE_URL, formData, {
      headers: formData.getHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
    });

    return response.data;
  } catch (error) {
    console.error('❌ AI compare-faces failed:', error.message);
    throw toUpstreamError(error, 'Face compare upstream failed');
  }
}

module.exports = {
  callAIDetection,
  callAICompareFaces,
};
