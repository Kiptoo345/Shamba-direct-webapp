const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/market-prices  (SELECT — scheduled price feed)
router.get('/', async (req, res) => {
  const { county } = req.query;
  try {
    const [rows] = county
      ? await db.query('SELECT * FROM market_prices WHERE county = ? ORDER BY crop_name', [county])
      : await db.query('SELECT * FROM market_prices ORDER BY crop_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

// POST /api/market-prices  (INSERT — admin/pipeline adds a price point)
router.post('/', async (req, res) => {
  const { cropName, pricePerKg, county } = req.body;
  if (!cropName || !pricePerKg) {
    return res.status(400).json({ error: 'cropName and pricePerKg are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO market_prices (crop_name, price_per_kg, county) VALUES (?, ?, ?)',
      [cropName, pricePerKg, county || null]
    );
    res.status(201).json({ message: 'Market price added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding market price:', error);
    res.status(500).json({ error: 'Failed to add market price' });
  }
});

// PUT /api/market-prices/:id  (UPDATE — scheduled pipeline refresh)
router.put('/:id', async (req, res) => {
  const { pricePerKg } = req.body;
  if (!pricePerKg) return res.status(400).json({ error: 'pricePerKg is required' });
  try {
    const [result] = await db.query('UPDATE market_prices SET price_per_kg = ? WHERE id = ?', [pricePerKg, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Price entry not found' });
    res.json({ message: 'Market price updated successfully' });
  } catch (error) {
    console.error('Error updating market price:', error);
    res.status(500).json({ error: 'Failed to update market price' });
  }
});

// DELETE /api/market-prices/:id  (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM market_prices WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Price entry not found' });
    res.json({ message: 'Market price deleted successfully' });
  } catch (error) {
    console.error('Error deleting market price:', error);
    res.status(500).json({ error: 'Failed to delete market price' });
  }
});

module.exports = router;
