#!/bin/bash
# =============================================================================
# deploy-server.sh — Deploy Plane on production server (RHEL 9.6 Intel)
#
# Usage:
#   ./deploy-server.sh all          Load all images + recreate all services
#   ./deploy-server.sh api          Graceful restart API + Worker + Beat
#   ./deploy-server.sh web          Replace web static files + nginx reload
#   ./deploy-server.sh admin        Replace admin static files + nginx reload
#   ./deploy-server.sh space        Load image + recreate space container
#   ./deploy-server.sh live         Load image + recreate live container
#
# Prerequisites:
#   - Files uploaded by build-dev.sh (tar.gz in /opt/plane/)
#   - Docker + Docker Compose installed
# =============================================================================
set -euo pipefail

# Working directory — where docker-compose.yml lives
PLANE_DIR="${PLANE_DIR:-/opt/plane}"
cd "$PLANE_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

usage() {
  echo "Usage: $0 [all|api|web|admin|space|live]"
  echo ""
  echo "Targets:"
  echo "  all    — Load all images + docker compose up -d"
  echo "  api    — Copy source + migrate + graceful restart (0 downtime)"
  echo "  web    — Replace static files + nginx reload (0 downtime)"
  echo "  admin  — Replace static files + nginx reload (0 downtime)"
  echo "  space  — Load image + recreate container (~2-3s downtime)"
  echo "  live   — Load image + recreate container (~2-3s downtime)"
  exit 1
}

# --- Health check ---

health_check() {
  log "Running health check..."
  sleep 3
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/ || echo "000")
  if [ "$http_code" = "200" ]; then
    log "API health: OK (200)"
  else
    err "API health: FAILED ($http_code)"
    err "Check logs: docker logs api --tail 30"
    return 1
  fi
}

# --- Deploy functions ---

deploy_all() {
  log "Loading ALL images..."
  for f in images/*.tar.gz; do
    if [ -f "$f" ]; then
      log "  Loading $(basename "$f")..."
      docker load < "$f"
    fi
  done

  log "Starting all services..."
  docker compose up -d

  health_check
}

deploy_api() {
  local source_file="api-source.tar.gz"
  if [ ! -f "$source_file" ]; then
    err "File not found: $PLANE_DIR/$source_file"
    err "Run build-dev.sh api on dev machine first"
    exit 1
  fi

  # Copy source into all Python containers (api, bgworker, beatworker)
  for container in api bgworker beatworker; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
      log "[$container] Copying source..."
      docker cp "$source_file" "$container:/tmp/"
      docker exec "$container" bash -c "cd /code && tar xzf /tmp/api-source.tar.gz && rm /tmp/api-source.tar.gz"
    else
      warn "[$container] Container not running, skipping"
    fi
  done

  # Run migrations
  log "[api] Running migrations..."
  docker exec api python manage.py migrate --noinput

  # Collect static files
  log "[api] Collecting static files..."
  docker exec api python manage.py collectstatic --noinput

  # Graceful restart Gunicorn
  log "[api] Graceful restart Gunicorn..."
  docker exec api bash -c 'kill -HUP $(pgrep -f "gunicorn" | head -1)'

  # Graceful restart Celery worker
  if docker ps --format '{{.Names}}' | grep -q "^bgworker$"; then
    log "[bgworker] Graceful restart Celery worker..."
    docker exec bgworker bash -c 'kill -HUP $(pgrep -f "celery.*worker" | head -1)'
  fi

  # Restart Celery beat
  if docker ps --format '{{.Names}}' | grep -q "^beatworker$"; then
    log "[beatworker] Restarting..."
    docker restart beatworker
  fi

  health_check

  # Cleanup
  rm -f "$source_file"
  log "Cleaned up $source_file"
}

deploy_web() {
  local client_file="web-client.tar.gz"
  if [ ! -f "$client_file" ]; then
    err "File not found: $PLANE_DIR/$client_file"
    err "Run build-dev.sh web on dev machine first"
    exit 1
  fi

  log "[web] Replacing static files..."
  docker exec web rm -rf /usr/share/nginx/html/*
  docker cp "$client_file" web:/tmp/
  docker exec web sh -c "cd /usr/share/nginx/html && tar xzf /tmp/web-client.tar.gz && rm /tmp/web-client.tar.gz"

  log "[web] Reloading nginx..."
  docker exec web nginx -s reload

  # Cleanup
  rm -f "$client_file"
  log "[web] Done (0 downtime)"
}

deploy_admin() {
  local client_file="admin-client.tar.gz"
  if [ ! -f "$client_file" ]; then
    err "File not found: $PLANE_DIR/$client_file"
    err "Run build-dev.sh admin on dev machine first"
    exit 1
  fi

  log "[admin] Replacing static files..."
  docker exec admin rm -rf /usr/share/nginx/html/god-mode/*
  docker cp "$client_file" admin:/tmp/
  docker exec admin sh -c "cd /usr/share/nginx/html/god-mode && tar xzf /tmp/admin-client.tar.gz && rm /tmp/admin-client.tar.gz"

  log "[admin] Reloading nginx..."
  docker exec admin nginx -s reload

  # Cleanup
  rm -f "$client_file"
  log "[admin] Done (0 downtime)"
}

deploy_space() {
  local image_file="images/plane-space.tar.gz"
  if [ ! -f "$image_file" ]; then
    err "File not found: $PLANE_DIR/$image_file"
    err "Run build-dev.sh space on dev machine first"
    exit 1
  fi

  log "[space] Loading image..."
  docker load < "$image_file"

  log "[space] Recreating container..."
  docker compose up -d --no-deps --force-recreate space

  log "[space] Done (~2-3s downtime)"
}

deploy_live() {
  local image_file="images/plane-live.tar.gz"
  if [ ! -f "$image_file" ]; then
    err "File not found: $PLANE_DIR/$image_file"
    err "Run build-dev.sh live on dev machine first"
    exit 1
  fi

  log "[live] Loading image..."
  docker load < "$image_file"

  log "[live] Recreating container..."
  docker compose up -d --no-deps --force-recreate live

  log "[live] Done (~2-3s downtime)"
}

# --- Main ---

if [ $# -eq 0 ]; then
  usage
fi

log "=== Plane Deploy — $(date '+%Y-%m-%d %H:%M:%S') ==="

case "$1" in
  all)   deploy_all ;;
  api)   deploy_api ;;
  web)   deploy_web ;;
  admin) deploy_admin ;;
  space) deploy_space ;;
  live)  deploy_live ;;
  -h|--help) usage ;;
  *)
    err "Unknown target: $1"
    usage
    ;;
esac

log "=== Deploy Complete ==="
