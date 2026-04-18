#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

SERVICE_HOST="${SERVICE_HOST:-127.0.0.1}"
SERVICE_PORT="${SERVICE_PORT:-8787}"
API_KEY_HEADER="${API_KEY_HEADER:-x-shutong49-api-key}"

echo "[T2+T3] checking health endpoint"
curl --fail --silent "http://${SERVICE_HOST}:${SERVICE_PORT}/api/health"
echo

echo "[T2+T3] checking protected write route without api key"
status_code="$(curl --silent --output /tmp/shutong49_t23_no_key.json --write-out '%{http_code}' "http://${SERVICE_HOST}:${SERVICE_PORT}/api/write/ping")"
test "$status_code" = "401"
cat /tmp/shutong49_t23_no_key.json
echo

if [ -n "${VERIFY_API_KEY:-}" ]; then
  echo "[T2+T3] checking protected write route with api key"
  curl --fail --silent -H "${API_KEY_HEADER}: ${VERIFY_API_KEY}" "http://${SERVICE_HOST}:${SERVICE_PORT}/api/write/ping"
  echo
else
  echo "[T2+T3] skip authenticated route check because VERIFY_API_KEY is not set"
fi
