#!/usr/bin/env bash
# Team Operations Dashboard — local QA stack (API :8100, web :3100).
# Invoked via Makefile (`make dashboard-qa`). See AGENTS.md.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dashboard-qa.yml}"
API_URL="${DASHBOARD_QA_API_URL:-http://localhost:8100}"
WEB_HOST="${DASHBOARD_QA_WEB_HOST:-localhost}"
WEB_PORT="${DASHBOARD_QA_WEB_PORT:-3100}"
WEB_PID_FILE="${DASHBOARD_QA_WEB_PID_FILE:-/tmp/plane-dashboard-qa-web.pid}"
WEB_LOG="${DASHBOARD_QA_WEB_LOG:-/tmp/plane-dashboard-qa-web.log}"
READY_JSON="${DASHBOARD_QA_READY_JSON:-/tmp/plane-dashboard-qa-ready.json}"
API_CONTAINER="${DASHBOARD_QA_API_CONTAINER:-plane-dashboard-qa-api}"
REDIS_CONTAINER="${DASHBOARD_QA_REDIS_CONTAINER:-plane-dashboard-qa-redis}"

# Fixed container_name in compose — only one API may exist. Prefer the compose
# project label on an already-running QA container (db/redis/api) so `dc` matches
# the stack that owns :8100, not a second project that fights for the same name.
resolve_compose_project() {
  if [[ -n "${COMPOSE_PROJECT:-}" ]]; then
    echo "$COMPOSE_PROJECT"
    return 0
  fi
  local name proj
  for name in plane-dashboard-qa-db plane-dashboard-qa-redis plane-dashboard-qa-api; do
    if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
      proj="$(docker inspect "$name" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)"
      if [[ -n "$proj" ]]; then
        echo "$proj"
        return 0
      fi
    fi
  done
  if docker network inspect team-operations-dashboard_dashboard_qa_net >/dev/null 2>&1; then
    echo "team-operations-dashboard"
  else
    echo "plane-dashboard-qa"
  fi
}

COMPOSE_PROJECT="$(resolve_compose_project)"

dc() {
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" "$@"
}

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "error: Docker is not running. Start Docker Desktop and retry." >&2
    exit 1
  fi
}

wait_for_api() {
  local timeout="${1:-180}"
  local elapsed=0
  echo "Waiting for QA API at ${API_URL} (timeout ${timeout}s)…"
  while (( elapsed < timeout )); do
    if curl -sf "${API_URL}/api/instances/" >/dev/null 2>&1; then
      echo "API responding."
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    if (( elapsed % 10 == 0 )); then
      echo "  … still waiting (${elapsed}s)"
    fi
  done
  echo "error: API did not respond in ${timeout}s. Try: $0 restart" >&2
  return 1
}

wait_for_instance_ready() {
  local timeout="${1:-60}"
  local elapsed=0
  echo "Waiting for instance is_setup_done (timeout ${timeout}s)…"
  while (( elapsed < timeout )); do
    local body
    body="$(curl -sf "${API_URL}/api/instances/" 2>/dev/null || true)"
    if [[ -n "$body" ]] && echo "$body" | grep -Eq '"is_setup_done"[[:space:]]*:[[:space:]]*true'; then
      echo "Instance ready for login."
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "error: instance still not configured — seed may have failed" >&2
  return 1
}

seed_and_flush() {
  require_docker
  echo "Seeding dashboard QA fixture…"
  docker exec "$API_CONTAINER" python manage.py seed_dashboard_qa
  echo "Flushing Redis (clears cached /api/instances/)…"
  docker exec "$REDIS_CONTAINER" valkey-cli FLUSHALL >/dev/null
  if [[ -f "$READY_JSON" ]]; then
    echo "Readiness file: $READY_JSON"
  fi
}

remove_qa_api_container() {
  if docker ps -a --format '{{.Names}}' | grep -qx "$API_CONTAINER"; then
    local proj
    proj="$(docker inspect "$API_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)"
    echo "Removing existing ${API_CONTAINER} (compose project: ${proj:-unknown})…"
    docker rm -f "$API_CONTAINER" >/dev/null 2>&1 || true
  fi
}

