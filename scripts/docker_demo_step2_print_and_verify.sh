#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/docker_demo_common.sh"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

load_docker_demo_env
require_docker_stack_healthy
load_demo_state

bash "$ROOT_DIR/scripts/demo_step3_print_access_info.sh"

echo
curl -fsS "$DEMO_SERVICE_BASE_URL/api/query/list" -H "$DEMO_API_HEADER: $DEMO_API_KEY" >/dev/null
echo "[docker-demo] verified function 3/4 query surface via /api/query/list"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$FILE_CONTENT_HASH" >/dev/null
echo "[docker-demo] verified file public access"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$HTML_CONTENT_HASH" >/dev/null
echo "[docker-demo] verified rich text public access"

curl -fsS "$FILE_SHARE_URL" >/dev/null
echo "[docker-demo] verified file share access"

curl -fsS "$HTML_SHARE_URL" >/dev/null
echo "[docker-demo] verified rich text share access"
