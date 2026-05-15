#!/usr/bin/env bash
# GitNexus wrapper — handles analyze and mcp via Docker.
# Portable: uses $PWD / git rev-parse so it works on any dev machine.
# Docker (vs npx) locks version across team and avoids native-build/SSH-dep issues.
# Project pins 1.6.4-rc.63 (pre-release) — stable 1.6.3 lacks features needed.
set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# Pre-release; npm `latest` is 1.6.3 stable but lacks Django-migration parser
# and capability detection (FTS, vectorSearch). Review when 1.6.4 stable releases.
IMAGE="${GITNEXUS_IMAGE:-akonlabs/gitnexus:1.6.4-rc.63}"

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
    # --skip-agents-md is hard-wired — gitnexus rules live in
    # .claude/rules/gitnexus-mcp-usage.md (no sentinels in CLAUDE.md/AGENTS.md).
    # Refreshing tracked files would cause per-developer stats churn on every
    # re-index. There is intentionally no opt-out here.
    exec docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js analyze --skip-agents-md $*"
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
    # Background re-index used by git hooks. Detached, non-blocking.
    # Throttle: skip if last re-index was < 60s ago (prevents spam from rapid commits).
    # --skip-agents-md prevents gitnexus from writing into tracked CLAUDE.md
    # /AGENTS.md (rules live in .claude/rules/gitnexus-mcp-usage.md).
    MARKER="${REPO_ROOT}/.gitnexus/.last-reindex"
    if [ -f "${MARKER}" ]; then
      AGE=$(( $(date +%s) - $(stat -f %m "${MARKER}" 2>/dev/null || stat -c %Y "${MARKER}" 2>/dev/null || echo 0) ))
      if [ "${AGE}" -lt 60 ]; then
        echo "[gitnexus] skip re-index — last run ${AGE}s ago (<60s throttle)"
        exit 0
      fi
    fi
    mkdir -p "${REPO_ROOT}/.gitnexus" && touch "${MARKER}"
    LOG="/tmp/gitnexus-reindex-$(basename "${REPO_ROOT}").log"
    nohup docker run "${DOCKER_BASE[@]}" -c "node /app/gitnexus/dist/cli/index.js analyze --skip-agents-md" \
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
  analyze [args...]    Re-index repo synchronously (~2-3 min). Always passes
                       --skip-agents-md — gitnexus rules live in
                       .claude/rules/gitnexus-mcp-usage.md, tracked CLAUDE.md
                       /AGENTS.md must not churn per-developer.
  mcp                  Start MCP server on stdio (used by .mcp.json)
  status               Show index status
  list                 List indexed repos
  reindex-bg           Re-index in background (used by git hooks; throttled 60s)
  pull                 Pull/update Docker image

Env vars:
  GITNEXUS_IMAGE       Override image tag (default: akonlabs/gitnexus:1.6.4-rc.63)

First-time setup:
  scripts/gitnexus.sh pull
  scripts/gitnexus.sh analyze
EOF
    exit 1
    ;;
esac
