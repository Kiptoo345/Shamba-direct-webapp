**API Endpoint Table**

| Method | Path                          | Purpose                                                                 | Maps to Need                                                                 |
|--------|-------------------------------|-------------------------------------------------------------------------|------------------------------------------------------------------------------|
| GET    | /market-prices                | Retrieve current market commodity prices per kg (crop name + price in KES) | 1. List of current market commodity prices                                   |
| GET    | /farmers/ratings              | Retrieve verified farmer quality ratings (supports county/nearby filters) | 2. Verified farmer quality ratings                                           |
| GET    | /farmers/{farmer_id}/rating   | Retrieve the verified rating for a specific farmer                      | 2. Verified farmer quality ratings (single item)                             |
| GET    | /listings                     | Retrieve active produce listings (filterable by county)                 | 3. Active produce listings filtered by county                                |
| GET    | /listings/{listing_id}        | Retrieve a single active produce listing                                | 3. Active produce listings (single item)                                     |
| GET    | /headquarters                 | Retrieve list of headquarters/hubs (region name + county + location)    | 4. Headquarters (region name and county)                                     |
| GET    | /headquarters/{hq_id}         | Retrieve a single headquarters/hub                                      | 4. Headquarters (single item)                                                |
