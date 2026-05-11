#!/usr/bin/env bash
# Upload pre-built images from a local dist/ folder to GitLab Package Registry
# and create a tagged release. Designed for air-gapped environments where builds
# are produced on a personal machine and transferred to an internal upload host.
#
# Prerequisites on this machine:
#   - curl, zip, sha256sum (Linux: coreutils; macOS: brew install coreutils)
#   - Access to internal GitLab (no internet required)
#   - upload-release.env filled in (see upload-release.env.example)
#
# Usage:
#   bash scripts/upload-release.sh dev/shb_v1.2.0-build.5
#   bash scripts/upload-release.sh prod/shb_v1.2.0
#
# The script reads config from upload-release.env (in repo root), then delegates
# to publish-gitlab-release-package.sh with all required env vars set.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

RELEASE_TAG="${1:-}"
ENV_FILE="${ROOT_DIR}/upload-release.env"

# ── Validate args ─────────────────────────────────────────────────────────────
[ -n "${RELEASE_TAG}" ] || {
  echo "Usage: bash scripts/upload-release.sh <RELEASE_TAG>"
  echo "  e.g. bash scripts/upload-release.sh dev/shb_v1.2.0-build.5"
  echo "       bash scripts/upload-release.sh prod/shb_v1.2.0"
  exit 1
}

[[ "${RELEASE_TAG}" == dev/* || "${RELEASE_TAG}" == prod/* ]] || {
  echo "ERROR: RELEASE_TAG must start with 'dev/' or 'prod/'; got '${RELEASE_TAG}'"
  exit 1
}

if [[ "${RELEASE_TAG}" == dev/* ]]; then
  [[ "${RELEASE_TAG}" =~ ^dev/.+-build\.[0-9]+$ ]] || {
    echo "ERROR: dev release tags must include build suffix, e.g. dev/shb_v1.2.0-build.5"
    echo "       Got: '${RELEASE_TAG}'"
    exit 1
  }
fi

# ── Load local config (not committed to git) ──────────────────────────────────
[ -f "${ENV_FILE}" ] || {
  echo "ERROR: ${ENV_FILE} not found."
  echo "       Copy scripts/upload-release.env.example to upload-release.env and fill it in."
  exit 1
}
# shellcheck disable=SC1090
source "${ENV_FILE}"

# ── Derive SHB_VERSION from dist/.shb-version ────────────────────────────────
DIST_DIR="${DIST_DIR:-dist}"
[ -f "${DIST_DIR}/.shb-version" ] || {
  echo "ERROR: ${DIST_DIR}/.shb-version not found."
  echo "       Set DIST_DIR in upload-release.env to the transferred dist/ folder."
  exit 1
}
SHB_VERSION=$(tr -d '[:space:]' < "${DIST_DIR}/.shb-version")

echo "========================================="
echo " Upload Release: ${RELEASE_TAG}"
echo " Version       : ${SHB_VERSION}"
echo " Dist dir      : ${DIST_DIR}"
echo "========================================="

# ── Delegate to publish script ────────────────────────────────────────────────
export GITLAB_URL CI_PROJECT_ID GITLAB_PUBLISH_TOKEN
export SHB_VERSION RELEASE_TAG DIST_DIR

bash "${SCRIPT_DIR}/publish-gitlab-release-package.sh"
