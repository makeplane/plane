#!/usr/bin/env bash
# Run on the airgapped target host (e.g. jmsap1t) to load all base
# images produced by seed-base-images-save.sh.
#
# Usage:
#   bash scripts/seed-base-images-load.sh /path/to/jms-base-images.tar.gz

set -euo pipefail

ARCHIVE="${1:?Usage: $0 <jms-base-images.tar.gz>}"
[ -f "${ARCHIVE}" ] || { echo "ERROR: ${ARCHIVE} not found"; exit 1; }

echo "=== Loading images from ${ARCHIVE} ==="
if [[ "${ARCHIVE}" == *.gz ]]; then
  gunzip -c "${ARCHIVE}" | docker load
else
  docker load -i "${ARCHIVE}"
fi

echo ""
echo "=== Verifying expected images ==="
EXPECTED=(
  "docker/dockerfile:1.7"
  "node:22-alpine"
  "nginx:1.29-alpine"
  "nginx:1.27-alpine"
  "python:3.12.10-alpine"
  "caddy:2.10.0-builder-alpine"
  "caddy:2.10.0-alpine"
)
MISSING=0
for img in "${EXPECTED[@]}"; do
  if docker image inspect "${img}" >/dev/null 2>&1; then
    echo "  ✓ ${img}"
  else
    echo "  ✗ ${img} — NOT loaded"
    MISSING=$((MISSING + 1))
  fi
done

[ "${MISSING}" -eq 0 ] || { echo "ERROR: ${MISSING} image(s) missing"; exit 1; }
echo ""
echo "=== All base images present. CI build can now proceed offline. ==="
