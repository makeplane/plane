#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=/root/plane
BRANCH=main
COMPOSE=(docker compose --project-name plane-app --env-file /root/plane.env -f "$REPO_DIR/deploy/docker-compose.yaml")

cd "$REPO_DIR"

git fetch origin "$BRANCH"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "[deploy] $LOCAL -> $REMOTE, rebuilding"
  git reset --hard "origin/$BRANCH"
  "${COMPOSE[@]}" build
fi

"${COMPOSE[@]}" up -d --remove-orphans
