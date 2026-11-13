# API versioning

| Path | Status | Response shape |
|---|---|---|
| `/api/v2/...` | **Current** | `{ "data": ..., "meta": {...} }` |
| `/api/v1/...` | Deprecated, works until the sunset date | Original bare JSON |
| `/api/...` (no version) | Deprecated, behaves as v1 | Original bare JSON |

`/api/salama/...` is not versioned.

## What changed in v2, and why

v1 returned a bare array for lists and `{ "error": "text" }` for errors. That left no
room for metadata and forced every client to guess how to read an error. v2 changes two things:

1. **Success:** `{ "data": <v1 body>, "meta": { "apiVersion": "v2", "count": <n> } }`
   (`count` appears for list responses). The data inside is the same as v1.
2. **Errors:** `{ "error": { "status": 400, "message": "..." } }`. This also covers
   401, 403, 404 and 429 (`retryAfter` stays inside `error`).

Endpoints, query parameters, authentication, partner key limits and rate limits are unchanged.

## Deprecation signals on every v1 response

```
Deprecation: @1794355200
Sunset: Tue, 09 Feb 2027 00:00:00 GMT
Link: </api/v2/listings>; rel="successor-version"
API-Version: 1
```

Set the real dates in `server/.env` (`V1_DEPRECATION_DATE`, `V1_SUNSET_DATE`,
optional `V1_MIGRATION_URL`) so they match the notice you sent.

## Migrating a client

| v1 | v2 |
|---|---|
| `GET /api/listings` -> `[...]` | `GET /api/v2/listings` -> `{ "data": [...], "meta": {...} }` |
| `res.error` is a string | `res.error.message` is the string, `res.error.status` the code |

Read `body.data` instead of `body`, and `body.error.message` instead of `body.error`.

## Demo commands

```bash
# v1 still works and announces its deprecation
curl -i -H "X-API-Key: $KEY" "$URL/api/v1/market-prices"

# v2 returns the new shape, with no deprecation headers
curl -i -H "X-API-Key: $KEY" "$URL/api/v2/market-prices"
```

## Tests

`server/__tests__/versioning.test.js` (database mocked) checks v1 shape and headers, the
legacy path, v2 envelope and errors, and that the partner read-only key behaves
the same on both versions.
