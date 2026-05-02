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
echo "[p5-demo-step3] Public direct access   -> $P5_DEMO_SERVICE_BASE_URL/api/public/content/$P5_CONTENT_HASH"
echo "[p5-demo-step3] Share URL              -> $P5_SHARE_URL"

echo
echo "[p5-demo-step3] Suggested demo order:"
echo "1. Run the content query API to show body / bodyFormat / renderedBodyHtml / htmlContent."
echo "2. Open the owner detail page to show Markdown content is rendered from final HTML while the update form still preserves original body + bodyFormat."
echo "3. Open the owner list page to show summary / author / createdAt rendering still works."
echo "4. Open the public detail page or direct public API to show public rich_text also reuses renderedBodyHtml rather than raw Markdown."
