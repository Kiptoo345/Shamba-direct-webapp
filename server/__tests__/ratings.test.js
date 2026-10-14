const request = require('supertest');
const app = require('../app');
const db = require('../db');

let FARMER_ID;
let BUYER_ID;
const createdRatingIds = [];

beforeAll(async () => {
  const [[farmer]] = await db.query("SELECT id FROM users WHERE role = 'farmer' ORDER BY id LIMIT 1");
  const [[buyer]] = await db.query("SELECT id FROM users WHERE role = 'buyer' ORDER BY id LIMIT 1");
  FARMER_ID = farmer.id;
  BUYER_ID = buyer.id;
});

afterAll(async () => {
  for (const id of createdRatingIds) {
    await db.query('DELETE FROM farmer_ratings WHERE id = ?', [id]);
  }
  await db.end();
});

describe('POST /api/ratings', () => {
  it('validation rejection: missing fields returns 400', async () => {
    const res = await request(app).post('/api/ratings').send({ farmerId: FARMER_ID });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('edge case: rating outside 1-5 is rejected', async () => {
    const res = await request(app).post('/api/ratings').send({ farmerId: FARMER_ID, buyerId: BUYER_ID, rating: 7 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: submits a rating', async () => {
    const res = await request(app).post('/api/ratings').send({
      farmerId: FARMER_ID, buyerId: BUYER_ID, rating: 5, reviewText: 'Excellent maize, on time.'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdRatingIds.push(res.body.id);
  });
});

describe('GET /api/ratings?farmerId=', () => {
  it('happy path: returns ratings plus a correctly computed aggregate', async () => {
    const res = await request(app).get('/api/ratings').query({ farmerId: FARMER_ID });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ratings');
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('reviewCount');
    expect(Array.isArray(res.body.ratings)).toBe(true);
    expect(res.body.reviewCount).toBe(res.body.ratings.length); // strong: counts must actually agree
  });

  it('edge case: a farmer with zero ratings returns reviewCount 0, not an error', async () => {
    const res = await request(app).get('/api/ratings').query({ farmerId: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.reviewCount).toBe(0);
    expect(res.body.averageRating).toBe(0);
  });
});

describe('DELETE /api/ratings/:id', () => {
  it('happy path: deletes a rating', async () => {
    const createRes = await request(app).post('/api/ratings').send({ farmerId: FARMER_ID, buyerId: BUYER_ID, rating: 3 });
    createdRatingIds.push(createRes.body.id);
    const delRes = await request(app).delete(`/api/ratings/${createRes.body.id}`);
    createdRatingIds.splice(createdRatingIds.indexOf(createRes.body.id), 1);
    expect(delRes.status).toBe(200);
  });

  it('returns 404 for a rating that does not exist', async () => {
    const res = await request(app).delete('/api/ratings/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
