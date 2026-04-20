#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_STATE_DIR="$ROOT_DIR/.demo-state"
DEMO_STATE_FILE="$DEMO_STATE_DIR/mvp_demo.env"

DEMO_API_KEY="${DEMO_API_KEY:-t1_verify_api_key_0001}"
DEMO_API_HEADER="${DEMO_API_HEADER:-x-shutong49-api-key}"
DEMO_SERVICE_BASE_URL="${DEMO_SERVICE_BASE_URL:-http://127.0.0.1:8787}"
DEMO_PUBLIC_WEB_BASE_URL="${DEMO_PUBLIC_WEB_BASE_URL:-http://127.0.0.1:8787/web/public}"
DEMO_PDF_PATH="${DEMO_PDF_PATH:-/Users/mr.hu/Desktop/开发项目/静态网页服务-文件管理/2015-2016 第二学期 软件工程 期中试卷.pdf}"

ensure_demo_state_dir() {
  mkdir -p "$DEMO_STATE_DIR"
}

save_demo_state() {
  ensure_demo_state_dir
  cat > "$DEMO_STATE_FILE" <<EOF
DEMO_API_KEY='${DEMO_API_KEY}'
DEMO_API_HEADER='${DEMO_API_HEADER}'
DEMO_SERVICE_BASE_URL='${DEMO_SERVICE_BASE_URL}'
DEMO_PUBLIC_WEB_BASE_URL='${DEMO_PUBLIC_WEB_BASE_URL}'
DEMO_PDF_PATH='${DEMO_PDF_PATH}'
PDF_CONTENT_ID='${PDF_CONTENT_ID:-}'
PDF_CONTENT_HASH='${PDF_CONTENT_HASH:-}'
PDF_ACCESS_URL='${PDF_ACCESS_URL:-}'
PDF_SHARE_HASH='${PDF_SHARE_HASH:-}'
PDF_SHARE_URL='${PDF_SHARE_URL:-}'
HTML_CONTENT_ID='${HTML_CONTENT_ID:-}'
HTML_CONTENT_HASH='${HTML_CONTENT_HASH:-}'
HTML_ACCESS_URL='${HTML_ACCESS_URL:-}'
HTML_SHARE_HASH='${HTML_SHARE_HASH:-}'
HTML_SHARE_URL='${HTML_SHARE_URL:-}'
EOF
}

load_demo_state() {
  [ -f "$DEMO_STATE_FILE" ] || {
    echo "Demo state file not found: $DEMO_STATE_FILE" >&2
    echo "Run scripts/demo_step1_write_content.sh first." >&2
    exit 1
  }

  # shellcheck disable=SC1090
  . "$DEMO_STATE_FILE"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_file() {
  [ -f "$1" ] || {
    echo "Required file not found: $1" >&2
    exit 1
  }
}

require_command curl
require_command node

require_http_ok() {
  local url="$1"
  local label="$2"

  if ! curl --silent --show-error --fail "$url" >/dev/null 2>&1; then
    echo "Required service is not reachable: $label ($url)" >&2
    echo "Start the service first before running demo scripts." >&2
    exit 1
  fi
}
