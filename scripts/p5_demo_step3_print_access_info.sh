#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/p5_demo_common.sh"

load_p5_demo_state
require_http_ok "$P5_DEMO_SERVICE_BASE_URL/api/health" "business shell"

echo "[p5-demo-step3] Content write API      -> $P5_DEMO_SERVICE_BASE_URL/api/write/content"
echo "[p5-demo-step3] Content query API      -> $P5_DEMO_SERVICE_BASE_URL/api/query/content/$P5_CONTENT_ID"
echo "[p5-demo-step3] Owner list page        -> $P5_DEMO_OWNER_WEB_BASE_URL/list"
echo "[p5-demo-step3] Owner detail page      -> $P5_DEMO_OWNER_WEB_BASE_URL/detail/$P5_CONTENT_ID"
echo "[p5-demo-step3] Public detail page     -> $P5_DEMO_PUBLIC_WEB_BASE_URL/content/$P5_CONTENT_HASH"
echo "[p5-demo-step3] Public direct API      -> $P5_DEMO_SERVICE_BASE_URL/api/public/content/$P5_CONTENT_HASH"
echo "[p5-demo-step3] Share page URL         -> $P5_SHARE_URL"
echo "[p5-demo-step3] Share direct API       -> $P5_DEMO_SERVICE_BASE_URL/api/public/share/$P5_SHARE_HASH"

echo
echo "[p5-demo-step3] Suggested demo order:"
echo "1. Run the content query API to show body / bodyFormat / renderedBodyHtml / htmlContent."
echo "2. Open the owner detail page to inspect task lists, nested lists, table, code block, math, image, and the preserved original body + bodyFormat."
echo "3. Open the owner list page to show summary / author / createdAt rendering still works."
echo "4. Open the public detail page or share page URL to verify the same Markdown sample renders correctly for visitors."
echo "5. Open the direct public API only when you want to inspect the raw JSON payload rather than the rendered page."
