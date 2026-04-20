#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

load_demo_state
require_http_ok "$DEMO_SERVICE_BASE_URL/api/health" "business shell"

PDF_SHARE_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/share" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "{\"contentId\":\"$PDF_CONTENT_ID\"}")"

HTML_SHARE_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/share" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "{\"contentId\":\"$HTML_CONTENT_ID\"}")"

while IFS=$'\t' read -r key value; do
  printf -v "$key" '%s' "$value"
done < <(
  node -e "const pdf=JSON.parse(process.argv[1]); const html=JSON.parse(process.argv[2]); const pairs = [
    ['PDF_SHARE_HASH', pdf.shareHash],
    ['PDF_SHARE_URL', pdf.shareUrl],
    ['HTML_SHARE_HASH', html.shareHash],
    ['HTML_SHARE_URL', html.shareUrl]
  ]; for (const [k, v] of pairs) process.stdout.write(k + '\t' + String(v ?? '') + '\n');" \
  "$PDF_SHARE_RESPONSE" "$HTML_SHARE_RESPONSE"
)

save_demo_state

echo "[demo-step2] PDF share created: $PDF_SHARE_HASH"
echo "[demo-step2] HTML share created: $HTML_SHARE_HASH"
