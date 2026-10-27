# Shamba Direct API

Shamba Direct is a REST API (Node.js + Express 5 + MySQL) behind Kenya's farmer-to-company produce marketplace. **Farmers** post produce listings; **buyers** (companies, supermarkets, processors) browse them, send enquiries, place orders and rate the farmer afterwards. It is for developers who want to build on that data — the React app in [`client/`](client/) uses it, and partners such as SettleIn read its market prices, headquarters, listings and ratings.

## API overview

Shamba Direct is a REST API for a farmer-to-buyer produce marketplace in Kenya. It was built after seeing farmers earn about KES 10 per kg for tomatoes that retailed for KES 60 in Nairobi, with brokers taking the difference. The API gives farmers a direct digital route to the companies that need their produce, and gives other apps read access to the data behind it: active produce listings, current market prices per kg, verified farmer ratings, and headquarters locations. Buyers can also submit an enquiry about a listing, which reaches the farmer who owns it.

Interactive docs: https://kiptoo345.github.io/Shamba-direct-webapp/

## Authentication and safe public testing

Every `/api/...` request requires an `X-API-Key` header, including in local development. Configure separate long, random values for `API_KEY_RING_PARTNER` and `API_KEY_TEAM` in ignored `server/.env`. The ring-partner key is read-only and limited to listings, market prices, farmer ratings, and headquarters; the team key can access the full API.

Missing or invalid keys receive HTTP `401`. Authenticated requests are limited to **100 per API key per minute**. Exceeding the limit returns HTTP `429` JSON and a `Retry-After` header (seconds until requests are accepted again).

Example responses:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error":"A valid X-API-Key header is required"}
```

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{"error":"Rate limit exceeded","retryAfter":60}
```

