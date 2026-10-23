#!/usr/bin/env bash
# One-time cutover: move data from the old Docker (Portainer "plane") stack into the
# native install, then bring the native site up on :3356.
#
# Usage (as root, after setup-host.sh): sudo bash deployments/native/import-data.sh
#
# Old Plane-* containers are only stopped (restart policy set to "no"), never removed,
# and /volume1/docker/plane is only read, so rollback-to-docker.sh can revert.
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }

ROOT=/opt/plane
OLD_UPLOADS=/volume1/docker/plane/uploads
OLD_APP="Plane-PROXY Plane-FRONT Plane-SPACE Plane-ADMIN Plane-LIVE Plane-BACK Plane-WORKER Plane-BEAT Plane-MIGRATOR"
OLD_INFRA="Plane-DB Plane-MINIO Plane-REDIS Plane-RABBITMQ"
DUMP=$ROOT/backups/plane-cutover-$(date +%Y%m%d-%H%M%S).dump

log() { echo; echo "== $*"; }
set -a; . $ROOT/shared/api.env; set +a

log "Fetching production and checking the release is pre-built"
sudo -u plane git -C $ROOT/repo.git fetch --quiet origin +refs/heads/production:refs/remotes/origin/production
SHA=$(sudo -u plane git -C $ROOT/repo.git rev-parse refs/remotes/origin/production)
[[ -f $ROOT/releases/$SHA/.built ]] || echo "WARN: $SHA not pre-built; the build will run during downtime"

log "Native database must be empty"
TABLES=$(sudo -u postgres psql -d "$POSTGRES_DB" -Atc "select count(*) from pg_tables where schemaname='public'")
[[ "$TABLES" == 0 ]] || { echo "ERROR: native database '$POSTGRES_DB' already has $TABLES tables, refusing" >&2; exit 1; }

log "Stopping old app containers (downtime starts)"
docker stop $OLD_APP >/dev/null || true

log "Final dump from the old database"
[[ "$(docker inspect -f '{{.State.Running}}' Plane-DB)" == true ]] || docker start Plane-DB >/dev/null
until docker exec Plane-DB pg_isready -q -U planeuser -d plane; do sleep 2; done
docker exec Plane-DB sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$DUMP"
chown plane:plane "$DUMP"
ls -lh "$DUMP"

log "Stopping old infra and disabling restarts of all old containers"
docker stop $OLD_INFRA >/dev/null || true
docker update --restart=no $OLD_APP $OLD_INFRA >/dev/null

log "Restoring into native PostgreSQL 18"
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error "$DUMP"

log "Uploads"
if [[ -n "$(ls -A "$OLD_UPLOADS" 2>/dev/null)" ]]; then
  systemctl stop silo
  find /var/lib/silo/data -mindepth 1 -delete
  cp -a "$OLD_UPLOADS"/. /var/lib/silo/data/
  chown -R silo:silo /var/lib/silo/data
  systemctl start silo
  du -sh /var/lib/silo/data
else
  echo "old uploads dir is empty, nothing to copy"
fi

log "Starting Caddy on :3356"
systemctl restart caddy

log "Deploying $SHA (migrate, switch, start services)"
sudo -u plane $ROOT/bin/deploy "$SHA" --initial

systemctl --no-pager --lines=0 status caddy silo postgresql redis-server rabbitmq-server plane.target \
  plane-api plane-worker plane-beat plane-space plane-live | grep -E '^●|Active:'
echo
echo "Cutover done. Old data dump: $DUMP"
