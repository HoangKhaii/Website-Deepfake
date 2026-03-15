const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const detectRoutes = require('./routes/detect.route');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', detectRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AI Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Gateway running at http://localhost:${PORT}`);
  console.log(`   Forwarding to AI server at ${process.env.AI_SERVER || 'http://26.54.212.200:8000'}`);
});