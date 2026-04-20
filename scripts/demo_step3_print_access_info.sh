#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

load_demo_state
require_http_ok "$DEMO_SERVICE_BASE_URL/api/health" "business shell"

echo "[demo-step3] Open API save file      -> done (PDF_CONTENT_ID=$PDF_CONTENT_ID)"
echo "[demo-step3] Open API save rich text -> done (HTML_CONTENT_ID=$HTML_CONTENT_ID)"
echo "[demo-step3] Public list page        -> $DEMO_PUBLIC_WEB_BASE_URL/list"
echo "[demo-step3] Public search page      -> $DEMO_PUBLIC_WEB_BASE_URL/search?q=%E8%AF%95%E5%8D%B7"
echo "[demo-step3] PDF public detail page  -> $DEMO_PUBLIC_WEB_BASE_URL/content/$PDF_CONTENT_HASH"
echo "[demo-step3] HTML public detail page -> $DEMO_PUBLIC_WEB_BASE_URL/content/$HTML_CONTENT_HASH"
echo "[demo-step3] PDF direct download     -> $DEMO_SERVICE_BASE_URL/api/public/content/$PDF_CONTENT_HASH"
echo "[demo-step3] HTML direct access      -> $DEMO_SERVICE_BASE_URL/api/public/content/$HTML_CONTENT_HASH"
echo "[demo-step3] PDF share URL           -> $PDF_SHARE_URL"
echo "[demo-step3] HTML share URL          -> $HTML_SHARE_URL"

echo
echo "[demo-step3] Suggested next actions:"
echo "1. Open the public list page to demonstrate function 3."
echo "2. Open the public search page to demonstrate function 4."
echo "3. Open the HTML public detail page to demonstrate functions 2 and 5."
echo "4. Open the PDF public detail page and direct download URL to demonstrate functions 1 and 5."
