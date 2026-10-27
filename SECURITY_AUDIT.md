# Security audit

## Scope and checks

Reviewed the Express middleware and route handlers, API responses, database
queries, write request fields, ID-based access patterns, error responses, API
documentation, and the access/rate-limit tests.

## Findings and changes

- **Authentication was optional when `API_ACCESS_TOKEN` was empty or unset.**
  This left all read, write, and delete routes accessible without credentials.
  `/api` now requires a valid `X-API-Key` on every request and fails closed.
  Configure separate `API_KEY_RING_PARTNER` and `API_KEY_TEAM` values in the
  ignored `server/.env`. The ring-partner key is read-only and can access only
  listings, market prices, farmer ratings, and headquarters.
- **Sensitive data and broad database projections.** Login now returns only
  the user's ID, name, role, county, and verification display flag; it does not
  return password hashes, email, phone numbers, profile identifiers, or
  delivery details. API queries that previously used `SELECT *` now select
  explicit columns. Contact inbox and order details are restricted to the
  team key; the partner key cannot reach those endpoints.
- **Error responses could contain implementation details.** Database errors
  no longer return their raw message, unknown-route responses omit the URL,
  and the error middleware returns generic JSON without stack traces, file
  paths, SQL, or table names.
- **Write fields and record ownership.** Route handlers use explicit field
  allowlists rather than spreading request bodies into SQL, so submitted
  `id`, `isAdmin`, and unrecognized ownership fields are not written.
  Registration now accepts only `farmer` and `buyer`, preventing a request
  from assigning the database-supported `admin` role. The
  partner key is read-only. However, the application has no end-user session
  or identity token: the trusted team key has team-wide access, and endpoints
  that accept user IDs cannot prove that the human caller owns those records.
  Changing an ID can therefore select another record for a caller who has the
  team key. Do not expose that key to browsers or untrusted users; per-user
  authorization requires a separate user-authentication design.
- **Browser-client key handling.** The React client currently calls the API
  directly, so it cannot safely hold the team key. The key was not added to
  its environment or bundle; a trusted server-side proxy is needed before
  deploying that browser client against the protected API.

## Rate-limit choice

The default is **100 requests per API key per minute**, enforced in memory
before protected routes. This permits ordinary integrations to make repeated
page-load requests while limiting accidental or abusive bursts. An exceeded
limit returns HTTP `429`, a JSON error, and `Retry-After` seconds. The
configurable `API_RATE_LIMIT_MAX` supports the required short demonstration
with a limit of three.

## Verification

`server/__tests__/apiAccess.test.js` checks missing, invalid, and valid keys,
then makes five rapid requests with a temporary limit of three and verifies
the statuses `200 200 200 429 429`, the JSON body, and `Retry-After`.
`.env` is ignored and is not tracked by Git; real API keys must remain in the
local environment and must not be added to this repository.
