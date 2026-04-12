/** Cấu hình endpoint upstream — tách khỏi service (SRP / DIP). */
const AI_SERVER = process.env.AI_SERVER || 'http://26.54.212.200:8000';

module.exports = {
  AI_SERVER,
  AI_PREDICT_URL: `${AI_SERVER}/api/v1/predict`,
  AI_COMPARE_URL: `${AI_SERVER}/api/v1/compare-faces`,
  REQUEST_TIMEOUT_MS: 15000,
};
