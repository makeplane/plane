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
#
# Optional:
#   PACKAGE_NAME          Registry package name (default: plane-shb-release)
#   DIST_DIR              Source dist directory   (default: dist)
#   TAG_REF               Git ref for tag target (default: develop for dev/*, preview for prod/*)

set -euo pipefail

on_error() {
  local line="$1" cmd="$2"
  echo "ERROR: Command failed at line ${line}: ${cmd}" >&2
}
trap 'on_error ${LINENO} "${BASH_COMMAND}"' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

GITLAB_URL="${GITLAB_URL:-${CI_SERVER_URL:-}}"

for VAR in GITLAB_URL CI_PROJECT_ID GITLAB_PUBLISH_TOKEN SHB_VERSION RELEASE_TAG; do
  [ -n "${!VAR:-}" ] || { echo "ERROR: ${VAR} is required but not set"; exit 1; }
done

PACKAGE_NAME="${PACKAGE_NAME:-plane-shb-release}"
DIST_DIR="${DIST_DIR:-dist}"
PKG_VERSION=$(echo "${RELEASE_TAG}" | sed 's|.*/||')
ARCHIVE_NAME="${PACKAGE_NAME}-${PKG_VERSION}.zip"
CHECKSUMS_FILE="${PACKAGE_NAME}-${PKG_VERSION}.SHA256SUMS"
STAGE_DIR="release-stage-${SHB_VERSION}"
API_BASE="${GITLAB_URL}/api/v4/projects/${CI_PROJECT_ID}"
PKG_BASE="${API_BASE}/packages/generic/${PACKAGE_NAME}/${PKG_VERSION}"
TAG_REF="${TAG_REF:-}"

