#!/usr/bin/env bash
# Per-boot services. Must be safe to run more than once.
# Dev servers are launched from terminals (.cursor/run-dev.sh), not here.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
cd "$(plane_root)"

ensure_docker

if [ ! -f apps/api/.env ] || [ ! -f .env ]; then
  echo "env files missing; run bash .cursor/install.sh first" >&2
  exit 1
fi

docker compose -f docker-compose-local.yml up -d

echo "waiting for Plane API on :8000"
if ! wait_for_http "http://127.0.0.1:8000/api/instances/" 180; then
  docker compose -f docker-compose-local.yml ps >&2 || true
  docker compose -f docker-compose-local.yml logs --tail 120 api migrator >&2 || true
  exit 1
fi

echo "local stack is up"
