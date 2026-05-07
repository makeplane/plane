#!/usr/bin/env bash
# Publish a SHB release package to internal GitLab Generic Package Registry.
# Assembles the 3-image zip, uploads it, creates a GitLab Release with SHA256
# embedded in the description (second independent integrity anchor).
#
# Required env vars (CI variables or sourced file):
#   GITLAB_URL            Internal GitLab base URL (e.g. https://gitlab.internal)
#   CI_PROJECT_ID         GitLab project ID
#   GITLAB_PUBLISH_TOKEN  Project access token — write_package_registry + api scopes
#                         (NOT api-only — separate from the deploy read token)
#   SHB_VERSION           Package version string (e.g. shb_v1.2.0)
#   RELEASE_TAG           Git tag to create (dev/shb_v1.2.0-build.5 or prod/shb_v1.2.0)
#   CI_COMMIT_SHA         Full commit SHA
#
# Optional:
#   PACKAGE_NAME          Registry package name (default: plane-shb-release)
#   DIST_DIR              Source dist directory   (default: dist)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

for VAR in GITLAB_URL CI_PROJECT_ID GITLAB_PUBLISH_TOKEN SHB_VERSION RELEASE_TAG CI_COMMIT_SHA; do
  [ -n "${!VAR:-}" ] || { echo "ERROR: ${VAR} is required but not set"; exit 1; }
done

PACKAGE_NAME="${PACKAGE_NAME:-plane-shb-release}"
DIST_DIR="${DIST_DIR:-dist}"
ARCHIVE_NAME="${PACKAGE_NAME}-${SHB_VERSION}.zip"
CHECKSUMS_FILE="${PACKAGE_NAME}-${SHB_VERSION}.SHA256SUMS"
STAGE_DIR="release-stage-${SHB_VERSION}"
API_BASE="${GITLAB_URL}/api/v4/projects/${CI_PROJECT_ID}"
# Package version strips build suffix for registry grouping (dev/prod share version slot)
PKG_VERSION=$(echo "${RELEASE_TAG}" | sed 's|.*/||; s|-build\.[0-9]*||')
PKG_BASE="${API_BASE}/packages/generic/${PACKAGE_NAME}/${PKG_VERSION}"

echo "========================================="
echo " Publish Release Package"
echo "========================================="
echo " Version    : ${SHB_VERSION}"
echo " Release tag: ${RELEASE_TAG}"
echo " Pkg version: ${PKG_VERSION}"
echo "========================================="

# ── Preflight ─────────────────────────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl not found"; exit 1; }
[ -f "${DIST_DIR}/.shb-version" ] || { echo "ERROR: ${DIST_DIR}/.shb-version not found — run builds first"; exit 1; }

# sha256sum: Linux/Windows Git Bash use sha256sum; macOS uses shasum -a 256
if ! command -v sha256sum >/dev/null 2>&1; then
  if command -v shasum >/dev/null 2>&1; then
    sha256sum() { shasum -a 256 "$@"; }
  else
    echo "ERROR: sha256sum / shasum not found"; exit 1
  fi
fi

# zip_create <archive.zip> <source-dir>
# Tries: zip (Linux/macOS/Git Bash with zip) → 7z (Windows 7-Zip) → PowerShell (Windows fallback)
zip_create() {
  local archive="$1" source="$2"
  if command -v zip >/dev/null 2>&1; then
    zip -r "${archive}" "${source}/"
  elif command -v 7z >/dev/null 2>&1; then
    7z a -tzip "${archive}" "${source}/" > /dev/null
  elif command -v powershell.exe >/dev/null 2>&1; then
    local abs_src abs_dst
    abs_src=$(cygpath -w "$(realpath "${source}")" 2>/dev/null || echo "${source}")
    abs_dst=$(cygpath -w "$(realpath ".")\\$(basename "${archive}")" 2>/dev/null || echo "${archive}")
    powershell.exe -NoProfile -Command \
      "Compress-Archive -Path '${abs_src}\\*' -DestinationPath '${abs_dst}' -Force"
  else
    echo "ERROR: No zip tool found."
    echo "       Install one of: zip (Git Bash: pacman -S zip), 7-Zip, or ensure PowerShell is in PATH."
    exit 1
  fi
}

# ── Architecture verification ─────────────────────────────────────────────────
echo "[1/6] Verifying image architecture ..."
bash "${SCRIPT_DIR}/verify-release-package-architecture.sh" "${DIST_DIR}"

# ── Assemble package ──────────────────────────────────────────────────────────
echo "[2/6] Assembling release package ..."
rm -rf "${STAGE_DIR}"
mkdir -p "${STAGE_DIR}/dist" "${STAGE_DIR}/scripts"

cp "${DIST_DIR}/.shb-version" "${STAGE_DIR}/dist/"
cp scripts/deploy-shb.sh "${STAGE_DIR}/scripts/"
chmod +x "${STAGE_DIR}/scripts/deploy-shb.sh"

for IMG in plane-frontend plane-admin plane-backend; do
  FILE="${DIST_DIR}/${IMG}-${SHB_VERSION}.tar.gz"
  [ -f "${FILE}" ] || { echo "ERROR: ${FILE} not found"; exit 1; }
  cp "${FILE}" "${STAGE_DIR}/dist/"
done

