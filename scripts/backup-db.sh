#!/usr/bin/env bash
# Dump one customer's database to a compressed, timestamped file.
#   DATABASE_URL=postgres://user:pass@host/db scripts/backup-db.sh [output-dir]
# Keeps the newest $KEEP backups (default 14) in the output directory.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the Postgres connection URL}"
OUT_DIR="${1:-backups}"
KEEP="${KEEP:-14}"

mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/backup-$(date -u +%Y%m%dT%H%M%SZ).dump"

pg_dump --format=custom --no-owner --no-privileges --file="$FILE" "$DATABASE_URL"
echo "Wrote $FILE ($(du -h "$FILE" | cut -f1))"

# shellcheck disable=SC2012
ls -1t "$OUT_DIR"/backup-*.dump | tail -n +$((KEEP + 1)) | xargs -I{} rm -f {}
