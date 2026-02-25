#!/usr/bin/env bash
# Deploy SHB Docker images on the production server.
# Reads version from dist/.shb-version, loads tar.gz archives into Docker,
# runs Django migrations (force-recreate migrator), then deploys all services.
#
# Usage: ./scripts/deploy-shb.sh [dist-dir] [env-file] [base-compose]
#
# Arguments:
#   dist-dir      Path to the dist/ folder (default: dist)
#   env-file      Path to environment file (default: plane.env)
#   base-compose  Base docker-compose file (default: docker-compose.yaml)
#
# Prerequisites on server:
#   - docker + docker compose v2.1+
#   - dist/ folder with tar.gz archives and .shb-version file
#   - docker-compose.shb.yml override file in working directory
#   - docker-compose.yaml base file (plane-selfhost default) in working directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

DIST_DIR="${1:-dist}"
ENV_FILE="${2:-plane.env}"
BASE_COMPOSE="${3:-docker-compose.yaml}"
OVERRIDE_COMPOSE="docker-compose.shb.yml"
COMPOSE_CMD="docker compose --env-file ${ENV_FILE} -f ${BASE_COMPOSE} -f ${OVERRIDE_COMPOSE}"

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose v2 not found"; exit 1; }

[ -d "${DIST_DIR}" ]       || { echo "ERROR: dist dir '${DIST_DIR}' not found. Transfer dist/ from build machine first."; exit 1; }
[ -f "${BASE_COMPOSE}" ]   || { echo "ERROR: ${BASE_COMPOSE} not found in $(pwd)"; exit 1; }
[ -f "${OVERRIDE_COMPOSE}" ] || { echo "ERROR: ${OVERRIDE_COMPOSE} not found. Transfer it from build machine first."; exit 1; }

# ── Read version from manifest ────────────────────────────────────────────────
VERSION_FILE="${DIST_DIR}/.shb-version"
[ -f "${VERSION_FILE}" ] || {
  echo "ERROR: ${VERSION_FILE} not found."
  echo "       Run scripts/build-shb-images.sh on the build machine first."
  exit 1
}
TAG=$(tr -d '[:space:]' < "${VERSION_FILE}")

echo "========================================="
echo " SHB Deploy"
echo "========================================="
echo " Tag     : ${TAG}"
echo " Dist    : ${DIST_DIR}/"
echo " Server  : $(hostname)"
echo "========================================="
echo ""

# ── Step 1: Load Docker images from tar.gz archives ───────────────────────────
echo "[1/5] Loading Docker images ..."
LOADED=0
for TAR in "${DIST_DIR}"/*-"${TAG}".tar.gz; do
  [ -f "${TAR}" ] || continue
  echo "  → $(basename "${TAR}")"
  docker load < "${TAR}"
  LOADED=$((LOADED + 1))
done

[ "${LOADED}" -gt 0 ] || { echo "ERROR: No tar.gz files matching '*-${TAG}.tar.gz' found in ${DIST_DIR}/"; exit 1; }
echo "  ${LOADED} image(s) loaded."
echo ""

# Verify images are available
echo "  Loaded images:"
docker images --filter "reference=makeplane/*:${TAG}" \
  --format "  table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# ── Step 2: Stop conflicting Plane deployments ────────────────────────────────
# Detect any running Plane proxy/web containers from OTHER Docker Compose projects
# that might occupy the same ports (e.g. plane-app from the official installer).
echo "[2/5] Checking for conflicting Plane deployments ..."
CURRENT_PROJECT=$(${COMPOSE_CMD} config --format json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))" 2>/dev/null || echo "")

CONFLICTS=$(docker ps --filter "ancestor=artifacts.plane.so/makeplane/plane-proxy" \
                       --filter "ancestor=makeplane/plane-proxy" \
                       --format '{{.ID}} {{index .Labels "com.docker.compose.project"}} {{index .Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null || true)

STOPPED_PROJECTS=()
while IFS= read -r line; do
  [ -z "${line}" ] && continue
  CID=$(echo "${line}" | awk '{print $1}')
  CPROJECT=$(echo "${line}" | awk '{print $2}')
  CDIR=$(echo "${line}" | awk '{print $3}')

  # Skip containers belonging to our own compose project
  if [ -n "${CURRENT_PROJECT}" ] && [ "${CPROJECT}" = "${CURRENT_PROJECT}" ]; then
    continue
  fi

  # Check if we already stopped this project
  for sp in "${STOPPED_PROJECTS[@]+"${STOPPED_PROJECTS[@]}"}"; do
    [ "${sp}" = "${CPROJECT}" ] && continue 2
  done

  echo "  ⚠ Found conflicting deployment: project='${CPROJECT}' dir='${CDIR}'"
  if [ -n "${CDIR}" ] && [ -d "${CDIR}" ]; then
    echo "    → Stopping project '${CPROJECT}' via docker compose down ..."
    (cd "${CDIR}" && docker compose -p "${CPROJECT}" down --remove-orphans 2>&1 | sed 's/^/    /')
    STOPPED_PROJECTS+=("${CPROJECT}")
  else
    echo "    → Stopping container ${CID} directly ..."
    docker stop "${CID}" 2>/dev/null || true
  fi
done <<< "${CONFLICTS}"

if [ ${#STOPPED_PROJECTS[@]} -eq 0 ] && [ -z "$(echo "${CONFLICTS}" | tr -d '[:space:]')" ]; then
  echo "  ✓ No conflicting deployments found."
else
  echo "  ✓ Conflicting deployments stopped."
fi
echo ""

# ── Step 3: Run Django migrations ────────────────────────────────────────────
# Force-recreate ensures migrator always runs even if container previously exited.
echo "[3/5] Running Django migrations ..."
${COMPOSE_CMD} up -d migrator --force-recreate --no-build

echo "  Waiting for migrator to complete ..."
if ! ${COMPOSE_CMD} wait migrator; then
  echo "ERROR: Migration failed. Aborting deploy to protect data integrity."
  echo "       Check logs: docker compose -f ${BASE_COMPOSE} -f ${OVERRIDE_COMPOSE} logs migrator"
  exit 1
fi

echo "  Migrations complete (exit 0)."
echo ""

# ── Step 4: Deploy all services ───────────────────────────────────────────────
# --force-recreate: buộc tái tạo containers dù config không đổi → dùng image SHB mới thay image gốc
echo "[4/5] Deploying all services (force-recreating containers to switch to SHB images) ..."
${COMPOSE_CMD} up -d --no-build --force-recreate
echo ""

# ── Step 5: Verify health ─────────────────────────────────────────────────────
echo "[5/5] Service status:"
${COMPOSE_CMD} ps
echo ""

echo "========================================="
echo " Deploy Complete — Tag: ${TAG}"
echo "========================================="
echo ""
echo "Useful commands:"
echo "  View logs  : ${COMPOSE_CMD} logs -f [service]"
echo "  Status     : ${COMPOSE_CMD} ps"
echo "  Rollback   : docker compose -f ${BASE_COMPOSE} up -d"
echo ""
