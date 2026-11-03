jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn((options) => options)
}));

describe('development API proxy', () => {
  const originalTeamKey = process.env.API_KEY_TEAM;

  afterEach(() => {
    if (originalTeamKey === undefined) {
      delete process.env.API_KEY_TEAM;
    } else {
      process.env.API_KEY_TEAM = originalTeamKey;
    }
    jest.resetModules();
  });

  test('attaches the team key to proxied API requests server-side', () => {
    process.env.API_KEY_TEAM = 'test-team-key';
    const setupProxy = require('./setupProxy');
    const app = { use: jest.fn() };

    setupProxy(app);

    expect(app.use).toHaveBeenCalledWith('/api', expect.objectContaining({
      target: 'http://localhost:5000',
      changeOrigin: true,
      onProxyReq: expect.any(Function)
    }));

    const proxyOptions = app.use.mock.calls[0][1];
    const proxyRequest = { setHeader: jest.fn() };
    proxyOptions.onProxyReq(proxyRequest);

    expect(proxyRequest.setHeader).toHaveBeenCalledWith('X-API-Key', 'test-team-key');
  });
});
