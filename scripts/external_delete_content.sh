#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: bash ./scripts/external_delete_content.sh <contentId>" >&2
  exit 1
fi

CONTENT_ID="$1"

if [ -z "$CONTENT_ID" ]; then
  echo "contentId is required." >&2
  exit 1
fi

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_command curl

SERVICE_BASE_URL="${DEMO_SERVICE_BASE_URL:-${PUBLIC_BASE_URL:-http://192.168.2.9}}"
API_KEY_HEADER="${DEMO_API_HEADER:-${API_KEY_HEADER:-x-shutong49-api-key}}"
API_KEY_VALUE="${DEMO_API_KEY:-t1_verify_api_key_0001}"

RESPONSE="$(curl -sS -X POST "$SERVICE_BASE_URL/api/write/delete" \
  -H 'content-type: application/json' \
  -H "$API_KEY_HEADER: $API_KEY_VALUE" \
  -d "{\"contentId\":\"$CONTENT_ID\"}")"

echo "$RESPONSE"
echo "[external-delete] content deleted: $CONTENT_ID"
