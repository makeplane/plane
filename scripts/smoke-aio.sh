#!/usr/bin/env bash
# plane/scripts/smoke-aio.sh
# Smoke test for the all-in-one (AIO) image. It:
# - Runs the plane-aio image with minimal required environment
# - Waits for Caddy to come up
# - Probes proxied endpoints:
#     /           (web)
#     /spaces     (space)
#     /god-mode   (admin)
#     /live/health (live)
# - Prints container logs on failure and exits non-zero
#
# Usage examples:
#   ./scripts/smoke-aio.sh
#   ./scripts/smoke-aio.sh --image yourrepo/plane-aio:latest --port 18080
#   ./scripts/smoke-aio.sh --attempts 90 --sleep 1 --keep
#   ./scripts/smoke-aio.sh --docker-flags "--network host"
#
# Dependencies: bash, docker, curl

set -euo pipefail

# -------------------------------
# Defaults
# -------------------------------
IMAGE_DEFAULT="plane-aio:latest"
HOST_DEFAULT="127.0.0.1"
PORT_DEFAULT=8080
ATTEMPTS_DEFAULT=60
SLEEP_DEFAULT=2
KEEP_DEFAULT=0
PULL_DEFAULT=0
DOCKER_FLAGS_DEFAULT=""

# Required env for AIO (values are placeholders for smoke only)
DOMAIN_NAME_DEFAULT="localhost"
DATABASE_URL_DEFAULT="postgresql://plane:plane@127.0.0.1:15432/plane"
REDIS_URL_DEFAULT="redis://127.0.0.1:16379"
AMQP_URL_DEFAULT="amqp://plane:plane@127.0.0.1:15673/plane"
AWS_REGION_DEFAULT="us-east-1"
AWS_ACCESS_KEY_ID_DEFAULT="smoke"
AWS_SECRET_ACCESS_KEY_DEFAULT="smoke"
AWS_S3_BUCKET_NAME_DEFAULT="smoke-bucket"
AWS_S3_ENDPOINT_URL_DEFAULT="http://127.0.0.1:19000"
SITE_ADDRESS_DEFAULT=":80"
FILE_SIZE_LIMIT_DEFAULT="5242880"

# -------------------------------
# State
# -------------------------------
IMAGE="$IMAGE_DEFAULT"
HOST="$HOST_DEFAULT"
PORT="$PORT_DEFAULT"
ATTEMPTS="$ATTEMPTS_DEFAULT"
SLEEP_SECS="$SLEEP_DEFAULT"
KEEP="$KEEP_DEFAULT"
PULL="$PULL_DEFAULT"
DOCKER_FLAGS="$DOCKER_FLAGS_DEFAULT"

# AIO env values (overridable via flags)
DOMAIN_NAME="$DOMAIN_NAME_DEFAULT"
DATABASE_URL="$DATABASE_URL_DEFAULT"
REDIS_URL="$REDIS_URL_DEFAULT"
AMQP_URL="$AMQP_URL_DEFAULT"
AWS_REGION="$AWS_REGION_DEFAULT"
AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID_DEFAULT"
AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY_DEFAULT"
AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME_DEFAULT"
AWS_S3_ENDPOINT_URL="$AWS_S3_ENDPOINT_URL_DEFAULT"
SITE_ADDRESS="$SITE_ADDRESS_DEFAULT"
FILE_SIZE_LIMIT="$FILE_SIZE_LIMIT_DEFAULT"

TMP_DIR="$(mktemp -d -t plane-aio-smoke.XXXXXX)"
CONTAINER="plane-aio-smoke-$$"

# Endpoints to probe via Caddy
# Endpoint selection flags (1 = test, 0 = skip)
RUN_WEB=1
RUN_SPACE=1
RUN_ADMIN=1
RUN_LIVE=1

# Build PATHS dynamically later based on RUN_* flags
declare -a PATHS=()
declare -A NAMES=( ["/"]="web" ["/spaces"]="space" ["/god-mode"]="admin" ["/live/health"]="live" )
FAILURES=0

