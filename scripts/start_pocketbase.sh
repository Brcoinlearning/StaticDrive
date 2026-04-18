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
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/data}"
PB_PUBLIC_DIR="${PB_PUBLIC_DIR:-./pocketbase/public}"
PB_MIGRATIONS_DIR="${PB_MIGRATIONS_DIR:-./pb_migrations}"
PB_BIN="$ROOT_DIR/pocketbase/bin/pocketbase"

mkdir -p "$ROOT_DIR/$PB_DATA_DIR" "$ROOT_DIR/$PB_PUBLIC_DIR" "$ROOT_DIR/workspace"

if [ ! -x "$PB_BIN" ]; then
  echo "PocketBase binary not found: $PB_BIN" >&2
  echo "Run scripts/install_pocketbase.sh first." >&2
  exit 1
fi

exec "$PB_BIN" serve \
  --http="${PB_HOST}:${PB_PORT}" \
  --dir="$ROOT_DIR/$PB_DATA_DIR" \
  --publicDir="$ROOT_DIR/$PB_PUBLIC_DIR" \
  --migrationsDir="$ROOT_DIR/$PB_MIGRATIONS_DIR"
