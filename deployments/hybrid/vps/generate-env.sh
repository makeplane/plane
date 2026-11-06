#!/usr/bin/env bash
# Writes deployments/hybrid/vps/.env with fresh random secrets. Refuses to replace
# an existing file, because new secrets would lock the stack out of its own data.
set -euo pipefail

usage() {
  echo "usage: $0 --domain <public-domain> --release <tag> [--registry <registry>]" >&2
  exit 2
}

domain=""
release=""
registry="ghcr.io/nexus-link-automated"
while [ $# -gt 0 ]; do
  case "$1" in
    --domain) domain="${2:-}"; shift 2 ;;
    --release) release="${2:-}"; shift 2 ;;
    --registry) registry="${2:-}"; shift 2 ;;
    *) usage ;;
  esac
done
[ -n "$domain" ] && [ -n "$release" ] || usage

env_file="$(cd "$(dirname "$0")" && pwd)/.env"
if [ -e "$env_file" ]; then
  echo "$env_file already exists; leaving it untouched." >&2
  exit 1
fi

# Hex only, so the values are safe inside DATABASE_URL and AMQP_URL.
secret() { openssl rand -hex "$1"; }

umask 077
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

GUNICORN_WORKERS=2
API_KEY_RATE_LIMIT=60/minute

# rclone remote for off-server backups. It must be a crypt remote: see README.md.
BACKUP_REMOTE=nexus-backup-crypt:
BACKUP_RETENTION_DAYS=30
EOF

echo "Wrote $env_file (mode 600)."
