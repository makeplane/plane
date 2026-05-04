#!/usr/bin/env bash
# GitNexus wrapper — handles analyze and mcp via Docker.
# Portable: uses $PWD / git rev-parse so it works on any dev machine.
# npm release of gitnexus is broken in 1.6.x, hence Docker-only.
set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
IMAGE="${GITNEXUS_IMAGE:-akonlabs/gitnexus:1.6.4-rc.51}"

DOCKER_BASE=(
  --rm
  -v gitnexus-data:/data/gitnexus
  -v "${REPO_ROOT}:${REPO_ROOT}"
  --workdir "${REPO_ROOT}"
  --entrypoint sh
  "${IMAGE}"
)

case "${1:-}" in
  analyze)
    shift
    exec docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js analyze $*"
    ;;
  mcp)
    # MCP needs -i for stdio transport
    exec docker run -i "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js mcp"
    ;;
  status)
    exec docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js status"
    ;;
  list)
    exec docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js list"
    ;;
  reindex-bg)
    # Background re-index used by git hooks. Detached, no blocking.
    LOG="/tmp/gitnexus-reindex-$(basename "${REPO_ROOT}").log"
    nohup docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js analyze" \
      > "${LOG}" 2>&1 &
    disown 2>/dev/null || true
    echo "[gitnexus] re-indexing in background (PID $!) — log: ${LOG}"
    ;;
  pull)
    exec docker pull "${IMAGE}"
    ;;
  *)
    cat <<EOF
GitNexus wrapper — runs gitnexus CLI inside Docker.

Usage: scripts/gitnexus.sh <command>

Commands:
  analyze [args...]    Re-index repo synchronously (~2-3 min)
  mcp                  Start MCP server on stdio (used by .mcp.json)
  status               Show index status
  list                 List indexed repos
  reindex-bg           Re-index in background (used by git hooks)
  pull                 Pull/update Docker image

Env vars:
  GITNEXUS_IMAGE       Override image tag (default: akonlabs/gitnexus:1.6.4-rc.51)

First-time setup:
  scripts/gitnexus.sh pull
  scripts/gitnexus.sh analyze
EOF
    exit 1
    ;;
esac
