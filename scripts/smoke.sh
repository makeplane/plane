#!/usr/bin/env bash
# Local smoke test for Next.js apps: admin, live, space, web
# - Builds images using each app's Dockerfile
# - Runs each container on a unique host port
# - Probes HTTP endpoints for readiness
# - Leaves containers running for manual inspection

set -Eeuo pipefail

# ---------------------------
# Config (customize via env)
# ---------------------------
WEB_PORT="${WEB_PORT:-3001}"
ADMIN_PORT="${ADMIN_PORT:-3002}"
SPACE_PORT="${SPACE_PORT:-3003}"
LIVE_PORT="${LIVE_PORT:-3004}"

# Probe paths (derive from base paths; can be overridden)
WEB_PATH="${WEB_PATH:-/}"
ADMIN_PATH="${ADMIN_PATH:-${ADMIN_BASE_PATH:-/god-mode}}"
SPACE_PATH="${SPACE_PATH:-${SPACE_BASE_PATH:-/spaces}}"
LIVE_PATH="${LIVE_PATH:-${LIVE_BASE_PATH:-/live}/health}"

# Wait up to N seconds for each service to be ready
MAX_WAIT="${MAX_WAIT:-120}"
SLEEP_INTERVAL="${SLEEP_INTERVAL:-2}"

# Build args (override to change the built-in defaults)
# e.g. ADMIN_BASE_PATH="/admin" SPACE_BASE_PATH="/my-space"
ADMIN_BASE_PATH="${ADMIN_BASE_PATH:-/god-mode}"
SPACE_BASE_PATH="${SPACE_BASE_PATH:-/spaces}"
LIVE_BASE_PATH="${LIVE_BASE_PATH:-/live}"

# Docker image tags and container names
WEB_IMAGE="${WEB_IMAGE:-plane-web:smoke}"
ADMIN_IMAGE="${ADMIN_IMAGE:-plane-admin:smoke}"
SPACE_IMAGE="${SPACE_IMAGE:-plane-space:smoke}"
LIVE_IMAGE="${LIVE_IMAGE:-plane-live:smoke}"

WEB_CONT="${WEB_CONT:-plane-web-smoke}"
ADMIN_CONT="${ADMIN_CONT:-plane-admin-smoke}"
SPACE_CONT="${SPACE_CONT:-plane-space-smoke}"
LIVE_CONT="${LIVE_CONT:-plane-live-smoke}"

# ---------------------------
# Utilities
# ---------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

have() { command -v "$1" >/dev/null 2>&1; }

log() { printf '[%s] %s\n' "$(date +'%H:%M:%S')" "$*"; }

die() { echo "ERROR: $*" >&2; exit 1; }

http_ok() {
  # Returns 0 if URL returns a 2xx/3xx, non-zero otherwise
  local url="$1"
  if have curl; then
    # Use silent mode; output HTTP code only
    local code
    code="$(curl --connect-timeout 3 --max-time 10 -fsS -o /dev/null -w "%{http_code}" "$url" || true)"
    case "$code" in
      2??|3??) return 0 ;;
      *)       return 1 ;;
    esac
  elif have wget; then
    wget -q --timeout=10 --tries=1 --spider "$url" >/dev/null 2>&1
    return $?
  else
    die "Neither curl nor wget is available to probe endpoints"
  fi
}

wait_for_url() {
  local url="$1" name="$2" waited=0
  log "Waiting for $name to be ready at: $url (timeout: ${MAX_WAIT}s)"
  until http_ok "$url"; do
    sleep "$SLEEP_INTERVAL"
    waited=$((waited + SLEEP_INTERVAL))
    if (( waited >= MAX_WAIT )); then
      log "Timed out waiting for $name at $url"
      # Aid triage: print last response body (first 200 lines)
      if have curl; then
        echo "---- Last response body (${url}) ----"
        curl -sS -L "${url}" | sed -n '1,200p' || true
      elif have wget; then
        echo "---- Last response body (${url}) ----"
        wget -qO- "${url}" | sed -n '1,200p' || true
      fi
      return 1
    fi
  done
  log "$name is ready at $url"
}

