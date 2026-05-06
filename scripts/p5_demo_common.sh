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
P5_DEMO_BODY="${P5_DEMO_BODY:-$(cat <<'BODYEOF'
# P5 通用 Markdown 能力展示

这是一段用于演示通用 Markdown 能力的正文，覆盖 LLM / agent 生成技术内容时最常见的表达方式。

任务列表：
- [x] 已完成：支持 task list
- [x] 已完成：支持裸链接自动识别
- [x] 已完成：支持标准图片、表格、代码块
- [ ] 待扩展：更复杂的 Markdown 方言

裸链接：https://example.com/docs/markdown-agent-demo

引用：
> 这是一个面向技术内容演示的通用 Markdown 样例。

行内公式：$E = mc^2$

表格：

| 能力 | 当前状态 | 说明 |
|------|------|------|
| Task list | 已支持 | `- [x]` / `- [ ]` |
| 裸链接 | 已支持 | 自动转为超链接 |
| 代码块 | 已支持 | 支持语言类名 |
| 数学公式 | 已支持 | 预览页可排版 |

标准图片：

![演示图片](https://picsum.photos/seed/p5-markdown-demo/640/320)
BODYEOF
)}"

ensure_p5_demo_state_dir() {
  mkdir -p "$P5_DEMO_STATE_DIR"
}

save_p5_demo_state() {
  ensure_p5_demo_state_dir
  cat > "$P5_DEMO_STATE_FILE" <<EOFSTATE
P5_DEMO_API_KEY='${P5_DEMO_API_KEY}'
P5_DEMO_API_HEADER='${P5_DEMO_API_HEADER}'
P5_DEMO_SERVICE_BASE_URL='${P5_DEMO_SERVICE_BASE_URL}'
P5_DEMO_OWNER_WEB_BASE_URL='${P5_DEMO_OWNER_WEB_BASE_URL}'
P5_DEMO_PUBLIC_WEB_BASE_URL='${P5_DEMO_PUBLIC_WEB_BASE_URL}'
P5_DEMO_TITLE='${P5_DEMO_TITLE}'
P5_DEMO_BODY_FORMAT='${P5_DEMO_BODY_FORMAT}'
P5_DEMO_BODY='${P5_DEMO_BODY}'
P5_CONTENT_ID='${P5_CONTENT_ID:-}'
P5_CONTENT_HASH='${P5_CONTENT_HASH:-}'
P5_ACCESS_URL='${P5_ACCESS_URL:-}'
P5_SHARE_HASH='${P5_SHARE_HASH:-}'
P5_SHARE_URL='${P5_SHARE_URL:-}'
EOFSTATE
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

  node -e "const payload=JSON.parse(process.argv[1]); const field=process.argv[2]; const label=process.argv[3]; if (payload && payload.error) { console.error('[' + label + '] ' + payload.error + ': ' + (payload.message || 'request failed')); process.exit(1); } const value = payload && payload[field]; if (typeof value !== 'string' || !value.trim()) { console.error('[' + label + '] missing required field: ' + field); console.error(JSON.stringify(payload)); process.exit(1); }" \
    "$json_payload" "$field_name" "$context_label" >/dev/null
}

require_command curl
require_command node
