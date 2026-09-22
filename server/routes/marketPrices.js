const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/market-prices  (SELECT — scheduled price feed)
router.get('/', async (req, res) => {
  const { county } = req.query;
  try {
    const [rows] = county
      ? await db.query('SELECT crop_name, price_per_kg, county FROM market_prices WHERE county = ? ORDER BY crop_name', [county])
      : await db.query('SELECT crop_name, price_per_kg, county FROM market_prices ORDER BY crop_name');

    const shaped = rows.map(row => ({
      crop_name: row.crop_name,
      price_per_kg: parseInt(row.price_per_kg),
      county: row.county
    }));

    res.status(200).json(shaped);

    
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

module.exports = router;
