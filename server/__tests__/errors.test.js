const request = require('supertest');
const app = require('../app');
const db = require('../db');

afterAll(async () => { await db.end(); });

// Week 8: the README promises every failure looks like { "error": "<message>" }.
// These tests pin that promise for the failures Express would otherwise
// answer with an HTML stack-trace page.
describe('uniform JSON error format', () => {
  it('unknown route -> 404 JSON { error }', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('malformed JSON body -> 400 JSON { error }, no stack trace', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: 'Request body is not valid JSON' });
    expect(res.text).not.toMatch(/node_modules|at .*\(/);
  });

  it('POST with no body / no Content-Type -> 400 validation error, not a 500', async () => {
    const res = await request(app).post('/api/products');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error).toMatch(/required/);
  });
});
