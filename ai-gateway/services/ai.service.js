const axios = require('axios');
const FormData = require('form-data');

const AI_SERVER = process.env.AI_SERVER || 'http://26.54.212.200:8000';
const AI_PREDICT_URL = `${AI_SERVER}/api/v1/predict`;
const AI_COMPARE_URL = process.env.AI_COMPARE_URL || `${AI_SERVER}/api/v1/compare_faces`;

/**
 * Gửi file ảnh lên AI server
 */
async function callAIDetection(imageBuffer, filename, mimetype) {
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename,
      contentType: mimetype
    });

    const response = await axios.post(AI_PREDICT_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    console.error('❌ AI service error:', error.message);
    throw new Error(`AI detection failed: ${error.message}`);
  }
}

/**
 * Kiểm tra liveness: mặt thật (real) hay ảnh (fake/photo).
 * Gọi predict, nếu class là real → isReal: true.
 */
async function checkLiveness(imageBuffer, filename, mimetype) {
  try {
    const data = await callAIDetection(imageBuffer, filename, mimetype);
    const cls = (data.class || data.label || '').toLowerCase();
    const isReal = cls === 'real' || cls === 'live' || cls === 'human' || (!cls.includes('fake') && !cls.includes('photo') && (data.confidence || 0) > 0.5);
    return { isReal, class: data.class, confidence: data.confidence };
  } catch (error) {
    console.error('❌ Liveness check error:', error.message);
    throw new Error(`Liveness check failed: ${error.message}`);
  }
}

/**
 * So sánh hai ảnh khuôn mặt (ảnh đã lưu vs ảnh mới). AI server cần endpoint nhận 2 file.
 */
async function compareFaces(image1Buffer, image2Buffer, filename1, filename2) {
  try {
    const formData = new FormData();
    formData.append('image1', image1Buffer, { filename: filename1 || 'stored.jpg', contentType: 'image/jpeg' });
    formData.append('image2', image2Buffer, { filename: filename2 || 'current.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(AI_COMPARE_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 15000
    });

    const data = response.data || {};
    const match = data.match === true || data.same_person === true || (typeof data.similarity === 'number' && data.similarity >= 0.7);
    return { match, similarity: data.similarity };
  } catch (error) {
    console.error('❌ Compare faces error:', error.message);
    return { match: false };
  }
}

module.exports = {
  callAIDetection,
  checkLiveness,
  compareFaces
};