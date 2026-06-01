#!/usr/bin/env bash
#
# dev-local.sh — One-command local dev launcher (SHBVN MacBook dev).
#
# Backend + Caddy reverse proxy run in Docker; the frontends run on the host via
# turbo (pnpm dev) with hot reload. Everything is reached through ONE origin —
# http://localhost (Caddy on :80) — so you never have to juggle ports.
#
#   ./scripts/dev-local.sh           start the full stack
#   ./scripts/dev-local.sh --clean   kill stray host dev servers first, then start
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -p planeso -f docker-compose-local.yml)
FRONTEND_PORTS=(3000 3001 3002 3003)

# --clean: stop any host dev server squatting on a frontend port. This is the
# usual cause of "god-mode shows the wrong app": a duplicate `pnpm dev` cascades
# onto :3001 and impersonates the admin app (→ "no workspace").
if [[ "${1:-}" == "--clean" ]]; then
  echo "▶ Cleaning stray host dev servers on ${FRONTEND_PORTS[*]} …"
  for p in "${FRONTEND_PORTS[@]}"; do
    lsof -ti "tcp:$p" -sTCP:LISTEN 2>/dev/null | xargs -r kill 2>/dev/null || true
  done
fi

echo "▶ Backend + proxy (Docker) …"
"${COMPOSE[@]}" up -d

cat <<'MAP'

  ── Open ONE origin:  http://localhost ───────────────────────────────
   http://localhost              web app          (host :3000)
   http://localhost/god-mode/    admin / god-mode (host :3001)
   http://localhost/spaces/      public spaces    (host :3002)
   http://localhost/live/        live server      (host :3003)
   http://localhost/api/…        backend API      (docker  :8000)
   Postgres :5434 (plane/plane)  ·  MinIO console http://localhost:9090
  ─────────────────────────────────────────────────────────────────────
  Hot reload: frontends (vite HMR) + backend (Django autoreload).
  Ctrl-C stops the frontends; backend + proxy keep running.
  Stop backend too:  docker compose -p planeso -f docker-compose-local.yml down

MAP

# Warn (don't fail) if a frontend port is already taken and we did NOT --clean.
if [[ "${1:-}" != "--clean" ]]; then
  for p in "${FRONTEND_PORTS[@]}"; do
    if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "⚠  :$p already in use — if an app shows the wrong content, rerun with --clean"
    fi
  done
fi

echo "▶ Frontends (turbo: web + admin + space + live) …"
exec pnpm dev
