#!/usr/bin/env bash
# First command of every install: create the production .env from the template.
#
#   deployments/workspaces/init-env.sh                      # workspaces.hgsoftware.com.np
#   deployments/workspaces/init-env.sh staging.example.com  # somewhere else
#
# Copies deployments/workspaces/.env.example to .env in the repository root, points
# it at the domain, generates every secret, and locks the file down. Refuses to
# overwrite an existing .env -- edit that one by hand instead. Also checks that
# the installed Compose is new enough for the overlays.

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
TEMPLATE="$ROOT/deployments/workspaces/.env.example"
TARGET="$ROOT/.env"

if [ ! -f "$TEMPLATE" ]; then
  echo "error: $TEMPLATE not found" >&2
  exit 1
fi

# The template is this project's own configuration, so its domain is the
# default. Pass one to deploy the same code somewhere else.
TEMPLATE_DOMAIN=$(sed -n 's/^APP_DOMAIN=//p' "$TEMPLATE" | head -1)
DOMAIN=${1:-$TEMPLATE_DOMAIN}

if [ -z "$DOMAIN" ]; then
  echo "error: no domain given and APP_DOMAIN is empty in $TEMPLATE" >&2
  exit 1
fi

case "$DOMAIN" in
  *://*|*/*) echo "error: pass a bare hostname (workspaces.hgsoftware.com.np), not a URL" >&2; exit 1 ;;
esac

if [ -e "$TARGET" ]; then
  echo "error: $TARGET already exists; edit it in place or move it away first" >&2
  exit 1
fi

# The overlays use !override / !reset and env_file `required`, which need
# Compose v2.24 or newer. Older releases merge the port lists instead of
# replacing them, and Caddy ends up fighting nginx for 80/443.
compose_version=$(docker compose version --short 2>/dev/null || true)
if [ -z "$compose_version" ]; then
  echo "error: 'docker compose' is not available; install the Compose v2 plugin" >&2
  exit 1
fi
# Some releases print "v2.24.0" and some "2.39.4". Strip everything that is not
# a digit or a dot before comparing, or the leading "v" makes the numeric test
# error out and the check silently passes whatever it was given.
version_number=$(printf '%s' "$compose_version" | tr -cd '0-9.')
major=${version_number%%.*}
minor=${version_number#*.}; minor=${minor%%.*}
case "$major$minor" in
  ''|*[!0-9]*)
    echo "error: could not read a version number from 'docker compose version --short' ($compose_version)" >&2
    exit 1 ;;
esac
if [ "$major" -lt 2 ] || { [ "$major" -eq 2 ] && [ "$minor" -lt 24 ]; }; then
  echo "error: docker compose $compose_version is too old; v2.24 or newer is required." >&2
  echo "       Older releases merge the overlay's port list instead of replacing it," >&2
  echo "       so Caddy would try to take ports 80 and 443 from your nginx." >&2
  exit 1
fi

secret() { openssl rand -hex 32; }

# Every URL in the template is written out literally against the placeholder
# domain, so one global substitution does the whole file and the result carries
# no ${...} for Compose to expand -- the generated .env means the same thing on
# any Compose version.
umask 077
sed \
  -e "s|${TEMPLATE_DOMAIN//./\\.}|${DOMAIN}|g" \
  -e "s|^SECRET_KEY=$|SECRET_KEY=$(secret)|" \
  -e "s|^LIVE_SERVER_SECRET_KEY=$|LIVE_SERVER_SECRET_KEY=$(secret)|" \
  -e "s|^POSTGRES_PASSWORD=$|POSTGRES_PASSWORD=$(secret)|" \
  -e "s|^RABBITMQ_PASSWORD=$|RABBITMQ_PASSWORD=$(secret)|" \
  -e "s|^AWS_ACCESS_KEY_ID=$|AWS_ACCESS_KEY_ID=$(openssl rand -hex 10)|" \
  -e "s|^AWS_SECRET_ACCESS_KEY=$|AWS_SECRET_ACCESS_KEY=$(secret)|" \
  "$TEMPLATE" > "$TARGET"
chmod 600 "$TARGET"

# Prove the result is a complete configuration before anyone runs `up`.
if ! (cd "$ROOT" && docker compose config --quiet); then
  echo "error: the generated .env does not produce a valid configuration (see above)" >&2
  exit 1
fi

cat <<EOF
Wrote $TARGET (mode 600) for https://${DOMAIN}
  compose files: $(sed -n 's/^COMPOSE_FILE=//p' "$TARGET")
  project name:  $(sed -n 's/^COMPOSE_PROJECT_NAME=//p' "$TARGET")

Next:
  1. Review $TARGET -- in particular ODOO_BASE_URL / ODOO_API_KEY if attendance is wanted.
  2. If a stack already runs on this host, make sure COMPOSE_PROJECT_NAME matches
     its volume prefix ('docker volume ls') or it will start with empty volumes.
  3. docker compose up -d --build
  4. deployments/workspaces/verify.sh https://${DOMAIN}
EOF
