#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_ENV="$(cd "$BASE_DIR/.." && pwd)/.env"
BACKUP_DIR="$BASE_DIR/backups"
DATE="$(date +%F-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Load locals (POSTGRES_USER, POSTGRES_DB, ...) — same file Forgejo uses.
# shellcheck disable=SC1090
set -a; . "$BASE_DIR/.env"; set +a

DC=(docker compose --env-file "$PARENT_ENV" --env-file "$BASE_DIR/.env" -f "$BASE_DIR/docker-compose.yml")

echo "[1/4] pg_dump"
docker exec forgejo-postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$BACKUP_DIR/forgejo-db-$DATE.dump"

echo "[2/4] stop forgejo"
"${DC[@]}" stop forgejo

echo "[3/4] tar data"
tar -czf "$BACKUP_DIR/forgejo-files-$DATE.tar.gz" -C "$BASE_DIR" data/forgejo docker-compose.yml .env

echo "[4/4] start forgejo"
"${DC[@]}" start forgejo

find "$BACKUP_DIR" -type f \( -name "*.dump" -o -name "*.tar.gz" \) -mtime +14 -delete

echo "Backup complete:"
ls -lh "$BACKUP_DIR"/*"$DATE"*
