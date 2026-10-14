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

router.post('/', async (req, res) => {
  const { farmerId, buyerId, orderId, rating, reviewText } = req.body;
  if (farmerId === undefined || buyerId === undefined || rating === undefined) {
    return res.status(400).json({ error: 'farmerId, buyerId and rating are required' });
  }
  if (!Number.isInteger(Number(farmerId)) || Number(farmerId) < 1
    || !Number.isInteger(Number(buyerId)) || Number(buyerId) < 1
    || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ error: 'farmerId and buyerId must be positive integers and rating must be an integer between 1 and 5' });
  }
  if (orderId !== undefined && (!Number.isInteger(Number(orderId)) || Number(orderId) < 1)) {
    return res.status(400).json({ error: 'orderId must be a positive integer' });
  }
  if (reviewText !== undefined && (typeof reviewText !== 'string' || reviewText.length > 500)) {
    return res.status(400).json({ error: 'reviewText must be a string of at most 500 characters' });
  }

  try {
    const [users] = await db.query(
      "SELECT id, role FROM users WHERE id IN (?, ?) ",
      [farmerId, buyerId]
    );
    const farmer = users.find(user => user.id === Number(farmerId) && user.role === 'farmer');
    const buyer = users.find(user => user.id === Number(buyerId) && user.role === 'buyer');
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });

    if (orderId !== undefined) {
      const [[order]] = await db.query(
        'SELECT farmer_id, buyer_id, status FROM orders WHERE id = ?',
        [orderId]
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.farmer_id !== Number(farmerId) || order.buyer_id !== Number(buyerId)) {
        return res.status(400).json({ error: 'orderId must belong to the specified farmer and buyer' });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({ error: 'Ratings can only be submitted for delivered orders' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO farmer_ratings (farmer_id, buyer_id, order_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [farmerId, buyerId, orderId || null, rating, reviewText ? reviewText.trim() : null]
    );
    res.status(201).json({ message: 'Rating submitted successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id)) || Number(id) < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
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
