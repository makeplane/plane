#!/usr/bin/env bash
# Safe equivalent of ./setup.sh for Cloud Agents, plus the image pulls and
# builds docker-compose-local.yml needs before `up`.
#
# Unlike ./setup.sh, this never overwrites an existing .env file and never
# appends a second SECRET_KEY.
#
# When stack.sh lands in the repo, call it from here instead of the steps below.
# Do not add a second way to boot Plane.
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

# setup.sh copies these six files. Copy only when the destination is missing.
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

# CONTRIBUTING assumes Docker is already running. Cloud Agent VMs start the
# daemon here so the image pulls below can run during install.
ensure_docker

echo "pulling local infrastructure images"
docker compose -f docker-compose-local.yml pull plane-db plane-redis plane-mq plane-minio

# api, worker, beat-worker, and migrator share apps/api/Dockerfile.dev.
# Build api first so the other services reuse the layer cache.
echo "building local API image"
docker compose -f docker-compose-local.yml build api
docker compose -f docker-compose-local.yml build worker beat-worker migrator

echo "install complete"
