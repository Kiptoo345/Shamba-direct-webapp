process.env.API_KEY_TEAM = process.env.API_KEY_TEAM || 'week7-test-team-key';
process.env.API_RATE_LIMIT_MAX = process.env.API_RATE_LIMIT_MAX || '10000';

const supertest = require('supertest');
const requestWithApiKey = (...args) => {
  const agent = supertest(...args);
  const request = Object.create(agent);
  ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].forEach((method) => {
    request[method] = (...requestArgs) => {
      const testRequest = agent[method](...requestArgs);
      if (process.env.API_KEY_TEAM) {
        testRequest.set('X-API-Key', process.env.API_KEY_TEAM);
      }
      return testRequest;
    };
  });
  return request;
};

Object.assign(requestWithApiKey, supertest);
require.cache[require.resolve('supertest')].exports = requestWithApiKey;
