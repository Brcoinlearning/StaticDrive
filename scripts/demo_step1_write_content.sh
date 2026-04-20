#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

require_file "$DEMO_PDF_PATH"
require_http_ok "$DEMO_SERVICE_BASE_URL/api/health" "business shell"

PDF_BASE64="$(node -e "const fs=require('fs'); process.stdout.write(fs.readFileSync(process.argv[1]).toString('base64'));" "$DEMO_PDF_PATH")"
PDF_FILENAME="$(basename "$DEMO_PDF_PATH")"

PDF_REQUEST_BODY="$(node -e "process.stdout.write(JSON.stringify({ title: '软件工程期中试卷 PDF 样例', filename: process.argv[1], mimeType: 'application/pdf', contentBase64: process.argv[2] }));" "$PDF_FILENAME" "$PDF_BASE64")"

PDF_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/file" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "$PDF_REQUEST_BODY")"

HTML_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/html" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是人工演示的富文本样例。</p></article>"}')"

while IFS=$'\t' read -r key value; do
  printf -v "$key" '%s' "$value"
done < <(
  node -e "const pdf=JSON.parse(process.argv[1]); const html=JSON.parse(process.argv[2]); const pairs = [
    ['PDF_CONTENT_ID', pdf.contentId],
    ['PDF_CONTENT_HASH', pdf.contentHash],
    ['PDF_ACCESS_URL', pdf.accessUrl],
    ['HTML_CONTENT_ID', html.contentId],
    ['HTML_CONTENT_HASH', html.contentHash],
    ['HTML_ACCESS_URL', html.accessUrl]
  ]; for (const [k, v] of pairs) process.stdout.write(k + '\t' + String(v ?? '') + '\n');" \
  "$PDF_RESPONSE" "$HTML_RESPONSE"
)

save_demo_state

echo "[demo-step1] PDF content created: $PDF_CONTENT_ID"
echo "[demo-step1] PDF content hash: $PDF_CONTENT_HASH"
echo "[demo-step1] HTML content created: $HTML_CONTENT_ID"
echo "[demo-step1] HTML content hash: $HTML_CONTENT_HASH"
