#!/bin/bash

# Plane setup: env files + production Docker stack from THIS repo (default), or dev deps.
# https://github.com/makeplane/plane
#
# Unlike the community installer (downloads makeplane/* images from artifacts.plane.so),
# this script builds every app image from your local checkout via docker-compose.yml.
#
# Usage:
#   ./setup.sh              Production: env + docker build + start all services
#   ./setup.sh production   Same as default
#   ./setup.sh rebuild      Rebuild images from local source (use after code changes)
#   ./setup.sh dev          Dev only: env files + pnpm install (then use ./dev.sh)
#   ./setup.sh stop         Stop production Docker stack
#   ./setup.sh help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-production}"
COMPOSE_FILE="docker-compose.yml"
API_WAIT_SECONDS="${API_WAIT_SECONDS:-600}"

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

print_header() {
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}                   Plane - Project Management Tool                    ${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

copy_env_file() {
  local source=$1
  local destination=$2

  if [ ! -f "$source" ]; then
    echo -e "${RED}Error: Source file $source does not exist.${NC}"
    return 1
  fi

  cp "$source" "$destination"
  echo -e "${GREEN}✓${NC} Copied $destination"
}

copy_env_file_if_missing() {
  local source=$1
  local destination=$2

  if [ -f "$destination" ]; then
    echo -e "${GREEN}✓${NC} Kept existing $destination"
    return 0
  fi
  copy_env_file "$source" "$destination"
}

update_env_key() {
  local key=$1
  local value=$2
  local file=$3

  if [ ! -f "$file" ]; then
    echo -e "${RED}File not found: $file${NC}"
    return 1
  fi

  if grep -q "^${key}=" "$file"; then
    if [ "$(uname)" = "Darwin" ]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    echo "${key}=${value}" >> "$file"
  fi
}

setup_env_files() {
  local preserve_existing="${1:-false}"
  export LC_ALL=C
  export LC_CTYPE=C

  echo -e "${YELLOW}Setting up environment files...${NC}"

  local services=("" "web" "api" "space" "admin" "live")
  local service prefix
  local copy_fn=copy_env_file
  if [ "$preserve_existing" = "true" ]; then
    copy_fn=copy_env_file_if_missing
  fi

  for service in "${services[@]}"; do
    if [ "$service" = "" ]; then
      prefix="./"
    else
      prefix="./apps/$service/"
    fi
    $copy_fn "${prefix}.env.example" "${prefix}.env" || return 1
  done

  if [ -f "./apps/api/.env" ]; then
    if grep -q '^SECRET_KEY=' ./apps/api/.env; then
      echo -e "${GREEN}✓${NC} SECRET_KEY already present in apps/api/.env"
    else
      echo -e "\n${YELLOW}Generating Django SECRET_KEY...${NC}"
      local secret_key
      secret_key=$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)
      if [ -z "$secret_key" ]; then
        echo -e "${RED}Error: Failed to generate SECRET_KEY.${NC}"
        return 1
      fi
      echo -e "SECRET_KEY=\"$secret_key\"" >> ./apps/api/.env
      echo -e "${GREEN}✓${NC} Added SECRET_KEY to apps/api/.env"
    fi
  else
    echo -e "${RED}✗ apps/api/.env not found.${NC}"
    return 1
  fi

  return 0
}

