# Shamba Direct — Full Stack (React + Express + MySQL)

Kenya's Farmer-to-Company Marketplace. This project was converted from a
static HTML/CSS/JS site into a React front end backed by a real Express +
MySQL API — every form and button that used to be decorative now performs
a real INSERT, UPDATE, or DELETE against the database.


## API overview

Shamba Direct is a REST API for a farmer-to-buyer produce marketplace in Kenya. It was built after seeing farmers earn about KES 10 per kg for tomatoes that retailed for KES 60 in Nairobi, with brokers taking the difference. The API gives farmers a direct digital route to the companies that need their produce, and gives other apps read access to the data behind it: active produce listings, current market prices per kg, verified farmer ratings, and headquarters locations. Buyers can also submit an enquiry about a listing, which reaches the farmer who owns it.

Interactive docs: https://kiptoo345.github.io/Shamba-direct-webapp/

## Authentication

The endpoints documented below are **public**. No token, API key or header is needed, so you can call them as shown in the examples.

The documented endpoints do not return private fields such as phone numbers, national IDs or password hashes.




## Run the API locally

### Prerequisites

- Node.js 18 or later
- MySQL running locally, with a user that can create databases

### 1. Clone the repo

```bash
git clone https://github.com/Kiptoo345/Shamba-direct-webapp.git
cd Shamba-direct-webapp
```

### 2. Create the database

```bash
mysql -u root -p < server/sql/schema.sql
```

On Windows PowerShell, `<` doesn't work. Use:

```powershell
mysql -u root -p -e "source server/sql/schema.sql"
```

This creates the `shamba_direct_db` database, all tables and seed data.

### 3. Configure the server

```bash
cd server
cp .env.example .env
```

On Windows PowerShell: `copy .env.example .env`

Open `.env` and set DB_USER and DB_PASSWORD, to match your MySQL login in the example. Leave the rest as they are.

### 4. Install and start

```bash
npm install
npm start
```

You should see `Server is running on http://localhost:5000`.

### 5. Check that it works

In a new terminal:

```bash
curl http://localhost:5000/api/listings
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
curl.exe http://localhost:5000/api/listings
```

If you get a connection error, the API isn't running. Check that the server terminal says `Server is running on http://localhost:5000`.


## Endpoint examples

### GET /api/listings

Returns all active produce listings. 

```bash
curl http://localhost:5000/api/listings
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
curl http://localhost:5000/api/listings/1
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
curl http://localhost:5000/api/market-prices
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
curl http://localhost:5000/api/farmers/ratings
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
curl http://localhost:5000/api/farmers/1/rating
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
curl http://localhost:5000/api/headquarters
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
curl http://localhost:5000/api/headquarters/1
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
curl -X POST http://localhost:5000/api/enquiries \
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
curl.exe -X POST http://localhost:5000/api/enquiries -H "Content-Type: application/json" -d "@enquiry.json"
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
curl http://localhost:5000/api/listings/999999
```

Response `404`:

```json
{ "error": "Listing not found" }
```

### 404: farmer not found

```bash
curl http://localhost:5000/api/farmers/999999/rating
```

Response `404`:

```json
{ "error": "Farmer not found" }
```

### 400: id is not an integer

```bash
curl http://localhost:5000/api/listings/abc
```

Response `400`:

```json
{ "error": "listing_id must be an integer" }
```

### 400: missing required fields

```bash
curl -X POST http://localhost:5000/api/enquiries \
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

See `server/sql/schema.sql` for full column definitions, foreign keys, and
seed rows.
