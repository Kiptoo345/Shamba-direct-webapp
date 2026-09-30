/**
 * PARTNER TEST SUITE
 * ------------------
 * Written strictly from `openapi.yaml` — the contract — with no reference
 * to the Shamba Direct route source code. This plays the role of Week 7's
 * "ring partner": a consumer who only ever sees the contract, never the
 * implementation, and whose reasonable reading of that contract may differ
 * from what the implementation actually does.
 *
 * Run against a REAL, RUNNING instance of the API over plain HTTP —
 * not supertest's in-process app import — mirroring "swap running access
 * ... run the tests you wrote against their real, running server."
 *
 * Usage:
 *   node __tests__/partner-suite/run-partner-tests.js http://localhost:5050
 */

const BASE_URL = process.argv[2] || 'http://localhost:5050';

let passed = 0;
let failed = 0;
const failures = [];

async function check(description, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${description}`);
  } catch (err) {
    failed++;
    failures.push({ description, message: err.message });
    console.log(`  FAIL  ${description}`);
    console.log(`        ${err.message}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertHasProperty(obj, prop, label) {
  if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
    throw new Error(`${label}: expected object to have property "${prop}", got ${JSON.stringify(obj)}`);
  }
}

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* no body */ }
  return { status: res.status, body: json };
}

async function main() {
  console.log(`Partner suite running against: ${BASE_URL}\n`);

  // ---------------------------------------------------------------------
  // /api/products — reading the contract straightforwardly
  // ---------------------------------------------------------------------
  console.log('GET /api/products');
  await check('happy path returns 200 and an array', async () => {
    const { status, body } = await api('GET', '/api/products');
    assertEqual(status, 200, 'status');
    if (!Array.isArray(body)) throw new Error('expected an array per the contract');
  });

  console.log('\nGET /api/products/{id}');
  await check('unknown id returns 404 with an error field', async () => {
    const { status, body } = await api('GET', '/api/products/999999');
    assertEqual(status, 404, 'status');
    assertHasProperty(body, 'error', 'body');
  });

  console.log('\nPOST /api/products');
  let createdProductId;
  await check('happy path creates a product per ProductInput schema', async () => {
    const { status, body } = await api('POST', '/api/products', {
      farmerId: 1, name: 'Partner Suite Product', pricePerKg: 20, quantityKg: 50
    });
    assertEqual(status, 201, 'status');
    assertHasProperty(body, 'id', 'body');
    createdProductId = body.id;
  });
  await check('missing required fields is rejected with 400', async () => {
    const { status } = await api('POST', '/api/products', { name: 'No price or qty' });
    assertEqual(status, 400, 'status');
  });

  console.log('\nPUT /api/products/{id}  <-- RESOLVED: see PARTNER_TEST_RESULTS.md');
  await check(
    'CONTRACT (clarified): PUT uses ProductPatchInput, where every field is optional; ' +
    'a partial update with none of POST\'s required fields is accepted, not rejected',
    async () => {
      const { status } = await api('PUT', `/api/products/${createdProductId}`, { harvestNote: 'partial update only' });
      assertEqual(status, 200, 'status');
    }
  );

  // ---------------------------------------------------------------------
  // /api/orders
  // ---------------------------------------------------------------------
  console.log('\nPOST /api/orders');
  await check('happy path places an order', async () => {
    const { status, body } = await api('POST', '/api/orders', {
      productId: createdProductId, buyerId: 3, quantityKg: 5
    });
    assertEqual(status, 201, 'status');
    assertHasProperty(body, 'totalPrice', 'body');
  });
  await check(
    'EDGE CASE: quantityKg of 0 is a nonsensical order and should be rejected clearly',
    async () => {
      const { status, body } = await api('POST', '/api/orders', {
        productId: createdProductId, buyerId: 3, quantityKg: 0
      });
      assertEqual(status, 400, 'status');
      // A partner would expect an error message that actually reflects what's
      // wrong (a bad quantity), not a generic "required fields missing"
      // message when quantityKg was in fact present, just zero.
      if (/required/i.test(body.error) ) {
        throw new Error(`error message is misleading for a present-but-zero quantityKg: "${body.error}"`);
      }
    }
  );

  // ---------------------------------------------------------------------
  // /api/auth — the pattern established by every OTHER PUT endpoint in
  // this API is "404 if the target id doesn't exist." A partner reading
  // the contract holistically would expect PUT /api/auth/users/{id} to
  // follow the same rule, even though this specific path's contract entry
  // doesn't spell out a 404 response.
  // ---------------------------------------------------------------------
  console.log('\nPUT /api/auth/users/{id}');
  await check(
    'CONSISTENCY READING: every other PUT endpoint 404s for an unknown id; this one should too',
    async () => {
      const { status } = await api('PUT', '/api/auth/users/999999', { fullName: 'Ghost' });
      assertEqual(status, 404, 'status');
    }
  );

  console.log('\nPOST /api/auth/register + /api/auth/login');
  const partnerPhone = `06${String(Date.now()).slice(-8)}`;
  await check('happy path registers a user', async () => {
    const { status } = await api('POST', '/api/auth/register', {
      role: 'buyer', fullName: 'Partner Suite User', phoneNumber: partnerPhone, password: 'partner-pass-123'
    });
    assertEqual(status, 201, 'status');
  });
  await check('login never returns password_hash', async () => {
    const { status, body } = await api('POST', '/api/auth/login', {
      phoneNumber: partnerPhone, password: 'partner-pass-123'
    });
    assertEqual(status, 200, 'status');
    if (Object.prototype.hasOwnProperty.call(body.user, 'password_hash')) {
      throw new Error('password_hash leaked in login response');
    }
  });

  // ---------------------------------------------------------------------
  // /api/ratings — checking the documented oneOf shape
  // ---------------------------------------------------------------------
  console.log('\nGET /api/ratings');
  await check('with no query params, returns a plain array per the oneOf schema', async () => {
    const { status, body } = await api('GET', '/api/ratings');
    assertEqual(status, 200, 'status');
    if (!Array.isArray(body)) throw new Error('expected a plain array when no farmerId/buyerId given');
  });
  await check('with farmerId, returns the aggregate object shape per the oneOf schema', async () => {
    const { status, body } = await api('GET', '/api/ratings?farmerId=1');
    assertEqual(status, 200, 'status');
    assertHasProperty(body, 'averageRating', 'body');
    assertHasProperty(body, 'reviewCount', 'body');
  });

  // ---------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log(`Partner suite results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f.description}\n     ${f.message}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Partner suite crashed:', err);
  process.exit(1);
});
