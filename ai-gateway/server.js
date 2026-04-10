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
const detectRoutes = require('./routes/detect.route');
const { AI_SERVER } = require('./config/aiEndpoints');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api', detectRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AI Gateway is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Gateway running at http://0.0.0.0:${PORT}`);
  console.log(`   Forwarding to AI server at ${AI_SERVER}`);
});
