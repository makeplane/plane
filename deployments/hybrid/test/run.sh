#!/usr/bin/env bash
# Brings up the full hybrid topology locally and runs the smoke checks against it.
#
# By default it first builds this checkout's images, with the same Dockerfiles and
# contexts as .github/workflows/build-hybrid.yml, so it tests the fork as it stands.
# To test images that build-hybrid.yml has published instead, set APP_RELEASE to
# their tag, and IMAGE_REGISTRY if they are not in ghcr.io/nexus-link-automated.
# Pass --keep to leave the stack running afterwards.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
vps="$here/../vps"
repo="$(cd "$here/../../.." && pwd)"
project="nexus-hybrid-test"
keep=0
[ "${1:-}" = "--keep" ] && keep=1

if [ -n "${APP_RELEASE:-}" ]; then
  registry="${IMAGE_REGISTRY:-ghcr.io/nexus-link-automated}"
  release="$APP_RELEASE"
else
  registry="nexus-hybrid-test"
  release="$(git -C "$repo" rev-parse HEAD | cut -c1-9)"
  # Uncommitted changes go into the images too, so the tag must not claim the commit.
  [ -z "$(git -C "$repo" status --porcelain)" ] || release="$release-dirty"
  # Keep in step with the matrix in .github/workflows/build-hybrid.yml.
  for spec in \
    "plane-frontend . apps/web/Dockerfile.web" \
    "plane-admin . apps/admin/Dockerfile.admin" \
    "plane-space . apps/space/Dockerfile.space" \
    "plane-live . apps/live/Dockerfile.live" \
    "plane-backend apps/api apps/api/Dockerfile.api"; do
    read -r image context dockerfile <<<"$spec"
    echo "Building $registry/$image:$release..."
    docker build -q -t "$registry/$image:$release" -f "$repo/$dockerfile" "$repo/$context" >/dev/null
  done
fi

work="$(mktemp -d /tmp/nexus-hybrid-test.XXXXXX)"
export TEST_ROUTER_PORT="${TEST_ROUTER_PORT:-18080}"
export TEST_GATEWAY_PORT="${TEST_GATEWAY_PORT:-18081}"

cat >"$work/.env" <<EOF
APP_DOMAIN=operations.nexus-test.invalid
IMAGE_REGISTRY=$registry
APP_RELEASE=$release
POSTGRES_PASSWORD=$(openssl rand -hex 16)
RABBITMQ_PASSWORD=$(openssl rand -hex 16)
AWS_ACCESS_KEY_ID=$(openssl rand -hex 16)
AWS_SECRET_ACCESS_KEY=$(openssl rand -hex 32)
SECRET_KEY=$(openssl rand -hex 32)
LIVE_SERVER_SECRET_KEY=$(openssl rand -hex 32)
EOF

compose() {
  docker compose -p "$project" --env-file "$work/.env" \
    -f "$vps/docker-compose.yml" -f "$here/docker-compose.override.yml" "$@"
}

cleanup() {
  if [ "$keep" -eq 1 ]; then
    echo "Stack left running as project $project; router on 127.0.0.1:$TEST_ROUTER_PORT."
    echo "Env file: $work/.env"
    return
  fi
  compose down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

compose up -d --build

url="http://127.0.0.1:$TEST_ROUTER_PORT"
echo "Waiting for the API to answer through the router..."
ready=0
for _ in $(seq 1 60); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$url/api/instances/" || true)" = "200" ]; then
    ready=1
    break
  fi
  sleep 5
done
if [ "$ready" -ne 1 ]; then
  echo "FAIL  the API never answered through the router" >&2
  compose ps -a >&2
  compose logs --tail 20 router socks gateway api >&2 || true
  exit 1
fi

status=0
python3 "$here/smoke.py" --public-url https://operations.nexus-test.invalid --connect-url "$url" --write || status=$?

# With no direct route, passing the checks above proves the proxy path was used.
if compose exec -T router wget -q -T 3 -O /dev/null http://gateway/__gateway/health >/dev/null 2>&1; then
  echo "FAIL  the router can reach the gateway without the proxy"
  status=1
else
  echo "PASS  the router reaches the gateway only through the proxy"
fi

published="$(docker ps --filter "label=com.docker.compose.project=$project" --format '{{.Names}} {{.Ports}}' \
  | grep -E '0\.0\.0\.0|:::' || true)"
if [ -z "$published" ]; then
  echo "PASS  no service publishes a port beyond loopback"
else
  echo "FAIL  ports open beyond loopback: $published"
  status=1
fi

if [ "$status" -ne 0 ]; then
  compose logs --tail 40 gateway api router socks >&2 || true
fi
exit "$status"
