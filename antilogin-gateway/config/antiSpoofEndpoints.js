const RAW_SERVER = process.env.SILENT_FACE_ANTI_SPOOF_URL || 'http://26.54.212.200:8010';
const SILENT_FACE_SERVER = RAW_SERVER.replace(/\/+$/, '');
const PREDICT_URL = `${SILENT_FACE_SERVER}/predict`;
const REQUEST_TIMEOUT_MS = Number(process.env.ANTILOGIN_TIMEOUT_MS || 30000);

module.exports = {
  SILENT_FACE_SERVER,
  PREDICT_URL,
  REQUEST_TIMEOUT_MS,
};
