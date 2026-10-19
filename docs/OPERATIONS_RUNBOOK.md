# Operations Runbook

## Monitoring

- **Liveness:** `GET /health` — process is up. Use for the host's health check.
- **Readiness:** `GET /health/ready` — JSON with database, SMTP, Fiken and e-mail queue checks.
  Returns `503` when the database is down, `200` with `"status":"degraded"` when something needs
  attention (SMTP not configured, failed or stuck e-mails). No secrets are included.
- **Uptime monitor:** point a free monitor (UptimeRobot, Better Stack) at
  `https://<api-host>/health/ready` and alert on non-200 responses or the keyword `"unhealthy"`.
- **Alerts:** set `Alerts__WebhookUrl` to a Slack/Discord/Teams incoming webhook. The API posts
  on unhandled 5xx errors and permanently failed e-mails (throttled to one per kind every 15 min).
- **In the admin:** *Oppsett → System* shows the same status, the e-mail queue (with retry) and the
  change log (who changed what, logins and failed logins).

## E-mail

E-mails are written to an outbox and sent by a background worker (retries after 1, 5, 15 and 60
minutes; 5 attempts). If SMTP is not configured they stay `Failed` and can be retried from the
System page once it is. Use *Innstillinger → send test-e-post* to verify SMTP directly.

## Login protection

Admin and driver logins lock for 15 minutes after 5 failures (per IP, and per phone for drivers).
Failed and successful logins appear in the change log. A restart clears lockouts.

## Backups

- `scripts/backup-db.sh` — `pg_dump` (custom format) with retention (`KEEP`, default 14).
- `scripts/restore-test.sh` — restores a dump into a temporary database and checks the data.
- `.github/workflows/backup.yml` runs both nightly per customer. Add repository secrets
  `DATABASE_URL_NIDAROS`, `DATABASE_URL_HAGA`, `DATABASE_URL_KJOSAVIK`, `DATABASE_URL_TEAMTOUR`
  (the production Postgres URLs). Dumps are kept as workflow artifacts for 14 days.
- Also enable the database host's own point-in-time backups where available.

### Restoring production

1. Download the newest `backup-<customer>` artifact (or the host's snapshot).
2. Create an empty database, then `pg_restore --no-owner --dbname=<url> backup.dump`.
3. Point the API's `ConnectionStrings__Default` at it and start the API — pending migrations apply
   automatically.
4. Check `/health/ready` and the admin System page.

Run `restore-test.sh` against a fresh dump regularly; an untested backup is not a backup.

## Tests and CI

### Customer promotion

Run **Promote main to customer(s)** in GitHub Actions, selecting one customer or `all`.
It fast-forwards each selected `deploy/<slug>` branch to `main` without force-pushing,
then explicitly dispatches that customer's frontend deployment on the promoted branch.
Render follows the branch through its own Git integration.

Promotion uses the repository's automatic `GITHUB_TOKEN` with `contents: write` and
`actions: write`; no `GH_PAT` secret is needed. Explicit dispatch is required because
pushes made with `GITHUB_TOKEN` do not trigger other push workflows.

### Application tests

`dotnet test backend.Tests` runs pricing unit tests; database tests (booking validation, server
pricing, invoice numbering, conflict checks, outbox, audit) need a Postgres user that can create
databases: `TEST_PG="Host=localhost;Username=postgres;Database=postgres"`. CI does this on every
pull request (`.github/workflows/ci.yml`).
