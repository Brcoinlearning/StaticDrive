#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

bash "$ROOT_DIR/scripts/preflight.sh" service
node "$ROOT_DIR/scripts/preflight_check.js" service

cd "$ROOT_DIR"
exec npm start
