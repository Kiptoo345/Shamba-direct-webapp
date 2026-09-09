const express = require('express');
const router = express.Router();
const db = require('../db');

<<<<<<< HEAD
// POST /api/contact  (INSERT — "About & Contact" page form)
router.post('/', async (req, res) => {
  const { name, contactInfo, subject, message } = req.body;
  if (!name || !contactInfo || !message) {
    return res.status(400).json({ error: 'name, contactInfo and message are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, contact_info, subject, message) VALUES (?, ?, ?, ?)',
      [name, contactInfo, subject || null, message]
=======
// POST Submit Contact Inquiry
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
>>>>>>> ec6d04e132ccdf0a9c96429713bd9eaedb8075a1
    );
    res.status(201).json({ message: 'Inquiry submitted successfully', messageId: result.insertId });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

<<<<<<< HEAD
// GET /api/contact  (SELECT — admin inbox view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE /api/contact/:id  (DELETE — admin clears a handled message)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
=======
module.exports = router;
>>>>>>> ec6d04e132ccdf0a9c96429713bd9eaedb8075a1
