const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/orders  (SELECT — filterable by farmerId or buyerId for dashboards)
router.get('/', async (req, res) => {
  const { farmerId, buyerId, status } = req.query;
  const clauses = [];
  const params = [];
  if (farmerId) { clauses.push('o.farmer_id = ?'); params.push(farmerId); }
  if (buyerId) { clauses.push('o.buyer_id = ?'); params.push(buyerId); }
  if (status) { clauses.push('o.status = ?'); params.push(status); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    // Buyer contact + delivery details are joined in here so a farmer's
    // dashboard can show exactly who ordered and how to reach/deliver to
    // them, without exposing this on any public/read-only endpoint.
    const [orders] = await db.query(
      `SELECT o.*, p.name AS product_name,
              buyer.full_name AS buyer_name, buyer.phone_number AS buyer_phone, buyer.county AS buyer_county,
              cp.company_name AS buyer_company_name, cp.delivery_address AS buyer_delivery_address,
              farmer.full_name AS farmer_name
       FROM orders o
       JOIN products p ON p.id = o.product_id
       JOIN users buyer ON buyer.id = o.buyer_id
       JOIN users farmer ON farmer.id = o.farmer_id
       LEFT JOIN company_profiles cp ON cp.user_id = buyer.id
       ${where}
       ORDER BY o.created_at DESC`,
      params
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders  (INSERT — buyer places an order against a listing)
router.post('/', async (req, res) => {
  const { productId, buyerId, quantityKg } = req.body;
  if (!productId || !buyerId || !quantityKg) {
    return res.status(400).json({ error: 'productId, buyerId and quantityKg are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[product]] = await connection.query('SELECT farmer_id, price_per_kg, quantity_kg FROM products WHERE id = ?', [productId]);
    if (!product) {
      await connection.rollback();
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (Number(quantityKg) > Number(product.quantity_kg)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Requested quantity exceeds what is available' });
    }

    const totalPrice = Number(product.price_per_kg) * Number(quantityKg);

    const [result] = await connection.query(
      `INSERT INTO orders (product_id, buyer_id, farmer_id, quantity_kg, total_price, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [productId, buyerId, product.farmer_id, quantityKg, totalPrice]
    );

    await connection.query(
      'UPDATE products SET quantity_kg = quantity_kg - ? WHERE id = ?',
      [quantityKg, productId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', id: result.insertId, totalPrice });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    connection.release();
  }
});

// PUT /api/orders/:id  (UPDATE — confirm / mark delivered / cancel)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id  (DELETE — cancel/remove an order record)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
