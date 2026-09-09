const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
<<<<<<< HEAD
app.use(cors()); // Allows the React frontend to communicate with this backend
=======
app.use(cors()); // Allows frontend (React or HTML/JS) to communicate with this backend
>>>>>>> ec6d04e132ccdf0a9c96429713bd9eaedb8075a1
app.use(express.json()); // Parses incoming JSON payloads

// Health Check Route
app.get('/', (req, res) => {
  res.send('Shamba Direct API is running...');
});
<<<<<<< HEAD

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const enquiryRoutes = require('./routes/enquiries');
const contactRoutes = require('./routes/contact');
const ratingRoutes = require('./routes/ratings');
const headquartersRoutes = require('./routes/headquarters');
const marketPriceRoutes = require('./routes/marketPrices');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/headquarters', headquartersRoutes);
app.use('/api/market-prices', marketPriceRoutes);

=======
// Routes
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
>>>>>>> ec6d04e132ccdf0a9c96429713bd9eaedb8075a1
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
<<<<<<< HEAD
});
=======
});
>>>>>>> ec6d04e132ccdf0a9c96429713bd9eaedb8075a1
