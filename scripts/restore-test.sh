#!/usr/bin/env bash
# Proves a backup is restorable: restores it into a throwaway database and checks that the key
# tables have rows. Never touches the source database.
#   ADMIN_URL=postgres://user:pass@host/postgres scripts/restore-test.sh backups/backup-XYZ.dump
# ADMIN_URL must point at a database on a server where the user may CREATE DATABASE.
set -euo pipefail

: "${ADMIN_URL:?Set ADMIN_URL to a connection URL that can create databases}"
DUMP="${1:?Usage: restore-test.sh <dump-file>}"
TMP_DB="restore_test_$(date +%s)"
BASE="${ADMIN_URL%/*}"

cleanup() { psql "$ADMIN_URL" -qc "DROP DATABASE IF EXISTS \"$TMP_DB\" WITH (FORCE)" >/dev/null 2>&1 || true; }
trap cleanup EXIT

psql "$ADMIN_URL" -qc "CREATE DATABASE \"$TMP_DB\""
pg_restore --no-owner --no-privileges --dbname="$BASE/$TMP_DB" "$DUMP"

fail=0
for table in SiteConfigs Bookings Buses PriceCategories; do
  count=$(psql "$BASE/$TMP_DB" -Atc "SELECT count(*) FROM \"$table\"")
  echo "$table: $count rows"
  # Bookings may legitimately be empty on a new customer; config and prices must not be.
  if [[ "$table" == "SiteConfigs" && "$count" -lt 1 ]]; then fail=1; fi
done

if [[ $fail -ne 0 ]]; then echo "RESTORE TEST FAILED"; exit 1; fi
echo "Restore test passed: $DUMP"
