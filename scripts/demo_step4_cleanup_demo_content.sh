#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

load_demo_state
require_http_ok "$DEMO_SERVICE_BASE_URL/api/health" "business shell"

curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/delete" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "{\"contentId\":\"$PDF_CONTENT_ID\"}" >/dev/null

curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/delete" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "{\"contentId\":\"$HTML_CONTENT_ID\"}" >/dev/null

rm -f "$DEMO_STATE_FILE"

echo "[demo-step4] Demo content deleted and local demo state cleared."
