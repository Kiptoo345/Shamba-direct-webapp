jest.mock('../db', () => ({
  query: jest.fn()
}));

jest.mock('../services/salamaClient', () => ({
  salamaRequest: jest.fn()
}));

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { salamaRequest } = require('../services/salamaClient');

describe('Farmer protection report and services API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('records an anonymous economic exploitation report in Shamba Direct', async () => {
    db.query.mockResolvedValue([{ insertId: 42 }]);

    const response = await request(app)
      .post('/api/reports/economic-exploitation')
      .send({
        incident_date: '2026-11-10',
        county: ' Nairobi ',
        location: ' Market centre ',
        description: 'The buyer withheld the agreed payment.',
        is_anonymous: false,
        user_id: 17
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'Your confidential report was recorded.',
      id: 42,
      case_ref: 'SD-EXP-000042',
      is_anonymous: true
    });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO economic_exploitation_reports'),
      [
        '2026-11-10',
        'nairobi',
        'Market centre',
        'The buyer withheld the agreed payment.'
      ]
    );
    expect(JSON.stringify(response.body)).not.toContain('withheld the agreed payment');
    expect(salamaRequest).not.toHaveBeenCalled();
  });

  test('rejects invalid report input without writing it to the database', async () => {
    const response = await request(app)
      .post('/api/reports/economic-exploitation')
      .send({
        incident_date: '2026-02-30',
        county: 'Nairobi',
        description: 'A sufficiently long report description.'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(db.query).not.toHaveBeenCalled();
  });

  test('gets cached support services', async () => {
    const lastSyncedAt = new Date();
    db.query
      .mockResolvedValueOnce([[{ last_synced_at: lastSyncedAt }]])
      .mockResolvedValueOnce([[
        {
          id: 3,
          salama_resource_id: '3',
          name: 'County legal desk',
          type: 'legal',
          county: 'nairobi',
          description: 'Legal support',
          contact: '07000000000',
          available: 'Yes',
          source_created_at: null,
          last_synced_at: lastSyncedAt
        }
      ]])
      .mockResolvedValueOnce([[{ last_synced_at: lastSyncedAt }]]);

    const response = await request(app)
      .get('/api/salama/resources')
      .query({ county: 'nairobi', type: 'legal' });

    expect(response.status).toBe(200);
    expect(response.body.resources).toHaveLength(1);
    expect(response.body).toEqual(expect.objectContaining({
      source: 'cache',
      resources: [expect.objectContaining({
        contact: '07000000000'
      })]
    }));
    expect(salamaRequest).not.toHaveBeenCalled();
  });
});