get_web_url() {
  local port
  port=$(grep -E '^LISTEN_HTTP_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d ' ' || echo "80")
  if [ -z "$port" ]; then
    port="80"
  fi
  if [ "$port" = "80" ]; then
    echo "http://localhost"
  else
    echo "http://localhost:${port}"
  fi
}

get_listen_port() {
  local port
  port=$(grep -E '^LISTEN_HTTP_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d ' ' || echo "80")
  if [ -z "$port" ]; then
    port="80"
  fi
  echo "$port"
}

configure_production_env() {
  echo -e "${YELLOW}Configuring environment for production Docker stack...${NC}"

  local web_url port site_address
  web_url=$(get_web_url)
  port=$(get_listen_port)
  site_address=":${port}"

  local live_secret
  live_secret=$(grep -E '^LIVE_SERVER_SECRET_KEY=' ./apps/api/.env | cut -d= -f2- | tr -d '"' || true)
  if [ -z "$live_secret" ]; then
    live_secret=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c32)
    update_env_key "LIVE_SERVER_SECRET_KEY" "\"$live_secret\"" "./apps/api/.env"
    echo -e "${GREEN}✓${NC} Set LIVE_SERVER_SECRET_KEY in apps/api/.env"
  fi

  update_env_key "WEB_URL" "\"$web_url\"" "./apps/api/.env"
  update_env_key "APP_BASE_URL" "\"$web_url\"" "./apps/api/.env"
  update_env_key "ADMIN_BASE_URL" "\"$web_url\"" "./apps/api/.env"
  update_env_key "SPACE_BASE_URL" "\"$web_url\"" "./apps/api/.env"
  update_env_key "LIVE_BASE_URL" "\"${web_url}/live\"" "./apps/api/.env"
  update_env_key "CORS_ALLOWED_ORIGINS" "\"$web_url\"" "./apps/api/.env"
  update_env_key "AWS_S3_ENDPOINT_URL" "\"http://plane-minio:9000\"" "./apps/api/.env"
  update_env_key "POSTGRES_HOST" "\"plane-db\"" "./apps/api/.env"
  update_env_key "REDIS_HOST" "\"plane-redis\"" "./apps/api/.env"
  update_env_key "RABBITMQ_HOST" "\"plane-mq\"" "./apps/api/.env"

  update_env_key "API_BASE_URL" "\"http://api:8000\"" "./apps/live/.env"
  update_env_key "REDIS_HOST" "plane-redis" "./apps/live/.env"
  update_env_key "REDIS_URL" "\"redis://plane-redis:6379/\"" "./apps/live/.env"
  update_env_key "WEB_BASE_URL" "\"$web_url\"" "./apps/live/.env"
  update_env_key "LIVE_BASE_URL" "\"${web_url}/live\"" "./apps/live/.env"
  update_env_key "LIVE_BASE_PATH" "\"/live\"" "./apps/live/.env"
  update_env_key "LIVE_SERVER_SECRET_KEY" "\"$live_secret\"" "./apps/live/.env"

  # Root .env: proxy listen address + Vite build args (baked into web/admin/space images)
  update_env_key "SITE_ADDRESS" "$site_address" "./.env"
  update_env_key "VITE_API_BASE_URL" "\"$web_url\"" "./.env"
  update_env_key "VITE_WEB_BASE_URL" "\"$web_url\"" "./.env"
  update_env_key "VITE_ADMIN_BASE_URL" "\"$web_url\"" "./.env"
  update_env_key "VITE_SPACE_BASE_URL" "\"$web_url\"" "./.env"
  update_env_key "VITE_LIVE_BASE_URL" "\"$web_url\"" "./.env"

  echo -e "${GREEN}✓${NC} Production environment configured (app URL: ${web_url})"
  echo -e "${GREEN}✓${NC} Frontend images will build from this checkout (custom fields included)"
}

require_docker() {
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}Docker is not installed.${NC}"
    exit 1
  fi
  if ! docker info &>/dev/null; then
    echo -e "${RED}Docker daemon is not running. Start Docker Desktop and retry.${NC}"
    exit 1
  fi
}

wait_for_migrator() {
  local migrator_id
  migrator_id=$($COMPOSE_CMD -f "$COMPOSE_FILE" ps -q migrator 2>/dev/null || true)
  if [ -z "$migrator_id" ]; then
    return 0
  fi

  echo -e "${YELLOW}Waiting for database migrations...${NC}"
  local waited=0
  while docker inspect --format='{{.State.Status}}' "$migrator_id" 2>/dev/null | grep -q "running"; do
    if [ "$waited" -ge "$API_WAIT_SECONDS" ]; then
      echo -e "${RED}Migrator timed out. Check: $COMPOSE_CMD -f $COMPOSE_FILE logs migrator${NC}"
      exit 1
    fi
    sleep 2
    waited=$((waited + 2))
  done

  local exit_code
  exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$migrator_id" 2>/dev/null || echo 1)
  if [ "$exit_code" != "0" ]; then
    echo -e "${RED}Migrator failed (exit $exit_code). Check logs:${NC}"
    echo -e "  $COMPOSE_CMD -f $COMPOSE_FILE logs migrator"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} Migrations completed"
}

wait_for_proxy() {
  local web_url
  web_url=$(get_web_url)
  echo -e "${YELLOW}Waiting for Plane at ${web_url}...${NC}"

  local waited=0
  until curl -sf "${web_url}/" >/dev/null 2>&1; do
    if [ "$waited" -ge "$API_WAIT_SECONDS" ]; then
      echo -e "${RED}Plane did not become ready in ${API_WAIT_SECONDS}s.${NC}"
      echo -e "Check: $COMPOSE_CMD -f $COMPOSE_FILE ps"
      echo -e "Logs: $COMPOSE_CMD -f $COMPOSE_FILE logs proxy api"
      exit 1
    fi
    sleep 3
    waited=$((waited + 3))
  done
  echo -e "${GREEN}✓${NC} Plane is responding"
}

