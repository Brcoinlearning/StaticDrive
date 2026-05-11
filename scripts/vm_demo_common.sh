#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VM_DEMO_ENV_FILE="${VM_DEMO_ENV_FILE:-$ROOT_DIR/.env}"

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

load_vm_demo_env() {
  require_file "$VM_DEMO_ENV_FILE"

  set -a
  # shellcheck disable=SC1090
  . "$VM_DEMO_ENV_FILE"
  set +a

  export DEMO_SERVICE_BASE_URL="${DEMO_SERVICE_BASE_URL:-${PUBLIC_BASE_URL:-}}"
  export DEMO_OWNER_WEB_BASE_URL="${DEMO_OWNER_WEB_BASE_URL:-$DEMO_SERVICE_BASE_URL/web}"
  export DEMO_PUBLIC_WEB_BASE_URL="${DEMO_PUBLIC_WEB_BASE_URL:-$DEMO_SERVICE_BASE_URL/web/public}"
  export DEMO_API_HEADER="${DEMO_API_HEADER:-${API_KEY_HEADER:-x-shutong49-api-key}}"
  export DEMO_API_KEY="${DEMO_API_KEY:-}"
  export DEMO_FILE_PATH="${DEMO_FILE_PATH:-${DEMO_PDF_PATH:-$ROOT_DIR/docs/P4-Deployment/02-after-execution/assets/vm-acceptance-sample.txt}}"
}

require_vm_demo_prerequisites() {
  if [ -z "${DEMO_SERVICE_BASE_URL:-}" ]; then
    echo "DEMO_SERVICE_BASE_URL is empty." >&2
    echo "Set PUBLIC_BASE_URL in $VM_DEMO_ENV_FILE or export DEMO_SERVICE_BASE_URL explicitly before running VM acceptance scripts." >&2
    exit 1
  fi

  if [ -z "${DEMO_API_KEY:-}" ]; then
    echo "DEMO_API_KEY is empty." >&2
    echo "Export DEMO_API_KEY with a real users_api key before running VM acceptance scripts." >&2
    exit 1
  fi

  if [ "${PB_ADMIN_EMAIL:-}" = "admin@example.com" ] || [ -z "${PB_ADMIN_EMAIL:-}" ]; then
    echo "PB_ADMIN_EMAIL in $VM_DEMO_ENV_FILE is still placeholder or empty." >&2
    exit 1
  fi

  if [ "${PB_ADMIN_PASSWORD:-}" = "replace-with-strong-ascii-password" ] || [ -z "${PB_ADMIN_PASSWORD:-}" ]; then
    echo "PB_ADMIN_PASSWORD in $VM_DEMO_ENV_FILE is still placeholder or empty." >&2
    exit 1
  fi
}

require_vm_http_entrypoints() {
  curl -fsS "$DEMO_SERVICE_BASE_URL/api/health" >/dev/null
  curl -fsS "$DEMO_SERVICE_BASE_URL/web/auth/login" >/dev/null
  curl -fsS "$DEMO_SERVICE_BASE_URL/web/public/list" >/dev/null
  curl -fsS "$DEMO_SERVICE_BASE_URL/web/write" >/dev/null
}

print_vm_demo_preamble() {
  echo "[vm-demo] env file: $VM_DEMO_ENV_FILE"
  echo "[vm-demo] service base: $DEMO_SERVICE_BASE_URL"
  echo "[vm-demo] public base: $DEMO_PUBLIC_WEB_BASE_URL"
  echo "[vm-demo] api key header: $DEMO_API_HEADER"
  echo "[vm-demo] api key value: $DEMO_API_KEY"
  echo "[vm-demo] file sample: $DEMO_FILE_PATH"
}

require_command curl
require_command node
