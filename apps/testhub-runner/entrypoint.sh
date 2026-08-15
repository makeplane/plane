#!/bin/sh
set -eu
WORKDIR="${TESTHUB_WORKDIR:-/opt/testhub/workdir}"
if [ -d "$WORKDIR" ] && [ -f "$WORKDIR/pyproject.toml" ]; then
  echo "testhub-runner: uv sync in $WORKDIR"
  cd "$WORKDIR"
  if command -v uv >/dev/null 2>&1; then
    uv sync --frozen || uv sync
  fi
fi
cd /opt/testhub-runner
exec python server.py
