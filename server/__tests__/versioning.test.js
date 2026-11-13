jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([[
    {
      id: 1,
      region_name: 'Kirinyaga Hub',
      address: 'Kerugoya',
      county: 'Kirinyaga',
      latitude: '-0.5',
      longitude: '37.3'
    }
  ]])
}));

const request = require('supertest');
const app = require('../app');

const HUB = {
  id: 1,
  region_name: 'Kirinyaga Hub',
  address: 'Kerugoya',
  county: 'Kirinyaga',
  latitude: -0.5,
  longitude: 37.3
};

describe('API versioning', () => {
  const original = {
    partner: process.env.API_KEY_RING_PARTNER,
    deprecation: process.env.V1_DEPRECATION_DATE,
    sunset: process.env.V1_SUNSET_DATE
  };

  beforeEach(() => {
    process.env.API_KEY_RING_PARTNER = 'versioning-test-partner-key';
    process.env.V1_DEPRECATION_DATE = '2026-11-11';
    process.env.V1_SUNSET_DATE = '2027-02-09';
  });

  afterEach(() => {
    const restore = (name, value) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    };
    restore('API_KEY_RING_PARTNER', original.partner);
    restore('V1_DEPRECATION_DATE', original.deprecation);
    restore('V1_SUNSET_DATE', original.sunset);
  });

  describe('v1 (deprecated, unchanged shape)', () => {
    test('returns the original bare array', async () => {
      const res = await request(app).get('/api/v1/headquarters');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([HUB]);
    });

    test('sends Deprecation, Sunset and Link headers', async () => {
      const res = await request(app).get('/api/v1/headquarters');

      expect(res.headers.deprecation).toBe(`@${Date.UTC(2026, 10, 11) / 1000}`);
      expect(res.headers.sunset).toBe('Tue, 09 Feb 2027 00:00:00 GMT');
      expect(res.headers.link).toContain('</api/v2/headquarters>; rel="successor-version"');
      expect(res.headers['api-version']).toBe('1');
    });

    test('legacy unversioned path still works and is deprecated', async () => {
      const res = await request(app).get('/api/headquarters');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([HUB]);
      expect(res.headers.deprecation).toBeDefined();
      expect(res.headers.link).toContain('</api/v2/headquarters>');
    });

    test('keeps the old error shape', async () => {
      const res = await request(app).get('/api/v1/farmers/abc/rating');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'farmer_id must be an integer' });
    });

    test('dates and migration link come from the environment', async () => {
      process.env.V1_SUNSET_DATE = '2027-06-30';
      process.env.V1_MIGRATION_URL = 'https://example.test/migrate';

      const res = await request(app).get('/api/v1/headquarters');

      expect(res.headers.sunset).toBe('Wed, 30 Jun 2027 00:00:00 GMT');
      expect(res.headers.link).toContain('<https://example.test/migrate>; rel="deprecation"');
      delete process.env.V1_MIGRATION_URL;
    });
  });

  describe('v2 (current)', () => {
    test('wraps results in { data, meta }', async () => {
      const res = await request(app).get('/api/v2/headquarters');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: [HUB],
        meta: { apiVersion: 'v2', count: 1 }
      });
    });

    test('has no deprecation headers', async () => {
      const res = await request(app).get('/api/v2/headquarters');

      expect(res.headers['api-version']).toBe('2');
      expect(res.headers.deprecation).toBeUndefined();
      expect(res.headers.sunset).toBeUndefined();
    });

    test('uses structured errors', async () => {
      const res = await request(app).get('/api/v2/farmers/abc/rating');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: { status: 400, message: 'farmer_id must be an integer' }
      });
    });

    test('unknown v2 route returns a structured 404', async () => {
      const res = await request(app).get('/api/v2/nope');

      expect(res.status).toBe(404);
      expect(res.body.error).toEqual({ status: 404, message: 'Route not found' });
    });

    test('missing API key returns a structured 401', async () => {
      const res = await request(app).get('/api/v2/headquarters').unset('X-API-Key');

      expect(res.status).toBe(401);
      expect(res.body.error.status).toBe(401);
      expect(res.body.error.message).toBe('A valid X-API-Key header is required');
    });
  });

  describe('partner key works on both versions', () => {
    const partner = (path) =>
      request(app).get(path).set('X-API-Key', 'versioning-test-partner-key');

    test.each(['/api/v1/headquarters', '/api/v2/headquarters', '/api/headquarters'])(
      'GET %s is allowed',
      async (path) => {
        const res = await partner(path);
        expect(res.status).toBe(200);
      }
    );

    test.each(['/api/v1/orders', '/api/v2/orders'])(
      'GET %s is still forbidden',
      async (path) => {
        const res = await partner(path);
        expect(res.status).toBe(403);
      }
    );

    test('v2 partner 403 uses the structured error', async () => {
      const res = await partner('/api/v2/orders');

      expect(res.body.error.status).toBe(403);
      expect(res.body.error.message).toMatch(/read-only/);
    });
  });
});
