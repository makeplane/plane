#!/usr/bin/env bash
# Sends an encrypted backup off the server: the Postgres dump, the uploads volume,
# and .env. The .env copy matters because Plane encrypts stored instance settings
# with SECRET_KEY, so a database restored without it loses those settings.
#
# Environment overrides, used by the local test stack:
#   ENV_FILE           env file (default: ./.env)
#   COMPOSE_FILES      compose arguments (default: -f docker-compose.yml)
#   COMPOSE_PROJECT    compose project name (default: the file's own)
#   RCLONE_CONFIG_DIR  directory holding rclone.conf (default: ./rclone)
#   RCLONE_EXTRA_MOUNT extra docker volume for rclone, for a local test remote
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

env_file="${ENV_FILE:-$here/.env}"
# shellcheck disable=SC1090
set -a; . "$env_file"; set +a

: "${BACKUP_REMOTE:?BACKUP_REMOTE is not set}"
retention_days="${BACKUP_RETENTION_DAYS:-30}"
rclone_config_dir="${RCLONE_CONFIG_DIR:-$here/rclone}"
rclone_image="rclone/rclone:1.75.2"
read -r -a compose_files <<<"${COMPOSE_FILES:--f docker-compose.yml}"

compose() {
  docker compose ${COMPOSE_PROJECT:+-p "$COMPOSE_PROJECT"} --env-file "$env_file" "${compose_files[@]}" "$@"
}

rclone() {
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
    -v "$rclone_config_dir:/config/rclone:ro,z" \
    ${RCLONE_DATA_MOUNT:+-v "$RCLONE_DATA_MOUNT"} \
    ${RCLONE_EXTRA_MOUNT:+-v "$RCLONE_EXTRA_MOUNT"} \
    "$rclone_image" "$@"
}

# These backups include every secret in .env, so plain storage is not acceptable.
remote_name="${BACKUP_REMOTE%%:*}"
remote_type="$(rclone config show "$remote_name" | awk -F' *= *' '$1 == "type" { print $2 }')"
if [ "$remote_type" != "crypt" ]; then
  echo "BACKUP_REMOTE must be an rclone crypt remote; '$remote_name' has type '${remote_type:-unknown}'." >&2
  exit 1
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
stage="$(mktemp -d /tmp/nexus-ops-backup.XXXXXX)"
trap 'rm -rf "$stage"' EXIT
chmod 700 "$stage"

compose exec -T plane-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$stage/postgres.dump"
minio_container="$(compose ps -q plane-minio)"
[ -n "$minio_container" ] || { echo "plane-minio is not running." >&2; exit 1; }
docker run --rm --volumes-from "$minio_container:ro" alpine:3.22 tar czf - -C /export . >"$stage/uploads.tar.gz"
cp "$env_file" "$stage/env"

# A failed or empty dump must not replace good history through the retention step.
[ -s "$stage/postgres.dump" ] || { echo "Postgres dump is empty." >&2; exit 1; }
sha256sum "$stage"/postgres.dump "$stage"/uploads.tar.gz "$stage"/env | sed "s#$stage/##" >"$stage/SHA256SUMS"

RCLONE_DATA_MOUNT="$stage:/stage:ro,z" rclone copy /stage "${BACKUP_REMOTE}${stamp}"
rclone delete "${BACKUP_REMOTE}" --min-age "${retention_days}d"
rclone rmdirs "${BACKUP_REMOTE}" --leave-root

echo "Backup $stamp uploaded to $BACKUP_REMOTE"
