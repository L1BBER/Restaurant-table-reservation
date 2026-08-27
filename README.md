# TableFlow — Restaurant Table Reservations

**An interactive restaurant floor plan with a reservation request and approval workflow.**

HTML · CSS · JavaScript · Node.js · Express

## Overview

TableFlow is a small full-stack reservation prototype. Guests select a table on a visual floor plan, submit their booking details, and see availability. The administrator view manages pending requests and existing reservations. A lightweight Express API persists the table state in a JSON file.

The repository keeps its original URL, `Restaurant-table-reservation`, so existing links continue to work. **TableFlow** is the project display name.

## Features

- Interactive floor plan and list with **14 configured tables** and seat counts.
- Three visible states: available, awaiting confirmation, and reserved.
- Reservation form with guest details, date, and time.
- Client-side validation that rejects dates and times in the past.
- Administrator view to approve or reject requests, edit reservations, and cancel bookings.
- Periodic API refresh to update the displayed table state.
- JSON-file persistence and a health-check endpoint.
- Polish user interface.

## How it works

```mermaid
flowchart LR
    A[Guest selects a table] --> B[Reservation request]
    B --> C[Pending confirmation]
    C --> D[Administrator decision]
    D --> E[Reserved or available]
    E --> F[Express API]
    F --> G[tables.json]
```

## Run locally

Prerequisites: Node.js with npm, plus Python 3 for the simple static-file server below.

```powershell
git clone https://github.com/L1BBER/Restaurant-table-reservation.git
cd Restaurant-table-reservation
npm ci
```

`API_URL` near the top of `script.js` defaults to the local API:

```javascript
const API_URL = "http://localhost:3000/api/tables";
```

Start the API in one terminal:

```powershell
node server/server.js
```

Start the frontend from the repository root in another terminal:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open [the frontend](http://localhost:8000) and check [API health](http://localhost:3000/health).

Both servers bind to loopback by default. `start.ps1` is a portable Windows helper for the same local setup. Do not expose this prototype to a public network or enter real guest details: it has no server-side authentication. LAN use requires deliberately configuring `HOST`, the frontend bind address, and `API_URL`.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Return server status |
| GET | `/api/tables` | Return the full table collection |
| POST | `/api/tables` | Replace the collection with a JSON array |

## Project structure

```text
index.html          Page structure and reservation form
style.css           Floor plan, states, and responsive layout
script.js           Browser state, rendering, forms, and API requests
server/server.js    Express API
server/tables.example.json  Empty 14-table layout (committed)
server/tables.json          Local reservation data (created on save; ignored)
start.ps1           Local Windows development helper
```

## Scope and limitations

This is a **local educational prototype**, not a production booking service.

- The administrator prompt is implemented in client-side JavaScript; it is a UI demonstration, not authentication or access control.
- The API has no server-side user authorization and allows broad CORS access.
- Each table holds one reservation state. There is no full booking calendar, time-slot conflict engine, payment flow, or confirmation email service.
- Writes replace the entire JSON collection. Concurrent users can overwrite each other's changes.
- The backend validates the outer array shape, not a complete reservation schema.
- Use synthetic guest data when demonstrating the app; avoid exposing it to the public internet in its current form.

## Validation

The repository's `npm test` is currently a placeholder and exits with an error. There is no automated application test suite yet. Useful initial checks are JavaScript syntax validation and a manual create → approve → edit → cancel flow against a disposable copy of the JSON data.

## Engineering focus

The project demonstrates DOM-driven UI state, form handling, a visual availability model, HTTP API integration, and simple backend persistence. Future development should prioritize server-side authentication, schema validation, database transactions, and reservation conflict tests.

## Data privacy

Only an empty floor plan is distributed. Actual reservations are saved to `server/tables.json`, which is not tracked by Git. Logs, local environment files, dependencies, IDE state, and shortcuts are excluded. Use synthetic booking data during demonstrations. See [SECURITY.md](SECURITY.md).
