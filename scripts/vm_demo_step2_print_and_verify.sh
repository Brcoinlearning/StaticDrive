#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/vm_demo_common.sh"

load_vm_demo_env
require_vm_demo_prerequisites
require_vm_http_entrypoints

P5_DEMO_API_KEY="$DEMO_API_KEY"
P5_DEMO_API_HEADER="$DEMO_API_HEADER"
P5_DEMO_SERVICE_BASE_URL="$DEMO_SERVICE_BASE_URL"
P5_DEMO_OWNER_WEB_BASE_URL="${DEMO_SERVICE_BASE_URL}/web"
P5_DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL"

export P5_DEMO_API_KEY P5_DEMO_API_HEADER P5_DEMO_SERVICE_BASE_URL P5_DEMO_OWNER_WEB_BASE_URL P5_DEMO_PUBLIC_WEB_BASE_URL

# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/p5_demo_common.sh"

load_p5_demo_state

bash "$ROOT_DIR/scripts/p5_demo_step3_print_access_info.sh"

echo
curl -fsS "$DEMO_SERVICE_BASE_URL/api/query/list" -H "$DEMO_API_HEADER: $DEMO_API_KEY" >/dev/null
echo "[vm-demo] verified owner query surface via /api/query/list"

QUERY_RESPONSE="$(curl -fsS "$DEMO_SERVICE_BASE_URL/api/query/content/$P5_CONTENT_ID" \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY")"
require_json_field "$QUERY_RESPONSE" "body" "vm-demo-step2:query-body"
require_json_field "$QUERY_RESPONSE" "renderedBodyHtml" "vm-demo-step2:query-rendered"
echo "[vm-demo] verified query/content returns string body and rendered html"

curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$P5_CONTENT_HASH" >/dev/null
echo "[vm-demo] verified markdown public access in public mode"

PUBLIC_RESPONSE="$(curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/content/$P5_CONTENT_HASH")"
require_json_field "$PUBLIC_RESPONSE" "htmlContent" "vm-demo-step2:public"
echo "[vm-demo] verified public content payload returns rendered html"

SHARE_RESPONSE="$(curl -fsS "$DEMO_SERVICE_BASE_URL/api/public/share/$P5_SHARE_HASH")"
require_json_field "$SHARE_RESPONSE" "htmlContent" "vm-demo-step2:share"
echo "[vm-demo] verified share payload returns rendered html"

curl -fsS "$P5_SHARE_URL" >/dev/null
echo "[vm-demo] verified share page access in public mode"
