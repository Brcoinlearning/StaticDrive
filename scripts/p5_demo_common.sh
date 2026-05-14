#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
P5_DEMO_STATE_DIR="$ROOT_DIR/.demo-state"
P5_DEMO_STATE_FILE="$P5_DEMO_STATE_DIR/p5_content_demo.env"

P5_DEMO_API_KEY="${P5_DEMO_API_KEY:-${DEMO_API_KEY:-t1_verify_api_key_0001}}"
P5_DEMO_API_HEADER="${P5_DEMO_API_HEADER:-${DEMO_API_HEADER:-x-shutong49-api-key}}"
P5_DEMO_SERVICE_BASE_URL="${P5_DEMO_SERVICE_BASE_URL:-${DEMO_SERVICE_BASE_URL:-http://127.0.0.1:8787}}"
P5_DEMO_OWNER_WEB_BASE_URL="${P5_DEMO_OWNER_WEB_BASE_URL:-http://127.0.0.1:8787/web}"
P5_DEMO_PUBLIC_WEB_BASE_URL="${P5_DEMO_PUBLIC_WEB_BASE_URL:-http://127.0.0.1:8787/web/public}"
P5_DEMO_TITLE="${P5_DEMO_TITLE:-P5 通用 Markdown 能力展示}"
P5_DEMO_BODY_FORMAT="${P5_DEMO_BODY_FORMAT:-markdown}"
P5_DEMO_BODY="${P5_DEMO_BODY:-$([ -f "$ROOT_DIR/tests/fixtures/markdown/demo-showcase.md" ] && cat "$ROOT_DIR/tests/fixtures/markdown/demo-showcase.md" || { echo '# Demo'; echo 'content missing, regenerate fixtures.'; })}"

ensure_p5_demo_state_dir() {
  mkdir -p "$P5_DEMO_STATE_DIR"
}

save_p5_demo_state() {
  ensure_p5_demo_state_dir
  shell_quote() {
    printf '%q' "$1"
  }
  cat > "$P5_DEMO_STATE_FILE" <<EOFSTATE
P5_DEMO_API_KEY=$(shell_quote "${P5_DEMO_API_KEY}")
P5_DEMO_API_HEADER=$(shell_quote "${P5_DEMO_API_HEADER}")
P5_DEMO_SERVICE_BASE_URL=$(shell_quote "${P5_DEMO_SERVICE_BASE_URL}")
P5_DEMO_OWNER_WEB_BASE_URL=$(shell_quote "${P5_DEMO_OWNER_WEB_BASE_URL}")
P5_DEMO_PUBLIC_WEB_BASE_URL=$(shell_quote "${P5_DEMO_PUBLIC_WEB_BASE_URL}")
P5_DEMO_TITLE=$(shell_quote "${P5_DEMO_TITLE}")
P5_DEMO_BODY_FORMAT=$(shell_quote "${P5_DEMO_BODY_FORMAT}")
P5_DEMO_BODY=$(shell_quote "${P5_DEMO_BODY}")
P5_CONTENT_ID=$(shell_quote "${P5_CONTENT_ID:-}")
P5_EMPTY_TITLE_CONTENT_ID=$(shell_quote "${P5_EMPTY_TITLE_CONTENT_ID:-}")
P5_CONTENT_HASH=$(shell_quote "${P5_CONTENT_HASH:-}")
P5_ACCESS_URL=$(shell_quote "${P5_ACCESS_URL:-}")
P5_SHARE_HASH=$(shell_quote "${P5_SHARE_HASH:-}")
P5_SHARE_URL=$(shell_quote "${P5_SHARE_URL:-}")
EOFSTATE
}

delete_demo_content_if_present() {
  local content_id="${1:-}"

  if [ -z "$content_id" ]; then
    return 0
  fi

  local status
  status="$(curl -sS -o /tmp/p5_demo_delete_content.json -w '%{http_code}' -X POST "$P5_DEMO_SERVICE_BASE_URL/api/write/delete" \
    -H 'content-type: application/json' \
    -H "$P5_DEMO_API_HEADER: $P5_DEMO_API_KEY" \
    -d "{\"contentId\":\"$content_id\"}")"

  case "$status" in
    200|404)
      return 0
      ;;
    *)
      echo "[p5-demo-cleanup] delete content failed for $content_id with status $status" >&2
      cat /tmp/p5_demo_delete_content.json >&2
      return 1
      ;;
  esac
}

load_p5_demo_state() {
  [ -f "$P5_DEMO_STATE_FILE" ] || {
    echo "P5 demo state file not found: $P5_DEMO_STATE_FILE" >&2
    echo "Run scripts/p5_demo_step1_write_content.sh first." >&2
    exit 1
  }

  # shellcheck disable=SC1090
  . "$P5_DEMO_STATE_FILE"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_http_ok() {
  local url="$1"
  local label="$2"

  if ! curl --silent --show-error --fail "$url" >/dev/null 2>&1; then
    echo "Required service is not reachable: $label ($url)" >&2
    echo "Start the service first before running demo scripts." >&2
    exit 1
  fi
}

require_json_field() {
  local json_payload="$1"
  local field_name="$2"
  local context_label="$3"

  printf '%s' "$json_payload" | node -e "let input=''; process.stdin.on('data', (chunk) => input += chunk); process.stdin.on('end', () => { const payload = JSON.parse(input); const field = process.argv[1]; const label = process.argv[2]; if (payload && payload.error) { console.error('[' + label + '] ' + payload.error + ': ' + (payload.message || 'request failed')); process.exit(1); } const value = payload && payload[field]; if (typeof value !== 'string' || !value.trim()) { console.error('[' + label + '] missing required field: ' + field); console.error(JSON.stringify(payload)); process.exit(1); } });" "$field_name" "$context_label" >/dev/null
}

require_command curl
require_command node
