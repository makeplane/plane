#!/bin/sh
set -eu
if [ -f /opt/testhub-runner/local.env ]; then
  # Optional host-only proxy / GitHub mirror. Not committed; see local.env.example.
  . /opt/testhub-runner/local.env
fi
if [ -n "${GITSYNC_GITHUB_INSTEADOF:-}" ]; then
  rm -f /root/.gitconfig
  git config --global "url.${GITSYNC_GITHUB_INSTEADOF}.insteadOf" "https://github.com/"
fi
WORKDIR="${TESTHUB_WORKDIR:-/opt/testhub/workdir}"
if [ -d "$WORKDIR" ] && [ -f "$WORKDIR/pyproject.toml" ]; then
  echo "testhub-runner: uv sync in $WORKDIR"
  cd "$WORKDIR"
  if command -v uv >/dev/null 2>&1; then
    uv sync --frozen || uv sync || echo "testhub-runner: uv sync skipped (workdir venv not ready)"
  fi
fi
cd /opt/testhub-runner
exec python server.py
