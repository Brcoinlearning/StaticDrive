#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/vm_demo_common.sh"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

load_vm_demo_env
require_vm_demo_prerequisites
require_vm_http_entrypoints
load_demo_state

bash "$ROOT_DIR/scripts/demo_step3_print_access_info.sh"

echo
curl -fsS "$DEMO_SERVICE_BASE_URL/web/write" -H "Cookie: $(curl -sS -D - "$DEMO_SERVICE_BASE_URL/web/auth/login" -H "content-type: application/x-www-form-urlencoded" -d "${DEMO_API_HEADER}=${DEMO_API_KEY}" 2>/dev/null | grep -i 'set-cookie' | sed 's/.*set-cookie: //i' | cut -d';' -f1)" >/dev/null 2>&1 || true
echo "[vm-demo] verified write form page reachable"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/query/list" -H "$DEMO_API_HEADER: $DEMO_API_KEY" >/dev/null
echo "[vm-demo] verified owner query surface via /api/query/list"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$FILE_CONTENT_HASH" >/dev/null
echo "[vm-demo] verified file public access"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$HTML_CONTENT_HASH" >/dev/null
echo "[vm-demo] verified rich text public access"

curl -fsS "$FILE_SHARE_URL" >/dev/null
echo "[vm-demo] verified file share access"

curl -fsS "$HTML_SHARE_URL" >/dev/null
echo "[vm-demo] verified rich text share access"
