#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=/root/plane
BRANCH=main
REPO_SLUG=sadosystems/plane
COMPOSE=(docker compose --project-name plane-app --env-file /root/plane.env -f "$REPO_DIR/deploy/docker-compose.yaml")

cd "$REPO_DIR"

git fetch origin "$BRANCH"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

post_status() {
  local state=$1 desc=$2
  gh api -X POST "repos/$REPO_SLUG/statuses/$REMOTE" \
    -f state="$state" \
    -f context="plane-deploy" \
    -f description="$desc" \
    >/dev/null 2>&1 || true
}

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "[deploy] $LOCAL -> $REMOTE, rebuilding"
  trap 'post_status failure "deploy failed"' ERR
  post_status pending "build started"

  git reset --hard "origin/$BRANCH"
  "${COMPOSE[@]}" build
  "${COMPOSE[@]}" up -d --remove-orphans

  post_status success "deployed"
  trap - ERR
else
  "${COMPOSE[@]}" up -d --remove-orphans
fi
