#!/usr/bin/env bash
# Read-only survey of an existing Plane install, to plan a migration onto this
# fork. The migration itself is described in docs/deployment/migration.md.
#
# Writes nothing, changes nothing, stops nothing. Run it on the VPS from this
# repository's checkout:
#
#   deployments/workspaces/inspect-existing.sh            # old stack in /opt/plane
#   OLD_DIR=/var/plane deployments/workspaces/inspect-existing.sh
#
# Hand the whole output back before running any migration steps -- the version
# it reports decides whether this is an upgrade, a no-op, or not possible.

set -uo pipefail

OLD_DIR="${OLD_DIR:-/opt/plane}"

hr() { printf '\n\033[1m── %s\033[0m\n' "$1"; }

# Discover the api container by its compose label rather than guessing a name:
# it is "api" under this fork's compose file and "plane-app-api-1" under the
# upstream CLI installer, among others. Override with API_CONTAINER=<name>.
API_CONTAINER="${API_CONTAINER:-$(docker ps --filter label=com.docker.compose.service=api --format '{{.Names}}' | head -1)}"

hr "Compose project"
if [ -n "$API_CONTAINER" ]; then
  docker inspect "$API_CONTAINER" \
    --format '{{index .Config.Labels "com.docker.compose.project"}} @ {{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null \
    || echo "!! could not inspect $API_CONTAINER"
else
  echo "!! no container labelled com.docker.compose.service=api is running."
  echo "   Start the old stack, or set API_CONTAINER=<name> (docker ps)."
fi

hr "Image tags in use (this is the version you are migrating FROM)"
docker ps --format '{{.Names}}\t{{.Image}}' | grep -Ei 'plane|api|web|space|admin|live|proxy' || true

hr "Running containers"
docker ps --filter "label=com.docker.compose.project" \
  --format '{{.Names}}\t{{.Status}}' | sort

hr "Volumes (the data actually lives here)"
docker volume ls --format '{{.Name}}' | grep -Ei 'plane|pgdata|uploads|redis|rabbit' || true

# ---- database ------------------------------------------------------------
DB_CONTAINER="$(docker ps --format '{{.Names}}' | grep -Ei 'plane.*db|db.*plane' | head -1)"
hr "Database container"
echo "${DB_CONTAINER:-!! not found — find it with: docker ps | grep postgres}"

if [ -n "${DB_CONTAINER:-}" ]; then
  DB_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER 2>/dev/null || echo plane)"
  DB_NAME="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB 2>/dev/null || echo plane)"
  echo "user=$DB_USER db=$DB_NAME"

  hr "Postgres server version (must match the new stack's major version)"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SHOW server_version;" 2>/dev/null

  LATEST_HERE="$(ls "$(dirname "$0")/../../apps/api/workspaces/db/migrations" 2>/dev/null | grep -E '^[0-9]{4}_' | sort | tail -1 | sed 's/\.py$//')"
  hr "Last 5 applied migrations (this fork's latest: ${LATEST_HERE:-unknown})"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT name FROM django_migrations WHERE app='db' ORDER BY id DESC LIMIT 5;" 2>/dev/null

  hr "Total applied 'db' migrations"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT count(*) FROM django_migrations WHERE app='db';" 2>/dev/null

  hr "Scale of the data"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT 'users', count(*) FROM users
     UNION ALL SELECT 'workspaces', count(*) FROM workspaces
     UNION ALL SELECT 'projects', count(*) FROM projects
     UNION ALL SELECT 'issues', count(*) FROM issues;" 2>/dev/null
fi

# ---- config that must carry over -----------------------------------------
hr "SECRET_KEY and storage config (from the old env file)"
for f in "$OLD_DIR/.env" "$OLD_DIR/plane.env" "$OLD_DIR/variables.env"; do
  if [ -f "$f" ]; then
    echo "--- $f"
    grep -E '^(SECRET_KEY|USE_MINIO|AWS_S3_ENDPOINT_URL|AWS_S3_BUCKET_NAME|AWS_ACCESS_KEY_ID|WEB_URL|APP_DOMAIN|FILE_SIZE_LIMIT|POSTGRES_)' "$f" 2>/dev/null \
      | sed -E 's/(SECRET_KEY|AWS_ACCESS_KEY_ID|POSTGRES_PASSWORD)=.*/\1=<present, not shown>/'
  fi
done

hr "Encrypted instance config rows (these break if SECRET_KEY changes)"
if [ -n "${DB_CONTAINER:-}" ]; then
  docker exec "$DB_CONTAINER" psql -U "${DB_USER:-plane}" -d "${DB_NAME:-plane}" -tAc \
    "SELECT key FROM instance_configurations WHERE is_encrypted = true ORDER BY key;" 2>/dev/null \
    || echo "(table not present on this version)"
fi

hr "Done"
echo "Nothing was modified. Paste this output back before running migration steps."
