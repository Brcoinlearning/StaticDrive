#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/docker_demo_common.sh"

load_docker_demo_env
require_docker_stack_healthy
require_configured_admin_credentials
print_docker_demo_preamble

echo "[docker-demo] host health check: PocketBase"
curl -fsS http://127.0.0.1:8090/api/health >/dev/null

echo "[docker-demo] host health check: business shell"
curl -fsS "$DEMO_SERVICE_BASE_URL/api/health" >/dev/null

echo "[docker-demo] precheck passed"
echo "[docker-demo] next step: ensure users_api contains API key -> $DEMO_API_KEY"
