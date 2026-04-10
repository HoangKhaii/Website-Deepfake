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
const { UPLOAD_AI_SERVER, PREDICT_URL } = require('./config/uploadEndpoints');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.use('/api', predictRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'upload-ai-gateway ok',
    forwardsTo: UPLOAD_AI_SERVER,
    predictPath: '/api/predict',
    upstreamPredict: PREDICT_URL,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(56));
  console.log(`upload-ai-gateway → http://0.0.0.0:${PORT}`);
  console.log(`  POST /api/predict  (multipart field: file)`);
  console.log(`  → FastAPI upload_ai at ${UPLOAD_AI_SERVER}`);
  console.log(`  Health: GET /health`);
  console.log('='.repeat(56));
});
