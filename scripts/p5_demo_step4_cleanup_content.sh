#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/p5_demo_common.sh"

load_p5_demo_state
require_http_ok "$P5_DEMO_SERVICE_BASE_URL/api/health" "business shell"

delete_demo_content_if_present "${P5_CONTENT_ID:-}"
delete_demo_content_if_present "${P5_EMPTY_TITLE_CONTENT_ID:-}"

rm -f "$P5_DEMO_STATE_FILE"

echo "[p5-demo-step4] Demo content deleted and local P5 demo state cleared."
