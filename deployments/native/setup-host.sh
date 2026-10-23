#!/usr/bin/env bash
# One-time (re-runnable) host setup for running Plane natively under systemd.
# Does NOT touch the live site: Caddy and the Plane services are installed and
# enabled but not started; import-data.sh performs the cutover.
#
# Usage (as root, from a checkout of the production branch):
#   sudo bash deployments/native/setup-host.sh [ENV_DIR]
#
# ENV_DIR holds api.env, live.env and silo.env (default /var/www/plane-migration/native-env).
# Auto-deploy: GitHub-hosted Actions connect over SSH as `plane-ci`, whose key is
# pinned to /opt/plane/bin/ci-deploy. The private key is written to
# /root/plane-ci-deploy-key for the DEPLOY_SSH_KEY repo secret.
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }

HERE=$(cd "$(dirname "$0")" && pwd)
ENV_DIR=${1:-/var/www/plane-migration/native-env}
ROOT=/opt/plane
REPO_URL=https://github.com/xplicationsrl/plane.git

NODE_VERSION=22.22.0
NODE_SHA256=9aa8e9d2298ab68c600bd6fb86a6c13bce11a4eca1ba9b39d79fa021755d7c37
UV_VERSION=0.12.21
UV_SHA256=23f02075b652bb1df64178cfae41b5caf160822e720e2663568f3f5d63bc52c0
SILO_RELEASE=RELEASE.2026-09-16T00-00-00Z
SILO_TARBALL=silo_20260916000000.0.0_linux_amd64.tar.gz
SILO_SHA256=381e745510a8fb64323d7bb3207f95984b7f4ed826f4fcad318f97683c420c73

log() { echo; echo "== $*"; }
for f in api.env live.env silo.env; do
  [[ -f "$ENV_DIR/$f" ]] || { echo "missing $ENV_DIR/$f" >&2; exit 1; }
done
# Database and RabbitMQ credentials come from api.env (never hardcoded here)
set -a; . "$ENV_DIR/api.env"; set +a

fetch_verified() { # url sha256 dest
  curl -fsSL "$1" -o "$3"
  echo "$2  $3" | sha256sum -c --quiet
}
TMP=$(mktemp -d)
cleanup() { rm -rf "$TMP" /usr/sbin/policy-rc.d; }
trap cleanup EXIT

log "Packages (services are not auto-started during install)"
printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d
chmod +x /usr/sbin/policy-rc.d
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -yq curl ca-certificates gnupg git build-essential python3.12-dev postgresql-common \
  debian-keyring debian-archive-keyring apt-transport-https
# PostgreSQL 18 (PGDG) — same major version as the old container
[[ -f /etc/apt/sources.list.d/pgdg.sources || -f /etc/apt/sources.list.d/pgdg.list ]] \
  || /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
# Caddy (official repo); install our Caddyfile first so the package keeps it
if [[ ! -f /etc/apt/sources.list.d/caddy-stable.list ]]; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
fi
mkdir -p /etc/caddy
install -m 644 "$HERE/Caddyfile" /etc/caddy/Caddyfile
apt-get update -q
apt-get install -yq -o Dpkg::Options::=--force-confold \
  postgresql-18 postgresql-client-18 libpq-dev redis-server rabbitmq-server caddy
rm -f /usr/sbin/policy-rc.d

log "Users and directories"
id plane >/dev/null 2>&1 || useradd --system --home-dir $ROOT --shell /usr/sbin/nologin plane
id silo >/dev/null 2>&1 || useradd --system --home-dir /var/lib/silo --shell /usr/sbin/nologin silo
# SSH login for CI; its only permitted command is ci-deploy (forced in authorized_keys)
id plane-ci >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/plane-ci --shell /bin/bash plane-ci
install -d -o root -g root -m 755 $ROOT $ROOT/bin
install -d -o plane -g plane -m 755 $ROOT/releases $ROOT/backups
install -d -o root -g plane -m 750 $ROOT/shared
# plane needs a writable HOME for uv/pnpm caches and the deploy lock
install -d -o plane -g plane -m 755 $ROOT/.cache $ROOT/.local
touch $ROOT/deploy.lock && chown plane:plane $ROOT/deploy.lock

log "Node $NODE_VERSION (private to Plane; system node is left alone)"
if [[ "$($ROOT/node/bin/node --version 2>/dev/null)" != "v$NODE_VERSION" ]]; then
  fetch_verified "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" "$NODE_SHA256" "$TMP/node.tar.xz"
  rm -rf $ROOT/node && mkdir -p $ROOT/node
  tar -xJf "$TMP/node.tar.xz" -C $ROOT/node --strip-components=1
fi
# pnpm shim (version comes from packageManager in package.json); turbo needs it on PATH
$ROOT/node/bin/corepack enable --install-directory $ROOT/node/bin pnpm

log "uv $UV_VERSION"
if [[ "$($ROOT/bin/uv --version 2>/dev/null)" != "uv $UV_VERSION"* ]]; then
  fetch_verified "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-x86_64-unknown-linux-gnu.tar.gz" "$UV_SHA256" "$TMP/uv.tgz"
  tar -xzf "$TMP/uv.tgz" -C "$TMP"
  install -m 755 "$TMP"/uv-x86_64-unknown-linux-gnu/uv "$TMP"/uv-x86_64-unknown-linux-gnu/uvx $ROOT/bin/
fi