# -------------------------------
# Helpers
# -------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --image <name:tag>       AIO image to run (default: ${IMAGE_DEFAULT})
  --host <ip/host>         Hostname/IP to probe (default: ${HOST_DEFAULT})
  --port <port>            Host port to map container 80 to (default: ${PORT_DEFAULT})

  --attempts <n>           Attempts before failure (default: ${ATTEMPTS_DEFAULT})
  --sleep <seconds>        Sleep between attempts (default: ${SLEEP_DEFAULT})
  --keep                   Do not remove the container after the test
  --pull                   docker pull the image before run
  --docker-flags "<flags>" Extra flags for docker run (e.g., --network)

  # Override required env vars for AIO start script:
  --domain-name <val>              (default: ${DOMAIN_NAME_DEFAULT})
  --database-url <val>             (default: ${DATABASE_URL_DEFAULT})
  --redis-url <val>                (default: ${REDIS_URL_DEFAULT})
  --amqp-url <val>                 (default: ${AMQP_URL_DEFAULT})
  --aws-region <val>               (default: ${AWS_REGION_DEFAULT})
  --aws-access-key-id <val>        (default: ${AWS_ACCESS_KEY_ID_DEFAULT})
  --aws-secret-access-key <val>    (default: ${AWS_SECRET_ACCESS_KEY_DEFAULT})
  --aws-s3-bucket-name <val>       (default: ${AWS_S3_BUCKET_NAME_DEFAULT})
  --aws-s3-endpoint-url <val>      (default: ${AWS_S3_ENDPOINT_URL_DEFAULT})
  --site-address <val>             (default: ${SITE_ADDRESS_DEFAULT})
  --file-size-limit <bytes>        (default: ${FILE_SIZE_LIMIT_DEFAULT})

  -h, --help               Show help and exit

Examples:
  $(basename "$0")
  $(basename "$0") --image yourrepo/plane-aio:latest --port 18080 --attempts 90 --sleep 1
EOF
}

exists_cmd() { command -v "$1" >/dev/null 2>&1; }

log()      { printf "%s\n" "$*"; }
log_ok()   { printf "\033[32m%s\033[0m\n" "$*"; }
log_warn() { printf "\033[33m%s\033[0m\n" "$*"; }
log_err()  { printf "\033[31m%s\033[0m\n" "$*"; }

cleanup() {
  local code=$?
  if [[ $KEEP -eq 0 ]]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  else
    log "Keeping container: $CONTAINER"
  fi
  rm -rf "$TMP_DIR" >/dev/null 2>&1 || true
  exit $code
}

is_port_in_use() {
  local host="$1" port="$2"
  if exists_cmd ss; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${port}\\>" && return 0
  elif exists_cmd lsof; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && return 0
  elif exists_cmd netstat; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${port}\\>" && return 0
  else
    local code
    code="$(curl -sS -m 1 -o /dev/null -w "%{http_code}" "http://${host}:${port}/" || true)"
    [[ "$code" != "000" ]] && return 0
  fi
  return 1
}

# -------------------------------
# Arg parsing
# -------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) IMAGE="$2"; shift 2;;
    --host) HOST="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;

    --attempts) ATTEMPTS="$2"; shift 2;;
    --sleep) SLEEP_SECS="$2"; shift 2;;
    --keep) KEEP=1; shift;;
    --pull) PULL=1; shift;;
    --docker-flags) DOCKER_FLAGS="$2"; shift 2;;

    --domain-name) DOMAIN_NAME="$2"; shift 2;;
    --database-url) DATABASE_URL="$2"; shift 2;;
    --redis-url) REDIS_URL="$2"; shift 2;;
    --amqp-url) AMQP_URL="$2"; shift 2;;
    --aws-region) AWS_REGION="$2"; shift 2;;
    --aws-access-key-id) AWS_ACCESS_KEY_ID="$2"; shift 2;;
    --aws-secret-access-key) AWS_SECRET_ACCESS_KEY="$2"; shift 2;;
    --aws-s3-bucket-name) AWS_S3_BUCKET_NAME="$2"; shift 2;;
    --aws-s3-endpoint-url) AWS_S3_ENDPOINT_URL="$2"; shift 2;;
    --site-address) SITE_ADDRESS="$2"; shift 2;;
    --file-size-limit) FILE_SIZE_LIMIT="$2"; shift 2;;
    --skip-web) RUN_WEB=0; shift;;
    --skip-space) RUN_SPACE=0; shift;;
    --skip-admin) RUN_ADMIN=0; shift;;
    --skip-live) RUN_LIVE=0; shift;;

    -h|--help) usage; exit 0;;
    *) log_err "Unknown arg: $1"; usage; exit 1;;
  esac
done

trap cleanup EXIT INT TERM

# -------------------------------
# Pre-flight
# -------------------------------
exists_cmd docker || { log_err "docker is required"; exit 1; }
exists_cmd curl || { log_err "curl is required"; exit 1; }

