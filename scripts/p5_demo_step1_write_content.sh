#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/p5_demo_common.sh"

require_http_ok "$P5_DEMO_SERVICE_BASE_URL/api/health" "business shell"

CONTENT_REQUEST_BODY="$(node -e "process.stdout.write(JSON.stringify({ title: process.argv[1], body: process.argv[2], bodyFormat: process.argv[3], authorName: 'Demo Author', createdAt: '2026-05-02T10:00:00.000Z' }));" "$P5_DEMO_TITLE" "$P5_DEMO_BODY" "$P5_DEMO_BODY_FORMAT")"

CONTENT_RESPONSE="$(curl -sS -X POST "$P5_DEMO_SERVICE_BASE_URL/api/write/content" \
  -H 'content-type: application/json' \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY" \
  -d "$CONTENT_REQUEST_BODY")"

EMPTY_TITLE_RESPONSE="$(curl -sS -X POST "$P5_DEMO_SERVICE_BASE_URL/api/write/content" \
  -H 'content-type: application/json' \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY" \
  -d '{"title":"   ","body":"<p>只有正文，没有标题。</p>","bodyFormat":"html"}')"

INVALID_BODY_STATUS="$(curl -sS -o /tmp/p5_demo_invalid_body.json -w '%{http_code}' -X POST "$P5_DEMO_SERVICE_BASE_URL/api/write/content" \
  -H 'content-type: application/json' \
  -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY" \
  -d '{"title":"invalid","body":"   ","bodyFormat":"html"}')"

require_json_field "$CONTENT_RESPONSE" "contentId" "p5-demo-step1:content"
require_json_field "$CONTENT_RESPONSE" "contentHash" "p5-demo-step1:content"
require_json_field "$EMPTY_TITLE_RESPONSE" "contentId" "p5-demo-step1:empty-title"

if [ "$INVALID_BODY_STATUS" != "400" ]; then
  echo "[p5-demo-step1] expected invalid body status 400, got: $INVALID_BODY_STATUS" >&2
  cat /tmp/p5_demo_invalid_body.json >&2
  exit 1
fi

while IFS=$'\t' read -r key value; do
  printf -v "$key" '%s' "$value"
done < <(
  node -e "const payload=JSON.parse(process.argv[1]); const pairs = [
    ['P5_CONTENT_ID', payload.contentId],
    ['P5_CONTENT_HASH', payload.contentHash],
    ['P5_ACCESS_URL', payload.accessUrl]
  ]; for (const [k, v] of pairs) process.stdout.write(k + '\t' + String(v ?? '') + '\n');" \
  "$CONTENT_RESPONSE"
)

save_p5_demo_state

echo "[p5-demo-step1] content created: $P5_CONTENT_ID"
echo "[p5-demo-step1] content hash: $P5_CONTENT_HASH"
echo "[p5-demo-step1] content bodyFormat: $P5_DEMO_BODY_FORMAT"
echo "[p5-demo-step1] sample covers: task-list, nested-task, multi-level-list, mixed-list, bare-url-boundary, multiline-quote, table-escape, code-block, image, inline-math, block-math"
echo "[p5-demo-step1] empty title write: ok"
echo "[p5-demo-step1] invalid body rejected with 400"
