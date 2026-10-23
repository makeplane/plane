#!/usr/bin/env bash
# Build and activate a Plane release from the `production` branch.
#
# Installed root-owned to /opt/plane/bin/deploy by setup-host.sh and run as the
# `plane` user (CI reaches it only through ci-deploy, via sudo -u plane):
#
#   deploy <commit-sha>               build (if needed), migrate, switch, restart
#   deploy <commit-sha> --build-only  build the release without touching the live site
#   deploy <commit-sha> --initial     first activation, used only by import-data.sh
#
# Only commits reachable from origin/production are accepted. Each release lives in
# /opt/plane/releases/<sha>; /opt/plane/current points at the active one. If the
# health check fails after a switch, the previous release is restored (database
# migrations are not reverted).
set -euo pipefail

SHA="${1:-}"
MODE="${2:-}"
if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: deploy <40-char commit sha> [--build-only]" >&2
  exit 2
fi
if [[ -n "$MODE" && "$MODE" != "--build-only" && "$MODE" != "--initial" ]]; then
  echo "unknown option: $MODE" >&2
  exit 2
fi
if [[ "$(id -un)" != "plane" ]]; then
  echo "deploy must run as the plane user" >&2
  exit 1
fi

ROOT=/opt/plane
REPO=$ROOT/repo.git
REL=$ROOT/releases/$SHA
KEEP_RELEASES=5

export HOME=$ROOT
export PATH=$ROOT/node/bin:$ROOT/bin:/usr/bin:/bin
export CI=true
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export NODE_OPTIONS=--max-old-space-size=4096
export TURBO_TELEMETRY_DISABLED=1
export UV_PYTHON=/usr/bin/python3.12
export UV_PYTHON_DOWNLOADS=never

log() { echo "[deploy $(date +%H:%M:%S)] $*"; }

# One deploy at a time
exec 9>"$ROOT/deploy.lock"
flock 9

log "Fetching origin/production"
git -C "$REPO" fetch --quiet origin +refs/heads/production:refs/remotes/origin/production
if ! git -C "$REPO" merge-base --is-ancestor "$SHA" refs/remotes/origin/production; then
  echo "refusing: $SHA is not on origin/production" >&2
  exit 1
fi

if [[ -f "$REL/.built" ]]; then
  log "Release $SHA already built, reusing"
else
  log "Building release $SHA"
  rm -rf "$REL"
  mkdir -p "$REL"
  git -C "$REPO" archive "$SHA" | tar -x -C "$REL"
  echo "$SHA" > "$REL/REVISION"

  log "Backend: uv sync"
  (cd "$REL/apps/api" && UV_PROJECT_ENVIRONMENT="$REL/apps/api/.venv" \
    uv sync --locked --no-default-groups --group production)

  log "Frontend: pnpm install"
  (cd "$REL" && pnpm install --frozen-lockfile)

  log "Frontend: build web, admin, space, live"
  (cd "$REL" && pnpm turbo run build --filter=web --filter=admin --filter=space --filter=live)

  touch "$REL/.built"
fi

if [[ "$MODE" == "--build-only" ]]; then
  log "Build-only: done, live site untouched"
  exit 0
fi

# Until import-data.sh has restored the old database, a deploy must not migrate the
# empty native database (that would make the import refuse to run).
if [[ ! -e "$ROOT/current" && "$MODE" != "--initial" ]]; then
  echo "refusing: data not imported yet (no $ROOT/current); release $SHA is built, run import-data.sh" >&2
  exit 1
fi

manage() {
  (cd "$REL/apps/api" && set -a && . "$ROOT/shared/api.env" && set +a && .venv/bin/python manage.py "$@")
}

log "Django: migrate and instance setup"
manage wait_for_db
manage migrate --noinput
manage register_instance "$(sha256sum /etc/machine-id | cut -d' ' -f1)"
manage configure_instance
manage create_bucket
manage collectstatic --noinput >/dev/null

# /opt/plane/current (root-owned) -> releases/current, which plane switches here
LINK=$ROOT/releases/current
PREV=""
[[ -e "$LINK" ]] && PREV=$(readlink -f "$LINK")

switch_to() {
  ln -sfn "$1" "$LINK.new"
  mv -Tf "$LINK.new" "$LINK"
  sudo -n /usr/bin/systemctl restart plane.target
}

healthy() {
  local url
  for _ in $(seq 1 30); do
    sleep 3
    for url in http://127.0.0.1:8100/ http://127.0.0.1:3356/ http://127.0.0.1:3356/god-mode/ http://127.0.0.1:3356/spaces/; do
      curl -fsS -o /dev/null --max-time 5 "$url" || continue 2
    done
    return 0
  done
  return 1
}

log "Switching to $SHA"
switch_to "$REL"

if ! healthy; then
  echo "health check failed for $SHA" >&2
  if [[ -n "$PREV" && "$PREV" != "$REL" ]]; then
    log "Rolling back to $(basename "$PREV")"
    switch_to "$PREV"
  fi
  exit 1
fi

manage clear_cache

log "Pruning old releases (keeping $KEEP_RELEASES)"
CURRENT=$(readlink -f "$LINK")
ls -1dt "$ROOT"/releases/*/ | sed 's#/$##' | grep -E '/[0-9a-f]{40}$' | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
  [[ "$old" == "$CURRENT" ]] || rm -rf "$old"
done

log "Deployed $SHA"
