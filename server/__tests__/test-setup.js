
const request = require('supertest');
const app = require('../app');

describe('Shamba Direct API versioning', () => {

  describe('V1 backward compatibility', () => {

    test('GET /api/v1/listings returns an array', async () => {
      const res = await request(app).get('/api/v1/listings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('Legacy /api/listings returns the original array', async () => {
      const legacy = await request(app).get('/api/listings');

      const versioned = await request(app).get('/api/v1/listings');

      expect(legacy.status).toBe(200);
      expect(versioned.status).toBe(200);

      expect(legacy.body).toEqual(versioned.body);
    });

    test('V1 returns the original listing fields', async () => {
      const res = await request(app).get('/api/v1/listings');

      expect(res.status).toBe(200);

      if (res.body.length > 0) {
        expect(Object.keys(res.body[0]).sort()).toEqual([
          'category',
          'county',
          'id',
          'name',
          'price_per_kg',
          'quantity_kg'
        ]);
      }
    });

  });

  describe('V2 response structure', () => {

    test('GET /api/v2/listings returns data and metadata', async () => {
      const res = await request(app).get('/api/v2/listings');

      expect(res.status).toBe(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');

      expect(Array.isArray(res.body.data)).toBe(true);

      expect(res.body.meta.apiVersion).toBe('v2');
      expect(res.body.meta.count).toBe(res.body.data.length);
    });

    test('V2 listing fields remain compatible with the listing contract', async () => {
      const res = await request(app).get('/api/v2/listings');

      expect(res.status).toBe(200);

      if (res.body.data.length > 0) {
        expect(Object.keys(res.body.data[0]).sort()).toEqual([
          'category',
          'county',
          'id',
          'name',
          'price_per_kg',
          'quantity_kg'
        ]);
      }
    });

    test('V2 county filtering works', async () => {
      const all = await request(app).get('/api/v2/listings');

      if (all.body.data.length === 0) return;

      const county = all.body.data[0].county;

      const filtered = await request(app)
        .get('/api/v2/listings')
        .query({ county });

      expect(filtered.status).toBe(200);

      filtered.body.data.forEach((listing) => {
        expect(listing.county).toBe(county);
      });
    });

    test('V2 returns an empty data array for unknown counties', async () => {
      const res = await request(app)
        .get('/api/v2/listings')
        .query({ county: 'Atlantis' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: [],
        meta: {
          apiVersion: 'v2',
          count: 0
        }
      });
    });

  });

  describe('Deprecation headers', () => {

    test('V1 and legacy endpoints include deprecation headers', async () => {
      const paths = [
        '/api/listings',
        '/api/v1/listings'
      ];

      for (const path of paths) {
        const res = await request(app).get(path);

        expect(res.status).toBe(200);

        expect(res.headers.deprecation).toBe(
          `@${Math.floor(new Date(
            `${process.env.V1_DEPRECATION_DATE || '2026-11-11'}T00:00:00Z`
          ).getTime() / 1000)}`
        );

        expect(res.headers.sunset).toBe(
          new Date(
            `${process.env.V1_SUNSET_DATE || '2027-02-09'}T00:00:00Z`
          ).toUTCString()
        );

        expect(res.headers.link).toContain(
          'rel="successor-version"'
        );
      }
    });

    test('V2 does not include deprecation headers', async () => {
      const res = await request(app).get('/api/v2/listings');

      expect(res.status).toBe(200);

      expect(res.headers.deprecation).toBeUndefined();
      expect(res.headers.sunset).toBeUndefined();
    });

  });

  describe('Versioned listing details', () => {

    test('V2 returns a wrapped single listing response', async () => {
      const all = await request(app).get('/api/v2/listings');

      if (all.body.data.length === 0) return;

      const id = all.body.data[0].id;

      const res = await request(app)
        .get(`/api/v2/listings/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(id);
    });

  });

});
