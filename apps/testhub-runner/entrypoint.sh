#!/bin/sh
set -u
if [ -f /opt/testhub-runner/local.env ]; then
  # Optional host-only proxy / GitHub mirror. Not committed; see local.env.example.
  . /opt/testhub-runner/local.env
fi
if [ -n "${GITSYNC_GITHUB_INSTEADOF:-}" ]; then
  rm -f /root/.gitconfig
  git config --global "url.${GITSYNC_GITHUB_INSTEADOF}.insteadOf" "https://github.com/"
fi
WORKDIR="${TESTHUB_WORKDIR:-/opt/testhub/workdir}"
ENV_ROOT="${TESTHUB_UV_ENV_ROOT:-/opt/testhub/uv-envs}"
export UV_LINK_MODE="${UV_LINK_MODE:-copy}"
# Keep the Linux venv off the Windows bind-mount (host `.venv` is not usable here).
if [ -d "$WORKDIR" ] && [ -f "$WORKDIR/pyproject.toml" ]; then
  mkdir -p "$ENV_ROOT"
  export UV_PROJECT_ENVIRONMENT="${ENV_ROOT}/local-mount"
  echo "testhub-runner: uv sync in $WORKDIR (env=$UV_PROJECT_ENVIRONMENT)"
  if command -v uv >/dev/null 2>&1; then
    (cd "$WORKDIR" && uv sync --frozen --no-dev) \
      || (cd "$WORKDIR" && uv sync --no-dev) \
      || echo "testhub-runner: uv sync skipped (workdir venv not ready)"
  fi
fi
cd /opt/testhub-runner
exec python /opt/testhub-runner/server.py
