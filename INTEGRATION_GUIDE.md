# Salama to Shamba Direct Integration Guide

## 1. Purpose

This integration connects Shamba Direct to Salama.

The integration provides:

1. A support services directory fetched from Salama with GET requests.
2. County-based support service filtering.
3. Anonymous economic-exploitation report storage in Shamba Direct's database.

This integration does not replace Shamba Direct's crop marketplace,
crop listings, farmer accounts, or external crop-price API.

---

## 2. Salama services API

### Support resources

Salama endpoint:

GET /api/resources

Example:

GET /api/resources?county=nairobi&type=legal

Shamba Direct exposes this through:

GET /api/salama/resources?county=nairobi&type=legal

Available types:

- hotline
- shelter
- legal
- medical
- mental-health

Purpose:

Retrieve support organisations and display them inside
Shamba Direct.

Shamba Direct retrieves the directory from Salama using GET.
Salama is not used to store incident reports.

## 3. Protection reporting

The Farmers Protection page keeps separate reporting forms for
economic exploitation and other marketplace concerns:

- `POST /api/reports/economic-exploitation` stores anonymous
  economic exploitation reports in
  `economic_exploitation_reports`.
- `POST /api/salama/consumer-reports` stores anonymous marketplace
  concern reports in `consumer_protection_reports`.

### Salama volunteer API

Endpoint:

GET /api/volunteers

This endpoint is not included in the integration.

The current implementation exposes personal volunteer
information, including email addresses and phone numbers.

Salama should provide a privacy-safe public service-provider
endpoint before Shamba Direct consumes this information.

---

## 4. Database setup

New database installations include the report table in
`server/sql/schema.sql`.

For existing databases, apply the migrations:

```bash
mysql -u root -p shamba_direct_db < server/sql/migrations/001_economic_exploitation_reports.sql
```

---

## 5. Environment configuration

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
to Salama, if required by the support-resources endpoint.

Never expose SALAMA_API_KEY in React source code.
Incident reports are stored locally and do not require a
Salama incident-write API key.

---

## 6. Frontend

The support directory uses `client/src/api/salama.js` and
retrieves resources from `GET /api/salama/resources`.

The Farmers Protection page uses `submitEconomicAbuseReport` from
`client/src/api/api.js` for economic exploitation reports and
`submitConsumerProtectionReport` from `client/src/api/salama.js` for
other marketplace concerns.

---

## 7. Testing

First start Salama's backend.

Confirm that its health endpoint works:

GET http://localhost:5000/api/health

Then start Shamba Direct.

Open:

http://localhost:3000/farmers-protection

Test the following:

1. Select Nairobi.
2. Select Legal Aid.
3. Confirm that the resources are displayed.
4. Change the county.
5. Confirm that the results update.
6. Stop Salama's server.
7. Confirm that Shamba Direct displays an error instead of crashing.
8. Restart Salama and test again.

Reports submitted during testing are written to the configured
Shamba Direct database. Use synthetic details and remove test
reports according to the project's data-retention policy.

---

## 8. Questions for the Salama team

1. What is the reachable API base URL?
2. What API-key header should Shamba Direct use?
3. What is the API key issued to Shamba Direct?
4. Can Salama provide a privacy-safe service-provider
   endpoint filtered by availability?
5. What service-data update and availability guarantees apply?

---

## 9. Security

- Keep API keys in environment variables.
- Never commit .env.
- Never expose API keys in React.
- Do not log API keys.
- Do not log incident descriptions.
- Do not collect unnecessary personal information.
- Explain to users that the support directory comes from an external service.
- Restrict database access to confidential reports and define
  a report-retention policy before production use.

---

## 10. Important integration limitations

The support-resources endpoint supports county and type
filters, but not a structured availability filter. Protection
reports are stored locally and are not submitted to Salama.

Confirm these points with the Salama team before deployment.