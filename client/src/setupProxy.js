const path = require('path');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config({ path: path.resolve(__dirname, '../../server/.env'), override: true });

const apiKey = process.env.API_KEY_TEAM;
if (!apiKey) {
  throw new Error('Set API_KEY_TEAM in server/.env before starting the React development server.');
}

module.exports = (app) => {
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('X-API-Key', apiKey);
    }
  }));
};
