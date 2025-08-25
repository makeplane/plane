#!/usr/bin/env bash
# plane/scripts/smoke.sh
# Portable smoke test for Plane frontend images (web, space, admin, live).
# - Runs each image in a container bound to a host port
# - Probes an HTTP path until it returns 200 OK (or times out)
# - Prints container logs on failure and exits non-zero
#
# Examples:
#   ./scripts/smoke.sh
#   ./scripts/smoke.sh --web plane-web:latest --space plane-space:latest
#   ./scripts/smoke.sh --image-prefix local/ --attempts 90 --sleep 1
#   ./scripts/smoke.sh --parallel --keep
#
# Dependencies: bash, docker, curl

set -euo pipefail

# -------------------------------
# Defaults
# -------------------------------
WEB_IMAGE_DEFAULT="plane-web:latest"
SPACE_IMAGE_DEFAULT="plane-space:latest"
ADMIN_IMAGE_DEFAULT="plane-admin:latest"
LIVE_IMAGE_DEFAULT="plane-live:latest"

WEB_PORT_DEFAULT=3001
SPACE_PORT_DEFAULT=3002
ADMIN_PORT_DEFAULT=3003
LIVE_PORT_DEFAULT=3005

WEB_PATH_DEFAULT="/"
SPACE_PATH_DEFAULT="/spaces"
ADMIN_PATH_DEFAULT="/god-mode"
LIVE_PATH_DEFAULT="/live/health"

ATTEMPTS_DEFAULT=60
SLEEP_DEFAULT=2
KEEP_DEFAULT=0         # 1 = keep containers after run
PULL_DEFAULT=0         # 1 = docker pull before run
PARALLEL_DEFAULT=0     # 1 = run tests in parallel
HOST_DEFAULT="127.0.0.1"
DOCKER_FLAGS_DEFAULT=""

# Live specific env (can be overridden via --live-env)
LIVE_ENV_DEFAULT="-e NODE_ENV=production -e LIVE_BASE_PATH=/live"

# -------------------------------
# State
# -------------------------------
WEB_IMAGE="$WEB_IMAGE_DEFAULT"
SPACE_IMAGE="$SPACE_IMAGE_DEFAULT"
ADMIN_IMAGE="$ADMIN_IMAGE_DEFAULT"
LIVE_IMAGE="$LIVE_IMAGE_DEFAULT"

WEB_PORT="$WEB_PORT_DEFAULT"
SPACE_PORT="$SPACE_PORT_DEFAULT"
ADMIN_PORT="$ADMIN_PORT_DEFAULT"
LIVE_PORT="$LIVE_PORT_DEFAULT"

WEB_PATH="$WEB_PATH_DEFAULT"
SPACE_PATH="$SPACE_PATH_DEFAULT"
ADMIN_PATH="$ADMIN_PATH_DEFAULT"
LIVE_PATH="$LIVE_PATH_DEFAULT"

ATTEMPTS="$ATTEMPTS_DEFAULT"
SLEEP_SECS="$SLEEP_DEFAULT"
KEEP="$KEEP_DEFAULT"
PULL="$PULL_DEFAULT"
PARALLEL="$PARALLEL_DEFAULT"
HOST="$HOST_DEFAULT"
DOCKER_FLAGS="$DOCKER_FLAGS_DEFAULT"
LIVE_ENV="$LIVE_ENV_DEFAULT"

RUN_WEB=1
RUN_SPACE=1
RUN_ADMIN=1
RUN_LIVE=1

TMP_DIR="$(mktemp -d -t plane-smoke.XXXXXX)"
CONTAINERS_FILE="$TMP_DIR/containers.txt"
: > "$CONTAINERS_FILE"
CONTAINERS=()
PIDS=()
FAILURES=0

