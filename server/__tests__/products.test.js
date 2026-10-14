const request = require('supertest');
const app = require('../app');
const db = require('../db');

let farmerId;
let productFixtureId;
const createdProductIds = [];

beforeAll(async () => {
  const [[farmer]] = await db.query("SELECT id FROM users WHERE role = 'farmer' ORDER BY id LIMIT 1");
  farmerId = farmer.id;
  const [result] = await db.query(
    `INSERT INTO products (farmer_id, name, price_per_kg, quantity_kg)
     VALUES (?, 'API contract test product', 1, 1)`,
    [farmerId]
  );
  productFixtureId = result.insertId;
  createdProductIds.push(productFixtureId);
});

afterAll(async () => {
  for (const id of createdProductIds) {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
  }
  await db.end();
});

describe('GET /api/products', () => {
  it('happy path: returns an array of products with the documented shape', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Strong assertion: check actual field names/types, not just "a response came back"
    const first = res.body[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('price_per_kg');
    expect(first).toHaveProperty('farmer_name');
    expect(typeof first.name).toBe('string');
  });

  it('edge case: a filter matching nothing returns an empty array, not an error', async () => {
    const res = await request(app).get('/api/products').query({ county: 'Nowhereland' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 for a product that does not exist', async () => {
    const res = await request(app).get('/api/products/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: returns the full product for a known id', async () => {
    const res = await request(app).get(`/api/products/${productFixtureId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', productFixtureId);
    expect(res.body).toHaveProperty('farmer_name');
    expect(res.body).toHaveProperty('farmer_verified');
    expect(typeof res.body.price_per_kg).toBe('string');
  });
});

describe('POST /api/products', () => {
  it('validation rejection: missing required fields returns 400', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Incomplete Listing' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: creates a listing and returns its new id', async () => {
    const res = await request(app).post('/api/products').send({
      farmerId,
      name: 'Test Kale Batch',
      category: 'Vegetables',
      pricePerKg: 20,
      quantityKg: 100,
      county: 'Kirinyaga'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('number');
    createdProductIds.push(res.body.id);

    // Follow up: the created listing is actually retrievable and correct
    const getRes = await request(app).get(`/api/products/${res.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Test Kale Batch');
    expect(Number(getRes.body.price_per_kg)).toBe(20);
  });
});

describe('PUT /api/products/:id', () => {
  let createdId;
  beforeAll(async () => {
    const res = await request(app).post('/api/products').send({
      farmerId, name: 'Editable Listing', pricePerKg: 10, quantityKg: 50
    });
    createdId = res.body.id;
    createdProductIds.push(createdId);
  });

  it('happy path: updates only the fields provided', async () => {
    const res = await request(app).put(`/api/products/${createdId}`).send({ pricePerKg: 15 });
    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/products/${createdId}`);
    expect(Number(getRes.body.price_per_kg)).toBe(15);
    expect(getRes.body.name).toBe('Editable Listing'); // untouched field preserved
  });

  it('returns 404 when updating a product that does not exist', async () => {
    const res = await request(app).put('/api/products/999999').send({ pricePerKg: 15 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/products/:id', () => {
  it('happy path: deletes a listing, and it is then really gone', async () => {
    const createRes = await request(app).post('/api/products').send({
      farmerId, name: 'Disposable Listing', pricePerKg: 5, quantityKg: 10
    });
    const id = createRes.body.id;
    createdProductIds.push(id);

    const delRes = await request(app).delete(`/api/products/${id}`);
    createdProductIds.splice(createdProductIds.indexOf(id), 1);
    expect(delRes.status).toBe(200);

    const getRes = await request(app).get(`/api/products/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 when deleting a product that does not exist', async () => {
    const res = await request(app).delete('/api/products/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
