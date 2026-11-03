import { createEnquiry, getProducts } from './api';

describe('API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('uses the same-origin API proxy without exposing an API key to the browser', async () => {
    await getProducts();

    expect(global.fetch).toHaveBeenCalledWith('/api/products', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined
    });
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty('X-API-Key');
  });

  test('sends farmer enquiries with the field names required by the API', async () => {
    await createEnquiry({
      productId: 12,
      buyerId: 34,
      message: 'I am interested in this produce.'
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 12,
        buyer_id: 34,
        message: 'I am interested in this produce.'
      })
    });
  });
});
