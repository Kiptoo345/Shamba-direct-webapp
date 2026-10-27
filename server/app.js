const express = require('express');
const cors = require('cors');
const { timingSafeEqual } = require('node:crypto');
require('dotenv').config();

const db = require('./db');

const app = express();
const rateLimitBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Middleware
app.use(cors()); // Allows the React frontend to communicate with this backend
app.use(express.json());

// Keep body validation errors JSON shaped for requests without a JSON body.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

app.use('/api', (req, res, next) => {
  const apiKeys = Object.entries(process.env)
    .filter(([name, value]) => /^API_KEY_[A-Z0-9_]+$/.test(name) && value)
    .map(([name, value]) => ({ consumer: name.slice('API_KEY_'.length), value }));
  const providedKey = Buffer.from(req.get('X-API-Key') || '');
  const matchedKey = apiKeys.find(({ value }) => {
    const expectedKey = Buffer.from(value);
    return providedKey.length === expectedKey.length
      && timingSafeEqual(providedKey, expectedKey);
  });

  if (!matchedKey) {
    return res.status(401).json({ error: 'A valid X-API-Key header is required' });
  }

  const partnerReadOnlyRoutes = [
    /^\/listings(?:\/\d+)?$/,
    /^\/market-prices$/,
    /^\/farmers\/ratings$/,
    /^\/farmers\/\d+\/rating$/,
    /^\/headquarters(?:\/\d+)?$/
  ];
  if (matchedKey.consumer === 'RING_PARTNER'
    && (req.method !== 'GET' || !partnerReadOnlyRoutes.some((route) => route.test(req.path)))) {
    return res.status(403).json({ error: 'This API key is read-only and limited to partner data' });
  }

  const limit = Number(process.env.API_RATE_LIMIT_MAX || 100);
  if (!Number.isInteger(limit) || limit < 1) {
    console.error('API_RATE_LIMIT_MAX must be a positive integer');
    return res.status(500).json({ error: 'API rate limit configuration is invalid' });
  }

  const now = Date.now();
  const existingBucket = rateLimitBuckets.get(matchedKey.consumer);
  const bucket = !existingBucket || existingBucket.resetAt <= now
    ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    : existingBucket;

  if (bucket.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
  }

  bucket.count += 1;
  rateLimitBuckets.set(matchedKey.consumer, bucket);
  next();
});

// Health Check Route
app.get('/', (req, res) => {
  res.send('Shamba Direct API is running...');
});

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const enquiryRoutes = require('./routes/enquiries');
const contactRoutes = require('./routes/contact');
const ratingRoutes = require('./routes/ratings');
const headquartersRoutes = require('./routes/headquarters');
const marketPriceRoutes = require('./routes/marketPrices');
const farmerRoutes = require('./routes/farmers');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/listings', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/headquarters', headquartersRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/farmers', farmerRoutes);

// Test Database Connection Route
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Database connected successfully!', data: rows });
  } catch (error) {
    console.error('Database connection error:', error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Unknown route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// NOTE: no app.listen() here on purpose. This file only builds and exports
// the Express app so that Week 7's automated tests (supertest) can import
// it directly (`require('../app')`) and send requests to it in-process,
// without needing a real server bound to a real port. Starting the server
// is now index.js's job.
module.exports = app;