ensure_not_running() {
  local name="$1"
  if docker ps -a --format '{{.Names}}' | grep -q "^${name}\$"; then
    log "Container ${name} already exists, removing..."
    docker rm -f "$name" >/dev/null 2>&1 || true
  fi
}

build_image() {
  local name="$1" image="$2" dockerfile="$3"
  shift 3
  local build_args=("$@")
  log "Building ${name} image (${image}) with Dockerfile: ${dockerfile}"
  DOCKER_BUILDKIT=1 docker build \
    --pull \
    --progress=plain \
    -f "$dockerfile" \
    -t "$image" \
    "${build_args[@]}" \
    "$ROOT_DIR"
}

run_container() {
  local name="$1" image="$2" host_port="$3"
  shift 3
  local extra_args=("$@")
  log "Starting ${name} on host port ${host_port} from image ${image}"
  ensure_not_running "$name"
  docker run -d --rm \
    --name "$name" \
    -p "${host_port}:3000" \
    -e NODE_ENV=production \
    "${extra_args[@]}" \
    "$image" >/dev/null
}

stop_containers() {
  local names=("$@")
  for n in "${names[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${n}\$"; then
      log "Stopping ${n}..."
      docker rm -f "$n" >/dev/null 2>&1 || true
    fi
  done
}

usage() {
  cat <<EOF
Usage: $(basename "$0") [up|down] [--no-build] [--services svc1,svc2,...]

Commands:
  up        Build (unless --no-build) and run admin, live, space, web. Probe readiness and leave running.
  down      Stop and remove the smoke containers.

Options:
  --no-build    Do not rebuild images (reuse existing).
  --services    Comma-separated list of services to run (default: web,admin,space,live).
  --help        Show this help.
Environment overrides:
  Ports:   WEB_PORT=${WEB_PORT}, ADMIN_PORT=${ADMIN_PORT}, SPACE_PORT=${SPACE_PORT}, LIVE_PORT=${LIVE_PORT}
  Paths:   WEB_PATH=${WEB_PATH}, ADMIN_PATH=${ADMIN_PATH}, SPACE_PATH=${SPACE_PATH}, LIVE_PATH=${LIVE_PATH}
  Timeouts: MAX_WAIT=${MAX_WAIT}, SLEEP_INTERVAL=${SLEEP_INTERVAL}
  Images:  WEB_IMAGE=${WEB_IMAGE}, ADMIN_IMAGE=${ADMIN_IMAGE}, SPACE_IMAGE=${SPACE_IMAGE}, LIVE_IMAGE=${LIVE_IMAGE}
  Names:   WEB_CONT=${WEB_CONT}, ADMIN_CONT=${ADMIN_CONT}, SPACE_CONT=${SPACE_CONT}, LIVE_CONT=${LIVE_CONT}

Examples:
  $(basename "$0") up
  $(basename "$0") up --services web,space --no-build
  $(basename "$0") down
EOF
}

# ---------------------------
# Main
# ---------------------------
cmd="${1:-up}"
no_build="false"
# Default list; CLI --services should take precedence over environment.
services="web,admin,space,live"
shift $(( $# > 0 ? 1 : 0 ))

while (( "$#" )); do
  case "$1" in
    --no-build) no_build="true"; shift ;;
    --services) [[ $# -ge 2 ]] || die "--services requires a value"; services="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

# Environment override (only if CLI didn't specify --services)
if [[ -n "${SERVICES:-}" && "$services" == "web,admin,space,live" ]]; then
  services="$SERVICES"
fi

case "$cmd" in
  down)
    stop_containers "$WEB_CONT" "$ADMIN_CONT" "$SPACE_CONT" "$LIVE_CONT"
    log "All smoke containers stopped."
    exit 0
    ;;
  up) ;;
  *)
    usage
    exit 1
    ;;
esac

# Check Docker is available
have docker || die "Docker is required. Please install Docker and ensure the daemon is running."
# Verify daemon availability early
docker ps -q >/dev/null 2>&1 || die "Docker daemon not reachable. Start Docker and retry."

