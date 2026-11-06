#!/usr/bin/env bash
# Writes deployments/hybrid/vps/.env with fresh random secrets. Refuses to replace
# an existing file, because new secrets would lock the stack out of its own data.
#
# --add-missing appends the secrets a newer release needs (such as the agent chat's)
# to an existing .env, and never changes a value that is already there.
set -euo pipefail

usage() {
  echo "usage: $0 --domain <public-domain> --release <tag> [--registry <registry>]" >&2
  echo "       $0 --add-missing" >&2
  exit 2
}

domain=""
release=""
registry="ghcr.io/nexus-link-automated"
add_missing=0
while [ $# -gt 0 ]; do
  case "$1" in
    --domain) domain="${2:-}"; shift 2 ;;
    --release) release="${2:-}"; shift 2 ;;
    --registry) registry="${2:-}"; shift 2 ;;
    --add-missing) add_missing=1; shift ;;
    *) usage ;;
  esac
done

env_file="$(cd "$(dirname "$0")" && pwd)/.env"

# Hex only, so the values are safe inside DATABASE_URL and AMQP_URL.
secret() { openssl rand -hex "$1"; }

umask 077

# Secrets added after the first release. Each one is shared by two services, which
# read it from this one file, so a fresh value is safe as long as both restart.
agent_secrets() {
  # The API and the agent bridge (X-Agent-Bridge-Secret).
  echo "AGENT_BRIDGE_SECRET=$(secret 32)"
  # The agent bridge and the agent runner (spawn tickets; 32+ characters).
  echo "AGENT_RUNNER_SECRET=$(secret 32)"
}

if [ "$add_missing" -eq 1 ]; then
  [ -z "$domain" ] && [ -z "$release" ] || usage
  [ -e "$env_file" ] || { echo "$env_file does not exist; run without --add-missing first." >&2; exit 1; }
  added=0
  while IFS= read -r line; do
    key="${line%%=*}"
    if ! grep -q "^$key=" "$env_file"; then
      printf '%s\n' "$line" >>"$env_file"
      echo "Added $key."
      added=1
    fi
  done < <(agent_secrets)
  [ "$added" -eq 1 ] || echo "Nothing to add."
  exit 0
fi

[ -n "$domain" ] && [ -n "$release" ] || usage
if [ -e "$env_file" ]; then
  echo "$env_file already exists; leaving it untouched." >&2
  exit 1
fi

cat >"$env_file" <<EOF
APP_DOMAIN=$domain
IMAGE_REGISTRY=$registry
APP_RELEASE=$release

POSTGRES_USER=plane
POSTGRES_DB=plane
POSTGRES_PASSWORD=$(secret 32)

RABBITMQ_USER=plane
RABBITMQ_VHOST=plane
RABBITMQ_PASSWORD=$(secret 32)

AWS_REGION=
AWS_ACCESS_KEY_ID=$(secret 16)
AWS_SECRET_ACCESS_KEY=$(secret 32)
AWS_S3_BUCKET_NAME=uploads
FILE_SIZE_LIMIT=5242880

SECRET_KEY=$(secret 32)
LIVE_SERVER_SECRET_KEY=$(secret 32)

# In-app agent chat.
$(agent_secrets)
AGENT_SESSION_TOKEN_TTL_MINUTES=120
# The agent runner's limits. It runs every agent, with their shell commands and builds.
AGENT_RUNNER_CPUS=2
AGENT_RUNNER_MEMORY=3g
AGENT_RUNNER_PIDS=1024

GUNICORN_WORKERS=2
API_KEY_RATE_LIMIT=60/minute

# rclone remote for off-server backups. It must be a crypt remote: see README.md.
BACKUP_REMOTE=nexus-backup-crypt:
BACKUP_RETENTION_DAYS=30
EOF

echo "Wrote $env_file (mode 600)."
