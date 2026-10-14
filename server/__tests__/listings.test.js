const request = require('supertest');
const app = require('../index');

const db = require('../db');
let listingId;

afterAll(async () => {
  if (listingId) {
    await db.query('DELETE FROM products WHERE id = ?', [listingId]);
  }
  await db.end();
});

beforeAll(async () => {
  const [[farmer]] = await db.query("SELECT id FROM users WHERE role = 'farmer' ORDER BY id LIMIT 1");
  const [result] = await db.query(
    `INSERT INTO products (farmer_id, name, category, price_per_kg, quantity_kg, county, status)
     VALUES (?, 'API contract test listing', 'Test category', 1, 1, 'Test County', 'active')`,
    [farmer.id]
  );
  listingId = result.insertId;
});

describe('GET /api/listings', () => {
  it('returns an array of listings matching the contract', async () => {
    const res = await request(app).get('/api/listings');           

    expect(res.status).toBe(200);                                  
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const item = res.body[0];
    expect(typeof item.id).toBe('number');
    expect(typeof item.name).toBe('string');
    expect(typeof item.price_per_kg).toBe('number');
    expect(typeof item.quantity_kg).toBe('number');
    expect(typeof item.category).toBe('string');
    expect(typeof item.county).toBe('string');
  });

  it('filters by county', async () => {
    const all = await request(app).get('/api/listings');           
    const county = all.body[0].county;

    const res = await request(app).get('/api/listings').query({ county });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((l) => expect(l.county).toBe(county));
  });

  it('returns an empty array for a county with no listings', async () => {
    const res = await request(app).get('/api/listings').query({ county: 'Atlantis' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});


describe('GET /api/listings/:listing_id', () => {
  it('returns a single listing matching the contract', async () => {
    const res = await request(app).get(`/api/listings/${listingId}`);   

    expect(res.status).toBe(200);                                       
    expect(res.body.id).toBe(listingId);
    expect(typeof res.body.farmer_id).toBe('number');
    expect(typeof res.body.farmer_name).toBe('string');
    expect(typeof res.body.farmer_verified).toBe('boolean');
    expect(typeof res.body.name).toBe('string');
    expect(typeof res.body.category).toBe('string');
    expect(typeof res.body.price_per_kg).toBe('number');
    expect(typeof res.body.quantity_kg).toBe('number');
    expect(typeof res.body.views).toBe('number');
    expect(typeof res.body.county).toBe('string');
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).get('/api/listings/abc');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for a listing that does not exist', async () => {
    const res = await request(app).get('/api/listings/999999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for boundary ids 0 and -1', async () => {
    const zero = await request(app).get('/api/listings/0');
    const negative = await request(app).get('/api/listings/-1');

    expect(zero.status).toBe(404);
    expect(negative.status).toBe(404);
  });

  it('increments the view count on each request', async () => {
    const first = await request(app).get(`/api/listings/${listingId}`);
    const second = await request(app).get(`/api/listings/${listingId}`);

    expect(second.body.views).toBe(first.body.views + 1);
  });
});