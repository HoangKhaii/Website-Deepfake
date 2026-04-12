const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const root = __dirname;
dotenv.config({ path: path.join(root, '.env') });
const envLocal = path.join(root, '.env.local');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal, override: true });
}

const express = require('express');
const cors = require('cors');
const predictRoutes = require('./routes/predict.route');
const { SILENT_FACE_SERVER, PREDICT_URL } = require('./config/antiSpoofEndpoints');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use('/api', predictRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'antilogin-gateway ok',
    forwardsTo: SILENT_FACE_SERVER,
    predictPath: '/api/predict',
    upstreamPredict: PREDICT_URL,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(56));
  console.log(`antilogin-gateway → http://0.0.0.0:${PORT}`);
  console.log(`  POST /api/predict  (multipart field: file)`);
  console.log(`  → Silent-Face API at ${PREDICT_URL}`);
  console.log(`  Health: GET /health`);
  console.log('='.repeat(56));
});
