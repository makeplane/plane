#!/usr/bin/env bash
# Build SHB Docker images for linux/amd64 and export as tar.gz archives.
# Also generates docker-compose.shb.yml override at repo root.
#
# Usage: ./scripts/build-shb-images.sh
#
# Produces:
#   dist/.shb-version                    ← version tag used (e.g. shb_v1.2.0)
#   dist/plane-frontend-shb_v*.tar.gz
#   dist/plane-admin-shb_v*.tar.gz
#   dist/plane-space-shb_v*.tar.gz
#   dist/plane-live-shb_v*.tar.gz
#   dist/plane-backend-shb_v*.tar.gz
#   docker-compose.shb.yml               ← override file for production server

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

DIST_DIR="dist"

usage() {
  cat <<'EOF'
Usage: ./scripts/build-shb-images.sh [options]

Options:
  -a, --all             Build all images
  -i, --images <list>   Images to build: all or comma-separated services
                        (web,admin,space,live,api,proxy)
  --list-images         Print available service options and exit
  -h, --help            Show help
EOF
}

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1    || { echo "ERROR: docker not found"; exit 1; }
command -v node >/dev/null 2>&1      || { echo "ERROR: node not found (required for version detection)"; exit 1; }
docker buildx version >/dev/null 2>&1 || { echo "ERROR: docker buildx not available. Enable Docker Desktop buildx."; exit 1; }

# ── Auto-detect version from package.json ─────────────────────────────────────
VERSION=$(node -p "require('./package.json').version")
TAG="shb_v${VERSION}"

echo "========================================="
echo " SHB Docker Build"
echo "========================================="
echo " Version  : ${VERSION}"
echo " Tag      : ${TAG}"
echo " Platform : linux/amd64"
echo " Output   : ${DIST_DIR}/"
echo "========================================="
echo ""

mkdir -p "${DIST_DIR}"

# ── Image build definitions: NAME | DOCKERFILE | BUILD_CONTEXT ───────────────
# Each entry is a colon-separated tuple stored in an indexed array.
IMAGES=(
  "web:plane-frontend:apps/web/Dockerfile.web:."
  "admin:plane-admin:apps/admin/Dockerfile.admin:."
  "space:plane-space:apps/space/Dockerfile.space:."
  "live:plane-live:apps/live/Dockerfile.live:."
  "api:plane-backend:apps/api/Dockerfile.api:./apps/api"
  "proxy:plane-proxy:apps/proxy/Dockerfile.ce:./apps/proxy"
)

AVAILABLE_SERVICES=("web" "admin" "space" "live" "api" "proxy")

for arg in "$@"; do
  case "$arg" in
    -a|--all)
      ;;
    --list-images)
      echo "Available image options: ${AVAILABLE_SERVICES[*]}"
      exit 0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
  esac
done

IMAGES_ARG=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -a|--all)
      IMAGES_ARG="all"
      shift
      ;;
    -i|--images)
      shift
      [ "$#" -gt 0 ] || { echo "ERROR: --images requires a value"; usage; exit 1; }
      IMAGES_ARG="$1"
      shift
      ;;
    --list-images|-h|--help)
      shift
      ;;
    *)
      echo "ERROR: Unknown option '$1'"
      usage
      exit 1
      ;;
  esac
done

if [ -z "${IMAGES_ARG}" ]; then
  echo "Available image options: ${AVAILABLE_SERVICES[*]}"
  read -r -p "Select images to build (all or comma-separated, default: all): " IMAGES_ARG
fi

IMAGES_ARG="${IMAGES_ARG:-all}"
IMAGES_ARG="${IMAGES_ARG//[[:space:]]/}"

SELECTED_IMAGES=()
if [ "${IMAGES_ARG}" = "all" ]; then
  SELECTED_IMAGES=("${IMAGES[@]}")