if [ -z "${TAG_REF}" ]; then
  case "${RELEASE_TAG}" in
    dev/*) TAG_REF="develop" ;;
    prod/*) TAG_REF="preview" ;;
    *) echo "ERROR: RELEASE_TAG must start with dev/ or prod/"; exit 1 ;;
  esac
fi

split_http_response() {
  local response="$1"
  local http body
  if [[ "${response}" == *$'\n'* ]]; then
    http="${response##*$'\n'}"
    body="${response%$'\n'*}"
  else
    http="${response}"
    body=""
  fi
  printf '%s\n%s\n' "${http}" "${body}"
}

ensure_release_asset_link() {
  local link_response link_http link_body
  link_response=$(curl -s -w "\n%{http_code}" --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --data-urlencode "name=Release Package" \
    --data-urlencode "url=${PACKAGE_URL}" \
    --data-urlencode "link_type=other" \
    "${API_BASE}/releases/${TAG_ENCODED}/assets/links")
  link_http=$(printf '%s' "${link_response##*$'\n'}")
  link_body=$(printf '%s' "${link_response%$'\n'*}")

  case "${link_http}" in
    200|201) echo "  ✓ Release asset link created" ;;
    409|422) echo "  Release asset link already exists — skipping." ;;
    404)     echo "ERROR: Release not found while creating asset link"; exit 1 ;;
    *)       echo "ERROR: Release asset link failed (HTTP ${link_http}): ${link_body}"; exit 1 ;;
  esac
}

echo "========================================="
echo " Publish Release Package"
echo "========================================="
echo " Version    : ${SHB_VERSION}"
echo " Release tag: ${RELEASE_TAG}"
echo " Pkg version: ${PKG_VERSION}"
echo "========================================="

# ── Validate tag target ref exists in GitLab project ──────────────────────────
echo "[0/5] Validating tag target ref ${TAG_REF} ..."
REF_ENCODED=$(printf '%s' "${TAG_REF}" | sed 's|/|%2F|g; s| |%20|g')
REF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${API_BASE}/repository/branches/${REF_ENCODED}")

case "${REF_STATUS}" in
  200)
    echo "  ✓ Ref exists in project"
    ;;
  401)
    echo "ERROR: Unauthorized — GITLAB_PUBLISH_TOKEN missing required access (api scope)"
    exit 1
    ;;
  404)
    echo "ERROR: TAG_REF '${TAG_REF}' does not exist in project ${CI_PROJECT_ID}."
    echo "  Set TAG_REF in upload-release.env to an existing branch or commit ref."
    exit 1
    ;;
  *)
    echo "ERROR: Unable to validate ref '${TAG_REF}' (HTTP ${REF_STATUS})"
    exit 1
    ;;
esac

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
# Always cd into parent dir before zipping so paths inside the archive use
# forward slashes regardless of OS (prevents backslash paths on Windows Git Bash).
# Tries: zip → 7z → PowerShell
zip_create() {
  local archive="$1" source="$2"
  local abs_archive parent base
  abs_archive="$(cd "$(dirname "${archive}")" 2>/dev/null && pwd)/$(basename "${archive}")"
  parent="$(dirname "${source}")"
  base="$(basename "${source}")"
  if command -v zip >/dev/null 2>&1; then
    (cd "${parent}" && zip -r "${abs_archive}" "${base}/")
  elif command -v 7z >/dev/null 2>&1; then
    (cd "${parent}" && 7z a -tzip "${abs_archive}" "${base}/" > /dev/null)
  elif command -v powershell.exe >/dev/null 2>&1; then
    local abs_src abs_dst
    abs_src=$(cygpath -w "$(realpath "${source}")" 2>/dev/null || echo "${source}")
    abs_dst=$(cygpath -w "${abs_archive}" 2>/dev/null || echo "${abs_archive}")
    powershell.exe -NoProfile -Command \
      "Compress-Archive -Path '${abs_src}\\*' -DestinationPath '${abs_dst}' -Force"
  else
    echo "ERROR: No zip tool found."
    echo "       Install one of: zip (Git Bash: pacman -S zip), 7-Zip, or ensure PowerShell is in PATH."
    exit 1
  fi
}

# ── Assemble package ──────────────────────────────────────────────────────────
echo "[1/5] Assembling release package ..."
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
COMMIT_REF=${TAG_REF}
TAG_REF=${TAG_REF}
TARGET_ARCH=linux/amd64
IMAGES=makeplane/plane-frontend:${SHB_VERSION},makeplane/plane-admin:${SHB_VERSION},makeplane/plane-backend:${SHB_VERSION}
MANIFEST

zip_create "${ARCHIVE_NAME}" "${STAGE_DIR}"
ARCHIVE_SHA256=$(sha256sum "${ARCHIVE_NAME}" | awk '{print $1}')
echo "${ARCHIVE_SHA256}  ${ARCHIVE_NAME}" > "${CHECKSUMS_FILE}"
rm -rf "${STAGE_DIR}"
echo "  SHA256: ${ARCHIVE_SHA256}"

# ── Upload to Package Registry (idempotent) ───────────────────────────────────
echo "[2/5] Uploading to Package Registry ..."
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
echo "[3/5] Creating git tag ${RELEASE_TAG} ..."
TAG_ENCODED=$(echo "${RELEASE_TAG}" | sed 's|/|%2F|g; s| |%20|g')
TAG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${API_BASE}/repository/tags/${TAG_ENCODED}")

if [ "${TAG_STATUS}" = "200" ]; then
  echo "  Tag already exists — skipping."
else
  TAG_RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "{\"tag_name\":\"${RELEASE_TAG}\",\"ref\":\"${TAG_REF}\",\"message\":\"Release ${RELEASE_TAG}\"}" \
    "${API_BASE}/repository/tags")
  TAG_PARTS=$(split_http_response "${TAG_RESPONSE}")
  TAG_HTTP=$(printf '%s' "${TAG_PARTS}" | sed -n '1p')
  TAG_BODY=$(printf '%s' "${TAG_PARTS}" | sed -n '2,$p')
  case "${TAG_HTTP}" in
    200|201) echo "  ✓ Tag created" ;;
    409|422) echo "  Tag already exists — skipping." ;;
    401)     echo "ERROR: Unauthorized — GITLAB_PUBLISH_TOKEN missing 'api' scope"; exit 1 ;;
    404)     echo "ERROR: Project not found — check CI_PROJECT_ID (${CI_PROJECT_ID})"; exit 1 ;;
    *)       echo "ERROR: Tag creation failed (HTTP ${TAG_HTTP}): ${TAG_BODY}"; exit 1 ;;
  esac
fi

# ── Create/update GitLab Release with SHA256 in description ───────────────────
# SHA256 written here is the integrity anchor read by deploy-from-internal-gitlab-release.sh
# via the Releases API — independent of the package registry asset.
echo "[4/5] Creating GitLab Release ..."

# Plain-ASCII single-line description for max GitLab API compatibility.
RELEASE_DESC="Release ${SHB_VERSION} (ref ${TAG_REF}). Package: ${PACKAGE_URL}. SHA256: ${ARCHIVE_SHA256}"

RELEASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
  "${API_BASE}/releases/${TAG_ENCODED}")

if [ "${RELEASE_STATUS}" = "200" ]; then
  REL_RESPONSE=$(curl -s -w "\n%{http_code}" --request PUT \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --data-urlencode "description=${RELEASE_DESC}" \
    "${API_BASE}/releases/${TAG_ENCODED}")
  REL_PARTS=$(split_http_response "${REL_RESPONSE}")
  REL_HTTP=$(printf '%s' "${REL_PARTS}" | sed -n '1p')
  REL_BODY=$(printf '%s' "${REL_PARTS}" | sed -n '2,$p')
  if [ "${REL_HTTP}" != "200" ]; then
    echo "ERROR: Release update failed (HTTP ${REL_HTTP})"
    echo "  endpoint : ${API_BASE}/releases/${TAG_ENCODED}"
    echo "  body     : ${REL_BODY}"
    exit 1
  fi
  echo "  ✓ Release updated"
  ensure_release_asset_link
else
  REL_RESPONSE=$(curl -s -w "\n%{http_code}" --request POST \
    --header "PRIVATE-TOKEN: ${GITLAB_PUBLISH_TOKEN}" \
    --data-urlencode "tag_name=${RELEASE_TAG}" \
    --data-urlencode "description=${RELEASE_DESC}" \
    "${API_BASE}/releases")
  REL_PARTS=$(split_http_response "${REL_RESPONSE}")
  REL_HTTP=$(printf '%s' "${REL_PARTS}" | sed -n '1p')
  REL_BODY=$(printf '%s' "${REL_PARTS}" | sed -n '2,$p')
  if [ "${REL_HTTP}" != "200" ] && [ "${REL_HTTP}" != "201" ]; then
    echo "ERROR: Release creation failed (HTTP ${REL_HTTP})"
    echo "  tag_name : ${RELEASE_TAG}"
    echo "  endpoint : ${API_BASE}/releases"
    echo "  body     : ${REL_BODY}"
    exit 1
  fi
  echo "  ✓ Release created"
  ensure_release_asset_link
fi

echo "[5/5] Cleaning up ..."
rm -f "${ARCHIVE_NAME}" "${CHECKSUMS_FILE}"

echo ""
echo "========================================="
echo " Published: ${RELEASE_TAG}"
echo " SHA256   : ${ARCHIVE_SHA256}"
echo " URL      : ${PACKAGE_URL}"
echo "========================================="
