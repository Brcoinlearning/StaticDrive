#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

PB_HOST="${PB_HOST:-127.0.0.1}"
PB_PORT="${PB_PORT:-8090}"
BASE_URL="http://${PB_HOST}:${PB_PORT}"

echo "Checking PocketBase health at ${BASE_URL}/api/health ..."
HEALTH_OUTPUT="$(curl -fsS "${BASE_URL}/api/health")"
echo "$HEALTH_OUTPUT"

echo "Checking migration files ..."
test -f "$ROOT_DIR/pb_migrations/1700000000_create_users.js"
test -f "$ROOT_DIR/pb_migrations/1700000001_create_contents.js"
test -f "$ROOT_DIR/pb_migrations/1700000002_create_share_links.js"

echo "T1 local preflight passed."
echo "Note: collection-level read/write verification requires PocketBase admin bootstrap and migration execution in the running instance."