cmd_up() {
  require_docker
  echo "Starting dashboard QA stack (${COMPOSE_PROJECT})…"
  dc up -d --build
  wait_for_api
  seed_and_flush
  wait_for_instance_ready
}

cmd_down() {
  require_docker
  stop_web_bg 2>/dev/null || true
  dc down
}

cmd_seed() {
  require_docker
  if ! docker ps --format '{{.Names}}' | grep -qx "$API_CONTAINER"; then
    echo "error: ${API_CONTAINER} is not running. Run: $0 up" >&2
    exit 1
  fi
  seed_and_flush
}

stop_web_bg() {
  if [[ -f "$WEB_PID_FILE" ]]; then
    local pid
    pid="$(cat "$WEB_PID_FILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$WEB_PID_FILE"
  fi
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti ":${WEB_PORT}" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

start_web_fg() {
  echo ""
  echo "Dashboard QA web → http://${WEB_HOST}:${WEB_PORT}/acme-qa/dashboards/"
  echo "Login          → alice@acme.so / password123"
  echo ""
  cd "$ROOT/apps/web"
  exec pnpm exec react-router dev --mode dashboard-qa --port "$WEB_PORT" --host "$WEB_HOST"
}

start_web_bg() {
  stop_web_bg
  cd "$ROOT/apps/web"
  nohup pnpm exec react-router dev --mode dashboard-qa --port "$WEB_PORT" --host "$WEB_HOST" >"$WEB_LOG" 2>&1 &
  echo $! >"$WEB_PID_FILE"
  echo "Web started in background (pid $(cat "$WEB_PID_FILE")), log: $WEB_LOG"
}

cmd_web() { start_web_fg; }
cmd_web_bg() { start_web_bg; }
cmd_dev() { cmd_up; start_web_fg; }

cmd_restart() {
  require_docker
  echo "Restarting QA API only (compose project: ${COMPOSE_PROJECT}) — no seed, no Redis flush."
  if docker ps --format '{{.Names}}' | grep -qx "$API_CONTAINER"; then
    docker restart "$API_CONTAINER" >/dev/null
  else
    dc up -d dashboard-qa-api
  fi
  wait_for_api
  cmd_status
  echo ""
  echo "Web on :${WEB_PORT} hot-reloads on save. Use '$0 rebuild-api' after Python changes in apps/api."
  echo "Use '$0 seed' only if instance/login is broken (clears Redis sessions + re-seeds)."
}

cmd_rebuild_api() {
  require_docker
  echo "Rebuilding QA API image (compose project: ${COMPOSE_PROJECT}) — no seed, no Redis flush."
  remove_qa_api_container
  dc up -d --build --no-deps dashboard-qa-api
  wait_for_api
  cmd_status
}

cmd_status() {
  echo "=== Dashboard QA status ==="
  echo "Compose project: ${COMPOSE_PROJECT}"
  if docker ps --format '{{.Names}}' | grep -qx "$API_CONTAINER" 2>/dev/null; then
    echo "Docker API: running"
  else
    echo "Docker API: not running"
  fi
  curl -sf "${API_URL}/api/instances/" >/dev/null 2>&1 && echo "API: OK" || echo "API: FAIL"
  curl -sf "http://${WEB_HOST}:${WEB_PORT}/" >/dev/null 2>&1 && echo "Web: OK on :${WEB_PORT}" || echo "Web: not running"
}

main() {
  case "${1:-dev}" in
    up) cmd_up ;;
    down) cmd_down ;;
    seed) cmd_seed ;;
    web) cmd_web ;;
    web-bg) cmd_web_bg ;;
    dev) cmd_dev ;;
    restart) cmd_restart ;;
    rebuild-api) cmd_rebuild_api ;;
    status) cmd_status ;;
    *) echo "Usage: $0 {dev|up|down|seed|web|web-bg|restart|rebuild-api|status}" >&2; exit 1 ;;
  esac
}

main "$@"
