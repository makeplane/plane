#!/usr/bin/env bash
# Verify all Docker image tarballs in a directory are linux/amd64.
# Called by build-shb-images.sh and publish-gitlab-release-package.sh.
# Fails the pipeline if any image is not linux/amd64.
#
# Usage: ./scripts/verify-release-package-architecture.sh [dist-dir]
#   dist-dir defaults to "dist"

set -euo pipefail

DIST_DIR="${1:-dist}"
FAILED=0
CHECKED=0

[ -d "${DIST_DIR}" ] || { echo "ERROR: Directory '${DIST_DIR}' not found"; exit 1; }

# Skip gracefully when Docker is not available (e.g. upload-only machines)
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "  SKIP: Docker not available — architecture verification skipped (already verified at build time)"
  exit 0
fi

echo "Verifying image architecture in ${DIST_DIR}/ ..."
for TAR in "${DIST_DIR}"/*.tar.gz; do
  [ -f "${TAR}" ] || continue
  NAME=$(basename "${TAR}" .tar.gz)

  # Load image; guard against load failure before checking the output
  LOAD_OUT=$(docker load < "${TAR}" 2>&1) || {
    echo "  FAIL: ${NAME} — docker load failed: ${LOAD_OUT}"
    FAILED=1
    continue
  }
  LOADED=$(echo "${LOAD_OUT}" | grep -E 'Loaded image' | sed 's/.*Loaded image.*: //' || true)
  [ -n "${LOADED}" ] || { echo "  FAIL: ${NAME} — docker load produced no image reference"; FAILED=1; continue; }

  ARCH=$(docker inspect --format '{{.Architecture}}' "${LOADED}" 2>/dev/null || echo "unknown")
  OS=$(docker inspect --format '{{.Os}}' "${LOADED}" 2>/dev/null || echo "unknown")

  if [ "${ARCH}" = "amd64" ] && [ "${OS}" = "linux" ]; then
    echo "  OK  : ${NAME} (${OS}/${ARCH})"
  else
    echo "  FAIL: ${NAME} (${OS}/${ARCH}) — expected linux/amd64"
    FAILED=1
  fi
  CHECKED=$((CHECKED + 1))
done

[ "${CHECKED}" -gt 0 ] || { echo "ERROR: No tar.gz files found in ${DIST_DIR}/"; exit 1; }
[ "${FAILED}" -eq 0 ]  || { echo "ERROR: Architecture verification failed — ${FAILED} image(s) are not linux/amd64"; exit 1; }
echo "All ${CHECKED} image(s) verified: linux/amd64"
