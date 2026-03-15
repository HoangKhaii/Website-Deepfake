const axios = require('axios');
const FormData = require('form-data');

const GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:5001/api';

/**
 * Chuyển base64 data URL (từ frontend) thành Buffer
 */
function base64ToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

/**
 * Gọi ai-gateway kiểm tra liveness (mặt thật vs ảnh)
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ isReal: boolean }>}
 */
async function checkLiveness(imageBuffer) {
  const formData = new FormData();
  formData.append('image', imageBuffer, { filename: 'face.jpg', contentType: 'image/jpeg' });
  const res = await axios.post(`${GATEWAY_URL}/liveness`, formData, {
    headers: formData.getHeaders(),
    timeout: 15000,
  });
  const data = res.data || {};
  return { isReal: data.isReal === true };
}

/**
 * Gọi ai-gateway so sánh hai ảnh khuôn mặt
 * @param {Buffer} image1Buffer - ảnh đã lưu
 * @param {Buffer} image2Buffer - ảnh mới chụp
 * @returns {Promise<{ match: boolean }>}
 */
async function compareFaces(image1Buffer, image2Buffer) {
  const formData = new FormData();
  formData.append('image1', image1Buffer, { filename: 'stored.jpg', contentType: 'image/jpeg' });
  formData.append('image2', image2Buffer, { filename: 'current.jpg', contentType: 'image/jpeg' });
  const res = await axios.post(`${GATEWAY_URL}/compare-faces`, formData, {
    headers: formData.getHeaders(),
    timeout: 15000,
  });
  const data = res.data || {};
  return { match: data.match === true };
}

module.exports = {
  base64ToBuffer,
  checkLiveness,
  compareFaces,
};
