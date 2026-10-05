#!/usr/bin/env bash
# Shared helpers for the Cloud Agent install and start scripts.

export PATH="/usr/local/bin:${PATH}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export COREPACK_DEFAULT_TO_LATEST=0
export COREPACK_HOME="${COREPACK_HOME:-/usr/local/share/corepack}"

# Resolve once, at source time, so later cdirs do not reinterpret a relative path.
_PLANE_COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_PLANE_ROOT="$(cd "${_PLANE_COMMON_DIR}/.." && pwd)"

plane_root() {
  printf '%s\n' "$_PLANE_ROOT"
}

copy_env_if_missing() {
  local source=$1
  local destination=$2
  if [ -f "$destination" ]; then
    echo "env exists: $destination"
    return 0
  fi
  if [ ! -f "$source" ]; then
    echo "missing env example: $source" >&2
    return 1
  fi
  cp "$source" "$destination"
  echo "copied $destination"
}

ensure_secret_key() {
  local env_file="apps/api/.env"
  if [ ! -f "$env_file" ]; then
    echo "apps/api/.env is missing; cannot add SECRET_KEY" >&2
    return 1
  fi
  if grep -q '^SECRET_KEY=' "$env_file"; then
    echo "SECRET_KEY already set"
    return 0
  fi
  local secret_key
  # Same alphabet as setup.sh (a-z0-9, 50 chars). Generate with node so the
  # image does not need Python. Do not pipe /dev/urandom into head: with
  # pipefail, head closing the pipe exits 141 before the key is written.
  secret_key="$(node -e 'const {randomInt}=require("crypto"); const alphabet="abcdefghijklmnopqrstuvwxyz0123456789"; let secret=""; for (let i=0;i<50;i++) secret+=alphabet[randomInt(alphabet.length)]; process.stdout.write(secret);')"
  if [ -z "$secret_key" ]; then
    echo "failed to generate SECRET_KEY" >&2
    return 1
  fi
  printf '\nSECRET_KEY="%s"\n' "$secret_key" >> "$env_file"
  echo "added SECRET_KEY to apps/api/.env"
}

ensure_docker() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  echo "starting docker daemon"
  sudo service docker start >/tmp/docker-service.log 2>&1 || true
  local attempt
  for attempt in $(seq 1 45); do
    if [ -S /var/run/docker.sock ]; then
      sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    fi
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "service docker did not become ready; starting dockerd directly" >&2
  sudo dockerd >/tmp/dockerd.log 2>&1 &
  for attempt in $(seq 1 45); do
    if [ -S /var/run/docker.sock ]; then
      sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    fi
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Docker daemon failed to start. See /tmp/docker-service.log and /tmp/dockerd.log" >&2
  return 1
}

wait_for_http() {
  local url=$1
  local attempts=${2:-180}
  local attempt code
  for attempt in $(seq 1 "$attempts"); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$url" || true)"
    if [ -n "$code" ] && [ "$code" != "000" ]; then
      echo "ready $url ($code)"
      return 0
    fi
    sleep 2
  done
  echo "timed out waiting for $url" >&2
  return 1
}
