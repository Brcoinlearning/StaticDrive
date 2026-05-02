#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/p5_demo_common.sh"

load_p5_demo_state
require_http_ok "$P5_DEMO_SERVICE_BASE_URL/api/health" "business shell"

QUERY_RESPONSE="$(curl -sS "$P5_DEMO_SERVICE_BASE_URL/api/query/content/$P5_CONTENT_ID" \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY")"

NOT_FOUND_STATUS="$(curl -sS -o /tmp/p5_demo_query_missing.json -w '%{http_code}' "$P5_DEMO_SERVICE_BASE_URL/api/query/content/not-exists-id" \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY")"

SHARE_RESPONSE="$(curl -sS -X POST "$P5_DEMO_SERVICE_BASE_URL/api/write/share" \
  -H 'content-type: application/json' \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY" \
  -d "{\"contentId\":\"$P5_CONTENT_ID\"}")"

PUBLIC_RESPONSE="$(curl -sS "$P5_DEMO_SERVICE_BASE_URL/api/public/content/$P5_CONTENT_HASH")"

require_json_field "$QUERY_RESPONSE" "contentId" "p5-demo-step2:query"
require_json_field "$QUERY_RESPONSE" "body" "p5-demo-step2:query"
require_json_field "$SHARE_RESPONSE" "shareHash" "p5-demo-step2:share"
require_json_field "$PUBLIC_RESPONSE" "htmlContent" "p5-demo-step2:public"

if [ "$NOT_FOUND_STATUS" != "404" ]; then
  echo "[p5-demo-step2] expected missing query status 404, got: $NOT_FOUND_STATUS" >&2
  cat /tmp/p5_demo_query_missing.json >&2
  exit 1
fi

while IFS=$'\t' read -r key value; do
  printf -v "$key" '%s' "$value"
done < <(
  node -e "const share=JSON.parse(process.argv[1]); const pairs = [
    ['P5_SHARE_HASH', share.shareHash],
    ['P5_SHARE_URL', share.shareUrl]
  ]; for (const [k, v] of pairs) process.stdout.write(k + '\t' + String(v ?? '') + '\n');" \
  "$SHARE_RESPONSE"
)

save_p5_demo_state

echo "[p5-demo-step2] content query: ok"
echo "[p5-demo-step2] missing query rejected with 404"
echo "[p5-demo-step2] share created: $P5_SHARE_HASH"
echo "[p5-demo-step2] public rich_text access: ok"
