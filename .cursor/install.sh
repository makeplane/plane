#!/usr/bin/env bash
# Idempotent repository bootstrap for Cloud Agents.
# Toolchain (Node, pnpm, Docker) comes from .cursor/Dockerfile.
# This script only refreshes env files, JS dependencies, and local images.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
cd "$(plane_root)"

/usr/local/bin/node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 22)) {
  console.error(`Node ${process.versions.node} is older than 22.22.0`);
  process.exit(1);
}
console.log(`node v${process.versions.node}`);
'

copy_env_if_missing ".env.example" ".env"
copy_env_if_missing "apps/web/.env.example" "apps/web/.env"
copy_env_if_missing "apps/api/.env.example" "apps/api/.env"
copy_env_if_missing "apps/space/.env.example" "apps/space/.env"
copy_env_if_missing "apps/admin/.env.example" "apps/admin/.env"
copy_env_if_missing "apps/live/.env.example" "apps/live/.env"
ensure_secret_key

# packageManager pins pnpm@11.10.0. Activate it if the image shim is stale.
if ! command -v pnpm >/dev/null 2>&1 || [ "$(pnpm -v 2>/dev/null || true)" != "11.10.0" ]; then
  sudo mkdir -p /usr/local/share/corepack
  sudo chmod 1777 /usr/local/share/corepack
  sudo /usr/local/bin/corepack enable
  # Prepare as the runtime user so the package is not stored only in root's home.
  /usr/local/bin/corepack prepare pnpm@11.10.0 --activate
fi
echo "pnpm $(pnpm -v)"

pnpm install --frozen-lockfile

ensure_docker

echo "pulling local infrastructure images"
docker compose -f docker-compose-local.yml pull plane-db plane-redis plane-mq plane-minio

# api, worker, beat-worker, and migrator share Dockerfile.dev.
# Build api first so the other services reuse the layer cache.
echo "building local API image"
docker compose -f docker-compose-local.yml build api
docker compose -f docker-compose-local.yml build worker beat-worker migrator

echo "install complete"