else
  IFS=',' read -r -a REQUESTED_SERVICES <<< "${IMAGES_ARG}"
  [ "${#REQUESTED_SERVICES[@]}" -gt 0 ] || { echo "ERROR: Empty --images value"; exit 1; }

  for service in "${REQUESTED_SERVICES[@]}"; do
    [ -n "${service}" ] || continue
    VALID="false"
    for allowed in "${AVAILABLE_SERVICES[@]}"; do
      if [ "${service}" = "${allowed}" ]; then
        VALID="true"
        break
      fi
    done

    if [ "${VALID}" != "true" ]; then
      echo "ERROR: Invalid image option '${service}'. Valid options: ${AVAILABLE_SERVICES[*]}"
      exit 1
    fi

    for entry in "${IMAGES[@]}"; do
      IFS=':' read -r entry_service _ _ _ <<< "${entry}"
      if [ "${entry_service}" = "${service}" ]; then
        SELECTED_IMAGES+=("${entry}")
        break
      fi
    done
  done
fi

[ "${#SELECTED_IMAGES[@]}" -gt 0 ] || { echo "ERROR: No images selected"; exit 1; }

TOTAL=${#SELECTED_IMAGES[@]}

# ── Build + save loop ─────────────────────────────────────────────────────────
for i in "${!SELECTED_IMAGES[@]}"; do
  IDX=$((i + 1))
  ENTRY="${SELECTED_IMAGES[$i]}"

  # Parse tuple
  IFS=':' read -r SERVICE NAME DOCKERFILE CONTEXT <<< "${ENTRY}"

  IMAGE="makeplane/${NAME}:${TAG}"
  OUTFILE="${DIST_DIR}/${NAME}-${TAG}.tar.gz"

  echo "[${IDX}/${TOTAL}] Building ${IMAGE} ..."
  docker buildx build \
    --platform linux/amd64 \
    --load \
    -f "${DOCKERFILE}" \
    -t "${IMAGE}" \
    "${CONTEXT}"

  echo "[${IDX}/${TOTAL}] Saving → ${OUTFILE} ..."
  docker save "${IMAGE}" | gzip > "${OUTFILE}"
  echo "        Size: $(du -sh "${OUTFILE}" | cut -f1)"
  echo ""
done

# ── Write version manifest ────────────────────────────────────────────────────
echo "${TAG}" > "${DIST_DIR}/.shb-version"
echo "Version manifest written → ${DIST_DIR}/.shb-version"
echo ""

# ── Generate docker-compose.shb.yml override ─────────────────────────────────
{
  cat <<EOF
# Auto-generated by scripts/build-shb-images.sh — do not edit manually.
# Version: ${TAG}
# Transfer this file to the production server alongside dist/ and scripts/deploy-shb.sh
#
# Usage on server:
#   docker compose -f docker-compose.yml -f docker-compose.shb.yml up -d --no-build
#
# Rollback:
#   docker compose -f docker-compose.yml up -d

services:
EOF

  for entry in "${SELECTED_IMAGES[@]}"; do
    IFS=':' read -r service name _ _ <<< "${entry}"

    cat <<EOF
  ${service}:
    image: makeplane/${name}:${TAG}

EOF

    if [ "${service}" = "api" ]; then
      cat <<EOF
  worker:
    image: makeplane/${name}:${TAG}

  beat-worker:
    image: makeplane/${name}:${TAG}

  migrator:
    image: makeplane/${name}:${TAG}

EOF
    fi
  done
} > docker-compose.shb.yml

echo "Override file generated → docker-compose.shb.yml"
echo ""

# ── Final summary ─────────────────────────────────────────────────────────────
echo "========================================="
echo " Build Complete — Tag: ${TAG}"
echo "========================================="
echo " Selected services:"
for entry in "${SELECTED_IMAGES[@]}"; do
  IFS=':' read -r service _ _ _ <<< "${entry}"
  echo "  - ${service}"
done
echo ""
echo "Files in ${DIST_DIR}/:"
ls -lh "${DIST_DIR}/" | grep -v "^total"
echo ""
echo "Next steps:"
echo "  1. Transfer to production server:"
echo "     scp -r ${DIST_DIR}/ docker-compose.shb.yml scripts/deploy-shb.sh user@server:/path/to/plane/"
echo "  2. On server: chmod +x /path/to/plane/scripts/deploy-shb.sh"
echo "  3. On server: cd /path/to/plane && ./scripts/deploy-shb.sh"
echo ""
