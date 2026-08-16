#!/usr/bin/env bash
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# Coordinated production deploy. Never compose down -v. Never pull mutable
# tags as release identity — pull by digest, then retag.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

ACTION="deploy"
MANIFEST_PATH=""
SKIP_GIT_SYNC=0

usage() {
  cat <<'EOF'
Usage:
  deploy.sh --manifest PATH
  rollback.sh --release-id ID

Environment:
  PLANE_DEPLOY_DIR       Repository directory on the host (default: cwd)
  PLANE_RELEASES_DIR     Rollback records (default: /opt/plane/releases)
  PLANE_COMPOSE_FILE     default: docker-compose-prod.yml
  PLANE_APP_URL          Public origin used for health checks
  PLANE_RELEASE_KEEP     Number of release records to retain (default: 10)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      MANIFEST_PATH="${2:-}"
      shift 2
      ;;
    --skip-git-sync)
      SKIP_GIT_SYNC=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[[ -n "$MANIFEST_PATH" ]] || fail "--manifest is required"
MANIFEST_PATH="$(cd "$(dirname "$MANIFEST_PATH")" && pwd)/$(basename "$MANIFEST_PATH")"
[[ -f "$MANIFEST_PATH" ]] || fail "manifest not found: $MANIFEST_PATH"

require_commands docker python3 jq curl
cd "$PLANE_DEPLOY_DIR"
[[ -f "$PLANE_COMPOSE_FILE" ]] || fail "compose file missing: $PLANE_DEPLOY_DIR/$PLANE_COMPOSE_FILE"
[[ -f .env ]] || fail "production .env is missing; refusing to copy an example over it"

python3 "${SCRIPT_DIR}/plane_release.py" validate --manifest "$MANIFEST_PATH" >/dev/null
REVISION="$(jq -r '.revision' "$MANIFEST_PATH")"
BUILT_AT="$(jq -r '.built_at' "$MANIFEST_PATH")"
log "source SHA $REVISION built_at $BUILT_AT"

assert_no_watchtower
assert_compose_fail_closed

if [[ "$SKIP_GIT_SYNC" -eq 0 && -d .git ]]; then
  log "syncing compose and production scripts to $REVISION"
  git fetch origin "$REVISION" >/dev/null 2>&1 || git fetch origin
  git checkout "$REVISION" -- docker-compose.yml docker-compose-prod.yml deployments/production
fi

START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${REVISION:0:12}"
RECORD_DIR="${PLANE_RELEASES_DIR}/${RELEASE_ID}"
mkdir -p "$RECORD_DIR"
cp "$MANIFEST_PATH" "${RECORD_DIR}/target-manifest.json"

log "recording currently running identity to ${RECORD_DIR}/previous.json"
snapshot_running "${RECORD_DIR}/previous.json" || log "warning: could not snapshot a complete previous release; rollback may be limited"

python3 "${SCRIPT_DIR}/plane_release.py" prune-releases --root "$PLANE_RELEASES_DIR" --keep "${PLANE_RELEASE_KEEP}" >/dev/null

log "pulling coordinated image set by digest"
pull_and_retag_manifest "$MANIFEST_PATH"
verify_local_digests "$MANIFEST_PATH"

log "waiting for data stores (will not recreate them)"
wait_for_datastores

log "running migrator"
if ! compose_cmd run --rm --no-deps migrator; then
  echo failed > "${RECORD_DIR}/migration"
  fail "migrator failed; application containers were not recreated"
fi
echo succeeded > "${RECORD_DIR}/migration"

log "recreating application containers together (PULL_POLICY=never)"
recreate_app_services

log "verifying health, policy, digests, and build revision"
if ! verify_release "$MANIFEST_PATH"; then
  echo failed > "${RECORD_DIR}/health"
  fail "post-deploy verification failed. Application rollback is manual (see ${RECORD_DIR}). Database migrations are not reversed."
fi
echo succeeded > "${RECORD_DIR}/health"

END_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "${RECORD_DIR}/deploy.json" <<EOF
{
  "action": "deploy",
  "release_id": "${RELEASE_ID}",
  "revision": "${REVISION}",
  "started_at": "${START_TS}",
  "ended_at": "${END_TS}",
  "migration": "succeeded",
  "health": "succeeded",
  "record_dir": "${RECORD_DIR}"
}
EOF
cp "$MANIFEST_PATH" "${PLANE_RELEASES_DIR}/current.json"
ln -sfn "$RELEASE_ID" "${PLANE_RELEASES_DIR}/current"

log "deploy succeeded release_id=${RELEASE_ID} revision=${REVISION} record=${RECORD_DIR}"
