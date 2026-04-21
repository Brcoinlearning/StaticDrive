#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_ENV_FILE="${DOCKER_ENV_FILE:-$ROOT_DIR/.env.docker.example}"
DOCKER_PROJECT_NAME="${DOCKER_PROJECT_NAME:-static-content-service}"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_file() {
  [ -f "$1" ] || {
    echo "Required file not found: $1" >&2
    exit 1
  }
}

load_docker_demo_env() {
  require_file "$DOCKER_ENV_FILE"

  set -a
  # shellcheck disable=SC1090
  . "$DOCKER_ENV_FILE"
  set +a

  export APP_ENV_FILE="${APP_ENV_FILE:-.env}"
  export DEMO_SERVICE_BASE_URL="${DEMO_SERVICE_BASE_URL:-http://127.0.0.1:8787}"
  export DEMO_PUBLIC_WEB_BASE_URL="${DEMO_PUBLIC_WEB_BASE_URL:-http://127.0.0.1:8787/web/public}"
  export DEMO_API_HEADER="${DEMO_API_HEADER:-${API_KEY_HEADER:-x-shutong49-api-key}}"
  export DEMO_API_KEY="${DEMO_API_KEY:-docker_verify_api_key_0001}"
}

require_docker_stack_healthy() {
  local ps_output
  ps_output="$(APP_ENV_FILE="$APP_ENV_FILE" docker compose -p "$DOCKER_PROJECT_NAME" --env-file "$DOCKER_ENV_FILE" ps 2>/dev/null || true)"

  if ! printf '%s\n' "$ps_output" | rg -q 'static-content-pocketbase'; then
    echo "Docker stack not found. Start it first:" >&2
    echo "APP_ENV_FILE=.env.docker.example docker compose -p $DOCKER_PROJECT_NAME --env-file .env.docker.example up -d" >&2
    exit 1
  fi

  if ! printf '%s\n' "$ps_output" | rg -q 'static-content-pocketbase.+healthy'; then
    echo "PocketBase container is not healthy yet." >&2
    printf '%s\n' "$ps_output" >&2
    exit 1
  fi

  if ! printf '%s\n' "$ps_output" | rg -q 'static-content-app.+healthy'; then
    echo "App container is not healthy yet." >&2
    printf '%s\n' "$ps_output" >&2
    exit 1
  fi
}

require_configured_admin_credentials() {
  if [ "${PB_ADMIN_EMAIL:-}" = "admin@example.com" ] || [ -z "${PB_ADMIN_EMAIL:-}" ]; then
    echo "PB_ADMIN_EMAIL in $DOCKER_ENV_FILE is still placeholder or empty." >&2
    echo "Set it to the PocketBase admin identity you actually created." >&2
    exit 1
  fi

  if [ "${PB_ADMIN_PASSWORD:-}" = "replace-with-strong-ascii-password" ] || [ -z "${PB_ADMIN_PASSWORD:-}" ]; then
    echo "PB_ADMIN_PASSWORD in $DOCKER_ENV_FILE is still placeholder or empty." >&2
    echo "Set it to the PocketBase admin password you actually created." >&2
    exit 1
  fi
}

print_docker_demo_preamble() {
  echo "[docker-demo] env file: $DOCKER_ENV_FILE"
  echo "[docker-demo] project: $DOCKER_PROJECT_NAME"
  echo "[docker-demo] service base: $DEMO_SERVICE_BASE_URL"
  echo "[docker-demo] public base: $DEMO_PUBLIC_WEB_BASE_URL"
  echo "[docker-demo] api key header: $DEMO_API_HEADER"
  echo "[docker-demo] api key value: $DEMO_API_KEY"
}

require_command docker
require_command rg
require_command curl
require_command node
