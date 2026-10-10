const request = require('supertest');
const app = require('../index');
const db = require('../db');

let productId;
let buyerId;
const createdIds = [];   // enquiry rows created by these tests, removed in afterAll

beforeAll(async () => {
  // a real listing and a real buyer, not hardcoded IDs
  const list = await request(app).get('/api/listings');
  productId = list.body[0].id;

  const [[buyer]] = await db.query("SELECT id FROM users WHERE role = 'buyer' LIMIT 1");
  buyerId = buyer.id;
});

afterAll(async () => {
  if (createdIds.length > 0) {
    await db.query('DELETE FROM enquiries WHERE id IN (?)', [createdIds]);
  }
  await db.end();
});

const validBody = () => ({
  product_id: productId,
  buyer_id: buyerId,
  message: 'I am interested in 200kg of tomatoes'
});

describe('POST /api/enquiries', () => {
  it('creates an enquiry and returns 201 with an id', async () => {
    const res = await request(app).post('/api/enquiries').send(validBody());   

    expect(res.status).toBe(201);                                              
    expect(typeof res.body.id).toBe('number');
    expect(res.body.message).toBe('Enquiry submitted successfully');
    createdIds.push(res.body.id);
  });

  it('saves the enquiry linked to the right listing and buyer', async () => {
    const res = await request(app).post('/api/enquiries').send(validBody());
    createdIds.push(res.body.id);

    const [[row]] = await db.query('SELECT * FROM enquiries WHERE id = ?', [res.body.id]);
    expect(row.product_id).toBe(productId);
    expect(row.buyer_id).toBe(buyerId);
    expect(row.message).toBe('I am interested in 200kg of tomatoes');
  });

  it.each(['product_id', 'buyer_id', 'message'])(
    'returns 400 when %s is missing',
    async (field) => {
      const body = validBody();
      delete body[field];

      const res = await request(app).post('/api/enquiries').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    }
  );

  it('returns 400 for an empty body', async () => {
    const res = await request(app).post('/api/enquiries').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when product_id is not an integer', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), product_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when buyer_id is not an integer', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), buyer_id: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when message is only whitespace', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when message is not a string', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), message: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Not found 
  it('returns 404 when the listing does not exist', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), product_id: 999999 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when the buyer does not exist', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), buyer_id: 999999 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // Edge cases
  it('accepts numeric strings for the ids', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), product_id: String(productId), buyer_id: String(buyerId) });

    expect(res.status).toBe(201);
    createdIds.push(res.body.id);
  });

  it('trims whitespace around the message before saving', async () => {
    const res = await request(app)
      .post('/api/enquiries')
      .send({ ...validBody(), message: '  Is delivery available?  ' });
    createdIds.push(res.body.id);

    const [[row]] = await db.query('SELECT message FROM enquiries WHERE id = ?', [res.body.id]);
    expect(row.message).toBe('Is delivery available?');
  });
});