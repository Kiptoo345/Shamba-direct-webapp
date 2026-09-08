const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products (for Marketplace/Dashboard)
router.get('/', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST a new product (for Adding Inventory)
router.post('/', async (req, res) => {
  const { name, price, quantity, category } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (name, price, quantity, category) VALUES (?, ?, ?, ?)',
      [name, price, quantity, category]
    );
    res.status(201).json({ message: 'Product added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

module.exports = router;