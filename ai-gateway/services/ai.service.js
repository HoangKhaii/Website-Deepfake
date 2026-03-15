const axios = require('axios');
const FormData = require('form-data');

const AI_SERVER = process.env.AI_SERVER || 'http://26.54.212.200:8000';
const AI_PREDICT_URL = `${AI_SERVER}/api/v1/predict`;

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

module.exports = {
  callAIDetection
};