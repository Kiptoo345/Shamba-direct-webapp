# Salama to Shamba Direct Integration Guide

## 1. Purpose

This integration connects Shamba Direct to Salama.

The integration provides:

1. A support services directory.
2. County-based support service filtering.
3. Economic-abuse incident reporting.

This integration does not replace Shamba Direct's crop marketplace,
crop listings, farmer accounts, or external crop-price API.

---

## 2. Salama APIs

### A. Support resources

Endpoint:

GET /api/resources

Example:

GET /api/resources?county=nairobi&type=legal

Available types:

- hotline
- shelter
- legal
- medical
- mental-health

Purpose:

Retrieve support organisations and display them inside
Shamba Direct.

### B. Economic-abuse incident reporting

Endpoint:

POST /api/incidents

The integration sends:

{
  "incident_type": "economic",
  "incident_date": "2026-11-03",
  "county": "nairobi",
  "location": "Optional general area",
  "description": "Description of the incident.",
  "is_anonymous": true
}

Purpose:

Allow a user to submit an economic-abuse report to Salama.

### C. Volunteer API

Endpoint:

GET /api/volunteers

This endpoint is not included in the integration.

The current implementation exposes personal volunteer
information, including email addresses and phone numbers.

Salama should provide a privacy-safe public service-provider
endpoint before Shamba Direct consumes this information.

---

## 3. Backend installation

Copy these files into Shamba Direct:

server/services/salamaClient.js

server/routes/salama.js

Open:

server/app.js

Import the route:

const salamaRoutes = require('./routes/salama');

Mount the route before the unknown-route handler:

app.use('/api/salama', salamaRoutes);

Keep Shamba Direct's existing authentication middleware.

---

## 4. Environment configuration

Open:

server/.env

Add:

SALAMA_API_BASE_URL=http://localhost:5000/api

SALAMA_API_KEY=

SALAMA_API_KEY_HEADER=X-API-Key

SALAMA_TIMEOUT_MS=10000

Fill in the API URL and API key supplied by the Salama team.

Add the same variable names to:

server/.env.example

Never commit server/.env.

Important:

API_KEY_TEAM and SALAMA_API_KEY are different credentials.

API_KEY_TEAM authenticates requests to Shamba Direct.

SALAMA_API_KEY authenticates requests from Shamba Direct
to Salama.

Never expose SALAMA_API_KEY in React source code.

---

## 5. Frontend installation

Copy these files:

client/src/api/salama.js

client/src/pages/SafetySupport.jsx

client/src/styles/safety-support.css

Open:

client/src/App.js

Import:

import SafetySupport from './pages/SafetySupport';

Inside Routes, add:

<Route
  path="/safety-support"
  element={<SafetySupport />}
/>

Add a navigation link to /safety-support if required.

---

## 6. Testing

First start Salama's backend.

Confirm that its health endpoint works:

GET http://localhost:5000/api/health

Then start Shamba Direct.

Open:

http://localhost:3000/safety-support

Test the following:

1. Select Nairobi.
2. Select Legal Aid.
3. Confirm that the resources are displayed.
4. Change the county.
5. Confirm that the results update.
6. Stop Salama's server.
7. Confirm that Shamba Direct displays an error instead of crashing.
8. Restart Salama and test again.

Do not submit real incident reports until the Salama
team confirms that API-key authentication is implemented
and the incident endpoint is approved for partner writes.

---

## 7. Questions for the Salama team

1. What is the reachable API base URL?
2. What API-key header should Shamba Direct use?
3. What is the API key issued to Shamba Direct?
4. Has API-key authentication been implemented on
   POST /api/incidents?
5. Can Salama provide a privacy-safe service-provider
   endpoint filtered by availability?
6. What is the incident-report retention and follow-up policy?

---

## 8. Security

- Keep API keys in environment variables.
- Never commit .env.
- Never expose API keys in React.
- Do not log API keys.
- Do not log incident descriptions.
- Do not collect unnecessary personal information.
- Explain to users that Salama is an external service.
- Confirm privacy and consent requirements before
  enabling incident reporting in production.

---

## 9. Important integration limitations

The current Salama API needs further verification.

Its API needs document specifies API-key protection
for incident reporting.

However, the inspected implementation does not currently
enforce that authentication.

The integration sends the configured key, but Salama
must also validate it.

The current resources endpoint supports county and type
filters, but not a structured availability filter.

Confirm these points with the Salama team before deployment.