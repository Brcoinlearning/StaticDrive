#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/vm_demo_common.sh"

load_vm_demo_env
require_vm_demo_prerequisites
require_vm_http_entrypoints

DEMO_API_KEY="$DEMO_API_KEY" \
DEMO_API_HEADER="$DEMO_API_HEADER" \
DEMO_SERVICE_BASE_URL="$DEMO_SERVICE_BASE_URL" \
DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
P5_DEMO_OWNER_WEB_BASE_URL="${DEMO_SERVICE_BASE_URL}/web" \
P5_DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
bash "$ROOT_DIR/scripts/p5_demo_step1_write_content.sh"

DEMO_API_KEY="$DEMO_API_KEY" \
DEMO_API_HEADER="$DEMO_API_HEADER" \
DEMO_SERVICE_BASE_URL="$DEMO_SERVICE_BASE_URL" \
DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
P5_DEMO_OWNER_WEB_BASE_URL="${DEMO_SERVICE_BASE_URL}/web" \
P5_DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
bash "$ROOT_DIR/scripts/p5_demo_step2_query_and_share.sh"