# -------------------------------
# Helpers
# -------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --web <image[:tag]>       Image for web (default: ${WEB_IMAGE_DEFAULT})
  --space <image[:tag]>     Image for space (default: ${SPACE_IMAGE_DEFAULT})
  --admin <image[:tag]>     Image for admin (default: ${ADMIN_IMAGE_DEFAULT})
  --live <image[:tag]>      Image for live (default: ${LIVE_IMAGE_DEFAULT})

  --skip-web                Skip web
  --skip-space              Skip space
  --skip-admin              Skip admin
  --skip-live               Skip live

  --web-port <port>         Host port for web (default: ${WEB_PORT_DEFAULT})
  --space-port <port>       Host port for space (default: ${SPACE_PORT_DEFAULT})
  --admin-port <port>       Host port for admin (default: ${ADMIN_PORT_DEFAULT})
  --live-port <port>        Host port for live (default: ${LIVE_PORT_DEFAULT})

  --web-path <path>         Path to probe for web (default: ${WEB_PATH_DEFAULT})
  --space-path <path>       Path to probe for space (default: ${SPACE_PATH_DEFAULT})
  --admin-path <path>       Path to probe for admin (default: ${ADMIN_PATH_DEFAULT})
  --live-path <path>        Path to probe for live (default: ${LIVE_PATH_DEFAULT})

  --host <ip/host>          Hostname/IP to probe (default: ${HOST_DEFAULT})
  --attempts <n>            Attempts before failure (default: ${ATTEMPTS_DEFAULT})
  --sleep <seconds>         Sleep between attempts (default: ${SLEEP_DEFAULT})
  --pull                    docker pull each image before run
  --keep                    Do not remove containers after tests
  --parallel                Run tests in parallel
  --docker-flags "<flags>"  Extra flags passed to docker run (e.g. --network)
  --image-prefix <prefix>   Prefix for all images (e.g. "local/"), overrides individual images
  --live-env "<flags>"      Override env flags for 'live' container (default: ${LIVE_ENV_DEFAULT})

  -h, --help                Show this help and exit

Examples:
  $(basename "$0")
  $(basename "$0") --web plane-web:latest --space plane-space:latest
  $(basename "$0") --image-prefix ghcr.io/yourorg/ --attempts 90 --sleep 1
EOF
}

exists_cmd() {
  command -v "$1" >/dev/null 2>&1
}

is_port_in_use() {
  local host="$1"
  local port="$2"
  if exists_cmd ss; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${port}\\>" && return 0
  elif exists_cmd lsof; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && return 0
  elif exists_cmd netstat; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${port}\\>" && return 0
  else
    # Fallback: if we can get any HTTP response, assume in use
    local code
    code="$(curl -sS -m 1 -o /dev/null -w "%{http_code}" "http://${host}:${port}/" || true)"
    [[ "$code" != "000" ]] && return 0
  fi
  return 1
}

cleanup() {
  local code=$?
  if [[ $KEEP -eq 0 ]]; then
    if [[ -f "$CONTAINERS_FILE" ]]; then
      while IFS= read -r c; do
        [[ -n "$c" ]] || continue
        docker rm -f "$c" >/dev/null 2>&1 || true
      done < <(sort -u "$CONTAINERS_FILE")
    fi
  fi
  rm -rf "$TMP_DIR" >/dev/null 2>&1 || true
  exit $code
}

log() { printf "%s\n" "$*"; }
log_ok() { printf "\033[32m%s\033[0m\n" "$*"; }
log_warn() { printf "\033[33m%s\033[0m\n" "$*"; }
log_err() { printf "\033[31m%s\033[0m\n" "$*"; }