log "Silo object storage ($SILO_RELEASE)"
if [[ ! -x /usr/local/bin/silo ]] || ! /usr/local/bin/silo --version 2>/dev/null | grep -q "${SILO_RELEASE#RELEASE.}"; then
  fetch_verified "https://github.com/pgsty/silo/releases/download/$SILO_RELEASE/$SILO_TARBALL" "$SILO_SHA256" "$TMP/silo.tgz"
  tar -xzf "$TMP/silo.tgz" -C "$TMP" silo
  install -m 755 "$TMP/silo" /usr/local/bin/silo
fi
install -d -o silo -g silo -m 750 /var/lib/silo /var/lib/silo/data
install -m 640 -o root -g silo "$ENV_DIR/silo.env" /etc/default/silo

log "Environment files"
install -m 640 -o root -g plane "$ENV_DIR/api.env" $ROOT/shared/api.env
install -m 640 -o root -g plane "$ENV_DIR/live.env" $ROOT/shared/live.env

log "PostgreSQL 18"
systemctl enable --now postgresql
pg_lsclusters
sudo -u postgres psql -v ON_ERROR_STOP=1 -q \
  -v user="$POSTGRES_USER" -v pass="$POSTGRES_PASSWORD" -v db="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN', :'user')
  WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'user') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'user', :'pass') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'user')
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db') \gexec
SQL

log "Redis"
systemctl enable --now redis-server

log "RabbitMQ (localhost only)"
cat > /etc/rabbitmq/rabbitmq.conf <<'EOF'
listeners.tcp.default = 127.0.0.1:5672
distribution.listener.interface = 127.0.0.1
loopback_users.guest = true
EOF
grep -q '^ERL_EPMD_ADDRESS' /etc/rabbitmq/rabbitmq-env.conf 2>/dev/null \
  || echo 'ERL_EPMD_ADDRESS=127.0.0.1' >> /etc/rabbitmq/rabbitmq-env.conf
systemctl enable rabbitmq-server
systemctl restart rabbitmq-server
rabbitmqctl await_startup
rabbitmqctl list_users -q | grep -q "^$RABBITMQ_USER[[:space:]]" \
  || rabbitmqctl add_user "$RABBITMQ_USER" "$RABBITMQ_PASSWORD"
rabbitmqctl change_password "$RABBITMQ_USER" "$RABBITMQ_PASSWORD"
rabbitmqctl list_vhosts -q | grep -qx "$RABBITMQ_VHOST" || rabbitmqctl add_vhost "$RABBITMQ_VHOST"
rabbitmqctl set_permissions -p "$RABBITMQ_VHOST" "$RABBITMQ_USER" '.*' '.*' '.*'
rabbitmqctl list_users -q | grep -q '^guest' && rabbitmqctl delete_user guest || true

log "systemd units"
install -m 644 "$HERE"/systemd/*.service "$HERE"/systemd/plane.target /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now silo
systemctl enable plane.target plane-api plane-worker plane-beat plane-space plane-live
# Caddy stays stopped until cutover (port 3356 may still belong to the old stack)
systemctl enable caddy

log "Deploy script and sudo rules"
install -m 755 -o root -g root "$HERE/deploy.sh" $ROOT/bin/deploy
install -m 755 -o root -g root "$HERE/ci-deploy.sh" $ROOT/bin/ci-deploy
cat > "$TMP/sudoers" <<'EOF'
# Plane native deploy (deployments/native/setup-host.sh)
plane ALL=(root) NOPASSWD: /usr/bin/systemctl restart plane.target
plane-ci ALL=(plane) NOPASSWD: /opt/plane/bin/deploy
EOF
visudo -cf "$TMP/sudoers"
install -m 440 "$TMP/sudoers" /etc/sudoers.d/plane

log "Source mirror"
if [[ ! -d $ROOT/repo.git ]]; then
  sudo -u plane git init --quiet --bare $ROOT/repo.git
  sudo -u plane git -C $ROOT/repo.git remote add origin "$REPO_URL"
fi
sudo -u plane git -C $ROOT/repo.git fetch --quiet origin +refs/heads/production:refs/remotes/origin/production
SHA=$(sudo -u plane git -C $ROOT/repo.git rev-parse refs/remotes/origin/production)

log "CI deploy key (plane-ci, forced command /opt/plane/bin/ci-deploy)"
CI_KEY=/root/plane-ci-deploy-key
install -d -o plane-ci -g plane-ci -m 700 /opt/plane-ci/.ssh
if [[ ! -f $CI_KEY ]]; then
  ssh-keygen -q -t ed25519 -N '' -C "plane-ci deploy (github actions)" -f $CI_KEY
fi
printf 'restrict,command="/opt/plane/bin/ci-deploy" %s\n' "$(cat $CI_KEY.pub)" > /opt/plane-ci/.ssh/authorized_keys
chown plane-ci:plane-ci /opt/plane-ci/.ssh/authorized_keys
chmod 600 /opt/plane-ci/.ssh/authorized_keys $CI_KEY

log "Pre-building release $SHA (live site untouched)"
sudo -u plane $ROOT/bin/deploy "$SHA" --build-only

cat <<EOF

Host ready.

GitHub repo secrets for auto-deploy (Settings → Secrets and variables → Actions):
  DEPLOY_SSH_HOST         this server's public address (same as the freellmapi deploy)
  DEPLOY_SSH_PORT         SSH port (omit for 22)
  DEPLOY_SSH_KEY          contents of: sudo cat $CI_KEY
  DEPLOY_SSH_KNOWN_HOSTS  <DEPLOY_SSH_HOST> $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)
                          (use [host]:port instead of host if the port isn't 22)

Next: sudo bash $HERE/import-data.sh
EOF
