const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/farmers/ratings
router.get('/ratings', async (req, res) => {
  const { county } = req.query;

  try {
    const [rows] = county
      ? await db.query(
          `SELECT
             u.id AS farmer_id,
             u.full_name AS farmer_name,
             ROUND(AVG(fr.rating), 1) AS rating
           FROM farmer_ratings fr
           JOIN users u ON fr.farmer_id = u.id
           WHERE u.role = 'farmer'
             AND u.is_verified = 1
             AND u.county = ?
           GROUP BY u.id, u.full_name
           ORDER BY u.id`,
          [county]
        )
      : await db.query(
          `SELECT
             u.id AS farmer_id,
             u.full_name AS farmer_name,
             ROUND(AVG(fr.rating), 1) AS rating
           FROM farmer_ratings fr
           JOIN users u ON fr.farmer_id = u.id
           WHERE u.role = 'farmer'
             AND u.is_verified = 1
           GROUP BY u.id, u.full_name
           ORDER BY u.id`
        );

    const shaped = rows.map(row => ({
      farmer_id: parseInt(row.farmer_id),
      farmer_name: row.farmer_name,
      rating: parseFloat(row.rating || 0)
    }));

    res.status(200).json(shaped);

  } catch (error) {
    console.error('Error fetching farmer ratings:', error);
    res.status(500).json({
      error: 'Failed to fetch farmer ratings'
    });
  }
});

// GET /api/farmers/:farmer_id/rating
router.get('/:farmer_id/rating', async (req, res) => {
    const { farmer_id } = req.params;

    try {
        // Check that the farmer exists
        const [farmers] = await db.query(
            `SELECT id, full_name
             FROM users
             WHERE id = ?
               AND role = 'farmer'
               AND is_verified = 1`,
            [farmer_id]
        );

        if (farmers.length === 0) {
            return res.status(404).json({
                error: 'Farmer not found'
            });
        }

        const farmer = farmers[0];

        // Calculate the farmer's average rating
        const [[result]] = await db.query(
            `SELECT ROUND(AVG(rating), 1) AS rating
             FROM farmer_ratings
             WHERE farmer_id = ?`,
            [farmer_id]
        );

        const response = [{
            farmer_id: Number(farmer.id),
            farmer_name: farmer.full_name,
            rating: Number(result.rating || 0)
        }];

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching farmer rating:', error);

        res.status(500).json({
            error: 'Failed to fetch farmer rating'
        });
    }
});


module.exports = router;