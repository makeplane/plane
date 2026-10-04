#!/usr/bin/env bash
# Follow API container logs once compose has created the api service.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
cd "$(plane_root)"

attempt=0
until docker compose -f docker-compose-local.yml ps -q api | grep -q .; do
  attempt=$((attempt + 1))
  if [ "$attempt" -gt 180 ]; then
    echo "api container was not created" >&2
    exit 1
  fi
  sleep 2
done

exec docker compose -f docker-compose-local.yml logs -f api worker beat-worker
