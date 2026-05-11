#!/usr/bin/env bash
# Deploy an exact release package from internal GitLab to the local server.
# The runner must already be executing on the target server (no SSH/SCP).
#
# All configuration comes from GitLab CI variables — no server-side env file needed.
#
# Required CI variables (Settings → CI/CD → Variables):
#   PLANE_DIR      Deployment directory — set per environment scope
#
# Built-in CI variables used automatically:
#   CI_SERVER_URL, CI_PROJECT_ID, CI_JOB_TOKEN, CI_COMMIT_TAG, PACKAGE_NAME, RELEASE_TAG
#
# TARGET_ENV is derived from the tag prefix (dev/* → dev, prod/* → prod).

set -euo pipefail

STAGE_DIR="/tmp/plane-release-stage-$$"
trap 'rm -rf "${STAGE_DIR}"' EXIT

# ── Resolve variables from CI environment ─────────────────────────────────────
GITLAB_URL="${CI_SERVER_URL:-}"
PROJECT_ID="${CI_PROJECT_ID:-}"
RELEASE_TAG="${RELEASE_TAG:-${CI_COMMIT_TAG:-}}"

# Derive TARGET_ENV from tag prefix
case "${RELEASE_TAG}" in
  prod/*) TARGET_ENV="prod" ;;
  dev/*)  TARGET_ENV="dev"  ;;
  *)      echo "ERROR: RELEASE_TAG '${RELEASE_TAG}' must start with dev/ or prod/"; exit 1 ;;
esac

# Validate all required vars are present
for VAR in GITLAB_URL PROJECT_ID CI_JOB_TOKEN PACKAGE_NAME PLANE_DIR RELEASE_TAG; do
  [ -n "${!VAR:-}" ] || { echo "ERROR: ${VAR} is not set. Configure it as a GitLab CI variable."; exit 1; }
done

ARCHIVE_DIR="${PLANE_DIR}/archive"
AUDIT_LOG="${PLANE_DIR}/deploy-audit.log"
PKG_VERSION=$(echo "${RELEASE_TAG}" | sed 's|.*/||')
ARCHIVE_NAME="${PACKAGE_NAME}-${PKG_VERSION}.zip"
API_BASE="${GITLAB_URL}/api/v4/projects/${PROJECT_ID}"
TAG_ENCODED=$(echo "${RELEASE_TAG}" | sed 's|/|%2F|g; s| |%20|g')

echo "========================================="
echo " Deploy from GitLab Release"
echo "========================================="
echo " Tag        : ${RELEASE_TAG}"
echo " Environment: ${TARGET_ENV}"
echo " Server     : $(hostname)"
echo "========================================="

# ── Disk space preflight ──────────────────────────────────────────────────────
# Require at least 4 GB free: ~2 GB archive + ~2 GB extraction buffer
NEEDED_MB=4096
AVAIL_MB=$(df -m "${PLANE_DIR}" | awk 'NR==2 {print $4}')
[ "${AVAIL_MB}" -ge "${NEEDED_MB}" ] || {
  echo "ERROR: Insufficient disk space — need ${NEEDED_MB} MB, have ${AVAIL_MB} MB on ${PLANE_DIR}"
  exit 1
}

# ── Fetch Release description (independent SHA256 anchor) ─────────────────────
echo "[1/8] Fetching Release metadata from Releases API ..."
set +x
RELEASE_JSON=$(curl -sf \
  --header "Job-Token: ${CI_JOB_TOKEN}" \
  "${API_BASE}/releases/${TAG_ENCODED}" 2>&1) || {
  echo "ERROR: Failed to fetch Release '${RELEASE_TAG}' from ${GITLAB_URL}"
  exit 1
}
set +x

# Extract SHA256 from release description (written by publish-gitlab-release-package.sh)
EXPECTED_SHA256=$(echo "${RELEASE_JSON}" | \
  grep -oE '"description":"[^"]*"' | \
  grep -oE 'SHA256: [a-f0-9]{64}' | \
  awk '{print $2}' || echo "")
[ -n "${EXPECTED_SHA256}" ] || {
  echo "ERROR: SHA256 not found in Release '${RELEASE_TAG}' description."
  echo "       Ensure the release was published by publish-gitlab-release-package.sh"
  exit 1
}
echo "  Expected SHA256: ${EXPECTED_SHA256}"

# ── Download package ──────────────────────────────────────────────────────────
echo "[2/8] Downloading ${ARCHIVE_NAME} ..."
mkdir -p "${STAGE_DIR}"
PKG_URL="${API_BASE}/packages/generic/${PACKAGE_NAME}/${PKG_VERSION}/${ARCHIVE_NAME}"
set +x
curl -sfS -o "${STAGE_DIR}/${ARCHIVE_NAME}" \
  --header "Job-Token: ${CI_JOB_TOKEN}" \
  "${PKG_URL}"
set +x
echo "  Downloaded: ${STAGE_DIR}/${ARCHIVE_NAME}"

# ── Verify checksum against Release API anchor ────────────────────────────────
echo "[3/8] Verifying checksum ..."
ACTUAL_SHA256=$(sha256sum "${STAGE_DIR}/${ARCHIVE_NAME}" | awk '{print $1}')
[ "${ACTUAL_SHA256}" = "${EXPECTED_SHA256}" ] || {
  echo "ERROR: SHA256 mismatch — archive may be corrupted or substituted"
  echo "  Expected (Release API): ${EXPECTED_SHA256}"
  echo "  Actual   (downloaded) : ${ACTUAL_SHA256}"
  rm -rf "${STAGE_DIR}"
  exit 1
}
echo "  ✓ Checksum verified"

