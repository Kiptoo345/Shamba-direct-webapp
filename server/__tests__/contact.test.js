const request = require('supertest');
const app = require('../app');
const db = require('../db');

afterAll(async () => { await db.end(); });

describe('POST /api/contact', () => {
  it('validation rejection: missing fields returns 400', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'Only Name' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('happy path: submits an inquiry', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Test Person', contactInfo: 'test@example.com', subject: 'Bulk supply', message: 'Interested in a partnership.'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('messageId');
  });
});

describe('GET /api/contact', () => {
  it('happy path: returns the submitted message with the correct shape', async () => {
    await request(app).post('/api/contact').send({
      name: 'Findable Person', contactInfo: 'findme@example.com', message: 'Find this message'
    });
    const res = await request(app).get('/api/contact');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((m) => m.contact_info === 'findme@example.com');
    expect(found).toBeDefined();
    expect(found.message).toBe('Find this message');
  });
});

describe('DELETE /api/contact/:id', () => {
  it('happy path: deletes a message', async () => {
    const createRes = await request(app).post('/api/contact').send({
      name: 'Delete Me', contactInfo: 'x@example.com', message: 'to be removed'
    });
    const delRes = await request(app).delete(`/api/contact/${createRes.body.messageId}`);
    expect(delRes.status).toBe(200);
  });

  it('returns 404 for a message that does not exist', async () => {
    const res = await request(app).delete('/api/contact/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
