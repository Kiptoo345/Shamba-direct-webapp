const request = require('supertest');
const app = require('../app');
const db = require('../db');

afterAll(async () => { await db.end(); });

// Unique per test run so re-running the suite doesn't collide on phone/email uniqueness.
const uniqueSuffix = Date.now();
const testPhone = `07${String(uniqueSuffix).slice(-8)}`;
const testPassword = 'a-strong-test-password';

describe('POST /api/auth/register', () => {
  it('validation rejection: missing required fields returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'No Role Given' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: registers a new farmer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'farmer',
      fullName: 'Test Farmer',
      phoneNumber: testPhone,
      password: testPassword,
      county: 'Kirinyaga'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(typeof res.body.userId).toBe('number');
  });

  it('edge case: registering the same phone number twice returns 409, not a 500', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'farmer', fullName: 'Duplicate Farmer', phoneNumber: testPhone, password: testPassword
    });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  it('validation rejection: missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ phoneNumber: testPhone });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for a wrong password, not a 500', async () => {
    const res = await request(app).post('/api/auth/login').send({ phoneNumber: testPhone, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: logs in and never leaks the password hash back to the client', async () => {
    const res = await request(app).post('/api/auth/login').send({ phoneNumber: testPhone, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('full_name', 'Test Farmer');
    // Strong, security-relevant assertion: a weaker test would only check
    // status 200 and miss a leaked password hash entirely.
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user).not.toHaveProperty('national_id');
  });
});

describe('PUT /api/auth/users/:id', () => {
  let userId;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'farmer', fullName: 'Editable User', phoneNumber: `08${String(uniqueSuffix).slice(-8)}`, password: testPassword
    });
    userId = res.body.userId;
  });

  it('happy path: updates the user profile', async () => {
    const res = await request(app).put(`/api/auth/users/${userId}`).send({ fullName: 'Updated Name' });
    expect(res.status).toBe(200);
  });

  it('returns 404 for updating a user that does not exist (regression test)', async () => {
    const res = await request(app).put('/api/auth/users/999999').send({ fullName: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/auth/users/:id', () => {
  it('happy path: deletes a user account', async () => {
    const createRes = await request(app).post('/api/auth/register').send({
      role: 'buyer', fullName: 'Disposable User', phoneNumber: `09${String(uniqueSuffix).slice(-8)}`, password: testPassword
    });
    const delRes = await request(app).delete(`/api/auth/users/${createRes.body.userId}`);
    expect(delRes.status).toBe(200);
  });

  it('returns 404 for deleting a user that does not exist', async () => {
    const res = await request(app).delete('/api/auth/users/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
