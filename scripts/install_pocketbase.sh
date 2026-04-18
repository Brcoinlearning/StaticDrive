#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

PB_VERSION="${PB_VERSION:-0.22.0}"
BIN_DIR="$ROOT_DIR/pocketbase/bin"
TMP_DIR="${TMPDIR:-/tmp}"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin) PB_OS="darwin" ;;
  linux) PB_OS="linux" ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

case "$ARCH" in
  arm64|aarch64) PB_ARCH="arm64" ;;
  x86_64|amd64) PB_ARCH="amd64" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

ARCHIVE="pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${ARCHIVE}"

mkdir -p "$BIN_DIR"
curl -L -o "$TMP_DIR/$ARCHIVE" "$URL"
unzip -o "$TMP_DIR/$ARCHIVE" pocketbase -d "$BIN_DIR"
chmod +x "$BIN_DIR/pocketbase"

echo "Installed PocketBase ${PB_VERSION} for ${PB_OS}/${PB_ARCH}"
echo "Binary: $BIN_DIR/pocketbase"
