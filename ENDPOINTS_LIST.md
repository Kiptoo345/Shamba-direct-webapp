# Shamba Direct API Endpoint List

## Team

**Team 14 — Shamba Direct Webapp**

**Downstream Partner:** Team 1 — SettleIn

## Endpoint List

| Method | Path                         | Purpose                                                                    | Maps to Need                                     |
| ------ | ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| GET    | /market-prices               | Retrieve current market commodity prices per kg (crop name + price in KES) | 1. List of current market commodity prices       |
| GET    | /farmers/ratings             | Retrieve verified farmer quality ratings (supports county/nearby filters)  | 2. Verified farmer quality ratings               |
| GET    | /farmers/{farmer\_id}/rating | Retrieve the verified rating for a specific farmer                         | 2. Verified farmer quality ratings (single item) |
| GET    | /listings                    | Retrieve active produce listings (filterable by county)                    | 3. Active produce listings filtered by county    |
| GET    | /listings/{listing\_id}      | Retrieve a single active produce listing                                   | 3. Active produce listings (single item)         |
| GET    | /headquarters                | Retrieve list of headquarters/hubs (region name + county + location)       | 4. Headquarters (region name and county)         |
| GET    | /headquarters/{hq\_id}       | Retrieve a single headquarters/hub                                         | 4. Headquarters (single item)                    |

## REST Design Notes

- Endpoints use **nouns** to represent resources, while HTTP methods represent the action.
- `GET` is used because SettleIn requires read-only access to Shamba Direct data.
- Resource names are consistently plural, such as `/market-prices`, `/farmers`, `/listings`, and `/headquarters`.
- IDs are used in paths when retrieving a specific resource, such as `/listings/{listing_id}`.
- County filtering is supported on listings rather than creating separate county-specific endpoints.
- The endpoints were derived directly from the Week 2 API needs identified during the SettleIn downstream interview.

## Non-Functional Considerations

- Market prices and active listings should be sufficiently fresh for use when accommodation pages are loaded.
- The API should reflect the scheduled data-update pipeline rather than promising real-time prices.
- Farmer phone numbers and National ID information must remain private and should not be exposed through these endpoints.
- The API should provide reliable access to the data required by SettleIn.

## Write Endpoint Requirement

SettleIn confirmed during the Week 2 interview that it requires **read and display only** and does not need to create, update, or delete Shamba Direct data.

Therefore, all endpoints derived from the documented SettleIn needs are `GET` endpoints. No artificial write endpoint has been added because it would not map to a genuine downstream need.

This requirement should be raised with the instructor for clarification.

## Final Checklist

- [x] Every Week 2 need has a corresponding endpoint.
- [x] At least 5 endpoints are provided.
- [x] REST naming conventions are followed.
- [x] Path and query parameters are used appropriately.
- [x] Privacy restrictions identified during the interview are considered.
- [x] Data freshness concerns from the downstream interview are considered.
- [ ] Peer review completed.
- [ ] Reviewer feedback addressed.
- [ ] `ENDPOINT_LIST.md` committed and pushed.
- [ ] Write-endpoint requirement clarified with the instructor.
