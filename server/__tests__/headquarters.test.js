const request = require('supertest');
const app = require('../app');
const db = require('../db');

const createdIds = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await db.query('DELETE FROM headquarters WHERE id IN (?)', [createdIds]);
  }
  await db.end();
});

const numberOrNull = (value) => value === null || typeof value === 'number';

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

    res.body.forEach((hub) => {
      expect(numberOrNull(hub.latitude)).toBe(true);
      expect(numberOrNull(hub.longitude)).toBe(true);
    });
  });

  it('filters by county', async () => {
    const all = await request(app).get('/api/headquarters');
    const county = all.body[0].county;

    const res = await request(app).get('/api/headquarters').query({ county });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((hub) => expect(hub.county).toBe(county));
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
  let hub;

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
});

describe('POST /api/headquarters', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/headquarters').send({ county: 'Nairobi' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('creates a headquarters hub', async () => {
    const res = await request(app)
      .post('/api/headquarters')
      .send({ regionName: 'Test Hub', county: 'Nakuru' });
    createdIds.push(res.body.id);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
