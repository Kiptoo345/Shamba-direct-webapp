
# Week 13: API Versioning Notes

## 1. Breaking Change

Shamba Direct API v2 changes the GET /api/listings endpoint response from a bare JSON array into an object containing `data` and `meta` with version and count information.

The original endpoint will remain available as v1, while the new response structure will be available through /api/v2/listings.

## 2. Why This Change Is Necessary

The original API returns a bare array of produce listings. This makes it difficult to introduce pagination metadata, total record counts and other response information without changing the response structure again.

Wrapping the results in a data object and providing metadata creates a more extensible API response format.

## 3. Predicted Breaking Point

The partner application currently expects the listings endpoint to return an array.

Any integration code that directly uses array operations such as:

- response.map()
- response.length
- response.filter()

will fail if the response changes directly into an object.

The integration must instead access response.data.

## 4. Versioning Strategy

Version 1:
- GET /api/listings
- GET /api/v1/listings
- Original array response.
- Deprecation headers will be included.

Version 2:
- GET /api/v2/listings
- Response format: { data: [], meta: { apiVersion: "v2", count: number } }.

Both versions will access the same MySQL database.

## 5. Backward Compatibility

The original v1 endpoints will remain operational while consumers migrate to v2.

The API key authentication, rate limiting, database access and existing product functionality must remain operational.

## 6. Upstream Partner Migration

Partner name: [INSERT PARTNER NAME]

Partner API: [INSERT PARTNER API]

Old version: [INSERT OLD VERSION]

New version: [INSERT NEW VERSION]

Sunset date: [INSERT DATE FROM PARTNER NOTICE]

Migration status: Pending partner notice and verification.

## 7. V1 Usage Monitoring

Record the following information after testing:

- Requests to /api/listings: [INSERT COUNT]
- Requests to /api/v1/listings: [INSERT COUNT]
- Requests to /api/v2/listings: [INSERT COUNT]
- Remaining v1 consumers: [INSERT CALLER LABELS]

Can v1 safely be removed?

[ANSWER BASED ON ACTUAL USAGE]

## 8. Reflection

[WRITE YOUR OWN 150–250 WORD REFLECTION AFTER COMPLETING THE LAB.]

Address the following:

1. What was it like receiving a breaking API change?
2. How did you discover the change?
3. What did your partner's deprecation notice explain well?
4. What information was missing?
5. What would you improve in your own deprecation notice?
6. What would you do differently as an API owner next time?
