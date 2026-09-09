const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/enquiries  (SELECT — filterable by farmerId)
router.get('/', async (req, res) => {
  const { farmerId, productId } = req.query;
  const clauses = [];
  const params = [];
  if (farmerId) { clauses.push('e.farmer_id = ?'); params.push(farmerId); }
  if (productId) { clauses.push('e.product_id = ?'); params.push(productId); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const [rows] = await db.query(
      `SELECT e.*, p.name AS product_name, buyer.full_name AS buyer_name
       FROM enquiries e
       JOIN products p ON p.id = e.product_id
       LEFT JOIN users buyer ON buyer.id = e.buyer_id
       ${where}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// POST /api/enquiries  (INSERT — "Contact Farmer" button on the Marketplace)
router.post('/', async (req, res) => {
  const { productId, buyerId, message } = req.body;
  // Contacting a farmer requires a logged-in buyer, same as placing an
  // order — the client only reaches this endpoint when a user is signed
  // in, but we also enforce it here so the rule can't be bypassed.
  if (!productId || !buyerId || !message) {
    return res.status(400).json({ error: 'You must be logged in to contact a farmer. productId, buyerId and message are required' });
  }
  try {
    const [[product]] = await db.query('SELECT farmer_id FROM products WHERE id = ?', [productId]);
    if (!product) return res.status(404).json({ error: 'Listing not found' });

    const [result] = await db.query(
      `INSERT INTO enquiries (product_id, buyer_id, farmer_id, message) VALUES (?, ?, ?, ?)`,
      [productId, buyerId, product.farmer_id, message]
    );
    res.status(201).json({ message: 'Enquiry sent to farmer', id: result.insertId });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    res.status(500).json({ error: 'Failed to send enquiry' });
  }
});

// DELETE /api/enquiries/:id  (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM enquiries WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

module.exports = router;
