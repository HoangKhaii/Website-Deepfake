const http = require('http');
const https = require('https');
const axios = require('axios');

/**
 * Shared axios instance with keep-alive.
 * - Reuses TCP connections to gateways/FastAPI → lower latency, higher throughput.
 * - Central place to tune timeouts, headers, interceptors later.
 */
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  timeout: 60_000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  timeout: 60_000,
});

const axiosClient = axios.create({
  httpAgent,
  httpsAgent,
  // Do not set a global timeout; per-request timeouts differ (video vs image).
  // timeout: 0,
  validateStatus: () => true,
});

module.exports = { axiosClient };

