#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: bash ./scripts/external_upload_file.sh <absolute-file-path> [title]" >&2
  exit 1
fi

FILE_PATH="$1"
TITLE_INPUT="${2:-}"

if [ ! -f "$FILE_PATH" ]; then
  echo "File not found: $FILE_PATH" >&2
  exit 1
fi

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_command curl
require_command node

SERVICE_BASE_URL="${DEMO_SERVICE_BASE_URL:-${PUBLIC_BASE_URL:-http://192.168.2.9}}"
API_KEY_HEADER="${DEMO_API_HEADER:-${API_KEY_HEADER:-x-shutong49-api-key}}"
API_KEY_VALUE="${DEMO_API_KEY:-t1_verify_api_key_0001}"

FILE_NAME="$(basename "$FILE_PATH")"
FILE_EXTENSION="${FILE_NAME##*.}"
FILE_EXTENSION_LOWER="$(printf '%s' "$FILE_EXTENSION" | tr '[:upper:]' '[:lower:]')"

case "$FILE_EXTENSION_LOWER" in
  pdf)
    MIME_TYPE="application/pdf"
    ;;
  txt)
    MIME_TYPE="text/plain"
    ;;
  md)
    MIME_TYPE="text/markdown"
    ;;
  html|htm)
    MIME_TYPE="text/html"
    ;;
  jpg|jpeg)
    MIME_TYPE="image/jpeg"
    ;;
  png)
    MIME_TYPE="image/png"
    ;;
  *)
    MIME_TYPE="application/octet-stream"
    ;;
esac

TITLE="${TITLE_INPUT:-${FILE_NAME}}"

TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

node -e "const fs=require('fs'); const path=require('path'); const filePath=process.argv[1]; const title=process.argv[2]; const filename=path.basename(filePath); const mimeType=process.argv[3]; const contentBase64=fs.readFileSync(filePath).toString('base64'); fs.writeFileSync(process.argv[4], JSON.stringify({ title, filename, mimeType, contentBase64 }));" "$FILE_PATH" "$TITLE" "$MIME_TYPE" "$TMP_JSON"

RESPONSE="$(curl -sS -X POST "$SERVICE_BASE_URL/api/write/file" \
  -H 'content-type: application/json' \
  -H "$API_KEY_HEADER: $API_KEY_VALUE" \
  --data-binary @"$TMP_JSON")"

CONTENT_ID="$(printf '%s' "$RESPONSE" | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')); if (!data.contentId) process.exit(1); process.stdout.write(String(data.contentId));")" || {
  echo "$RESPONSE" >&2
  exit 1
}

CONTENT_HASH="$(printf '%s' "$RESPONSE" | node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(0,'utf8')); if (!data.contentHash) process.exit(1); process.stdout.write(String(data.contentHash));")" || {
  echo "$RESPONSE" >&2
  exit 1
}

echo "[external-upload] contentId: $CONTENT_ID"
echo "[external-upload] contentHash: $CONTENT_HASH"
echo "[external-upload] detail URL: $SERVICE_BASE_URL/web/public/content/$CONTENT_HASH"
echo "[external-upload] direct URL: $SERVICE_BASE_URL/api/public/content/$CONTENT_HASH"
