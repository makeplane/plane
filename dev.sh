#!/bin/bash
# Start Plane local development: Docker backend + frontend apps from source.
# Usage:
#   ./dev.sh              Start Docker services, wait for API, then pnpm dev
#   ./dev.sh docker       Start / restart Docker backend only
#   ./dev.sh frontend     Start pnpm dev only (Docker must already be running)
#   ./dev.sh stop         Stop Docker backend services
#   ./dev.sh setup        Run ./setup.sh then start everything

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose-local.yml"
API_URL="${API_URL:-http://localhost:8000/api/instances/}"
API_WAIT_SECONDS="${API_WAIT_SECONDS:-300}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

if command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose"
fi

print_urls() {
  echo -e "\n${BOLD}Local URLs${NC}"
  echo -e "  Web (main app):  ${BLUE}http://localhost:3000${NC}"
  echo -e "  Admin:           ${BLUE}http://localhost:3001${NC}"
  echo -e "  Space:           ${BLUE}http://localhost:3002${NC}"
  echo -e "  Live:            ${BLUE}http://localhost:3100${NC}"
  echo -e "  API:             ${BLUE}http://localhost:8000${NC}"
  echo -e "  MinIO console:   ${BLUE}http://localhost:9090${NC}"
  echo ""
}

require_docker() {
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}Docker is not installed or not on PATH.${NC}"
    exit 1
  fi
  if ! docker info &>/dev/null; then
    echo -e "${RED}Docker daemon is not running. Start Docker Desktop and retry.${NC}"
    exit 1
  fi
}

require_pnpm() {
  if ! command -v pnpm &>/dev/null; then
    echo -e "${RED}pnpm is not installed.${NC}"
    echo -e "Install Node.js, then: ${BOLD}corepack enable pnpm${NC} or ${BOLD}npm install -g pnpm${NC}"
    exit 1
  fi
}

env_files_ready() {
  local f
  for f in .env apps/api/.env apps/web/.env apps/admin/.env apps/space/.env apps/live/.env; do
    if [ ! -f "$f" ]; then
      return 1
    fi
  done
  return 0
}

run_setup() {
  echo -e "${YELLOW}Running ./setup.sh dev to create .env files and install dependencies...${NC}\n"
  bash ./setup.sh dev
}

ensure_env() {
  if env_files_ready; then
    return 0
  fi
  echo -e "${YELLOW}.env files missing — running setup first.${NC}"
  run_setup
}

ensure_node_modules() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found — running pnpm install...${NC}"
    pnpm install
  fi
}

start_docker() {
  require_docker
  echo -e "${YELLOW}Starting Docker backend (${COMPOSE_FILE})...${NC}"
  /bin/bash -c "$COMPOSE_CMD -f $COMPOSE_FILE up -d --remove-orphans"

  echo -e "${YELLOW}Waiting for database migrations (migrator)...${NC}"
  local migrator_id
  migrator_id=$($COMPOSE_CMD -f "$COMPOSE_FILE" ps -q migrator 2>/dev/null || true)
  if [ -n "$migrator_id" ]; then
    local waited=0
    while docker inspect --format='{{.State.Status}}' "$migrator_id" 2>/dev/null | grep -q "running"; do
      if [ "$waited" -ge "$API_WAIT_SECONDS" ]; then
        echo -e "${RED}Migrator did not finish within ${API_WAIT_SECONDS}s. Check: $COMPOSE_CMD -f $COMPOSE_FILE logs migrator${NC}"
        exit 1
      fi
      sleep 1
      waited=$((waited + 1))
    done
    local exit_code
    exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$migrator_id" 2>/dev/null || echo 1)
    if [ "$exit_code" != "0" ]; then
      echo -e "${RED}Migrator failed (exit $exit_code). Check logs:${NC}"
      echo -e "  $COMPOSE_CMD -f $COMPOSE_FILE logs migrator"
      exit 1
    fi
    echo -e "${GREEN}✓${NC} Migrations completed"
  fi

  echo -e "${YELLOW}Waiting for API at ${API_URL}...${NC}"
  local waited=0
  until curl -sf "$API_URL" >/dev/null 2>&1; do
    if [ "$waited" -ge "$API_WAIT_SECONDS" ]; then
      echo -e "${RED}API not ready after ${API_WAIT_SECONDS}s. Check:${NC}"
      echo -e "  $COMPOSE_CMD -f $COMPOSE_FILE logs api"
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done
  echo -e "${GREEN}✓${NC} API is ready"
}

stop_docker() {
  require_docker
  echo -e "${YELLOW}Stopping Docker backend...${NC}"
  /bin/bash -c "$COMPOSE_CMD -f $COMPOSE_FILE down"
  echo -e "${GREEN}✓${NC} Docker services stopped"
}

start_frontend() {
  require_pnpm
  ensure_node_modules
  echo -e "\n${BOLD}${GREEN}Starting frontends from source (pnpm dev)...${NC}"
  print_urls
  echo -e "${YELLOW}Press Ctrl+C to stop web, admin, space, and live. Docker keeps running.${NC}"
  echo -e "${YELLOW}Stop Docker with: ${BOLD}./dev.sh stop${NC}\n"
  exec pnpm dev
}

MODE="${1:-}"

case "$MODE" in
  ""|start|all)
    echo -e "${BOLD}${BLUE}Plane local dev — Docker backend + source frontends${NC}\n"
    ensure_env
    start_docker
    start_frontend
    ;;
  docker|backend)
    ensure_env
    start_docker
    print_urls
    echo -e "${GREEN}✓${NC} Backend is up. Start frontends with: ${BOLD}./dev.sh frontend${NC}"
    ;;
  frontend|web)
    ensure_env
    start_frontend
    ;;
  stop|down)
    stop_docker
    ;;
  setup)
    run_setup
    start_docker
    start_frontend
    ;;
  help|-h|--help)
    sed -n '2,8p' "$0" | sed 's/^# //'
    echo ""
    echo "Environment:"
    echo "  API_URL             Health check URL (default: http://localhost:8000/api/instances/)"
    echo "  API_WAIT_SECONDS    Max wait for API/migrator (default: 300)"
    ;;
  *)
    echo -e "${RED}Unknown command: $MODE${NC}"
    echo "Run ./dev.sh help"
    exit 1
    ;;
esac