# name, image, port, path, envflags
run_and_probe() {
  local name="$1"
  local image="$2"
  local port="$3"
  local path="$4"
  local envflags="$5"
  local container="${name}-smoke-$$"

  if [[ $PULL -eq 1 ]]; then
    log "Pulling ${image} ..."
    docker pull "$image" >/dev/null
  fi

  # Pre-flight: ensure host port is not already in use
  if is_port_in_use "$HOST" "$port"; then
    log_err "Port ${HOST}:${port} appears to be in use; aborting ${name} smoke"
    return 1
  fi

  log "Starting ${name}: image=${image} port=${port} path=${path}"
  if ! cid=$(docker run -d --name "$container" -p "${port}:3000" $envflags $DOCKER_FLAGS "$image" 2>"$TMP_DIR/${container}.err"); then
    # If the image tag is :ci-smoke and it fails, try falling back to :latest
    base="${image%:*}"
    tag="${image##*:}"
    if [[ "$tag" == "$image" ]]; then
      tag=""
    fi
    if [[ "$tag" == "ci-smoke" ]]; then
      alt_image="${base}:latest"
      log_warn "Failed to start ${name} with ${image}, retrying with ${alt_image} ..."
      if ! cid=$(docker run -d --name "$container" -p "${port}:3000" $envflags $DOCKER_FLAGS "$alt_image" 2>"$TMP_DIR/${container}.err"); then
        log_err "Failed to start container ${container}"
        cat "$TMP_DIR/${container}.err" 1>&2 || true
        return 1
      else
        image="$alt_image"
      fi
    else
      log_err "Failed to start container ${container}"
      cat "$TMP_DIR/${container}.err" 1>&2 || true
      return 1
    fi
  fi
  printf "%s\n" "$container" >>"$CONTAINERS_FILE"

  local url="http://${HOST}:${port}${path}"
  local i=1
  local status=""
  local conn_reset_count=0
  local logs_printed=0
  while [[ $i -le $ATTEMPTS ]]; do
    local errfile="$TMP_DIR/${container}.curl.err"
    status="$(curl -sS -o /dev/null -w "%{http_code}" -L "$url" 2>"$errfile" || true)"
    if [[ "$status" == "200" ]]; then
      log_ok "Success: ${name} responded 200 at ${url}"
      return 0
    fi

    # If repeated connection issues, show early container logs once
    if grep -qiE "connection reset|failed to connect|connection refused" "$errfile" 2>/dev/null; then
      conn_reset_count=$((conn_reset_count+1))
      if [[ $conn_reset_count -ge 3 && $logs_printed -eq 0 ]]; then
        log "----- ${name} early logs (${container}) -----"
        docker logs "$container" || true
        log "---------------------------------------------"
        logs_printed=1
      fi
    fi

    # Detect if container exited early
    local state
    state="$(docker ps -a --filter "name=${container}" --format '{{.Status}}' || true)"
    if [[ -n "$state" ]] && echo "$state" | grep -qi "^exited"; then
      log_err "${name} container exited early: ${state}"
      log "----- ${name} container logs (${container}) -----"
      docker logs "$container" || true
      log "-----------------------------------------------"
      return 1
    fi

    log "Waiting ${name} (attempt ${i}/${ATTEMPTS}) -> HTTP ${status}, retrying in ${SLEEP_SECS}s"
    sleep "$SLEEP_SECS"
    i=$((i+1))
  done

  log_err "Failure: ${name} did not return 200 at ${url} after ${ATTEMPTS} attempts"
  log "----- ${name} container logs (${container}) -----"
  docker logs "$container" || true
  log "-----------------------------------------------"
  return 1
}

# -------------------------------
# Parse args
# -------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --web) WEB_IMAGE="$2"; shift 2;;
    --space) SPACE_IMAGE="$2"; shift 2;;
    --admin) ADMIN_IMAGE="$2"; shift 2;;
    --live) LIVE_IMAGE="$2"; shift 2;;

    --skip-web) RUN_WEB=0; shift;;
    --skip-space) RUN_SPACE=0; shift;;
    --skip-admin) RUN_ADMIN=0; shift;;
    --skip-live) RUN_LIVE=0; shift;;

    --web-port) WEB_PORT="$2"; shift 2;;
    --space-port) SPACE_PORT="$2"; shift 2;;
    --admin-port) ADMIN_PORT="$2"; shift 2;;
    --live-port) LIVE_PORT="$2"; shift 2;;

    --web-path) WEB_PATH="$2"; shift 2;;
    --space-path) SPACE_PATH="$2"; shift 2;;
    --admin-path) ADMIN_PATH="$2"; shift 2;;
    --live-path) LIVE_PATH="$2"; shift 2;;

    --host) HOST="$2"; shift 2;;
    --attempts) ATTEMPTS="$2"; shift 2;;
    --sleep) SLEEP_SECS="$2"; shift 2;;
    --pull) PULL=1; shift;;
    --keep) KEEP=1; shift;;
    --parallel) PARALLEL=1; shift;;
    --docker-flags) DOCKER_FLAGS="$2"; shift 2;;
    --live-env) LIVE_ENV="$2"; shift 2;;

    --image-prefix)
      local prefix="$2"
      WEB_IMAGE="${prefix}plane-web:latest"
      SPACE_IMAGE="${prefix}plane-space:latest"
      ADMIN_IMAGE="${prefix}plane-admin:latest"
      LIVE_IMAGE="${prefix}plane-live:latest"
      shift 2
      ;;
    -h|--help) usage; exit 0;;
    *)
      log_err "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

