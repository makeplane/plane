#!/usr/bin/env bash
# Assemble a self-contained deploy package at ./deploy/
# Ready to scp INTO the server's existing plane-selfhost/plane-app/ directory.
#
# Usage: ./scripts/prepare-deploy-package.sh
#
# Produces:
#   deploy/
#   ├── docker-compose.shb.yml   ← SHB image override (applied on top of server's docker-compose.yaml)
#   ├── scripts/
#   │   └── deploy-shb.sh
#   └── dist/
#       ├── .shb-version
#       └── plane-*-shb_v*.tar.gz  (6 images: frontend, admin, space, live, backend, proxy)
#
# NOTE: The base docker-compose.yaml is NOT included — it must already exist on the server
#       (installed via plane-selfhost). SCP deploy/* into the plane-app/ directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

DEPLOY_DIR="deploy"

# ── Preflight checks ──────────────────────────────────────────────────────────
[ -f "dist/.shb-version" ]        || { echo "ERROR: dist/.shb-version not found. Run build-shb-images.sh first."; exit 1; }
[ -f "docker-compose.shb.yml" ]   || { echo "ERROR: docker-compose.shb.yml not found. Run build-shb-images.sh first."; exit 1; }

TAG=$(tr -d '[:space:]' < dist/.shb-version)

# Check all 6 tar.gz exist and are non-empty
MISSING=0
for NAME in plane-frontend plane-admin plane-space plane-live plane-backend plane-proxy; do
  FILE="dist/${NAME}-${TAG}.tar.gz"
  if [ ! -f "${FILE}" ]; then
    echo "  MISSING : ${FILE}"
    MISSING=1
  elif [ "$(wc -c < "${FILE}")" -lt 1000 ]; then
    echo "  INVALID : ${FILE} (file too small — likely a failed build)"
    MISSING=1
  else
    echo "  OK      : ${FILE} ($(du -sh "${FILE}" | cut -f1))"
  fi
done

if [ "${MISSING}" -eq 1 ]; then
  echo ""
  echo "ERROR: Some images are missing or invalid."
  echo "       Re-run build-shb-images.sh (or rebuild individual images) then retry."
  exit 1
fi

# ── Assemble deploy/ folder ───────────────────────────────────────────────────
echo ""
echo "Assembling ${DEPLOY_DIR}/ ..."

rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}/scripts"
mkdir -p "${DEPLOY_DIR}/dist"

cp docker-compose.shb.yml      "${DEPLOY_DIR}/docker-compose.shb.yml"
cp scripts/deploy-shb.sh       "${DEPLOY_DIR}/scripts/deploy-shb.sh"
chmod +x                       "${DEPLOY_DIR}/scripts/deploy-shb.sh"
cp dist/.shb-version           "${DEPLOY_DIR}/dist/.shb-version"

for NAME in plane-frontend plane-admin plane-space plane-live plane-backend plane-proxy; do
  cp "dist/${NAME}-${TAG}.tar.gz" "${DEPLOY_DIR}/dist/"
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo " Deploy package ready — Tag: ${TAG}"
echo "========================================="
echo ""
echo "Folder structure:"
find "${DEPLOY_DIR}" -not -name "*.tar.gz" | sort | sed 's|[^/]*/|  |g'
echo "  dist/*.tar.gz  ($(du -sh "${DEPLOY_DIR}/dist/" | cut -f1) total)"
echo ""
echo "Transfer to server (INTO the plane-selfhost/plane-app/ directory):"
echo "  scp -r ${DEPLOY_DIR}/* user@server:/path/to/plane-selfhost/plane-app/"
echo ""
echo "Then on server:"
echo "  cd /path/to/plane-selfhost/plane-app"
echo "  chmod +x ./scripts/deploy-shb.sh"
echo "  ./scripts/deploy-shb.sh"
echo ""
