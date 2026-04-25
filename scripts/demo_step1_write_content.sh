#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/demo_common.sh"

require_file "$DEMO_FILE_PATH"
require_http_ok "$DEMO_SERVICE_BASE_URL/api/health" "business shell"

FILE_BASE64="$(node -e "const fs=require('fs'); process.stdout.write(fs.readFileSync(process.argv[1]).toString('base64'));" "$DEMO_FILE_PATH")"
FILE_FILENAME="$(basename "$DEMO_FILE_PATH")"
FILE_EXTENSION="${FILE_FILENAME##*.}"

case "${FILE_EXTENSION,,}" in
  pdf)
    FILE_MIME_TYPE="application/pdf"
    FILE_TITLE="软件工程期中试卷 PDF 样例"
    ;;
  txt)
    FILE_MIME_TYPE="text/plain"
    FILE_TITLE="VM 验收 TXT 样例"
    ;;
  md)
    FILE_MIME_TYPE="text/markdown"
    FILE_TITLE="Markdown 文件样例"
    ;;
  html|htm)
    FILE_MIME_TYPE="text/html"
    FILE_TITLE="HTML 文件样例"
    ;;
  *)
    FILE_MIME_TYPE="application/octet-stream"
    FILE_TITLE="文件上传样例"
    ;;
esac

FILE_REQUEST_BODY="$(node -e "process.stdout.write(JSON.stringify({ title: process.argv[3], filename: process.argv[1], mimeType: process.argv[2], contentBase64: process.argv[4] }));" "$FILE_FILENAME" "$FILE_MIME_TYPE" "$FILE_TITLE" "$FILE_BASE64")"

FILE_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/file" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d "$FILE_REQUEST_BODY")"

HTML_RESPONSE="$(curl -sS -X POST "$DEMO_SERVICE_BASE_URL/api/write/html" \
  -H 'content-type: application/json' \
  -H "$DEMO_API_HEADER: $DEMO_API_KEY" \
  -d '{"title":"书童四九 HTML 样例","htmlContent":"<article><h1>静态网页服务演示</h1><p>这是人工演示的富文本样例。</p></article>"}')"

require_json_field "$FILE_RESPONSE" "contentId" "demo-step1:file"
require_json_field "$FILE_RESPONSE" "contentHash" "demo-step1:file"
require_json_field "$HTML_RESPONSE" "contentId" "demo-step1:html"
require_json_field "$HTML_RESPONSE" "contentHash" "demo-step1:html"

while IFS=$'\t' read -r key value; do
  printf -v "$key" '%s' "$value"
done < <(
  node -e "const file=JSON.parse(process.argv[1]); const html=JSON.parse(process.argv[2]); const pairs = [
    ['FILE_CONTENT_ID', file.contentId],
    ['FILE_CONTENT_HASH', file.contentHash],
    ['FILE_ACCESS_URL', file.accessUrl],
    ['HTML_CONTENT_ID', html.contentId],
    ['HTML_CONTENT_HASH', html.contentHash],
    ['HTML_ACCESS_URL', html.accessUrl]
  ]; for (const [k, v] of pairs) process.stdout.write(k + '\t' + String(v ?? '') + '\n');" \
  "$FILE_RESPONSE" "$HTML_RESPONSE"
)

save_demo_state

echo "[demo-step1] file content created: $FILE_CONTENT_ID"
echo "[demo-step1] file content hash: $FILE_CONTENT_HASH"
echo "[demo-step1] HTML content created: $HTML_CONTENT_ID"
echo "[demo-step1] HTML content hash: $HTML_CONTENT_HASH"