log "AIO smoke starting..."
log "  Image:        ${IMAGE}"
log "  Host:         ${HOST}"
log "  Port:         ${PORT}"
log "  Attempts:     ${ATTEMPTS}"
log "  Sleep (s):    ${SLEEP_SECS}"
log "  Keep:         ${KEEP}"
log "  Pull:         ${PULL}"
log "  Docker flags: ${DOCKER_FLAGS:-<none>}"
# Parse DOCKER_FLAGS string into an array for safe docker invocation
if [[ -n "${DOCKER_FLAGS:-}" ]]; then
  read -r -a DOCKER_FLAGS_ARRAY <<< "$DOCKER_FLAGS"
else
  DOCKER_FLAGS_ARRAY=()
fi

if is_port_in_use "$HOST" "$PORT"; then
  log_err "Port ${HOST}:${PORT} appears to be in use. Use --port to override."
  exit 1
fi

if [[ $PULL -eq 1 ]]; then
  log "Pulling ${IMAGE} ..."
  docker pull "$IMAGE" >/dev/null
fi

# -------------------------------
# Run container
# -------------------------------
log "Starting AIO container: ${CONTAINER}"

if ! docker run -d --name "$CONTAINER" \
  -p "${PORT}:80" \
  -e DOMAIN_NAME="$DOMAIN_NAME" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="$REDIS_URL" \
  -e AMQP_URL="$AMQP_URL" \
  -e AWS_REGION="$AWS_REGION" \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME" \
  -e AWS_S3_ENDPOINT_URL="$AWS_S3_ENDPOINT_URL" \
  -e SITE_ADDRESS="$SITE_ADDRESS" \
  -e FILE_SIZE_LIMIT="$FILE_SIZE_LIMIT" \
  "${DOCKER_FLAGS_ARRAY[@]}" \
  "$IMAGE" >"$TMP_DIR/run.out" 2>"$TMP_DIR/run.err"
then
  log_err "Failed to start AIO container"
  cat "$TMP_DIR/run.err" 1>&2 || true
  exit 1
fi

# -------------------------------
# Select endpoints to probe
# -------------------------------
PATHS=()
[[ $RUN_WEB -eq 1 ]] && PATHS+=("/")
[[ $RUN_SPACE -eq 1 ]] && PATHS+=("/spaces")
[[ $RUN_ADMIN -eq 1 ]] && PATHS+=("/god-mode")
[[ $RUN_LIVE -eq 1 ]] && PATHS+=("/live/health")

# -------------------------------
# Probe endpoints
# -------------------------------
for path in "${PATHS[@]}"; do
  name="${NAMES[$path]}"
  url="http://${HOST}:${PORT}${path}"
  i=1
  status=""
  early_logs_printed=0
  log "Probing ${name}: ${url}"
  while [[ $i -le $ATTEMPTS ]]; do
    errfile="$TMP_DIR/${name}.curl.err"
    status="$(curl --connect-timeout 5 --max-time 10 -sS -o /dev/null -w "%{http_code}" -L "$url" 2>"$errfile" || true)"
    if [[ "$status" == "200" ]]; then
      log_ok "Success: ${name} responded 200 at ${url}"
      break
    fi

    # Print early container logs after a few failures
    if [[ $i -eq 5 && $early_logs_printed -eq 0 ]]; then
      log "----- Early container logs (${CONTAINER}) -----"
      docker logs "$CONTAINER" || true
      log "-----------------------------------------------"
      early_logs_printed=1
    fi

    # Detect container exit
    state="$(docker ps -a --filter "name=${CONTAINER}" --format '{{.Status}}' || true)"
    if [[ -n "$state" ]] && echo "$state" | grep -qi "^exited"; then
      log_err "Container exited early: ${state}"
      log "----- Container logs (${CONTAINER}) -----"
      docker logs "$CONTAINER" || true
      log "-----------------------------------------"
      FAILURES=$((FAILURES+1))
      break
    fi

    log "Waiting ${name} (attempt ${i}/${ATTEMPTS}) -> HTTP ${status}, retrying in ${SLEEP_SECS}s"
    sleep "$SLEEP_SECS"
    i=$((i+1))
  done

  if [[ "$status" != "200" ]]; then
    log_err "Failure: ${name} did not return 200 at ${url}"
    FAILURES=$((FAILURES+1))
  fi
done

if [[ $FAILURES -gt 0 ]]; then
  log_err "AIO smoke finished with ${FAILURES} failure(s)"
  exit 1
fi

log_ok "AIO smoke finished successfully"
exit 0