build_production_images() {
  local extra_args="${1:-}"
  require_docker

  echo -e "${BOLD}Building Docker images from local source${NC}"
  echo -e "  Context: ${SCRIPT_DIR}"
  echo -e "  Compose: ${COMPOSE_FILE} (not makeplane/plane Hub images)\n"
  export DOCKER_BUILDKIT=1
  # shellcheck disable=SC2086
  /bin/bash -c "$COMPOSE_CMD -f $COMPOSE_FILE build $extra_args"
}

start_production() {
  local skip_build="${1:-false}"
  require_docker

  if [ "$skip_build" != "true" ]; then
    build_production_images
  fi

  echo -e "\n${YELLOW}Starting all services (web, admin, space, live, api, workers, proxy, infra)...${NC}"
  export DOCKER_BUILDKIT=1
  /bin/bash -c "$COMPOSE_CMD -f $COMPOSE_FILE up -d --build --remove-orphans"

  wait_for_migrator
  wait_for_proxy

  local web_url
  web_url=$(get_web_url)

  echo -e "\n${GREEN}✓${NC} Production stack is running.\n"
  echo -e "${BOLD}Open Plane:${NC} ${BLUE}${web_url}${NC}"
  echo -e "${BOLD}Admin (god-mode):${NC} ${BLUE}${web_url}/god-mode/${NC}"
  echo -e "${BOLD}Public spaces:${NC} ${BLUE}${web_url}/spaces/${NC}"
  echo -e "${BOLD}MinIO console:${NC} ${BLUE}http://localhost:9090${NC} (only if port published)"
  echo ""
  echo -e "Stop: ${BOLD}./setup.sh stop${NC}"
  echo -e "Rebuild after code changes: ${BOLD}./setup.sh rebuild${NC}"
  echo -e "Logs: ${BOLD}$COMPOSE_CMD -f $COMPOSE_FILE logs -f [service]${NC}"
  echo -e "Dev from source (hot reload): ${BOLD}./setup.sh dev${NC} then ${BOLD}./dev.sh${NC}"
}

rebuild_production() {
  configure_production_env
  build_production_images "--no-cache"
  start_production "true"
}

stop_production() {
  require_docker
  echo -e "${YELLOW}Stopping production Docker stack...${NC}"
  /bin/bash -c "$COMPOSE_CMD -f $COMPOSE_FILE down"
  echo -e "${GREEN}✓${NC} Stopped"
}

setup_dev() {
  echo -e "${BOLD}Setting up local development environment...${NC}\n"

  if ! setup_env_files; then
    exit 1
  fi

  if ! command -v pnpm &>/dev/null; then
    echo -e "${RED}pnpm is not installed. Install Node.js and enable pnpm.${NC}"
    exit 1
  fi

  echo -e "\n${YELLOW}Installing Node dependencies...${NC}"
  pnpm install

  echo -e "\n${GREEN}✓${NC} Dev setup completed.\n"
  echo -e "${BOLD}Next:${NC} ${BOLD}./dev.sh${NC} (Docker backend + frontends from source on ports 3000–3100)"
}

print_help() {
  sed -n '9,14p' "$0" | sed 's/^# //'
  echo ""
  echo "Production builds from docker-compose.yml in this repo (your source tree)."
  echo "It does NOT download prebuilt images from artifacts.plane.so / makeplane/plane."
  echo "If port 80 is in use, set LISTEN_HTTP_PORT=8080 in .env before ./setup.sh"
  echo "After changing frontend or API code, run: ./setup.sh rebuild"
}

# --- main ---
print_header

case "$MODE" in
  production|prod|start|"")
    echo -e "${BOLD}Production setup — build from local source and start all services${NC}\n"
    if ! setup_env_files "true"; then
      exit 1
    fi
    configure_production_env
    start_production
    ;;
  rebuild)
    echo -e "${BOLD}Rebuilding production images from local source${NC}\n"
    if ! setup_env_files "true"; then
      exit 1
    fi
    rebuild_production
    ;;
  dev|development)
    setup_dev
    ;;
  stop|down)
    stop_production
    ;;
  help|-h|--help)
    print_help
    ;;
  *)
    echo -e "${RED}Unknown command: $MODE${NC}"
    print_help
    exit 1
    ;;
esac