API keys identify API consumers, not individual users. The team key grants team-level access and must stay on trusted backends. Use the isolated synthetic database described in [Temporary public testing](#temporary-public-testing) for public demos; never expose the normal `shamba_direct_db` through a public tunnel.

The React app currently calls the API directly from the browser. Do not place the team key in a `REACT_APP_*` variable or client bundle; a trusted server-side proxy is needed before deploying the browser app against this protected API.

Never put an API key in a URL, source control, or public document. Send each consumer only its own key through a private channel.

```bash
curl -H 'X-API-Key: YOUR_API_KEY' http://localhost:5000/api/listings
```

- **Full API reference:** open [`docs/index.html`](docs/index.html) in a browser — every endpoint, with request and response samples. Nothing to install or run. (Generated from [`openapi.yaml`](openapi.yaml); see [Rebuilding the docs](#rebuilding-the-docs).)
- **Local base URL:** `http://localhost:5000`. A temporary public tunnel URL is created only while your computer and server are running; it changes when the tunnel restarts.
## 1. Run the API locally (from a clean clone)

### Prerequisites

- Node.js 18 or later
- MySQL running locally, with a user that can create databases

### 1. Clone the repo

```bash
mysql -u root -p --default-character-set=utf8mb4 < server/sql/schema.sql
```

### 2. Create the database

```bash
git clone https://github.com/Kiptoo345/Shamba-direct-webapp.git
cd Shamba-direct-webapp
```

On Windows PowerShell, `<` doesn't work. Use:

```powershell
Get-Content .\server\sql\schema.sql | mysql -u root -p --default-character-set=utf8mb4
```

This creates the `shamba_direct_db` database, all tables and seed data.

### 3. Configure the server

```bash
cd server
cp .env.example .env
```

*(PowerShell: `Copy-Item .env.example .env`.)* Open `server/.env` and set `DB_USER` and `DB_PASSWORD` for your MySQL login. Generate two different API keys and set `API_KEY_RING_PARTNER` and `API_KEY_TEAM`; the API rejects all `/api` requests until at least one key is configured. Generate each key using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and keep the values private.

### 4. Install and start

From the repository root, run the API tests against the seeded database:

```bash
npm test
```

The root `npm test` command forwards to the server's Jest suite. The tests call the real API and need the database from step 1, seeded with `schema.sql`.

Install and start the API:

```bash
npm install
npm start
```

You should see this line (the `dotenv` library may print a couple of `injected env` lines above it). The terminal stays busy — **leave it running** and open a second terminal for everything below:

### 5. Check that it works

In a new terminal:

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings
```

You should get a JSON array of active listings back, with status `200`:

```json
[
  {
    "id": 1,
    "name": "Roma Tomatoes",
    "price_per_kg": 45,
    "quantity_kg": 800,
    "category": "Vegetables",
    "county": "Kirinyaga"
  }
]
```

The real response contains every active listing. This one is trimmed to the first item.

On Windows PowerShell, use `curl.exe` instead of `curl`:

```powershell
curl.exe -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings
```

If you get a connection error, the API isn't running. Check that the server terminal says `Server is running on http://localhost:5000`.

## Temporary public testing

Use this only for short-lived testing. The public demo database is separate from `shamba_direct_db` and contains synthetic data only. Importing the script creates `shamba_direct_public_demo`; it does not copy or alter the normal database.

1. From the repository root, load the isolated sample database:

   ```powershell
   Get-Content .\server\sql\public-demo.sql | mysql -u root -p --default-character-set=utf8mb4
   ```

2. In `server/.env`, set:

   ```dotenv
   DB_NAME=shamba_direct_public_demo
   API_KEY_RING_PARTNER=replace-with-a-unique-long-random-key
   API_KEY_TEAM=replace-with-a-different-long-random-key
   API_RATE_LIMIT_MAX=100
   ```

   Generate each key independently with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the outputs into the ignored `.env` file. Keep both keys private.

3. Start the API from `server` with `npm start`. In another terminal, start a Cloudflare Quick Tunnel using the official `cloudflared` CLI:

   ```powershell
   cloudflared tunnel --url http://localhost:5000
   ```

   Share the generated `https://....trycloudflare.com` URL as the API base URL. It is temporary and is reachable only while the API and tunnel are running.

4. Tell callers to include the token header, for example:

   ```powershell

   curl.exe -H "X-API-Key: $env:API_KEY_RING_PARTNER" https://YOUR-TUNNEL-URL/api/listings
   ```

   Send the ring-partner key privately to that consumer. Do not paste it into public group chats or URLs. Stop `cloudflared` with Ctrl+C when testing ends. Restore `DB_NAME=shamba_direct_db` before returning to normal local development.

The demo login accounts use the synthetic phone numbers `07000000001` (farmer) and `07000000002` (buyer), both with password `DemoOnly123!`. These credentials are for the disposable demo database only. Every API request requires its consumer's API key.


## Endpoint examples

### GET /api/listings

Returns all active produce listings. 

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings
```

Response `200` (trimmed to the first item):

```json
[
  {
    "id": 1,
    "name": "Roma Tomatoes",
    "price_per_kg": 45,
    "quantity_kg": 800,
    "category": "Vegetables",
    "county": "Kirinyaga"
  }
]
```

### GET /api/listings/:listing_id

Returns one listing with farmer details.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings/1
```

Response `200`:

```json
{
  "id": 1,
  "farmer_id": 1,
  "farmer_name": "James Mwangi",
  "farmer_verified": true,
  "name": "Roma Tomatoes",
  "category": "Vegetables",
  "price_per_kg": 45,
  "quantity_kg": 800,
  "views": 60,
  "county": "Kirinyaga"
}
```

`views` goes up by one on every request, so the number will differ.

### GET /api/market-prices

Returns current market prices per kg.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/market-prices
```

Response `200` (trimmed to the first item):

```json
[
  {
    "crop_name": "Maize",
    "price_per_kg": 32,
    "county": "Uasin Gishu"
  }
]
```

### GET /api/farmers/ratings

Returns the average rating of each verified, rated farmer.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/farmers/ratings
```

Response `200`:

```json
[
  {
    "farmer_id": 1,
    "farmer_name": "James Mwangi",
    "rating": 4
  }
]
```

### GET /api/farmers/:farmer_id/rating

Returns the rating for one verified farmer. The response is an array with one item.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/farmers/1/rating
```

Response `200`:

```json
[
  {
    "farmer_id": 1,
    "farmer_name": "James Mwangi",
    "rating": 4
  }
]
```

### GET /api/headquarters

Returns all Shamba Direct hubs. Optional query parameter: `county`. `latitude` and `longitude` are `null` when a hub has no coordinates.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/headquarters
```

Response `200`:

```json
[
  {
    "id": 1,
    "region_name": "Shamba Direct HQ",
    "address": "2nd Floor, Ngong Road Plaza, Ngong Road, Nairobi",
    "county": "Nairobi",
    "latitude": null,
    "longitude": null
  }
]
```

### GET /api/headquarters/:id

Returns one hub.

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/headquarters/1
```

Response `200`:

```json
{
  "id": 1,
  "region_name": "Shamba Direct HQ",
  "address": "2nd Floor, Ngong Road Plaza, Ngong Road, Nairobi",
  "county": "Nairobi",
  "latitude": null,
  "longitude": null
}
```

### POST /api/enquiries

Sends an enquiry from a buyer to the farmer who owns a listing. All three fields are required. The listing and the buyer must exist.

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"buyer_id":3,"message":"I am interested in 200kg of tomatoes"}'
```

Response `201`:

```json
{
  "message": "Enquiry submitted successfully",
  "id": 16
}
```

The `id` is generated, so it will differ.

On Windows PowerShell, quotes inside `-d` get stripped. Save the body to a file and send that instead:

```powershell
'{"product_id":1,"buyer_id":3,"message":"I am interested in 200kg of tomatoes"}' | Set-Content -Encoding ascii enquiry.json
curl.exe -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/enquiries -H "Content-Type: application/json" -d "@enquiry.json"
```

## Errors

A 2xx status means success. Any other status means the request failed, and the body is a JSON object with an `error` field:

```json
{ "error": "description of what went wrong" }
```

| Status | Meaning |
|---|---|
| 400 | A required field is missing, or an id is not an integer |
| 404 | The listing, farmer, hub or buyer does not exist |

### 404: resource not found

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings/999999
```

Response `404`:

```json
{ "error": "Listing not found" }
```

### 404: farmer not found

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/farmers/999999/rating
```

Response `404`:

```json
{ "error": "Farmer not found" }
```

### 400: id is not an integer

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/listings/abc
```

Response `400`:

```json
{ "error": "listing_id must be an integer" }
```

### 400: missing required fields

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response `400`:

```json
{ "error": "product_id, buyer_id and message are required" }
```

## Project structure

```
Shamba-direct-webapp/
├── client/                 React app (Create React App)
│   ├── public/
│   │   └── images/         favicon etc.
│   └── src/
│       ├── api/            api.js (all fetch calls), auth.js (session helper)
│       ├── components/     Navbar.jsx, Footer.jsx
│       ├── pages/          Home, Marketplace, Dashboard, Register, Contact, HowItWorks
│       ├── styles/         your original CSS files, unchanged
│       └── App.js          React Router setup
├── server/                 Express API
│   ├── routes/             auth, products, orders, enquiries, contact, ratings, headquarters, marketPrices, farmers
│   ├── sql/schema.sql      every table + seed data
│   ├── db.js               MySQL connection pool
│   └── index.js            app entry point
├── API_NEEDS.md            (unchanged — Week 2 downstream interview doc)
├── ENDPOINTS_LIST.md       (unchanged — Week 2 endpoint doc)
└── TEAM_CHARTER.md         (unchanged)
```



## Where the CRUD lives

| Action in the UI                          | Endpoint                          | SQL operation |
|--------------------------------------------|------------------------------------|----------------|
| Register as farmer/buyer                   | `POST /api/auth/register`          | INSERT `users`, `farmer_profiles`/`company_profiles` |
| Sign in (Dashboard)                        | `POST /api/auth/login`             | SELECT `users` |
| Update profile                             | `PUT /api/auth/users/:id`          | UPDATE `users` + profile table |
| Delete account                             | `DELETE /api/auth/users/:id`       | DELETE `users` (cascades) |
| Browse marketplace                         | `GET /api/products`                | SELECT `products` |
| Post new produce (Dashboard)                | `POST /api/products`               | INSERT `products` |
| Edit a listing (Dashboard)                  | `PUT /api/products/:id`            | UPDATE `products` |
| Delete a listing (Dashboard)                | `DELETE /api/products/:id`         | DELETE `products` |
| Place an order                             | `POST /api/orders`                 | INSERT `orders`, UPDATE `products.quantity_kg` |
| Advance order status (Dashboard)            | `PUT /api/orders/:id`              | UPDATE `orders` |
| Delete an order                            | `DELETE /api/orders/:id`           | DELETE `orders` |
| "Contact Farmer" (Marketplace)              | `POST /api/enquiries`              | INSERT `enquiries` |
| Contact / About page form                  | `POST /api/contact`                | INSERT `contact_messages` |
| Headquarters CRUD (admin/back office)       | `/api/headquarters`                | INSERT/UPDATE/DELETE `headquarters` |
| Market price feed CRUD (admin/pipeline)     | `/api/market-prices`               | INSERT/UPDATE/DELETE `market_prices` |

```
Server is running on http://localhost:5000
```

**5. Check it can reach the database**

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/test-db
```

**Response** — `200 OK`

```json
{
  "message": "Database connected successfully!",
  "data": [
    {
      "result": 2
    }
  ]
}
```

If you get `{"error":"Database connection failed", ...}` instead, see [Troubleshooting](#troubleshooting).

## 2. Quickstart — your first call

One command, no account, no token:

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products
```

**Response** — `200 OK`

```json
[
  {
    "id": 1,
    "farmer_id": 1,
    "name": "Roma Tomatoes",
    "category": "Vegetables",
    "price_per_kg": "45.00",
    "quantity_kg": "800.00",
    "county": "Kirinyaga",
    "harvest_note": "Harvested 2 days ago",
    "image_emoji": "🍅",
    "status": "active",
    "views": 47,
    "created_at": "2026-10-13T18:38:50.000Z",
    "updated_at": "2026-10-13T18:38:50.000Z",
    "farmer_name": "James Mwangi",
    "farmer_verified": 1
  },
  {
    "id": 2,
    "farmer_id": 2,
    "name": "Grade A Maize",
    "category": "Cereals & Grains",
    "price_per_kg": "32.00",
    "quantity_kg": "3500.00",
    "county": "Uasin Gishu",
    "harvest_note": "Post-harvest dry",
    "image_emoji": "🌽",
    "status": "active",
    "views": 22,
    "created_at": "2026-10-13T18:38:50.000Z",
    "updated_at": "2026-10-13T18:38:50.000Z",
    "farmer_name": "Grace Achieng",
    "farmer_verified": 1
  }
]
```

That is the seeded marketplace: two active listings. Prices and quantities are strings (`"45.00"`) — see [Conventions](#conventions).

> **Windows PowerShell users:** `curl` is an alias for a different command there. Type **`curl.exe`** instead of `curl`. For requests with a JSON body (sections 4–5), save the JSON to a file such as `body.json` and send it with `curl.exe -X POST <url> -H "Content-Type: application/json" -d "@body.json"` — this avoids PowerShell's quote-handling. Git Bash or WSL run every command here exactly as written.

## 3. Authentication

Every `/api/...` request requires the `X-API-Key` header. For a request example, see [Authentication and safe public testing](#authentication-and-safe-public-testing). The key identifies the API consumer; it does not authenticate a particular user or create a login session. Send the ring-partner key only for its read-only endpoints and keep the team key on a trusted backend.

Missing or invalid API keys receive HTTP `401`. Requests above the default **100 per minute per key** receive HTTP `429`, JSON, and a `Retry-After` header.

## 4. Examples — one per major endpoint

Every example below was run against a freshly imported database, **in this order**, and the response shown is what came back. Ids (`userId 4`, order `1`, …) match only if you start fresh and go in order; otherwise use the `id` that your own response returns. Timestamps will differ. Send `Content-Type: application/json` on every request that has a body.

### Accounts

**Register** a buyer (`role` is `farmer` or `buyer`; `fullName`, `phoneNumber`, `password`, `role` are required):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"role":"buyer","fullName":"Test Buyer","phoneNumber":"0700000001","password":"secret123","county":"Nairobi","companyName":"Test Foods Ltd"}'
```

**Response** — `201 Created`

```json
{
  "message": "User registered successfully",
  "userId": 4
}
```

**Log in** with the same phone number and password:

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"phoneNumber":"0700000001","password":"secret123"}'
```

**Response** — `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": 4,
    "full_name": "Test Buyer",
    "email": null,
    "phone_number": "0700000001",
    "role": "buyer",
    "county": "Nairobi",
    "is_verified": 0,
    "created_at": "2026-10-13T18:39:26.000Z",
    "updated_at": "2026-10-13T18:39:26.000Z",
    "profile": {
      "company_name": "Test Foods Ltd",
      "business_type": null,
      "delivery_address": null
    }
  }
}
```

### Products (produce listings)

**Get one product** — also adds 1 to its `views`:

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products/1
```

**Response** — `200 OK`

```json
{
  "id": 1,
  "farmer_id": 1,
  "name": "Roma Tomatoes",
  "category": "Vegetables",
  "price_per_kg": "45.00",
  "quantity_kg": "800.00",
  "county": "Kirinyaga",
  "harvest_note": "Harvested 2 days ago",
  "image_emoji": "🍅",
  "status": "active",
  "views": 48,
  "created_at": "2026-10-13T18:38:50.000Z",
  "updated_at": "2026-10-13T18:39:27.000Z",
  "farmer_name": "James Mwangi",
  "farmer_verified": 1
}
```

**List and filter** — optional query filters: `county`, `category`, `farmerId`, `status`, `minQuantity`. No matches returns `[]`, not an error:

```bash
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:5000/api/products?county=Kirinyaga&category=Vegetables"
```

**Response** — `200 OK`

```json
[
  {
    "id": 1,
    "farmer_id": 1,
    "name": "Roma Tomatoes",
    "category": "Vegetables",
    "price_per_kg": "45.00",
    "quantity_kg": "800.00",
    "county": "Kirinyaga",
    "harvest_note": "Harvested 2 days ago",
    "image_emoji": "🍅",
    "status": "active",
    "views": 48,
    "created_at": "2026-10-13T18:38:50.000Z",
    "updated_at": "2026-10-13T18:39:27.000Z",
    "farmer_name": "James Mwangi",
    "farmer_verified": 1
  }
]
```

**Create** a listing (required: `farmerId`, `name`, `pricePerKg`, `quantityKg`; new listings start as `pending_review` unless you set `status`):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products -H "Content-Type: application/json" -d '{"farmerId":1,"name":"Kale","category":"Vegetables","pricePerKg":30,"quantityKg":200,"county":"Kirinyaga","harvestNote":"Picked this morning"}'
```

**Response** — `201 Created`

```json
{
  "message": "Listing created successfully",
  "id": 3
}
```

**Update** — send only the fields you want to change (`status` is one of `pending_review`, `active`, `sold_out`):

```bash
curl -X PUT -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products/3 -H "Content-Type: application/json" -d '{"pricePerKg":35,"status":"active"}'
```

**Response** — `200 OK`

```json
{
  "message": "Listing updated successfully"
}
```

`DELETE /api/products/{id}` removes a listing.

### Orders

**Place an order** — computes `totalPrice` from the listing's price and reduces its available quantity:

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/orders -H "Content-Type: application/json" -d '{"productId":1,"buyerId":4,"quantityKg":50}'
```

**Response** — `201 Created`

```json
{
  "message": "Order placed successfully",
  "id": 1,
  "totalPrice": 2250
}
```

**List orders** — filters: `farmerId`, `buyerId`, `status`:

```bash
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:5000/api/orders?buyerId=4"
```

**Response** — `200 OK`

```json
[
  {
    "id": 1,
    "product_id": 1,
    "buyer_id": 4,
    "farmer_id": 1,
    "quantity_kg": "50.00",
    "total_price": "2250.00",
    "status": "pending",
    "created_at": "2026-10-13T18:39:27.000Z",
    "updated_at": "2026-10-13T18:39:27.000Z",
    "product_name": "Roma Tomatoes",
    "buyer_name": "Test Buyer",
    "buyer_phone": "0700000001",
    "buyer_county": "Nairobi",
    "buyer_company_name": "Test Foods Ltd",
    "buyer_delivery_address": null,
    "farmer_name": "James Mwangi"
  }
]
```

**Change an order's status** (`pending`, `confirmed`, `delivered`, `cancelled`):

```bash
curl -X PUT -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/orders/1 -H "Content-Type: application/json" -d '{"status":"confirmed"}'
```

**Response** — `200 OK`

```json
{
  "message": "Order status updated"
}
```

### Ratings

**Rate a farmer** (`rating` is a whole number 1–5; `orderId` and `reviewText` optional):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/ratings -H "Content-Type: application/json" -d '{"farmerId":1,"buyerId":4,"orderId":1,"rating":5,"reviewText":"Fresh and on time"}'
```

**Response** — `201 Created`

```json
{
  "message": "Rating submitted successfully",
  "id": 1
}
```

**Get a farmer's ratings** — with `farmerId` you also get the average and count. (`averageRating` is a string like `"5.0"`, or the number `0` if the farmer has no ratings yet.)

```bash
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:5000/api/ratings?farmerId=1"
```

**Response** — `200 OK`

```json
{
  "ratings": [
    {
      "id": 1,
      "farmer_id": 1,
      "buyer_id": 4,
      "order_id": 1,
      "rating": 5,
      "review_text": "Fresh and on time",
      "created_at": "2026-10-13T18:39:27.000Z"
    }
  ],
  "averageRating": "5.0",
  "reviewCount": 1
}
```

### Enquiries ("Contact Farmer")

**Send an enquiry** about a listing (the API looks up the farmer from the listing):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/enquiries -H "Content-Type: application/json" -d '{"productId":1,"buyerId":4,"message":"Can you deliver to Nairobi?"}'
```

**Response** — `201 Created`

```json
{
  "message": "Enquiry sent to farmer",
  "id": 1
}
```

**List a farmer's enquiries:**

```bash
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:5000/api/enquiries?farmerId=1"
```

**Response** — `200 OK`

```json
[
  {
    "id": 1,
    "product_id": 1,
    "buyer_id": 4,
    "farmer_id": 1,
    "message": "Can you deliver to Nairobi?",
    "created_at": "2026-10-13T18:39:27.000Z",
    "product_name": "Roma Tomatoes",
    "buyer_name": "Test Buyer"
  }
]
```

### Contact form

**Submit the About & Contact form** (required: `name`, `contactInfo`, `message`):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/contact -H "Content-Type: application/json" -d '{"name":"Wanjiru","contactInfo":"wanjiru@example.com","subject":"Partnership","message":"Hello, we would like to buy maize."}'
```

**Response** — `201 Created`

```json
{
  "message": "Inquiry submitted successfully",
  "messageId": 1
}
```

### Headquarters and market prices (read-only partner data)

**List headquarters:**

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/headquarters
```

**Response** — `200 OK`

```json
[
  {
    "id": 1,
    "region_name": "Shamba Direct HQ",
    "county": "Nairobi",
    "address": "2nd Floor, Ngong Road Plaza, Ngong Road, Nairobi",
    "latitude": null,
    "longitude": null,
    "created_at": "2026-10-13T18:38:50.000Z"
  }
]
```

**List market prices** — optional `county` filter:

```bash
curl -H "X-API-Key: YOUR_API_KEY" "http://localhost:5000/api/market-prices?county=Nyandarua"
```

**Response** — `200 OK`

```json
[
  {
    "id": 3,
    "crop_name": "Potatoes",
    "price_per_kg": "28.00",
    "county": "Nyandarua",
    "updated_at": "2026-10-13T18:38:50.000Z"
  }
]
```

### Delete

**Delete an order** (every `DELETE /…/{id}` works the same way):

```bash
curl -X DELETE -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/orders/1
```

**Response** — `200 OK`

```json
{
  "message": "Order deleted successfully"
}
```

### All endpoints

Full request/response detail for each is in [`docs/index.html`](docs/index.html).

| Method | Path | What it does |
|---|---|---|
| GET | `/` | Plain-text liveness check |
| GET | `/api/test-db` | Database connectivity check |
| POST | `/api/auth/register` | Create a farmer or buyer account |
| POST | `/api/auth/login` | Check phone + password, return profile |
| PUT | `/api/auth/users/{id}` | Update a user's profile (partial) |
| DELETE | `/api/auth/users/{id}` | Delete an account (and its listings, orders…) |
| GET | `/api/products` | List/filter listings |
| POST | `/api/products` | Create a listing |
| GET | `/api/products/{id}` | One listing (+1 view) |
| PUT | `/api/products/{id}` | Update a listing (partial) |
| DELETE | `/api/products/{id}` | Delete a listing |
| GET | `/api/orders` | List/filter orders |
| POST | `/api/orders` | Place an order |
| PUT | `/api/orders/{id}` | Change order status |
| DELETE | `/api/orders/{id}` | Delete an order |
| GET | `/api/ratings` | List ratings (`farmerId` adds average + count) |
| POST | `/api/ratings` | Rate a farmer |
| DELETE | `/api/ratings/{id}` | Delete a rating |
| GET | `/api/enquiries` | List enquiries (`farmerId`, `productId`) |
| POST | `/api/enquiries` | Send an enquiry |
| DELETE | `/api/enquiries/{id}` | Delete an enquiry |
| GET | `/api/contact` | List contact-form messages |
| POST | `/api/contact` | Submit the contact form |
| DELETE | `/api/contact/{id}` | Delete a message |
| GET | `/api/headquarters` | List headquarters |
| POST | `/api/headquarters` | Add a headquarters |
| GET | `/api/headquarters/{id}` | One headquarters |
| PUT | `/api/headquarters/{id}` | Update a headquarters (partial) |
| DELETE | `/api/headquarters/{id}` | Delete a headquarters |
| GET | `/api/market-prices` | List prices (`county` filter) |
| POST | `/api/market-prices` | Add a price |
| PUT | `/api/market-prices/{id}` | Update a price's value |
| DELETE | `/api/market-prices/{id}` | Delete a price |

## 5. Error format

**A failed request always returns a JSON body with one key, `error`, holding a message. A successful request never has an `error` key — it has `message` (and usually an `id`).** So to tell them apart: check the HTTP status (`2xx` = success), or check whether the body has `error`.

```json
{ "error": "Listing not found" }
```

| Status | Meaning | Real example |
|---|---|---|
| `400` | Missing/invalid input | see below |
| `401` | Wrong phone number or password | see below |
| `404` | That record (or URL) doesn't exist | see below |
| `409` | Duplicate account (phone/email taken) | see below |
| `500` | Server or database failure (e.g. you referenced a `farmerId` that doesn't exist) | see below |

**404 — record not found**

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products/9999
```

**Response** — `404 Not Found`

```json
{
  "error": "Listing not found"
}
```

**400 — missing required fields** (the message lists them):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products -H "Content-Type: application/json" -d '{"name":"Kale"}'
```

**Response** — `400 Bad Request`

```json
{
  "error": "farmerId, name, pricePerKg and quantityKg are required"
}
```

**400 — value out of range:**

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/orders -H "Content-Type: application/json" -d '{"productId":1,"buyerId":4,"quantityKg":0}'
```

**Response** — `400 Bad Request`

```json
{
  "error": "quantityKg must be greater than 0"
}
```

**401 — bad credentials:**

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"phoneNumber":"0700000001","password":"wrong"}'
```

**Response** — `401 Unauthorized`

```json
{
  "error": "Invalid credentials"
}
```

**409 — phone number already registered** (run after the register example above):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"role":"buyer","fullName":"Test Buyer","phoneNumber":"0700000001","password":"secret123"}'
```

**Response** — `409 Conflict`

```json
{
  "error": "An account with that phone number or email already exists"
}
```

**400 — body isn't valid JSON:**

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products -H "Content-Type: application/json" -d '{bad json'
```

**Response** — `400 Bad Request`

```json
{
  "error": "Request body is not valid JSON"
}
```

**404 — URL doesn't exist:**

```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/nope
```

**Response** — `404 Not Found`

```json
{
  "error": "Route not found: GET /api/nope"
}
```

**500 — database rejected the request** (`farmerId` 9999 doesn't exist):

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products -H "Content-Type: application/json" -d '{"farmerId":9999,"name":"Kale","pricePerKg":30,"quantityKg":200}'
```

**Response** — `500 Internal Server Error`

```json
{
  "error": "Failed to add listing"
}
```

### The mistake almost everyone makes once

If you forget `-H "Content-Type: application/json"`, curl sends the body as a form instead, the API ignores it, and you get a **400 that complains the fields are missing even though you sent them**:

```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/products -d '{"farmerId":1,"name":"Kale","pricePerKg":30,"quantityKg":200}'
```

**Response** — `400 Bad Request`

```json
{
  "error": "farmerId, name, pricePerKg and quantityKg are required"
}
```

Add the header and the same request works.

## Conventions

- **Requests use camelCase** (`pricePerKg`); **responses use snake_case** (`price_per_kg`) because they come straight from the database.
- **Decimals are strings.** Prices, quantities and coordinates (`"45.00"`, `"0.282700"`) are serialized as strings — convert before doing arithmetic. Whole numbers (`id`, `views`, `rating`) are numbers.
- **Timestamps** are ISO-8601 UTC (`2026-10-13T18:34:13.000Z`).
- **`PUT` is a partial update.** Send only the fields to change; omitted fields are left alone. (`PUT /api/market-prices/{id}` is the exception — `pricePerKg` is required.)
- **Deleting a user** also deletes everything that depends on them — their listings, orders, ratings and the enquiries they received (database cascade).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `mysql: command not found` | MySQL's `bin` folder isn't on your PATH. See [DATABASE_SETUP.md](DATABASE_SETUP.md) for Windows/Workbench alternatives. |
| `ERROR 1045 Access denied` (from `mysql`) or `Database connection failed` / `Access denied for user` (from the API) | Wrong password. Check `DB_PASSWORD` in `server/.env`, then restart `npm start` (`.env` is only read at startup). |
| `ECONNREFUSED` / can't connect to MySQL | MySQL isn't running. Start the MySQL service. |
| `Unknown database 'shamba_direct_db'` | Step 2 (import `schema.sql`) wasn't done. |
| `EADDRINUSE … :5000` | Something else uses port 5000. Set `PORT=5001` in `server/.env`, restart, and use `http://localhost:5001` in every command. |
| PowerShell shows a parameter/security prompt or odd output instead of JSON | `curl` is a PowerShell alias — use `curl.exe` (see the note in section 2). |
| Walk-through ids don't match (`userId` is 7, not 4) | The database already has data. Reset it (below) and start from the top. |

**Reset the database to a fresh state** (deletes all local data):

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS shamba_direct_db"
mysql -u root -p --default-character-set=utf8mb4 < server/sql/schema.sql
```

## Tests

```bash
cd server
npm test
```

70 automated tests (supertest + Jest) run against your local database and **create/modify rows in it** — reset the database afterwards if you want the walk-through ids above to line up.

## Rebuilding the docs

`docs/index.html` is generated from `openapi.yaml` with [Redoc](https://redocly.com/redoc). After editing `openapi.yaml`:

```bash
npx @redocly/cli lint openapi.yaml
npx @redocly/cli build-docs openapi.yaml -o docs/index.html --title "Shamba Direct API Docs"
```

Commit the regenerated `docs/index.html`. (The page is pre-rendered, so it is readable offline; the interactive sidebar loads Redoc's script from a CDN and needs internet.)

## The React app (optional)

The `client/` folder is the web front end for this API. With the API running:

```bash
cd client
cp .env.example .env      # points the app at http://localhost:5000/api
npm install
npm start                 # opens http://localhost:3000
```

## Project layout

```
Shamba-direct-webapp/
├── openapi.yaml            API contract (source of truth for the docs)
├── docs/index.html         rendered API reference (generated)
├── README.md               this file
├── BLIND_TEST_REPORT.md    Week 8 blind-test report
├── DATABASE_SETUP.md       detailed MySQL setup + troubleshooting (Windows-friendly)
├── PARTNER_TEST_RESULTS.md Week 7 partner-test write-up
├── API_NEEDS.md, ENDPOINTS_LIST.md, TEAM_CHARTER.md   Weeks 2–3 planning docs
├── server/                 Express API
│   ├── routes/             auth, products, orders, enquiries, contact, ratings, headquarters, marketPrices
│   ├── sql/schema.sql      every table + seed data
│   ├── __tests__/          Jest/supertest suites (+ partner-suite/)
│   ├── app.js              builds the Express app (routes + JSON error handlers)
│   └── index.js            starts the server
└── client/                 React app (Create React App)
```
