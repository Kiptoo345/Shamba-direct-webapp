
import {
  getSalamaResources,
  submitConsumerProtectionReport
} from './salama';

describe('Shamba Direct Salama integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        resources: [],
        source: 'live',
        lastSyncedAt: null
      })
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('retrieves resources using county and category filters', async () => {
    await getSalamaResources({
      county: 'nairobi',
      type: 'legal'
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/salama/resources?county=nairobi&type=legal',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  test('submits a consumer protection report', async () => {
    const payload = {
      category: 'delivery_issue',
      county: 'nairobi',
      order_reference: 'ORD-001',
      description: 'The delivery did not match the agreed order.'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Report submitted',
        case_ref: 'SD-CP-2026-000001',
        status: 'received'
      })
    });

    const result = await submitConsumerProtectionReport(payload);

    expect(result.status).toBe('received');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/salama/consumer-reports',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });
});
