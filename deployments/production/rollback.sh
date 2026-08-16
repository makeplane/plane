#!/usr/bin/env bash
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# Restore a previously recorded COMPLETE release set. Does not reverse DB
# migrations.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

RELEASE_ID=""
RUN_MIGRATOR=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id)
      RELEASE_ID="${2:-}"
      shift 2
      ;;
    --run-migrator)
      RUN_MIGRATOR=1
      shift
      ;;
    -h|--help)
      echo "Usage: rollback.sh --release-id ID [--run-migrator]"
      echo "Application rollback only unless --run-migrator is set."
      echo "Database rollback is NOT automatic."
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[[ -n "$RELEASE_ID" ]] || fail "--release-id is required"
require_commands docker python3 jq curl
cd "$PLANE_DEPLOY_DIR"

RECORD_DIR="${PLANE_RELEASES_DIR}/${RELEASE_ID}"
CANDIDATES=(
  "${RECORD_DIR}/target-manifest.json"
  "${RECORD_DIR}/plane-release-manifest.json"
  "${PLANE_RELEASES_DIR}/${RELEASE_ID}.json"
)
MANIFEST_PATH=""
for candidate in "${CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]] && python3 "${SCRIPT_DIR}/plane_release.py" validate --manifest "$candidate" >/dev/null 2>&1; then
    MANIFEST_PATH="$candidate"
    break
  fi
done
if [[ -z "$MANIFEST_PATH" && -f "${RECORD_DIR}/previous.json" ]]; then
  TMP_MANIFEST="$(mktemp)"
  if python3 "${SCRIPT_DIR}/plane_release.py" snapshot-to-manifest --snapshot "${RECORD_DIR}/previous.json" --output "$TMP_MANIFEST"; then
    MANIFEST_PATH="$TMP_MANIFEST"
  fi
fi
[[ -n "$MANIFEST_PATH" ]] || fail "no complete coordinated manifest in ${RECORD_DIR}; refusing a partial component restore"

assert_no_watchtower
REVISION="$(jq -r '.revision' "$MANIFEST_PATH")"
log "rolling back application containers to ${RELEASE_ID} revision ${REVISION}"
log "database migrations will not be reversed"

START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
NEW_ID="$(date -u +%Y%m%dT%H%M%SZ)-rollback-${REVISION:0:12}"
NEW_DIR="${PLANE_RELEASES_DIR}/${NEW_ID}"
mkdir -p "$NEW_DIR"
snapshot_running "${NEW_DIR}/previous.json" || true
cp "$MANIFEST_PATH" "${NEW_DIR}/target-manifest.json"

pull_and_retag_manifest "$MANIFEST_PATH"
verify_local_digests "$MANIFEST_PATH"
wait_for_datastores

if [[ "$RUN_MIGRATOR" -eq 1 ]]; then
  log "running migrator because --run-migrator was set"
  compose_cmd run --rm --no-deps migrator
  echo succeeded > "${NEW_DIR}/migration"
else
  echo skipped > "${NEW_DIR}/migration"
fi

recreate_app_services
if ! verify_release "$MANIFEST_PATH"; then
  echo failed > "${NEW_DIR}/health"
  fail "rollback verification failed"
fi
echo succeeded > "${NEW_DIR}/health"
END_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "${NEW_DIR}/deploy.json" <<EOF
{
  "action": "rollback",
  "source_release_id": "${RELEASE_ID}",
  "release_id": "${NEW_ID}",
  "revision": "${REVISION}",
  "started_at": "${START_TS}",
  "ended_at": "${END_TS}",
  "migration": "$(cat "${NEW_DIR}/migration")",
  "health": "succeeded",
  "record_dir": "${NEW_DIR}"
}
EOF
cp "$MANIFEST_PATH" "${PLANE_RELEASES_DIR}/current.json"
ln -sfn "$NEW_ID" "${PLANE_RELEASES_DIR}/current"
python3 "${SCRIPT_DIR}/plane_release.py" prune-releases --root "$PLANE_RELEASES_DIR" --keep "${PLANE_RELEASE_KEEP}" >/dev/null
log "rollback succeeded release_id=${NEW_ID}"
