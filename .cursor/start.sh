#!/usr/bin/env bash
# Backend start from CONTRIBUTING.md:
#   docker compose -f docker-compose-local.yml up -d
# Then wait until the API answers on :8000.
#
# Frontends stay out of this script. A terminal runs `pnpm dev`.
# When stack.sh lands in the repo, call it from here instead.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
cd "$(plane_root)"

# Cloud Agent VMs have no running Docker daemon until this starts it.
# The Plane stack itself is only the compose file below.
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
