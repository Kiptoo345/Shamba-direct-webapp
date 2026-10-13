const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();

// Middleware
app.use(cors()); // Allows the React frontend to communicate with this backend
app.use(express.json()); // Parses incoming JSON payloads

// If a caller sends no body, or forgets `Content-Type: application/json`,
// Express 5 leaves req.body undefined and the route handlers would crash on
// destructuring (-> HTML 500). Default it to {} so the handlers' own
// "<field> is required" validation answers with a JSON 400 instead.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
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
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// -----------------------------------------------------------------------
// Error handling — every failure is JSON shaped { "error": "<message>" }
// (documented in README.md "Error format" and the Error schema in
// openapi.yaml). Without these two handlers Express answers unknown routes
// and malformed JSON with an HTML page that includes a stack trace.
// -----------------------------------------------------------------------

// Unknown route
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Anything thrown/passed to next(err) — e.g. body-parser rejecting bad JSON
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
