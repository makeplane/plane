#!/usr/bin/env bash
# Emergency revert to the old Docker (Portainer "plane") stack.
# Anything written to Plane after the cutover exists only in the native database
# and is NOT carried back. Usage: sudo bash deployments/native/rollback-to-docker.sh
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }

OLD_APP="Plane-BACK Plane-WORKER Plane-BEAT Plane-FRONT Plane-SPACE Plane-ADMIN Plane-LIVE Plane-PROXY"
OLD_INFRA="Plane-DB Plane-MINIO Plane-REDIS Plane-RABBITMQ"

systemctl stop caddy plane.target
docker update --restart=unless-stopped $OLD_INFRA $OLD_APP >/dev/null
docker start $OLD_INFRA >/dev/null
sleep 10
docker start $OLD_APP >/dev/null
docker ps --filter name=Plane- --format '{{.Names}}\t{{.Status}}'
echo "Old stack restarted. Native services are stopped (still enabled at boot: run"
echo "'systemctl disable caddy plane.target' if staying on Docker)."
