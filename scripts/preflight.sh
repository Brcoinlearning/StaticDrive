#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

if [ -z "$MODE" ]; then
  echo "Usage: ./scripts/preflight.sh <pocketbase|service>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

PB_HOST="${PB_HOST:-127.0.0.1}"
PB_PORT="${PB_PORT:-8090}"
PB_BASE_URL="${PB_BASE_URL:-http://${PB_HOST}:${PB_PORT}}"
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/data}"
PB_PUBLIC_DIR="${PB_PUBLIC_DIR:-./pocketbase/public}"
PB_MIGRATIONS_DIR="${PB_MIGRATIONS_DIR:-./pb_migrations}"
PB_BIN="$ROOT_DIR/pocketbase/bin/pocketbase"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-}"
SERVICE_HOST="${SERVICE_HOST:-127.0.0.1}"
SERVICE_PORT="${SERVICE_PORT:-8787}"
WORKSPACE_DIR="${WORKSPACE_DIR:-./workspace}"

resolve_path() {
  local value="$1"

  if [ -z "$value" ]; then
    echo "$ROOT_DIR"
    return
  fi

  case "$value" in
    /*) echo "$value" ;;
    *) echo "$ROOT_DIR/$value" ;;
  esac
}

PB_DATA_PATH="$(resolve_path "$PB_DATA_DIR")"
PB_PUBLIC_PATH="$(resolve_path "$PB_PUBLIC_DIR")"
PB_MIGRATIONS_PATH="$(resolve_path "$PB_MIGRATIONS_DIR")"
WORKSPACE_PATH="$(resolve_path "$WORKSPACE_DIR")"

fail() {
  echo "[preflight:$MODE] $1" >&2
  exit 1
}

note() {
  echo "[preflight:$MODE] $1"
}

require_file() {
  local path="$1"
  local message="$2"
  [ -f "$path" ] || fail "$message"
}

require_dir() {
  local path="$1"
  local message="$2"
  [ -d "$path" ] || fail "$message"
}

require_non_empty() {
  local value="$1"
  local name="$2"
  [ -n "$value" ] || fail "$name is missing. Fill it in .env before starting."
}

validate_port_number() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) [ "$1" -ge 1 ] && [ "$1" -le 65535 ] ;;
  esac
}

port_listener() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | tail -n +2 | head -n 1
}

port_in_use() {
  [ -n "$(port_listener "$1")" ]
}

print_port_hint() {
  local port="$1"
  local listener
  listener="$(port_listener "$port")"

  if [ -n "$listener" ]; then
    echo "$listener" >&2
  fi

  echo "Use: lsof -nP -iTCP:${port} -sTCP:LISTEN" >&2
}

port_failure_message() {
  local label="$1"
  local host="$2"
  local port="$3"
  local listener
  listener="$(port_listener "$port")"

  echo "Port ${port} is already in use. ${label} cannot start on ${host}:${port}." >&2
  if [ -n "$listener" ]; then
    echo "$listener" >&2
  fi
  echo "Use: lsof -nP -iTCP:${port} -sTCP:LISTEN" >&2
}

check_http_health() {
  curl --silent --show-error --fail "$1" >/dev/null 2>&1
}

validate_port_number "$PB_PORT" || fail "PB_PORT must be an integer between 1 and 65535. Current value: $PB_PORT"
validate_port_number "$SERVICE_PORT" || fail "SERVICE_PORT must be an integer between 1 and 65535. Current value: $SERVICE_PORT"

require_file "$ENV_FILE" ".env is missing. Copy .env.example to .env first."

if [ "$MODE" = "pocketbase" ]; then
  if [ ! -x "$PB_BIN" ]; then
    fail "PocketBase binary not found at $PB_BIN. Run ./scripts/install_pocketbase.sh first."
  fi

  require_dir "$PB_MIGRATIONS_PATH" "PocketBase migrations directory not found: $PB_MIGRATIONS_PATH"

  mkdir -p "$PB_DATA_PATH" "$PB_PUBLIC_PATH" "$WORKSPACE_PATH"

  if port_in_use "$PB_PORT"; then
    port_failure_message "PocketBase" "$PB_HOST" "$PB_PORT"
    exit 1
  fi

  note "PocketBase preflight passed."
  note "data dir: $PB_DATA_PATH"
  note "public dir: $PB_PUBLIC_PATH"
  exit 0
fi

if [ "$MODE" = "service" ]; then
  require_non_empty "$PB_ADMIN_EMAIL" "PB_ADMIN_EMAIL"
  require_non_empty "$PB_ADMIN_PASSWORD" "PB_ADMIN_PASSWORD"

  mkdir -p "$WORKSPACE_PATH"

  if port_in_use "$SERVICE_PORT"; then
    port_failure_message "Business shell" "$SERVICE_HOST" "$SERVICE_PORT"
    exit 1
  fi

  if ! check_http_health "$PB_BASE_URL/api/health"; then
    fail "PocketBase is not reachable at ${PB_BASE_URL}. Start it first and confirm /api/health returns 200."
  fi

  note "Service preflight passed."
  note "workspace dir: $WORKSPACE_PATH"
  note "PocketBase health: $PB_BASE_URL/api/health"
  exit 0
fi

fail "Unknown mode: $MODE"
