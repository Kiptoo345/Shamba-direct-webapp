const express = require('express');
const router = express.Router();
const db = require('../db');

// -----------------------------------------------------------------------
// GET /api/products  (SELECT — supports optional filters used by the
// Marketplace and Dashboard pages)
// -----------------------------------------------------------------------
router.get('/', async (req, res) => {
  const { county, category, farmerId, status, minQuantity } = req.query;
  const clauses = [];
  const params = [];

  if (county) { clauses.push('p.county = ?'); params.push(county); }
  if (category) { clauses.push('p.category = ?'); params.push(category); }
  if (farmerId) { clauses.push('p.farmer_id = ?'); params.push(farmerId); }
  if (status) { clauses.push('p.status = ?'); params.push(status); }
  if (minQuantity) { clauses.push('p.quantity_kg >= ?'); params.push(minQuantity); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const [products] = await db.query(
      `SELECT p.*, u.full_name AS farmer_name, u.is_verified AS farmer_verified
       FROM products p
       JOIN users u ON u.id = p.farmer_id
       ${where}
       ORDER BY p.created_at DESC`,
      params
    );
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// -----------------------------------------------------------------------
// GET /api/products/:id  (SELECT single + increments view count)
// -----------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE products SET views = views + 1 WHERE id = ?', [id]);
    const [rows] = await db.query(
      `SELECT p.*, u.full_name AS farmer_name, u.is_verified AS farmer_verified
       FROM products p JOIN users u ON u.id = p.farmer_id WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// -----------------------------------------------------------------------
// POST /api/products  (INSERT — "Post New Produce" on the Dashboard)
// -----------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { farmerId, name, category, pricePerKg, quantityKg, county, harvestNote, imageEmoji, status } = req.body;

  if (!farmerId || !name || !pricePerKg || !quantityKg) {
    return res.status(400).json({ error: 'farmerId, name, pricePerKg and quantityKg are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products (farmer_id, name, category, price_per_kg, quantity_kg, county, harvest_note, image_emoji, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, name, category || null, pricePerKg, quantityKg, county || null, harvestNote || null, imageEmoji || '🌾', status || 'pending_review']
    );
    res.status(201).json({ message: 'Listing created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add listing' });
  }
});

// -----------------------------------------------------------------------
// PUT /api/products/:id  (UPDATE — edit price/quantity/status of a listing)
// -----------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, pricePerKg, quantityKg, county, harvestNote, status } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE products SET
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         price_per_kg = COALESCE(?, price_per_kg),
         quantity_kg = COALESCE(?, quantity_kg),
         county = COALESCE(?, county),
         harvest_note = COALESCE(?, harvest_note),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [name || null, category || null, pricePerKg || null, quantityKg || null, county || null, harvestNote || null, status || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// -----------------------------------------------------------------------
// DELETE /api/products/:id  (DELETE — remove a listing)
// -----------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
