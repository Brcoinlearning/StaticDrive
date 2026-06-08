#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

REGISTRY="${ACR_REGISTRY:-crpi-egl8fqea65tii5cz.cn-beijing.personal.cr.aliyuncs.com}"
NAMESPACE="${ACR_NAMESPACE:-static-drive}"
VERSION="${STATIC_CONTENT_IMAGE_TAG:-2026.06.08}"
PLATFORM="${STATIC_CONTENT_IMAGE_PLATFORM:-linux/amd64}"

APP_IMAGE="${REGISTRY}/${NAMESPACE}/static-content-service-app:${VERSION}"
PB_IMAGE="${REGISTRY}/${NAMESPACE}/static-content-service-pocketbase:${VERSION}"

cd "$ROOT_DIR"

echo "Building and pushing images:"
echo "  app:        $APP_IMAGE"
echo "  pocketbase: $PB_IMAGE"
echo "  platform:   $PLATFORM"

docker buildx build \
  --platform "$PLATFORM" \
  -f docker/app.Dockerfile \
  -t "$APP_IMAGE" \
  --push \
  .

docker buildx build \
  --platform "$PLATFORM" \
  -f docker/pocketbase.Dockerfile \
  -t "$PB_IMAGE" \
  --push \
  .

echo "Pushed:"
echo "$APP_IMAGE"
echo "$PB_IMAGE"
