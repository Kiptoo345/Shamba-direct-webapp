const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Never send these fields back to the client
const PRIVATE_FARMER_FIELDS = ['national_id'];

function stripPrivateFields(user) {
  const clean = { ...user };
  delete clean.password_hash;
  PRIVATE_FARMER_FIELDS.forEach((f) => delete clean[f]);
  return clean;
}

// -----------------------------------------------------------------------
// POST /api/auth/register  (INSERT users [+ farmer_profiles/company_profiles])
// -----------------------------------------------------------------------
router.post('/register', async (req, res) => {
  const {
    role, // 'farmer' | 'buyer'
    fullName,
    email,
    phoneNumber,
    password,
    county,
    // farmer-only
    farmSize,
    nationalId,
    mainCrops,
    // buyer-only
    companyName,
    kraPin,
    businessType,
    productsNeeded,
    deliveryAddress
  } = req.body;

  if (!fullName || !phoneNumber || !password || !role) {
    return res.status(400).json({ error: 'fullName, phoneNumber, password and role are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, role, county)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email || null, phoneNumber, passwordHash, role, county || null]
    );
    const userId = result.insertId;

    if (role === 'farmer') {
      await connection.query(
        `INSERT INTO farmer_profiles (user_id, farm_size, national_id, main_crops)
         VALUES (?, ?, ?, ?)`,
        [userId, farmSize || null, nationalId || null, mainCrops || null]
      );
    } else if (role === 'buyer') {
      await connection.query(
        `INSERT INTO company_profiles (user_id, company_name, kra_pin, business_type, products_needed, delivery_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, companyName || fullName, kraPin || null, businessType || null, productsNeeded || null, deliveryAddress || null]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with that phone number or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
});

// -----------------------------------------------------------------------
// POST /api/auth/login  (SELECT users)
// -----------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password) {
    return res.status(400).json({ error: 'phoneNumber and password are required' });
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let profile = null;
    if (user.role === 'farmer') {
      const [rows] = await db.query('SELECT farm_size, main_crops FROM farmer_profiles WHERE user_id = ?', [user.id]);
      profile = rows[0] || null;
    } else if (user.role === 'buyer') {
      const [rows] = await db.query('SELECT company_name, business_type, delivery_address FROM company_profiles WHERE user_id = ?', [user.id]);
      profile = rows[0] || null;
    }

    res.json({ message: 'Login successful', user: { ...stripPrivateFields(user), profile } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// -----------------------------------------------------------------------
// PUT /api/auth/users/:id  (UPDATE users [+ profile table])
// -----------------------------------------------------------------------
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, county, farmSize, mainCrops, businessType, deliveryAddress } = req.body;

  try {
    await db.query(
      `UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), county = COALESCE(?, county)
       WHERE id = ?`,
      [fullName || null, email || null, county || null, id]
    );

    const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (user && user.role === 'farmer') {
      await db.query(
        `UPDATE farmer_profiles SET farm_size = COALESCE(?, farm_size), main_crops = COALESCE(?, main_crops)
         WHERE user_id = ?`,
        [farmSize || null, mainCrops || null, id]
      );
    } else if (user && user.role === 'buyer') {
      await db.query(
        `UPDATE company_profiles SET business_type = COALESCE(?, business_type), delivery_address = COALESCE(?, delivery_address)
         WHERE user_id = ?`,
        [businessType || null, deliveryAddress || null, id]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// -----------------------------------------------------------------------
// DELETE /api/auth/users/:id  (DELETE users — cascades to profile rows)
// -----------------------------------------------------------------------
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
