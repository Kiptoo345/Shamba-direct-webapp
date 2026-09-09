const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/headquarters  (SELECT — used by the SettleIn downstream integration)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM headquarters ORDER BY region_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching headquarters:', error);
    res.status(500).json({ error: 'Failed to fetch headquarters' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM headquarters WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Headquarters not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching headquarters:', error);
    res.status(500).json({ error: 'Failed to fetch headquarters' });
  }
});

// POST /api/headquarters  (INSERT — admin adds a new hub)
router.post('/', async (req, res) => {
  const { regionName, county, address, latitude, longitude } = req.body;
  if (!regionName || !county) {
    return res.status(400).json({ error: 'regionName and county are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO headquarters (region_name, county, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [regionName, county, address || null, latitude || null, longitude || null]
    );
    res.status(201).json({ message: 'Headquarters added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding headquarters:', error);
    res.status(500).json({ error: 'Failed to add headquarters' });
  }
});

// PUT /api/headquarters/:id  (UPDATE)
router.put('/:id', async (req, res) => {
  const { regionName, county, address, latitude, longitude } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE headquarters SET
         region_name = COALESCE(?, region_name),
         county = COALESCE(?, county),
         address = COALESCE(?, address),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude)
       WHERE id = ?`,
      [regionName || null, county || null, address || null, latitude || null, longitude || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Headquarters not found' });
    res.json({ message: 'Headquarters updated successfully' });
  } catch (error) {
    console.error('Error updating headquarters:', error);
    res.status(500).json({ error: 'Failed to update headquarters' });
  }
});

// DELETE /api/headquarters/:id  (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM headquarters WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Headquarters not found' });
    res.json({ message: 'Headquarters deleted successfully' });
  } catch (error) {
    console.error('Error deleting headquarters:', error);
    res.status(500).json({ error: 'Failed to delete headquarters' });
  }
});

module.exports = router;
