#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/docker_demo_common.sh"

load_docker_demo_env
require_docker_stack_healthy
require_configured_admin_credentials
print_docker_demo_preamble

DEMO_API_KEY="$DEMO_API_KEY" \
DEMO_API_HEADER="$DEMO_API_HEADER" \
DEMO_SERVICE_BASE_URL="$DEMO_SERVICE_BASE_URL" \
DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
bash "$ROOT_DIR/scripts/demo_step1_write_content.sh"

DEMO_API_KEY="$DEMO_API_KEY" \
DEMO_API_HEADER="$DEMO_API_HEADER" \
DEMO_SERVICE_BASE_URL="$DEMO_SERVICE_BASE_URL" \
DEMO_PUBLIC_WEB_BASE_URL="$DEMO_PUBLIC_WEB_BASE_URL" \
bash "$ROOT_DIR/scripts/demo_step2_share_content.sh"
