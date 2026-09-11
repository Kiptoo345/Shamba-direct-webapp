const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/ratings?farmerId=  (SELECT + aggregate average for dashboard)
// GET /api/ratings?buyerId=   (SELECT — used by the buyer dashboard to know
//                               which of their delivered orders are already rated)
router.get('/', async (req, res) => {
  const { farmerId, buyerId } = req.query;
  try {
    if (farmerId) {
      const [rows] = await db.query(
        `SELECT fr.*, u.full_name AS farmer_name 
        FROM farmer_ratings fr 
        JOIN users u ON fr.farmer_id = u.id 
        WHERE fr.farmer_id = ? 
        ORDER BY fr.created_at DESC`,
        [farmerId]);
      const [[agg]] = await db.query(
        'SELECT ROUND(AVG(rating),1) AS average_rating, COUNT(*) AS review_count FROM farmer_ratings WHERE farmer_id = ?',
        [farmerId]
      );
      return res.json({ ratings: rows, averageRating: agg.average_rating || 0, reviewCount: agg.review_count });
    }
    if (buyerId) {
      const [rows] = await db.query('SELECT * FROM farmer_ratings WHERE buyer_id = ? ORDER BY created_at DESC', [buyerId]);
      return res.json(rows);
    }
    const [rows] = await db.query('SELECT * FROM farmer_ratings ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// POST /api/ratings  (INSERT — buyer rates a farmer after delivery)
router.post('/', async (req, res) => {
  const { farmerId, buyerId, orderId, rating, reviewText } = req.body;
  if (!farmerId || !buyerId || !rating) {
    return res.status(400).json({ error: 'farmerId, buyerId and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO farmer_ratings (farmer_id, buyer_id, order_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [farmerId, buyerId, orderId || null, rating, reviewText || null]
    );
    res.status(201).json({ message: 'Rating submitted successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// DELETE /api/ratings/:id  (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM farmer_ratings WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Rating not found' });
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

module.exports = router;
