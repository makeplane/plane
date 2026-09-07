#!/usr/bin/env bash
# Back up everything that cannot be rebuilt: the Postgres database and the
# uploads volume. Run on the VPS from the repository root, with the stack up:
#
#   deployments/workspaces/backup.sh                 # writes to ./backups/<timestamp>/
#   deployments/workspaces/backup.sh /mnt/backups    # somewhere else
#
# Keeps the newest BACKUP_KEEP sets (default 7) in the target directory and
# removes older ones. Valkey and RabbitMQ hold only transient state and are
# not backed up. The .env file is NOT included: keep it somewhere safe
# yourself, because SECRET_KEY is needed to read the encrypted instance
# settings back out of the database dump.
#
# Restore is described in DEPLOYMENT.md ("Restoring a backup").

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"

DEST_ROOT=${1:-$ROOT/backups}
KEEP=${BACKUP_KEEP:-7}
STAMP=$(date +%Y%m%d-%H%M%S)
DEST="$DEST_ROOT/$STAMP"

project=$(docker compose config --format json | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -1)
project=${project:-$(basename "$ROOT")}
db_user=$(docker compose exec -T workspaces-db printenv POSTGRES_USER | tr -d '\r')
db_name=$(docker compose exec -T workspaces-db printenv POSTGRES_DB | tr -d '\r')

mkdir -p "$DEST"
echo "Backing up project '$project' to $DEST"

echo "  postgres ($db_name) ..."
docker compose exec -T workspaces-db pg_dump -U "$db_user" -d "$db_name" --no-owner --no-privileges \
  | gzip > "$DEST/postgres.sql.gz"

echo "  uploads volume ..."
docker run --rm \
  -v "${project}_uploads:/data:ro" \
  -v "$DEST:/backup" \
  alpine:3.20 tar czf /backup/uploads.tar.gz -C /data .

( cd "$DEST" && sha256sum postgres.sql.gz uploads.tar.gz > SHA256SUMS )
du -sh "$DEST"/* | sed 's/^/  /'

# Prune: keep the newest $KEEP timestamped directories.
ls -1d "$DEST_ROOT"/[0-9]*-[0-9]* 2>/dev/null | sort | head -n -"$KEEP" | while read -r old; do
  echo "  removing old backup $old"
  rm -rf "$old"
done

echo "Done."
