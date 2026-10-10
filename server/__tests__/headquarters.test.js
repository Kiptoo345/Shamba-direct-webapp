const request = require('supertest');
const app = require('../index');
const db = require('../db');

afterAll(async () => {
  await db.end();
});

// latitude/longitude may be null (a hub without coordinates), never a string
const numberOrNull = (v) => v === null || typeof v === 'number';

describe('GET /api/headquarters', () => {
  it('returns an array of hubs matching the contract', async () => {
    const res = await request(app).get('/api/headquarters');            

    expect(res.status).toBe(200);                                       
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const item = res.body[0];
    expect(typeof item.id).toBe('number');
    expect(typeof item.region_name).toBe('string');
    expect(typeof item.county).toBe('string');
    expect(numberOrNull(item.latitude)).toBe(true);
    expect(numberOrNull(item.longitude)).toBe(true);
  });

  it('does not return fields outside the contract', async () => {
    const res = await request(app).get('/api/headquarters');

    expect(Object.keys(res.body[0]).sort()).toEqual(
      ['address', 'county', 'id', 'latitude', 'longitude', 'region_name']
    );
  });

  it('never returns coordinates as strings', async () => {
    const res = await request(app).get('/api/headquarters');

    res.body.forEach((h) => {
      expect(numberOrNull(h.latitude)).toBe(true);
      expect(numberOrNull(h.longitude)).toBe(true);
    });
  });

  it('filters by county', async () => {
    const all = await request(app).get('/api/headquarters');          
    const county = all.body[0].county;

    const res = await request(app).get('/api/headquarters').query({ county });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((h) => expect(h.county).toBe(county));
  });

  it('returns an empty array for a county with no hubs', async () => {
    const res = await request(app)
      .get('/api/headquarters')
      .query({ county: 'Atlantis' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

});



describe('GET /api/headquarters/:id', () => {
  let hub;   // a real hub taken from the list endpoint

  beforeAll(async () => {
    const list = await request(app).get('/api/headquarters');
    hub = list.body[0];
  });

  it('returns a single hub identical to its list entry', async () => {
    const res = await request(app).get(`/api/headquarters/${hub.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(hub);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).get('/api/headquarters/abc');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for a hub that does not exist', async () => {
    const res = await request(app).get('/api/headquarters/999999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for boundary ids 0 and -1', async () => {
    const zero = await request(app).get('/api/headquarters/0');
    const negative = await request(app).get('/api/headquarters/-1');

    expect(zero.status).toBe(404);
    expect(negative.status).toBe(404);
  });
});