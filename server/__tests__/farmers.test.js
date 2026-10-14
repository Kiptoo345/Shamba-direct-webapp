const request = require('supertest');
const app = require('../index');
const db = require('../db');

afterAll(async () => {
  await db.end();
});

let verifiedFarmerId;

beforeAll(async () => {
  const [[farmer]] = await db.query(
    "SELECT id FROM users WHERE role = 'farmer' AND is_verified = 1 ORDER BY id LIMIT 1"
  );
  verifiedFarmerId = farmer.id;
});

describe('GET /api/farmers/ratings', () => {
  it('returns an array of farmer ratings matching the contract', async () => {
    const res = await request(app).get('/api/farmers/ratings');         

    expect(res.status).toBe(200);                                       
    expect(Array.isArray(res.body)).toBe(true);

    res.body.forEach((item) => {
      expect(typeof item.farmer_id).toBe('number');
      expect(typeof item.farmer_name).toBe('string');
      expect(typeof item.rating).toBe('number');
    });
  });

  it('does not return fields outside the contract', async () => {
    const res = await request(app).get('/api/farmers/ratings');

    res.body.forEach((item) => {
      expect(Object.keys(item).sort()).toEqual(['farmer_id', 'farmer_name', 'rating']);
    });
  });

  it('returns ratings between 0 and 5 inclusive', async () => {
    const res = await request(app).get('/api/farmers/ratings');

    res.body.forEach((f) => {
      expect(f.rating).toBeGreaterThanOrEqual(0);
      expect(f.rating).toBeLessThanOrEqual(5);
    });
  });

  it('returns an empty array for a county with no rated farmers', async () => {
    const res = await request(app)
      .get('/api/farmers/ratings')
      .query({ county: 'Atlantis' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

});



describe('GET /api/farmers/:farmer_id/rating', () => {
  let farmer;   // { farmer_id, farmer_name, rating } taken from the list endpoint

  beforeAll(async () => {
    const [[row]] = await db.query(
      `SELECT u.id AS farmer_id, u.full_name AS farmer_name,
              ROUND(AVG(fr.rating), 1) AS rating
       FROM users u
       LEFT JOIN farmer_ratings fr ON fr.farmer_id = u.id
       WHERE u.id = ? AND u.role = 'farmer' AND u.is_verified = 1
       GROUP BY u.id, u.full_name`,
      [verifiedFarmerId]
    );
    farmer = {
      farmer_id: row.farmer_id,
      farmer_name: row.farmer_name,
      rating: Number(row.rating || 0)
    };
  });

  it('returns the rating for a specific farmer', async () => {
    const res = await request(app).get(`/api/farmers/${farmer.farmer_id}/rating`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual({
      farmer_id: farmer.farmer_id,
      farmer_name: farmer.farmer_name,
      rating: farmer.rating
    });
  });

  it('returns 400 for a non-integer farmer id', async () => {
    const res = await request(app).get('/api/farmers/abc/rating');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for a farmer that does not exist', async () => {
    const res = await request(app).get('/api/farmers/999999/rating');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 for boundary ids 0 and -1', async () => {
    const zero = await request(app).get('/api/farmers/0/rating');
    const negative = await request(app).get('/api/farmers/-1/rating');

    expect(zero.status).toBe(404);
    expect(negative.status).toBe(404);
  });

  it('returns a rating within 0 to 5', async () => {
    const res = await request(app).get(`/api/farmers/${farmer.farmer_id}/rating`);

    expect(res.body[0].rating).toBeGreaterThanOrEqual(0);
    expect(res.body[0].rating).toBeLessThanOrEqual(5);
  });
});