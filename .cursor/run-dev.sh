#!/usr/bin/env bash
# pnpm dev for the web, admin, space, and live apps, plus workspace package watchers.
# Terminals start beside the boot script, so wait until the API is accepting connections.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
cd "$(plane_root)"

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:3000/ \
  && curl -sf -o /dev/null --max-time 2 http://127.0.0.1:3001/; then
  echo "dev servers already listening on :3000 and :3001"
  exec sleep infinity
fi

if ! wait_for_http "http://127.0.0.1:8000/api/instances/" 180; then
  echo "API was not ready; starting pnpm dev anyway" >&2
fi

exec pnpm dev
