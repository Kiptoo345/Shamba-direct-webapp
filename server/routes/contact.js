const express = require('express');
const router = express.Router();
const db = require('../db');

// POST Submit Contact Inquiry
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.status(201).json({ message: 'Inquiry submitted successfully', messageId: result.insertId });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

module.exports = router;