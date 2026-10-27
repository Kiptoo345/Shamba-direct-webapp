jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([[]])
}));

const request = require('supertest');
const app = require('../app');

describe('API key access and rate limiting', () => {
  const originalTeamKey = process.env.API_KEY_TEAM;
  const originalPartnerKey = process.env.API_KEY_RING_PARTNER;
  const originalRateLimit = process.env.API_RATE_LIMIT_MAX;

  afterEach(() => {
    process.env.API_KEY_TEAM = originalTeamKey;
    if (originalPartnerKey === undefined) {
      delete process.env.API_KEY_RING_PARTNER;
    } else {
      process.env.API_KEY_RING_PARTNER = originalPartnerKey;
    }
    if (originalRateLimit === undefined) {
      delete process.env.API_RATE_LIMIT_MAX;
    } else {
      process.env.API_RATE_LIMIT_MAX = originalRateLimit;
    }
    delete process.env.API_KEY_RATE_DEMO;
  });

  test('rejects requests with a missing API key', async () => {
    const response = await request(app)
      .get('/api/not-a-route')
      .unset('X-API-Key');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'A valid X-API-Key header is required' });
  });

  test('fails closed when no API keys are configured', async () => {
    delete process.env.API_KEY_TEAM;
    delete process.env.API_KEY_RING_PARTNER;

    const response = await request(app).get('/api/not-a-route');

    expect(response.status).toBe(401);
  });

  test('rejects requests with an invalid API key', async () => {
    const response = await request(app)
      .get('/api/not-a-route')
      .set('X-API-Key', 'invalid-key');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'A valid X-API-Key header is required' });
  });

  test('allows requests with a configured API key', async () => {
    const response = await request(app)
      .get('/api/not-a-route')
      .set('X-API-Key', process.env.API_KEY_TEAM);

    expect(response.status).toBe(404);
  });

  test('limits the ring-partner key to read-only partner endpoints', async () => {
    process.env.API_KEY_RING_PARTNER = 'ring-partner-test-key';

    const readResponse = await request(app)
      .get('/api/listings')
      .set('X-API-Key', process.env.API_KEY_RING_PARTNER);
    const writeResponse = await request(app)
      .post('/api/products')
      .set('X-API-Key', process.env.API_KEY_RING_PARTNER)
      .send({ name: 'Blocked listing' });

    expect(readResponse.status).toBe(200);
    expect(writeResponse.status).toBe(403);
    expect(writeResponse.body).toEqual({
      error: 'This API key is read-only and limited to partner data'
    });
  });

  test('does not allow public registration to assign the admin role', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        role: 'admin',
        fullName: 'Untrusted Admin',
        phoneNumber: '07000000000',
        password: 'not-a-real-password'
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'role must be farmer or buyer' });
  });

  test('returns 429 with Retry-After after three requests in one minute', async () => {
    process.env.API_RATE_LIMIT_MAX = '3';
    process.env.API_KEY_RATE_DEMO = 'rate-limit-demo-key';
    const statuses = [];
    let limitedResponse;

    for (let index = 0; index < 5; index += 1) {
      const response = await request(app)
        .get('/api/listings')
        .set('X-API-Key', process.env.API_KEY_RATE_DEMO);
      statuses.push(response.status);
      if (response.status === 429) limitedResponse = response;
    }

    console.log(`Rate-limit demonstration: ${statuses.join(' ')}`);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(limitedResponse.headers['retry-after']).toMatch(/^\d+$/);
    expect(limitedResponse.body).toEqual({
      error: 'Rate limit exceeded',
      retryAfter: Number(limitedResponse.headers['retry-after'])
    });
  });
});