# ── Extract and validate manifest ─────────────────────────────────────────────
echo "[4/8] Extracting package ..."
# Use python3 to extract: normalizes backslash paths from Windows zip tools
python3 - "${STAGE_DIR}/${ARCHIVE_NAME}" "${STAGE_DIR}/pkg" << 'PYEOF'
import zipfile, os, sys
archive, dest = sys.argv[1], sys.argv[2]
os.makedirs(dest, exist_ok=True)
with zipfile.ZipFile(archive) as zf:
    for info in zf.infolist():
        info.filename = info.filename.replace(chr(92), '/')
        if info.filename.endswith('/'):
            os.makedirs(os.path.join(dest, info.filename), exist_ok=True)
        else:
            zf.extract(info, dest)
PYEOF
# Find package dir by locating MANIFEST (skips Mac __MACOSX metadata dirs)
# Depth-agnostic: handles flat zips, single-wrapped zips, and double-nested artifacts.
MANIFEST=$(find "${STAGE_DIR}/pkg" -name MANIFEST -type f ! -path '*__MACOSX*' | head -1)
[ -n "${MANIFEST}" ] && [ -f "${MANIFEST}" ] || {
  echo "ERROR: MANIFEST not found in package — may be corrupt"
  echo "  Extracted contents (up to 4 levels):"
  find "${STAGE_DIR}/pkg" -maxdepth 4 | sed 's/^/    /'
  exit 1
}
PKG_DIR=$(dirname "${MANIFEST}")
MANIFEST_ARCH=$(grep '^TARGET_ARCH=' "${MANIFEST}" | cut -d= -f2)
MANIFEST_IMAGES=$(grep '^IMAGES=' "${MANIFEST}" | cut -d= -f2)
MANIFEST_VERSION=$(grep '^VERSION=' "${MANIFEST}" | cut -d= -f2)

[ "${MANIFEST_ARCH}" = "linux/amd64" ] || {
  echo "ERROR: Package TARGET_ARCH is '${MANIFEST_ARCH}' — expected linux/amd64"
  exit 1
}
echo "  Package: ${MANIFEST_VERSION} (${MANIFEST_ARCH})"

# ── Load all images BEFORE stopping any running containers ────────────────────
echo "[5/8] Loading Docker images ..."
LOADED_COUNT=0
for TAR in "${PKG_DIR}/dist"/*.tar.gz; do
  [ -f "${TAR}" ] || continue
  LOADED=$(docker load < "${TAR}" | grep 'Loaded image' | sed 's/.*Loaded image.*: //')
  echo "  ✓ Loaded: ${LOADED}"
  LOADED_COUNT=$((LOADED_COUNT + 1))
done
[ "${LOADED_COUNT}" -gt 0 ] || { echo "ERROR: No images loaded from package"; exit 1; }

# Verify every expected image is present in the Docker daemon
IFS=',' read -ra EXPECTED_IMAGES <<< "${MANIFEST_IMAGES}"
for IMG in "${EXPECTED_IMAGES[@]}"; do
  docker inspect --format '{{.Id}}' "${IMG}" >/dev/null 2>&1 || {
    echo "ERROR: Image not available after load: ${IMG}"
    echo "       Do not proceed — containers have not been stopped yet."
    exit 1
  }
  echo "  ✓ Verified digest: ${IMG}"
done

# ── Stage release files and deploy ────────────────────────────────────────────
echo "[6/8] Deploying ..."
cp "${PKG_DIR}/docker-compose.shb.yml" "${PLANE_DIR}/docker-compose.shb.yml"
cp -r "${PKG_DIR}/dist/." "${PLANE_DIR}/dist/"
chmod +x "${PKG_DIR}/scripts/deploy-shb.sh"

# deploy-shb.sh handles: stop conflicts, run migrations, compose up
bash "${PKG_DIR}/scripts/deploy-shb.sh" \
  "${PLANE_DIR}/dist" \
  "${PLANE_DIR}/plane.env" \
  "${PLANE_DIR}/docker-compose.yaml"

# ── Archive previous package (keep last 3) ────────────────────────────────────
echo "[7/8] Archiving release package ..."
ARCHIVE_KEEP="${ARCHIVE_KEEP:-3}"
ARCHIVE_TAG_SAFE=$(echo "${RELEASE_TAG}" | sed 's|/|-|g')
mkdir -p "${ARCHIVE_DIR}"
cp "${STAGE_DIR}/${ARCHIVE_NAME}" "${ARCHIVE_DIR}/${ARCHIVE_TAG_SAFE}-${ARCHIVE_NAME}"

# Prune oldest archives beyond retention limit
ls -t "${ARCHIVE_DIR}"/*.zip 2>/dev/null | tail -n "+$((ARCHIVE_KEEP + 1))" | xargs -r rm -f
echo "  Archived: ${ARCHIVE_TAG_SAFE}-${ARCHIVE_NAME} (keep last ${ARCHIVE_KEEP})"

# ── Append audit log entry ─────────────────────────────────────────────────────
# Format: timestamp | release_tag | uid:username | sha256_of_archive | exit_code
echo "[8/8] Writing audit log ..."
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | ${RELEASE_TAG} | $(id -u):$(id -un) | ${ACTUAL_SHA256} | 0" >> "${AUDIT_LOG}"
chmod 0644 "${AUDIT_LOG}"

rm -rf "${STAGE_DIR}"

echo ""
echo "========================================="
echo " Deploy Complete: ${RELEASE_TAG}"
echo "========================================="
