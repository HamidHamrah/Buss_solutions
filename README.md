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
Go to `http://localhost:5173/logg-inn` and log in with the seeded admin credentials below.

## Demo credentials

All four demo sites share the same seed credentials. The admin account also doubles as
the driver login — there are no separate seeded driver accounts.

| Customer | URL | Admin/Driver phone | Password |
|---|---|---|---|
| Kjosavik Reiser | https://kjosavik-reiser-staging.s362052.workers.dev | 90000000 | Test123! |
| Nidaros Turbuss | https://nidaros-turbuss-staging.s362052.workers.dev | 90000000 | Test123! |
| Team Tour | https://team-tour-staging.s362052.workers.dev | 90000000 | Test123! |
| Haga Turbusser | https://haga-turbusser-staging.s362052.workers.dev | 90000000 | Test123! |

Login page is at `/logg-inn` on each site. Driver app is at `/sjåfør`.
