# Shamba Direct — Full Stack (React + Express + MySQL)

Kenya's Farmer-to-Company Marketplace. This project was converted from a
static HTML/CSS/JS site into a React front end backed by a real Express +
MySQL API — every form and button that used to be decorative now performs
a real INSERT, UPDATE, or DELETE against the database.

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
│   ├── routes/             auth, products, orders, enquiries, contact, ratings, headquarters, marketPrices
│   ├── sql/schema.sql      every table + seed data
│   ├── db.js               MySQL connection pool
│   └── index.js            app entry point
├── API_NEEDS.md            (unchanged — Week 2 downstream interview doc)
├── ENDPOINTS_LIST.md       (unchanged — Week 2 endpoint doc)
└── TEAM_CHARTER.md         (unchanged)
```

## 1. Set up the database

```bash
mysql -u root -p < server/sql/schema.sql
```

This creates the `shamba_direct_db` database, every table, and a small
amount of seed data so the Marketplace/Dashboard aren't empty on first run.

## 2. Run the API

```bash
cd server
cp .env.example .env      # edit DB_USER / DB_PASSWORD if needed
npm install
npm run dev                # nodemon, or `npm start` for plain node
```

The API listens on `http://localhost:5000` by default.

## 3. Run the React app

```bash
cd client
cp .env.example .env       # only needed if your API isn't on localhost:5000
npm install
npm start
```

The app opens on `http://localhost:3000` and talks to the API via
`REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

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
| Rate a farmer                              | `POST /api/ratings`                | INSERT `farmer_ratings` |
| Headquarters CRUD (admin/back office)       | `/api/headquarters`                | INSERT/UPDATE/DELETE `headquarters` |
| Market price feed CRUD (admin/pipeline)     | `/api/market-prices`               | INSERT/UPDATE/DELETE `market_prices` |

See `server/sql/schema.sql` for full column definitions, foreign keys, and
seed rows.
