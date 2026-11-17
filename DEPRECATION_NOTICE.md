
# Deprecation Notice: Shamba Direct Listings API v1

**To:** [Partner Name]

**From:** Shamba Direct Development Team

**Date:** 10 November 2026

## 1. Summary

Shamba Direct is introducing API v2 for its produce listings endpoint.

The existing v1 endpoint will remain available during the migration period but is now deprecated.

The new version is available immediately.

The planned sunset date for v1 is 9 February 2027, subject to the agreed migration schedule.

## 2. What Is Changing?

The response structure for GET /api/listings is changing.

### Previous response: v1

The original API returns a bare JSON array.

```json
[
  {
    "id": 1,
    "name": "Tomatoes",
    "price_per_kg": 80,
    "quantity_kg": 50,
    "category": "Vegetables",
    "county": "Nairobi"
  }
]
```

### New response: v2

The new API wraps the listing array in a `data` property and provides version and count metadata in `meta`.

```json
{
  "data": [
    {
      "id": 1,
      "name": "Tomatoes",
      "price_per_kg": 80,
      "quantity_kg": 50,
      "category": "Vegetables",
      "county": "Nairobi"
    }
  ],
  "meta": {
    "apiVersion": "v2",
    "count": 1
  }
}
```

## 3. Why Are We Making This Change?

The new structure makes it easier to introduce pagination, total result counts and additional response metadata without repeatedly changing the API contract.

## 4. What Is Not Changing?

- API key authentication.
- Produce listing information.
- Listing identifiers.
- Price and quantity fields.
- Category and county information.
- Existing database records.
- Existing filtering parameters.

## 5. How to Migrate

1. Replace GET /api/listings with GET /api/v2/listings.
2. Read listing records from response.data.
3. Use response.meta.count to obtain the number of returned records.
4. Keep the existing X-API-Key header.
5. Test the integration.
6. Notify Shamba Direct after completing the migration.

## 6. Migration Timeline

- 10 November 2026: v2 becomes available.
- 10 November 2026: v1 is marked deprecated.
- 9 February 2027: planned v1 sunset date.

V1 will remain available during the course migration and demo period as agreed with the instructor and partner.

## 7. Questions and Support

Please contact the Shamba Direct development team if you encounter integration problems.

We request confirmation once the migration has been completed.

Thank you for continuing to integrate with Shamba Direct.
