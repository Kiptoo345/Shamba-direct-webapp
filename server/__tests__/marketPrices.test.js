const request = require('supertest');
const app = require('../index');
const db = require('../db');

afterAll(async () => {
  await db.end();
});

describe('GET /api/market-prices', () => {
  it('returns an array of prices matching the contract', async () => {
    const res = await request(app).get('/api/market-prices');         

    expect(res.status).toBe(200);                                      
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const item = res.body[0];
    expect(typeof item.crop_name).toBe('string');
    expect(typeof item.price_per_kg).toBe('number');
    expect(typeof item.county).toBe('string');
  });

  it('does not return fields outside the contract', async () => {
    const res = await request(app).get('/api/market-prices');

    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['county', 'crop_name', 'price_per_kg']
    );
  });

  it('filters by county', async () => {
    const all = await request(app).get('/api/market-prices');         
    const county = all.body[0].county;

    const res = await request(app).get('/api/market-prices').query({ county });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((p) => expect(p.county).toBe(county));
  });

  it('returns an empty array for a county with no prices', async () => {
    const res = await request(app)
      .get('/api/market-prices')
      .query({ county: 'Atlantis' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns prices that are positive numbers', async () => {
    const res = await request(app).get('/api/market-prices');

    res.body.forEach((p) => {
      expect(Number.isFinite(p.price_per_kg)).toBe(true);
      expect(p.price_per_kg).toBeGreaterThan(0);
    });
  });
});

