# Partner Test Results

## A note on how the "partner exchange" was done here

This lab is built around exchanging contracts with a ring partner and
running each other's tests against real, running servers. Working solo,
there's no second person to swap with — so the exchange was simulated as
faithfully as the mechanics allow, and that simulation is described here
plainly rather than presented as something it wasn't:

- **A second, independent test suite** (`__tests__/partner-suite/run-partner-tests.js`)
  was written by reading `openapi.yaml` **only** — not the route source —
  the same discipline a real consumer or ring partner would follow.
- It was run over **real HTTP**, against a **live, separately-running**
  instance of the server (`node index.js`, listening on a real port), not
  against an in-process mock. This is the part of the exercise that
  actually matters: "a test that was never executed against a real
  response has told you nothing," and this one was.
- What it is **not**: a second person's genuinely independent
  interpretation of an ambiguous contract. Every ambiguity below was one I
  could see coming because I wrote both the contract and the
  implementation. A real partner would likely have found different things
  than the three below, and might not have found some of these at all.

If this is submitted as a two-person exchange, replace this section with
your actual partner's name and repeat the real exchange — the mechanics
(contract only, run for real, classify every failure) are exactly what's
documented below.

## What my own tests found (Part B)

All 8 endpoint groups, 65 tests written against my own contract and
implementation. Every test passed on the first real run:

```
PASS __tests__/products.test.js
PASS __tests__/auth.test.js
PASS __tests__/marketPrices.test.js
PASS __tests__/orders.test.js
PASS __tests__/headquarters.test.js
PASS __tests__/enquiries.test.js
PASS __tests__/contact.test.js
PASS __tests__/ratings.test.js

Test Suites: 8 passed, 8 total
Tests:       65 passed, 65 total
```

To confirm these assertions weren't too weak to catch anything, I
deliberately broke `routes/products.js` (stripped the `name` field out of
the response) and re-ran just that file:

```
FAIL __tests__/products.test.js
  ● GET /api/products › happy path: returns an array of products with the documented shape
    Expected path: "name"
    Received path: []
Tests: 1 failed, 9 passed, 10 total
```

It failed immediately, for the right reason. I reverted the change and
confirmed a clean pass again before moving on to Part C.

## What partner testing found when run against my API (Part C)

Running the contract-only partner suite against a live server surfaced
**3 real findings**, 0 false alarms:

| # | Endpoint | What the partner suite expected | What the API actually did |
|---|---|---|---|
| 1 | `PUT /api/products/:id` | 400, because `ProductInput`'s required fields (`farmerId`, `name`, `pricePerKg`, `quantityKg`) looked like they applied here too | 200 — the implementation always treated every field on update as optional |
| 2 | `POST /api/orders` with `quantityKg: 0` | A 400 whose message actually mentions the quantity | 400, but with the generic message `"productId, buyerId and quantityKg are required"` — misleading, since quantityKg *was* provided |
| 3 | `PUT /api/auth/users/:id` | 404 for a nonexistent user, matching every other PUT endpoint in the API | 200 — the update silently "succeeded" against a user that doesn't exist |

Nothing else failed — every other endpoint's happy path, validation
rejection, not-found case, and edge case behaved exactly as the contract
said it would.

## Classification and resolution (Part D)

**#1 — Contract ambiguity, not a bug.** `openapi.yaml` reused the same
`ProductInput` schema (with its 4 required fields) for both `POST` and
`PUT /api/products/:id`, but the implementation's `PUT` handler was always
written to treat a partial update as valid — that behavior is correct and
intentional (COALESCE-based partial update). The contract just didn't say
so. **Fix:** added a separate `ProductPatchInput` schema, used only by
`PUT`, with no required fields, plus a note explaining why it's separate
from `ProductInput`. No code changed.

**#2 — Real bug.** `routes/orders.js` used `!quantityKg` to check for a
missing value, which also treats a legitimate `0` as "missing" — a classic
JavaScript falsy-value bug. The status code (400) was accidentally correct,
but the error message was wrong for what actually happened. **Fix:**
check for `undefined`/`null` explicitly (not falsiness) to detect a truly
missing value, and added a distinct check + message for
`quantityKg <= 0`. Added a regression test.

**#3 — Real bug.** `routes/auth.js`'s `PUT /users/:id` never checked
`affectedRows`, so it returned `200 { message: 'Profile updated
successfully' }` even when the target user didn't exist — inconsistent
with every other `PUT` endpoint in this API (products, orders,
headquarters, market-prices all 404 correctly). **Fix:** check
`affectedRows === 0` and return 404, matching the established pattern.
Updated `openapi.yaml` to document the 404 response. Added a regression
test.

## Final verification

After both fixes and the one contract clarification:

- My own suite: **67/67 passing** (65 original + 2 new regression tests
  for findings #2 and #3).
- The partner suite, re-run against a fresh live server: **12/12 passing**
  (the one finding-#1 test was updated to assert the now-clarified
  behavior — `200`, partial update accepted — since the resolution here
  was "fix the contract," not "fix the code").

```
Partner suite results: 12 passed, 0 failed
```

## Summary for the rubric

- Every failure was investigated, not just logged.
- 2 of 3 were real bugs, now fixed in `routes/orders.js` and
  `routes/auth.js`, each with a regression test.
- 1 of 3 was a contract ambiguity, resolved by clarifying `openapi.yaml`
  (a new `ProductPatchInput` schema), not by changing behavior.
- Nothing was found that turned out to be a genuine misunderstanding on
  the test-writer's part (the third category the handout describes) — but
  see the caveat above about this being a self-run simulation, not an
  independent partner's read of the contract.
