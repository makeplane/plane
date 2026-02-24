#!/bin/bash
# =============================================================================
# build-dev.sh — Build Plane artifacts on dev machine (macOS) for RHEL server
#
# Usage:
#   ./build-dev.sh all              Build + export ALL images
#   ./build-dev.sh api              Pack API source (no image rebuild)
#   ./build-dev.sh web              Extract web static files
#   ./build-dev.sh admin            Extract admin static files
#   ./build-dev.sh space            Rebuild space image
#   ./build-dev.sh live             Rebuild live image
#   ./build-dev.sh api web          Multiple targets
#
# Output: all artifacts saved to ./dist-images/
# After build, use FileZilla SFTP to copy files to server (see docs/deployment-guide.md)
# =============================================================================
set -euo pipefail

PLATFORM="linux/amd64"
DIST="./dist-images"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[BUILD]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

usage() {
  echo "Usage: $0 [all|api|web|admin|space|live] ..."
  echo ""
  echo "Targets:"
  echo "  all    — Build + export ALL Docker images (first-time deploy)"
  echo "  api    — Pack API Python source only (no image rebuild, fast)"
  echo "  web    — Extract web static files from Docker build"
  echo "  admin  — Extract admin static files from Docker build"
  echo "  space  — Rebuild space Docker image"
  echo "  live   — Rebuild live Docker image"
  echo ""
  echo "Output: $DIST/"
  exit 1
}

mkdir -p "$DIST"

# --- Build functions ---

build_all() {
  log "Building ALL images for $PLATFORM..."

  log "Building plane-api..."
  docker build --platform "$PLATFORM" \
    -f apps/api/Dockerfile.api \
    -t plane-api:latest \
    ./apps/api

  log "Building plane-web..."
  docker build --platform "$PLATFORM" \
    -f apps/web/Dockerfile.web \
    -t plane-web:latest .

  log "Building plane-admin..."
  docker build --platform "$PLATFORM" \
    -f apps/admin/Dockerfile.admin \
    -t plane-admin:latest .

  log "Building plane-space..."
  docker build --platform "$PLATFORM" \
    -f apps/space/Dockerfile.space \
    -t plane-space:latest .

  log "Building plane-live..."
  docker build --platform "$PLATFORM" \
    -f apps/live/Dockerfile.live \
    -t plane-live:latest .

  log "Building plane-proxy..."
  docker build --platform "$PLATFORM" \
    -f apps/proxy/Dockerfile.ce \
    -t plane-proxy:latest \
    ./apps/proxy

  log "Exporting images to $DIST/ ..."
  for img in plane-api plane-web plane-admin plane-space plane-live plane-proxy; do
    log "  Saving $img..."
    docker save "$img:latest" | gzip > "$DIST/$img.tar.gz"
  done

  log ""
  log "=== BUILD COMPLETE ==="
  log "Output files in $DIST/:"
  ls -lh "$DIST"/*.tar.gz
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy ALL .tar.gz files → server:/opt/plane/images/"
  log "Copy docker-compose.yml  → server:/opt/plane/"
  log "Copy .env                → server:/opt/plane/"
  log "Copy apps/api/.env       → server:/opt/plane/apps/api/.env"
  log "Copy deploy-server.sh    → server:/opt/plane/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh all"
}

build_api() {
  log "Packing API source..."
  tar czf "$DIST/api-source.tar.gz" \
    --exclude='__pycache__' \
    --exclude='.env' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='node_modules' \
    -C apps/api .

  log ""
  log "=== BUILD COMPLETE ==="
  ls -lh "$DIST/api-source.tar.gz"
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy $DIST/api-source.tar.gz → server:/opt/plane/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh api"
}

build_web() {
  log "Building Web static files..."
  docker build --platform "$PLATFORM" \
    -f apps/web/Dockerfile.web \
    --target installer \
    -t plane-web-builder:latest .

  docker rm -f tmp-web 2>/dev/null || true
  docker create --name tmp-web plane-web-builder:latest
  rm -rf "$DIST/web-client"
  docker cp tmp-web:/app/apps/web/build/client "$DIST/web-client/"
  docker rm tmp-web

  tar czf "$DIST/web-client.tar.gz" -C "$DIST/web-client" .

  log ""
  log "=== BUILD COMPLETE ==="
  ls -lh "$DIST/web-client.tar.gz"
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy $DIST/web-client.tar.gz → server:/opt/plane/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh web"
}

build_admin() {
  log "Building Admin static files..."
  docker build --platform "$PLATFORM" \
    -f apps/admin/Dockerfile.admin \
    --target installer \
    -t plane-admin-builder:latest .

  docker rm -f tmp-admin 2>/dev/null || true
  docker create --name tmp-admin plane-admin-builder:latest
  rm -rf "$DIST/admin-client"
  docker cp tmp-admin:/app/apps/admin/build/client "$DIST/admin-client/"
  docker rm tmp-admin

  tar czf "$DIST/admin-client.tar.gz" -C "$DIST/admin-client" .

  log ""
  log "=== BUILD COMPLETE ==="
  ls -lh "$DIST/admin-client.tar.gz"
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy $DIST/admin-client.tar.gz → server:/opt/plane/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh admin"
}

build_space() {
  log "Building Space image..."
  docker build --platform "$PLATFORM" \
    -f apps/space/Dockerfile.space \
    -t plane-space:latest .

  docker save plane-space:latest | gzip > "$DIST/plane-space.tar.gz"

  log ""
  log "=== BUILD COMPLETE ==="
  ls -lh "$DIST/plane-space.tar.gz"
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy $DIST/plane-space.tar.gz → server:/opt/plane/images/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh space"
}

build_live() {
  log "Building Live image..."
  docker build --platform "$PLATFORM" \
    -f apps/live/Dockerfile.live \
    -t plane-live:latest .

  docker save plane-live:latest | gzip > "$DIST/plane-live.tar.gz"

  log ""
  log "=== BUILD COMPLETE ==="
  ls -lh "$DIST/plane-live.tar.gz"
  log ""
  log "=== SFTP UPLOAD GUIDE ==="
  log "Copy $DIST/plane-live.tar.gz → server:/opt/plane/images/"
  log "Then SSH: cd /opt/plane && ./deploy-server.sh live"
}

# --- Main ---

if [ $# -eq 0 ]; then
  usage
fi

for target in "$@"; do
  case "$target" in
    all)   build_all ;;
    api)   build_api ;;
    web)   build_web ;;
    admin) build_admin ;;
    space) build_space ;;
    live)  build_live ;;
    -h|--help) usage ;;
    *)
      err "Unknown target: $target"
      usage
      ;;
  esac
done
