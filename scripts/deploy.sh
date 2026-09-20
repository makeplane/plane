#!/usr/bin/env bash
# Plane hybrid production deployment helper.
#
# Usage:
#   ./scripts/deploy.sh              # update web and backend
#   ./scripts/deploy.sh --web        # only build web/admin and update Caddy
#   ./scripts/deploy.sh --backend    # only migrate and recreate backend workers
#   ./scripts/deploy.sh --skip-pull  # deploy the current checkout

set -euo pipefail

log() {
    printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

fail() {
    printf '\n\033[1;31mDeployment failed: %s\033[0m\n' "$1" >&2
    exit 1
}

SKIP_PULL=false
MODE="full"
for arg in "$@"; do
    case "$arg" in
        --web) MODE="web" ;;
        --backend) MODE="backend" ;;
        --skip-pull) SKIP_PULL=true ;;
        *) fail "unknown argument: $arg (usage: $0 [--web|--backend] [--skip-pull])" ;;
    esac
done

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

for cmd in git docker curl timeout; do
    command -v "$cmd" >/dev/null 2>&1 || fail "missing command: $cmd"
done

# setup.sh intentionally overwrites every .env file. Run it automatically only
# for a genuinely fresh checkout; a partially configured checkout must be
# repaired manually so existing credentials are never replaced.
ENV_FILES=(
    .env
    apps/web/.env
    apps/api/.env
    apps/space/.env
    apps/admin/.env
    apps/live/.env
)
MISSING_ENV_FILES=()
for env_file in "${ENV_FILES[@]}"; do
    [[ -f "$env_file" ]] || MISSING_ENV_FILES+=("$env_file")
done

set_env_value() {
    local file="$1" key="$2" value="$3" temp_file
    temp_file="$(mktemp)"
    awk -v key="$key" -v value="$value" '
        BEGIN { found = 0 }
        index($0, key "=") == 1 {
            print key "=\"" value "\""
            found = 1
            next
        }
        { print }
        END {
            if (!found) print key "=\"" value "\""
        }
    ' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    rm -f "$temp_file"
}

read_env_value() {
    local file="$1" key="$2"
    awk -v key="$key" '
        index($0, key "=") == 1 {
            sub("^[^=]*=", "")
            sub("^\\\"", "")
            sub("\\\"$", "")
            print
            exit
        }
    ' "$file"
}

if [[ "${#MISSING_ENV_FILES[@]}" -eq "${#ENV_FILES[@]}" ]]; then
    log "First deployment detected; initializing environment files"
    ./setup.sh || fail "initial setup failed"

    PUBLIC_URL="${PLANE_PUBLIC_URL:-$(read_env_value .env PLANE_PUBLIC_URL)}"
    ALLOWED_ORIGINS="${PLANE_ALLOWED_ORIGINS:-$(read_env_value .env PLANE_ALLOWED_ORIGINS)}"
    [[ -n "$PUBLIC_URL" ]] || fail "PLANE_PUBLIC_URL is empty after setup"
    [[ -n "$ALLOWED_ORIGINS" ]] || fail "PLANE_ALLOWED_ORIGINS is empty after setup"

    log "Applying first-deployment production environment defaults"
    for frontend_env in apps/web/.env apps/admin/.env; do
        set_env_value "$frontend_env" VITE_API_BASE_URL ""
        set_env_value "$frontend_env" VITE_WEB_BASE_URL "$PUBLIC_URL"
        set_env_value "$frontend_env" VITE_ADMIN_BASE_URL ""
    done
    set_env_value apps/api/.env CORS_ALLOWED_ORIGINS "$ALLOWED_ORIGINS"
    set_env_value apps/api/.env CSRF_TRUSTED_ORIGINS "$ALLOWED_ORIGINS"
    set_env_value apps/api/.env AWS_S3_ENDPOINT_URL "http://plane-minio:9000"
    set_env_value apps/api/.env USE_MINIO "1"
    set_env_value apps/api/.env WEB_URL "$PUBLIC_URL"
    set_env_value apps/api/.env ADMIN_BASE_URL "$PUBLIC_URL"
    set_env_value apps/api/.env APP_BASE_URL "$PUBLIC_URL"
elif [[ "${#MISSING_ENV_FILES[@]}" -gt 0 ]]; then
    fail "environment setup is incomplete; missing: ${MISSING_ENV_FILES[*]}. Do not rerun setup.sh because it overwrites existing .env files"
fi

command -v pnpm >/dev/null 2>&1 || fail "missing command: pnpm (setup.sh should install it on first deployment)"

if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
else
    fail "Docker Compose is not installed"
fi

