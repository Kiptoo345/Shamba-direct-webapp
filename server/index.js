const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows frontend (React or HTML/JS) to communicate with this backend
app.use(express.json()); // Parses incoming JSON payloads

// Health Check Route
app.get('/', (req, res) => {
  res.send('Shamba Direct API is running...');
});
// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});