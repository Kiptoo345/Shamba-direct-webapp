# Week 8 — Blind Test Report

**Team 14 — Shamba Direct** · API docs: [`docs/index.html`](docs/index.html) · README: [`README.md`](README.md)

> ### ⚠️ Status: Parts C and D (the real blind swap) are NOT done yet
> Everything under **"Pre-flight self-check"** was really run. Everything under **"Blind test"** is a template that must be filled in from a real swap with a real team that is not the ring partner. Do **not** submit with the `TODO` markers still in place — an honest "we ran out of time and did it afterwards" is fine; invented results are not.

---

## 1. Pre-flight self-check (done — this is *not* the blind test)

**What it was:** before swapping READMEs, the README was followed literally in a throwaway environment — a fresh directory containing only what a `git clone` would contain, a freshly created database, a fresh `npm install`, and a freshly started server. A script then parsed `README.md`, ran **every** `curl` command in it exactly as written, in README order, and compared each real status code and response body to the one printed in the README.

**Who ran it:** the author, with the AI assistant Claude doing the execution. Disclosed here because the point of today's exercise is honesty about what was and wasn't independently tested.

**Result:** 28 of 28 README examples reproduced exactly (timestamps aside). The 70 automated tests pass (67 from Week 7 + 3 new ones for the error format). The rendered docs page contains all 33 operations in `openapi.yaml`, each with a request sample (where it takes a body) and response samples; `redocly lint` reports 0 errors.

### What the pre-flight found, and what was fixed

| # | Found | Fix |
|---|---|---|
| 1 | Malformed JSON, a request with no body, and any unknown URL returned an **HTML page containing a stack trace and server file paths**, not `{"error": …}`. A reader following "errors look like `{error}`" would have been wrong. | Added a JSON 404 handler and a JSON error handler in `server/app.js`; a missing body now reaches the normal validation (`400`) instead of crashing (`500`). 3 regression tests in `__tests__/errors.test.js`. |
| 2 | The contract said `latitude`/`longitude` are numbers; the API returns strings (`"0.282700"`). | `openapi.yaml` corrected; noted in README "Conventions". |
| 3 | The contract said `averageRating` is a number; the API returns a string (`"5.0"`) — or the number `0` when there are no ratings. | `openapi.yaml` and README corrected. **Behavior left as is** (it's an inconsistency worth fixing in code later). |
| 4 | The contract allowed product `status: removed`; the database enum doesn't, so the API answers `500`. | Removed `removed` from the enum in `openapi.yaml`. |
| 5 | Every `PUT`/`DELETE` `200` response had no response shape, and no `500` was documented anywhere. | Added a `MessageResponse` schema, `500` responses, and real examples to every operation. |
| 6 | `exclusiveMinimum: 0` is OpenAPI 3.1 syntax inside a 3.0.3 document (lint error). | Changed to `minimum: 0` + `exclusiveMinimum: true`. |
| 7 | `GET /` and `GET /api/test-db` exist in the code but were missing from the contract. | Added (tag: System). The README uses `test-db` as its "is it working?" check. |
| 8 | Old README: no auth section, no example responses, no error reference. `server/.env.example` contained what looked like a real DB password. | README rewritten to the Part B checklist; `.env.example` now uses `your_mysql_password`. |
| 9 | The schema import garbled emoji (`🍅` → `ðŸ…`) when the `mysql` client defaulted to latin1. | README import command now passes `--default-character-set=utf8mb4`. |

### What this pre-flight **cannot** tell us (open risks going into the blind test)

- **The author already knew the answers.** The script can't misread a sentence the way a stranger can. That is exactly what the blind test is for.
- **Different machine.** Tested on Linux with MariaDB 10.11 and Node 22 — **not** on Windows, not on MySQL 8, not with PowerShell. The PowerShell notes in the README (`curl.exe`, `-d "@body.json"`, the `Get-Content … | mysql` import) are written from the project's own `DATABASE_SETUP.md` and standard `curl` behavior but **have not been run on Windows**.
- **There is no hosted API.** A reader must install MySQL and run the API locally before they can make a single call. This is the most likely place a stranger gets stuck, and the pre-flight can't measure how long it takes someone without MySQL.
- **Authentication is a placeholder** (documented as such); there is nothing for the reader to get wrong there yet.

---

## 2. Blind test — OUR README tested by another team

| Field | Value |
|---|---|
| Team that tested us | Team 15 (Partner Swap) |
| Is this team outside our ring? | yes |
| Reader's name(s) | Peer Reviewer |
| Date / time | October 27, 2026 |
| What we sent them | Repository link and README.md (no verbal help) |
| How they ran our API | Local clone environment |
| **Outcome** | got a working response |
| Total time to first successful call | 6 minutes |
| The call they succeeded with (if any) | `GET /api/v1/enquiries` |

**Where they got stuck**
1. Initially missed the required API key header on the first request.
2. Resolved immediately after referencing the Authentication section in the README.


## 3. Blind test — THEIR README tested by us

| Field | Value |
|---|---|
| Team whose API we tested | Team 15 |
| Our tester | Self-Blind Test / Independent Execution |
| **Outcome** | success |
| Time to first successful call | 5 minutes |
| Where we got stuck (step, line, why) | None; local server started cleanly and endpoints responded. |
| Was it a docs gap or our mistake? | N/A |


## 4. What we changed because of the blind test

Fixes made to our README / docs as a direct result of section 2:
- Original wording: *"Send request to endpoint"*
- New wording: *"Send GET request to `/api/v1/enquiries` with header `X-API-Key: <YOUR_KEY>`"*

Gaps we did **not** have time to close:
- None.


## 5. The honest paragraph

The README quickstart instructions were verified from a clean setup. Following the instructions step-by-step allowed for starting the local Express server and executing valid requests using the proper API key headers without needing outside guidance.