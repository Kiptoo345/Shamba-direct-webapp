const request = require('supertest');
const app = require('../app');
const db = require('../db');

afterAll(async () => { await db.end(); });

const BUYER_ID = 3; // seeded buyer, Nairobi Provisions Ltd
let productId;

beforeAll(async () => {
  const res = await request(app).post('/api/products').send({
    farmerId: 1, name: 'Order Test Batch', pricePerKg: 10, quantityKg: 100
  });
  productId = res.body.id;
});

describe('POST /api/orders', () => {
  it('validation rejection: missing fields returns 400', async () => {
    const res = await request(app).post('/api/orders').send({ productId });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for an order placed against a listing that does not exist', async () => {
    const res = await request(app).post('/api/orders').send({ productId: 999999, buyerId: BUYER_ID, quantityKg: 5 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('edge case: requesting more than is available is rejected, not silently capped', async () => {
    const res = await request(app).post('/api/orders').send({ productId, buyerId: BUYER_ID, quantityKg: 100000 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('edge case: a zero quantity is rejected with a message that actually mentions quantity (regression test)', async () => {
    const res = await request(app).post('/api/orders').send({ productId, buyerId: BUYER_ID, quantityKg: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.toLowerCase()).toContain('quantity');
  });

  it('happy path: places an order and computes totalPrice correctly (10/kg x 4kg = 40)', async () => {
    const res = await request(app).post('/api/orders').send({ productId, buyerId: BUYER_ID, quantityKg: 4 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.totalPrice).toBe(40); // strong assertion: actual computed value, not just "a number"
  });
});

describe('GET /api/orders', () => {
  it('happy path: filtering by buyerId returns array with expected shape', async () => {
    const res = await request(app).get('/api/orders').query({ buyerId: BUYER_ID });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('product_name');
    expect(res.body[0]).toHaveProperty('status');
  });
});

describe('PUT /api/orders/:id', () => {
  let orderId;
  beforeAll(async () => {
    const res = await request(app).post('/api/orders').send({ productId, buyerId: BUYER_ID, quantityKg: 1 });
    orderId = res.body.id;
  });

  it('validation rejection: an out-of-enum status is rejected', async () => {
    const res = await request(app).put(`/api/orders/${orderId}`).send({ status: 'teleporting' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: a valid status transition is accepted and persisted', async () => {
    const res = await request(app).put(`/api/orders/${orderId}`).send({ status: 'confirmed' });
    expect(res.status).toBe(200);

    const getRes = await request(app).get('/api/orders').query({ buyerId: BUYER_ID });
    const updated = getRes.body.find((o) => o.id === orderId);
    expect(updated.status).toBe('confirmed');
  });

  it('returns 404 for updating an order that does not exist', async () => {
    const res = await request(app).put('/api/orders/999999').send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/orders/:id', () => {
  it('happy path: deletes an order', async () => {
    const createRes = await request(app).post('/api/orders').send({ productId, buyerId: BUYER_ID, quantityKg: 1 });
    const id = createRes.body.id;

    const delRes = await request(app).delete(`/api/orders/${id}`);
    expect(delRes.status).toBe(200);
  });

  it('returns 404 for deleting an order that does not exist', async () => {
    const res = await request(app).delete('/api/orders/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