cd "$ROOT_DIR"

IFS=',' read -r -a SELECTED <<< "${services//[[:space:]]/}"

if [[ "$no_build" != "true" ]]; then
  for svc in "${SELECTED[@]}"; do case "$svc" in
    web) build_image "web" "$WEB_IMAGE" "apps/web/Dockerfile.web" ;;
    admin) build_image "admin" "$ADMIN_IMAGE" "apps/admin/Dockerfile.admin" --build-arg NEXT_PUBLIC_ADMIN_BASE_PATH="${ADMIN_BASE_PATH}" ;;
    space) build_image "space" "$SPACE_IMAGE" "apps/space/Dockerfile.space" --build-arg NEXT_PUBLIC_SPACE_BASE_PATH="${SPACE_BASE_PATH}" ;;
    live) build_image "live" "$LIVE_IMAGE" "apps/live/Dockerfile.live" --build-arg LIVE_BASE_PATH="${LIVE_BASE_PATH}" ;;
    *) die "Unknown service: $svc" ;;
  esac; done
else log "Skipping build (reusing existing images)"; fi

# Run containers (selected)
for svc in "${SELECTED[@]}"; do
  case "$svc" in
    web) run_container "$WEB_CONT" "$WEB_IMAGE" "$WEB_PORT" ;;
    admin) run_container "$ADMIN_CONT" "$ADMIN_IMAGE" "$ADMIN_PORT" ;;
    space) run_container "$SPACE_CONT" "$SPACE_IMAGE" "$SPACE_PORT" ;;
    live) run_container "$LIVE_CONT" "$LIVE_IMAGE" "$LIVE_PORT" -e LIVE_BASE_PATH="${LIVE_BASE_PATH}" ;;
    *) die "Unknown service: $svc" ;;
  esac
done

# Probe readiness
web_url="http://127.0.0.1:${WEB_PORT}${WEB_PATH}"
admin_url="http://127.0.0.1:${ADMIN_PORT}${ADMIN_PATH}"
space_url="http://127.0.0.1:${SPACE_PORT}${SPACE_PATH}"
live_url="http://127.0.0.1:${LIVE_PORT}${LIVE_PATH}"

failures=0
for svc in "${SELECTED[@]}"; do
  case "$svc" in
    web) wait_for_url "$web_url" "web" || failures=$((failures+1)) ;;
    admin) wait_for_url "$admin_url" "admin" || failures=$((failures+1)) ;;
    space) wait_for_url "$space_url" "space" || failures=$((failures+1)) ;;
    live) wait_for_url "$live_url" "live" || failures=$((failures+1)) ;;
  esac
done

echo
if (( failures == 0 )); then
  log "Smoke test succeeded. Containers are running:"
else
  log "Smoke test completed with ${failures} failure(s). Containers may still be running for inspection:"
  # Dump brief logs to help triage
  for svc in "${SELECTED[@]}"; do
    case "$svc" in
      web)   name="$WEB_CONT" ;;
      admin) name="$ADMIN_CONT" ;;
      space) name="$SPACE_CONT" ;;
      live)  name="$LIVE_CONT" ;;
    esac
    docker ps -a --format '{{.Names}}' | grep -q "^${name}\$" && {
      log "---- logs: ${name} (last 80 lines) ----"
      docker logs --tail=80 "$name" || true
    }
  done
fi

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' | grep -E "(^NAMES|${WEB_CONT}|${ADMIN_CONT}|${SPACE_CONT}|${LIVE_CONT})" || true

echo
echo "URLs:"
for svc in "${SELECTED[@]}"; do
  case "$svc" in
    web)   echo "  web:   ${web_url}" ;;
    admin) echo "  admin: ${admin_url}" ;;
    space) echo "  space: ${space_url}" ;;
    live)  echo "  live:  ${live_url}" ;;
  esac
done

echo
echo "To stop all smoke containers:"
echo "  $(basename "$0") down"

if (( failures > 0 )); then
  exit 1
fi