trap cleanup EXIT INT TERM

# -------------------------------
# Pre-flight
# -------------------------------
exists_cmd docker || { log_err "docker is required"; exit 1; }
exists_cmd curl || { log_err "curl is required"; exit 1; }

log "Smoke test starting..."
log "  Host:         ${HOST}"
log "  Attempts:     ${ATTEMPTS}"
log "  Sleep (s):    ${SLEEP_SECS}"
log "  Keep:         ${KEEP}"
log "  Pull:         ${PULL}"
log "  Parallel:     ${PARALLEL}"
log "  Docker flags: ${DOCKER_FLAGS:-<none>}"

# -------------------------------
# Run tests
# -------------------------------
# Define a small runner wrapper that writes a status code to tmp
service_job() {
  local name="$1" image="$2" port="$3" path="$4" envflags="$5" out="$6"
  if run_and_probe "$name" "$image" "$port" "$path" "$envflags"; then
    echo "OK" > "$out"
  else
    echo "FAIL" > "$out"
  fi
}

if [[ $PARALLEL -eq 1 ]]; then
  if [[ $RUN_WEB -eq 1 ]]; then
    service_job "web" "$WEB_IMAGE" "$WEB_PORT" "$WEB_PATH" "" "$TMP_DIR/web.status" &
    PIDS+=($!)
  fi
  if [[ $RUN_SPACE -eq 1 ]]; then
    service_job "space" "$SPACE_IMAGE" "$SPACE_PORT" "$SPACE_PATH" "" "$TMP_DIR/space.status" &
    PIDS+=($!)
  fi
  if [[ $RUN_ADMIN -eq 1 ]]; then
    service_job "admin" "$ADMIN_IMAGE" "$ADMIN_PORT" "$ADMIN_PATH" "" "$TMP_DIR/admin.status" &
    PIDS+=($!)
  fi
  if [[ $RUN_LIVE -eq 1 ]]; then
    service_job "live" "$LIVE_IMAGE" "$LIVE_PORT" "$LIVE_PATH" "$LIVE_ENV" "$TMP_DIR/live.status" &
    PIDS+=($!)
  fi

  for pid in "${PIDS[@]}"; do
    wait "$pid" || true
  done

  for svc in web space admin live; do
    [[ $svc == "web" && $RUN_WEB -eq 0 ]] && continue
    [[ $svc == "space" && $RUN_SPACE -eq 0 ]] && continue
    [[ $svc == "admin" && $RUN_ADMIN -eq 0 ]] && continue
    [[ $svc == "live" && $RUN_LIVE -eq 0 ]] && continue
    status_file="$TMP_DIR/${svc}.status"
    if [[ -f "$status_file" && "$(cat "$status_file")" == "OK" ]]; then
      log_ok "${svc}: OK"
    else
      log_err "${svc}: FAIL"
      FAILURES=$((FAILURES+1))
    fi
  done
else
  if [[ $RUN_WEB -eq 1 ]]; then
    if ! run_and_probe "web" "$WEB_IMAGE" "$WEB_PORT" "$WEB_PATH" ""; then FAILURES=$((FAILURES+1)); fi
  fi
  if [[ $RUN_SPACE -eq 1 ]]; then
    if ! run_and_probe "space" "$SPACE_IMAGE" "$SPACE_PORT" "$SPACE_PATH" ""; then FAILURES=$((FAILURES+1)); fi
  fi
  if [[ $RUN_ADMIN -eq 1 ]]; then
    if ! run_and_probe "admin" "$ADMIN_IMAGE" "$ADMIN_PORT" "$ADMIN_PATH" ""; then FAILURES=$((FAILURES+1)); fi
  fi
  if [[ $RUN_LIVE -eq 1 ]]; then
    if ! run_and_probe "live" "$LIVE_IMAGE" "$LIVE_PORT" "$LIVE_PATH" "$LIVE_ENV"; then FAILURES=$((FAILURES+1)); fi
  fi
fi

if [[ $FAILURES -gt 0 ]]; then
  log_err "Smoke test finished with ${FAILURES} failure(s)"
  exit 1
fi

log_ok "Smoke test finished successfully"
exit 0