cat > "${STAGE_DIR}/docker-compose.shb.yml" <<COMPOSE
# Auto-generated — ${RELEASE_TAG}
services:
  web:
    image: makeplane/plane-frontend:${SHB_VERSION}
  admin:
    image: makeplane/plane-admin:${SHB_VERSION}
  api:
    image: makeplane/plane-backend:${SHB_VERSION}
  worker:
    image: makeplane/plane-backend:${SHB_VERSION}
  beat-worker:
    image: makeplane/plane-backend:${SHB_VERSION}
  migrator:
    image: makeplane/plane-backend:${SHB_VERSION}
COMPOSE

cat > "${STAGE_DIR}/MANIFEST" <<MANIFEST
VERSION=${SHB_VERSION}
RELEASE_TAG=${RELEASE_TAG}
BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
COMMIT=${CI_COMMIT_SHA}
TARGET_ARCH=linux/amd64
IMAGES=makeplane/plane-frontend:${SHB_VERSION},makeplane/plane-admin:${SHB_VERSION},makeplane/plane-backend:${SHB_VERSION}
MANIFEST

zip_create "${ARCHIVE_NAME}" "${STAGE_DIR}"
ARCHIVE_SHA256=$(sha256sum "${ARCHIVE_NAME}" | awk '{print $1}')
echo "${ARCHIVE_SHA256}  ${ARCHIVE_NAME}" > "${CHECKSUMS_FILE}"
rm -rf "${STAGE_DIR}"
echo "  SHA256: ${ARCHIVE_SHA256}"

# ── Upload to Package Registry (idempotent) ───────────────────────────────────
echo "[3/6] Uploading to Package Registry ..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${PKG_BASE}/${ARCHIVE_NAME}")

if [ "${HTTP_STATUS}" = "200" ]; then
  REMOTE_SHA=$(curl -sf --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    "${PKG_BASE}/${CHECKSUMS_FILE}" 2>/dev/null | awk '{print $1}' || echo "")
  if [ "${REMOTE_SHA}" = "${ARCHIVE_SHA256}" ]; then
    echo "  Package ${PKG_VERSION} already published with matching SHA256 — skipping upload (idempotent)."
  else
    echo "ERROR: Package ${PKG_VERSION} already exists with different SHA256."
    echo "  Remote: ${REMOTE_SHA}  Local: ${ARCHIVE_SHA256}"
    exit 1
  fi
else
  curl --fail -s --request PUT \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --upload-file "${ARCHIVE_NAME}" "${PKG_BASE}/${ARCHIVE_NAME}"
  echo "  ✓ Uploaded ${ARCHIVE_NAME}"
  curl --fail -s --request PUT \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --upload-file "${CHECKSUMS_FILE}" "${PKG_BASE}/${CHECKSUMS_FILE}"
  echo "  ✓ Uploaded ${CHECKSUMS_FILE}"
fi

PACKAGE_URL="${PKG_BASE}/${ARCHIVE_NAME}"

# ── Create git tag ────────────────────────────────────────────────────────────
echo "[4/6] Creating git tag ${RELEASE_TAG} ..."
TAG_ENCODED=$(echo "${RELEASE_TAG}" | sed 's|/|%2F|g; s| |%20|g')
TAG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${API_BASE}/repository/tags/${TAG_ENCODED}")

if [ "${TAG_STATUS}" = "200" ]; then
  echo "  Tag already exists."
else
  curl --fail -s --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --data-urlencode "tag_name=${RELEASE_TAG}" \
    --data-urlencode "ref=${CI_COMMIT_SHA}" \
    --data-urlencode "message=Release ${RELEASE_TAG}" \
    "${API_BASE}/repository/tags" > /dev/null
  echo "  ✓ Tag created"
fi

# ── Create/update GitLab Release with SHA256 in description ───────────────────
# SHA256 written here is the integrity anchor read by deploy-from-internal-gitlab-release.sh
# via the Releases API — independent of the package registry asset.
echo "[5/6] Creating GitLab Release ..."
RELEASE_DESC="Release ${SHB_VERSION} — commit ${CI_COMMIT_SHA:0:8}

Package: ${PACKAGE_URL}

SHA256: ${ARCHIVE_SHA256}"

RELEASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${API_BASE}/releases/${TAG_ENCODED}")

if [ "${RELEASE_STATUS}" = "200" ]; then
  # Update description only (preserve existing asset links)
  DESC_JSON=$(printf '%s' "${RELEASE_DESC}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
  curl --fail -s --request PUT \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"description\":${DESC_JSON}}" \
    "${API_BASE}/releases/${TAG_ENCODED}" > /dev/null
  echo "  ✓ Release updated"
else
  DESC_JSON=$(printf '%s' "${RELEASE_DESC}" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
  ASSET_JSON="{\"links\":[{\"name\":\"Release Package\",\"url\":\"${PACKAGE_URL}\",\"link_type\":\"package\"}]}"
  curl --fail -s --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"name\":\"${RELEASE_TAG}\",\"tag_name\":\"${RELEASE_TAG}\",\"description\":${DESC_JSON},\"assets\":${ASSET_JSON}}" \
    "${API_BASE}/releases" > /dev/null
  echo "  ✓ Release created"
fi

echo "[6/6] Cleaning up ..."
rm -f "${ARCHIVE_NAME}" "${CHECKSUMS_FILE}"

echo ""
echo "========================================="
echo " Published: ${RELEASE_TAG}"
echo " SHA256   : ${ARCHIVE_SHA256}"
echo " URL      : ${PACKAGE_URL}"
echo "========================================="
