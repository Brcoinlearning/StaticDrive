#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT_DIR/scripts/vm_demo_common.sh"

load_vm_demo_env
require_vm_demo_prerequisites

echo "[vm-demo] checking VM HTTP entrypoints"
require_vm_http_entrypoints

print_vm_demo_preamble

echo "[vm-demo] precheck passed"
echo "[vm-demo] next step: ensure users_api contains API key -> $DEMO_API_KEY"

