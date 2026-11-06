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
    "plane-backend apps/api apps/api/Dockerfile.api" \
    "plane-agent-bridge . apps/agent-bridge/Dockerfile.agent-bridge" \
    "plane-agent-runner . apps/agent-runner/Dockerfile.agent-runner" \
    "plane-mcp apps/mcp apps/mcp/Dockerfile"; do
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
AGENT_BRIDGE_SECRET=$(openssl rand -hex 32)
AGENT_RUNNER_SECRET=$(openssl rand -hex 32)
AGENTS_BRIDGE_NAME=br-nxhtest-agt
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
echo "Waiting for the API and the agent bridge to answer through the router..."
# The fork's migrations take several minutes on an empty database.
ready=0
for _ in $(seq 1 120); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$url/api/instances/" || true)" = "200" ] \
    && [ "$(curl -s -o /dev/null -w '%{http_code}' "$url/agents/health" || true)" = "200" ]; then
    ready=1
    break
  fi
  sleep 5
done
if [ "$ready" -ne 1 ]; then
  echo "FAIL  the API or the agent bridge never answered through the router" >&2
  compose ps -a >&2
  compose logs --tail 20 router socks gateway api agent-bridge agent-runner >&2 || true
  exit 1
fi

# The admin UI only offers the real adapters, so the echo test agent goes in directly.
echo_agent_id="$(compose exec -T api python manage.py shell -c '
from plane.license.models import AgentDefinition
agent, _ = AgentDefinition.objects.get_or_create(slug="smoke-echo", defaults={"name": "Smoke echo", "adapter": "echo"})
print(agent.id)' | tail -n 1 | tr -d '\r')"

status=0
python3 "$here/smoke.py" --public-url https://operations.nexus-test.invalid --connect-url "$url" --write \
  --echo-agent-id "$echo_agent_id" || status=$?

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

# The agent runner is the sandbox: from inside it, only mcp and the internet.
runner_reaches() {
  compose exec -T agent-runner timeout 5 bash -c "</dev/tcp/$1/$2" >/dev/null 2>&1
}
for target in api:8000 gateway:80 plane-db:5432 plane-redis:6379 plane-mq:5672 plane-minio:9000 live:3000; do
  service="${target%%:*}"
  port="${target##*:}"
  # By name, and by each of the service's addresses in case only DNS hides it.
  addresses="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' \
    "$(compose ps -q "$service")")"
  reached=""
  for host in "$service" $addresses; do
    runner_reaches "$host" "$port" && reached="$reached $host"
  done
  if [ -z "$reached" ]; then
    echo "PASS  agent-runner cannot reach $service ($service${addresses:+, $addresses})"
  else
    echo "FAIL  agent-runner reaches $service at$reached"
    status=1
  fi
done
if runner_reaches mcp 8211; then
  echo "PASS  agent-runner reaches mcp:8211"
else
  echo "FAIL  agent-runner cannot reach mcp:8211"
  status=1
fi
internet="$(compose exec -T agent-runner curl -s -o /dev/null --max-time 15 -w '%{http_code}' https://example.com || true)"
if [[ "$internet" =~ ^[23] ]]; then
  echo "PASS  agent-runner reaches the internet (https://example.com: $internet)"
else
  echo "FAIL  agent-runner cannot reach the internet (https://example.com: ${internet:-no answer})"
  status=1
fi

# The chat above ran as its workspace dir's own unprivileged uid, and its process went
# away with the connection.
dirs="$(compose exec -T agent-runner sh -c \
  'find "$AGENT_WORKSPACES_ROOT" -mindepth 2 -maxdepth 2 ! -path "$AGENT_WORKSPACES_ROOT/.*" -printf "%U %m %p\n"')"
if [ -n "$dirs" ] && ! awk '$1 < 20000 || $2 != "700" { bad = 1 } END { exit !bad }' <<<"$dirs"; then
  echo "PASS  agent working dirs belong to per-workspace uids, mode 700 ($(wc -l <<<"$dirs") found)"
else
  echo "FAIL  agent working dirs are missing or not private: ${dirs:-none}"
  status=1
fi
leftover=""
for _ in $(seq 1 10); do
  leftover="$(compose exec -T agent-runner ps -eo uid=,args= | awk '$1 >= 20000' || true)"
  [ -z "$leftover" ] && break
  sleep 1
done
if [ -z "$leftover" ]; then
  echo "PASS  no agent process outlives its chat"
else
  echo "FAIL  agent processes still running: $leftover"
  status=1
fi

if [ "$status" -ne 0 ]; then
  compose logs --tail 40 gateway api router socks agent-bridge agent-runner >&2 || true
fi
exit "$status"
