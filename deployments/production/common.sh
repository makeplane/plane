#!/usr/bin/env bash
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# Shared helpers for coordinated production deploy/rollback. Sourced only.
# shellcheck disable=SC2034

PLANE_DEPLOY_DIR="${PLANE_DEPLOY_DIR:-$(pwd)}"
PLANE_RELEASES_DIR="${PLANE_RELEASES_DIR:-/opt/plane/releases}"
PLANE_COMPOSE_FILE="${PLANE_COMPOSE_FILE:-docker-compose-prod.yml}"
PLANE_APP_URL="${PLANE_APP_URL:-}"
PLANE_RELEASE_KEEP="${PLANE_RELEASE_KEEP:-10}"
APP_SERVICES=(web admin space api worker beat-worker live proxy)
DATASTORE_SERVICES=(plane-db plane-redis plane-mq plane-minio)
COMPONENTS=(frontend admin space live backend proxy)

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

require_commands() {
  local cmd
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null 2>&1 || fail "required command not found: $cmd"
  done
}

compose_cmd() {
  PULL_POLICY="${PULL_POLICY:-never}" docker compose --env-file .env -f "$PLANE_COMPOSE_FILE" "$@"
}

assert_no_watchtower() {
  local name labels
  if docker ps --format '{{.Names}}' | grep -qx watchtower; then
    fail "Watchtower is running. Disable it before a coordinated Plane deploy."
  fi
  for name in web admin space api bgworker beatworker plane-live proxy; do
    if docker inspect "$name" >/dev/null 2>&1; then
      labels="$(docker inspect "$name" --format '{{index .Config.Labels "com.centurylinklabs.watchtower.enable"}}' 2>/dev/null || true)"
      if [[ "${labels}" == "true" ]]; then
        fail "container $name has Watchtower enabled; refusing mixed auto-updates"
      fi
    fi
  done
}

assert_compose_fail_closed() {
  local images
  images="$(compose_cmd config --images)"
  if grep -E 'makeplane/' <<<"$images" >/dev/null; then
    fail "compose resolved a makeplane/* application image"
  fi
}

wait_for_datastores() {
  local svc
  for svc in "${DATASTORE_SERVICES[@]}"; do
    log "ensuring data store $svc is running (no volume wipe, no recreate)"
    PULL_POLICY="${PULL_POLICY:-if_not_present}" docker compose --env-file .env -f "$PLANE_COMPOSE_FILE" up -d --no-recreate "$svc"
  done
  local i
  for i in $(seq 1 60); do
    local healthy=1
    for svc in plane-db plane-redis plane-mq plane-minio; do
      local status
      status="$(docker inspect "$svc" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' 2>/dev/null || echo missing)"
      if [[ "$status" != "healthy" && "$status" != "running" ]]; then
        healthy=0
      fi
    done
    if [[ "$healthy" -eq 1 ]]; then
      return 0
    fi
    sleep 5
  done
  fail "data stores did not become healthy"
}

pull_and_retag_manifest() {
  local manifest="$1"
  local name ref digest repo spec
  python3 "${SCRIPT_DIR}/plane_release.py" validate --manifest "$manifest" >/dev/null
  for name in "${COMPONENTS[@]}"; do
    ref="$(jq -r ".images.${name}.ref" "$manifest")"
    digest="$(jq -r ".images.${name}.digest" "$manifest")"
    repo="${ref%:*}"
    spec="${repo}@${digest}"
    log "docker pull $spec (not the mutable tag)"
    docker pull "$spec"
    docker tag "$spec" "$ref"
  done
}

verify_local_digests() {
  local manifest="$1"
  local tmp
  tmp="$(mktemp -d)"
  local name ref
  for name in "${COMPONENTS[@]}"; do
    ref="$(jq -r ".images.${name}.ref" "$manifest")"
    docker image inspect "$ref" >"${tmp}/${name}.json"
  done
  python3 "${SCRIPT_DIR}/plane_release.py" verify-inspect --manifest "$manifest" --inspect-dir "$tmp"
  rm -rf "$tmp"
}

recreate_app_services() {
  # Recreate only application services. Never `docker compose down -v`.
  PULL_POLICY=never docker compose --env-file .env -f "$PLANE_COMPOSE_FILE" \
    up -d --no-deps --force-recreate \
    web admin space api worker beat-worker live proxy
}

container_digest() {
  local container="$1"
  local image_id
  image_id="$(docker inspect "$container" --format '{{.Image}}')"
  docker image inspect "$image_id" --format '{{json .}}'
}

