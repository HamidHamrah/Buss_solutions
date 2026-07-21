# Bus Solution — Canonical Booking Platform Template

Bus booking, trip planning, and driver-tracking platform. This is the canonical
template repo — one codebase shared across every customer, with each customer's
branding, fleet, pricing, and contact info kept in `customers/<slug>/config.json`
rather than duplicated across forked repos.

## Structure

- **frontend/** — React 19 + Vite + Tailwind CSS
- **backend/** — ASP.NET Core Web API (.NET 10) + PostgreSQL
- **customers/** — per-customer config + assets, selected via the `Customer:Slug` setting

## Running locally

### Backend
```bash
cd backend
dotnet run
# API runs on http://localhost:5119
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### Admin panel
Go to `http://localhost:5173/logg-inn` and log in with the seeded admin's phone number
and password (see the console output on first backend run, or `Admin:InitialPassword`
in configuration).
