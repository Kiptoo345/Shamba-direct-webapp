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


module.exports = router;