snapshot_running() {
  local output="$1"
  python3 - "$output" <<'PY'
import json, os, subprocess, sys
from datetime import datetime, timezone

out = sys.argv[1]
services = {
    "web": "frontend",
    "admin": "admin",
    "space": "space",
    "plane-live": "live",
    "api": "backend",
    "proxy": "proxy",
}

def inspect(name):
    proc = subprocess.run(["docker", "inspect", name], capture_output=True, text=True)
    if proc.returncode != 0:
        return None
    return json.loads(proc.stdout)[0]

def image_digest(image_id):
    proc = subprocess.run(["docker", "image", "inspect", image_id], capture_output=True, text=True)
    if proc.returncode != 0:
        return None, None
    payload = json.loads(proc.stdout)[0]
    digests = payload.get("RepoDigests") or []
    digest = None
    for item in digests:
        if "@sha256:" in item:
            digest = "sha256:" + item.split("@sha256:", 1)[1]
            break
    tags = payload.get("RepoTags") or []
    ref = tags[0] if tags else None
    return ref, digest

images = {}
containers = {}
for container, component in services.items():
    info = inspect(container)
    if not info:
        continue
    ref, digest = image_digest(info["Image"])
    containers[container] = {
        "id": info.get("Id", "")[:12],
        "image_id": info.get("Image", ""),
        "config_image": (info.get("Config") or {}).get("Image", ""),
        "digest": digest,
    }
    if ref and digest:
        images[component] = {"ref": ref, "digest": digest}

revision = None
app_url = os.environ.get("PLANE_APP_URL", "").rstrip("/")
if app_url:
    curl = subprocess.run(
        ["curl", "-fsS", f"{app_url}/api/instances/"],
        capture_output=True,
        text=True,
    )
    if curl.returncode == 0:
        try:
            payload = json.loads(curl.stdout)
            revision = (payload.get("config") or {}).get("build_revision") or payload.get("build_revision")
        except json.JSONDecodeError:
            revision = None

record = {
    "recorded_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "build_revision": revision,
    "images": images,
    "containers": containers,
}
# A snapshot is not a deployable manifest unless every component is present.
with open(out, "w", encoding="utf-8") as handle:
    json.dump(record, handle, indent=2)
    handle.write("\n")
PY
}

instances_payload() {
  local url="${PLANE_APP_URL:?PLANE_APP_URL is required for health checks}"
  curl -fsS --max-time 30 "${url%/}/api/instances/"
}

verify_release() {
  local manifest="$1"
  local name container
  declare -A CONTAINERS=(
    [frontend]=web
    [admin]=admin
    [space]=space
    [live]=plane-live
    [backend]=api
    [proxy]=proxy
  )
  for container in web admin space api bgworker beatworker plane-live proxy; do
    local state
    state="$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null || echo missing)"
    [[ "$state" == "running" ]] || fail "container $container is $state"
  done

  local tmp
  tmp="$(mktemp -d)"
  for name in "${COMPONENTS[@]}"; do
    container="${CONTAINERS[$name]}"
    container_digest "$container" >"${tmp}/${name}.json"
  done
  python3 "${SCRIPT_DIR}/plane_release.py" verify-inspect --manifest "$manifest" --inspect-dir "$tmp"
  rm -rf "$tmp"

  [[ -n "$PLANE_APP_URL" ]] || fail "PLANE_APP_URL is required"

  local payload revision
  payload="$(instances_payload)"
  revision="$(jq -r '.revision' "$manifest")"
  SCRIPT_DIR="$SCRIPT_DIR" python3 -c '
import json, os, sys
sys.path.insert(0, os.environ["SCRIPT_DIR"])
from plane_release import build_revision_matches, policy_is_self_hosted_unlimited
payload = json.loads(sys.argv[1])
policy_is_self_hosted_unlimited(payload)
build_revision_matches(payload, sys.argv[2])
print("policy and build_revision ok")
' "$payload" "$revision"

  local web_status
  web_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${PLANE_APP_URL%/}/")"
  [[ "$web_status" =~ ^2 ]] || fail "frontend HTTP $web_status"

  # Bounded smoke: unauthenticated SPA routes must not 5xx.
  local path
  for path in / /signin /api/instances/; do
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${PLANE_APP_URL%/}${path}")"
    if [[ "$code" =~ ^5 ]]; then
      fail "smoke ${path} returned $code"
    fi
  done
  log "smoke: login page and /api/instances/ reachable (no production data created)"
}