BACKEND_COMPOSE=("${COMPOSE[@]}" -f docker-compose-local.yml)
WEB_COMPOSE=("${COMPOSE[@]}" -f docker-compose-prod-web.yml)
PLANE_WEB_PORT="${PLANE_WEB_PORT:-3300}"
PLANE_API_PORT="${PLANE_API_PORT:-3001}"

[[ -f docker-compose-local.yml ]] || fail "docker-compose-local.yml not found"
[[ -f docker-compose-prod-web.yml ]] || fail "docker-compose-prod-web.yml not found"

printf '==========================================\n'
printf ' Plane deployment (mode: %s)\n' "$MODE"
printf ' Project: %s\n' "$PROJECT_DIR"
printf ' Public web: http://127.0.0.1:%s\n' "$PLANE_WEB_PORT"
printf ' API host port: %s (proxied publicly by Caddy)\n' "$PLANE_API_PORT"
printf '==========================================\n'

if [[ "$SKIP_PULL" == true ]]; then
    log "Skipping git pull"
else
    log "Pulling the latest code"
    git pull --ff-only || fail "git pull failed; resolve local changes or branch divergence first"
    git log --oneline -1
fi

# The production Caddy compose joins the backend compose network, so bring up
# infrastructure first on full deployments. A web-only update expects that the
# initial full deployment has already created this network.
if [[ "$MODE" != "web" ]]; then
    log "Starting infrastructure services"
    "${BACKEND_COMPOSE[@]}" up -d plane-db plane-redis plane-mq plane-minio \
        || fail "infrastructure services failed to start"
elif ! docker network inspect plane_dev_env >/dev/null 2>&1; then
    fail "Docker network plane_dev_env does not exist; run one full deployment first"
fi

if [[ "$MODE" != "backend" ]]; then
    log "Installing frontend dependencies"
    pnpm install --frozen-lockfile || fail "pnpm install failed"

    log "Building Web and Admin"
    pnpm turbo run build --filter=web --filter=admin || fail "frontend build failed"

    log "Creating or updating the Caddy container"
    "${WEB_COMPOSE[@]}" up -d --build web-prod || fail "Caddy failed to start"
fi

if [[ "$MODE" != "web" ]]; then
    log "Running database migrations"
    "${BACKEND_COMPOSE[@]}" up -d migrator || fail "migration container failed to start"
    MIGRATOR_ID="$("${BACKEND_COMPOSE[@]}" ps -aq migrator)"
    [[ -n "$MIGRATOR_ID" ]] || fail "migration container was not created"

    timeout 120 bash -c \
        'while [[ "$(docker inspect --format "{{.State.Status}}" "$1" 2>/dev/null)" == "running" ]]; do sleep 2; done' \
        _ "$MIGRATOR_ID" || fail "migration timed out after 120 seconds"
    MIGRATOR_EXIT="$(docker inspect --format '{{.State.ExitCode}}' "$MIGRATOR_ID")"
    [[ "$MIGRATOR_EXIT" == "0" ]] \
        || fail "migration exited with code $MIGRATOR_EXIT; run: docker logs $MIGRATOR_ID"

    log "Recreating API and workers"
    "${BACKEND_COMPOSE[@]}" up -d --force-recreate api worker beat-worker \
        || fail "backend services failed to start"
fi

log "Verifying deployment"
FAILURES=0
check() {
    local name="$1" url="$2" retries="${3:-1}" delay=6 code="000" try
    for try in $(seq 1 "$retries"); do
        code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)"
        [[ "$code" == "200" ]] && break
        [[ "$try" -lt "$retries" ]] && sleep "$delay"
    done
    if [[ "$code" == "200" ]]; then
        printf '  OK  %s (%s) -> %s\n' "$name" "$url" "$code"
    else
        printf '  ERR %s (%s) -> %s\n' "$name" "$url" "${code:-000}"
        FAILURES=$((FAILURES + 1))
    fi
}

check "Web" "http://127.0.0.1:${PLANE_WEB_PORT}/" 1
check "Admin" "http://127.0.0.1:${PLANE_WEB_PORT}/god-mode/" 1
check "API" "http://127.0.0.1:${PLANE_WEB_PORT}/api/instances/" 15

if [[ "$FAILURES" -eq 0 ]]; then
    printf '\n\033[1;32mDeployment completed; all checks passed.\033[0m\n'
else
    printf '\n\033[1;33mDeployment completed with %s failed check(s).\033[0m\n' "$FAILURES"
    printf 'Inspect logs with:\n  %q -f docker-compose-local.yml logs api\n  %q -f docker-compose-prod-web.yml logs web-prod\n' "${COMPOSE[*]}" "${COMPOSE[*]}"
    exit 1
fi
