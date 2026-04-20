#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

note() {
  echo "[coldstart-dry-run] $1"
}

fail() {
  echo "[coldstart-dry-run] $1" >&2
  exit 1
}

require_file() {
  local path="$1"
  [ -f "$path" ] || fail "Missing required file: ${path#$ROOT_DIR/}"
}

require_dir() {
  local path="$1"
  [ -d "$path" ] || fail "Missing required directory: ${path#$ROOT_DIR/}"
}

note "checking repository cold-start prerequisites"

require_file "$ROOT_DIR/package.json"
require_file "$ROOT_DIR/.env.example"
require_file "$ROOT_DIR/README.md"
require_file "$ROOT_DIR/scripts/install_pocketbase.sh"
require_file "$ROOT_DIR/scripts/preflight.sh"
require_file "$ROOT_DIR/scripts/start_pocketbase.sh"
require_file "$ROOT_DIR/scripts/start_service.sh"
require_dir "$ROOT_DIR/pb_migrations"
require_dir "$ROOT_DIR/src"
require_dir "$ROOT_DIR/tests"

note "checking shell scripts syntax"
bash -n "$ROOT_DIR/scripts/install_pocketbase.sh"
bash -n "$ROOT_DIR/scripts/preflight.sh"
bash -n "$ROOT_DIR/scripts/start_pocketbase.sh"
bash -n "$ROOT_DIR/scripts/start_service.sh"

note "checking Node runtime"
node <<'EOF'
const [major] = process.versions.node.split('.').map(Number);
if (!Number.isFinite(major) || major < 20) {
  console.error(`[coldstart-dry-run] Node.js >=20 is required. Current: ${process.version}`);
  process.exit(1);
}
console.log(`[coldstart-dry-run] Node runtime OK: ${process.version}`);
EOF

note "running automated tests"
cd "$ROOT_DIR"
node --test

note "dry-run passed"
note "manual steps still required for a true cold start:"
note "1. copy .env.example to .env and fill PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD"
note "2. run ./scripts/install_pocketbase.sh in a networked environment"
note "3. start PocketBase and complete admin/bootstrap data setup"
note "4. start the business shell and run manual MVP smoke checks"
