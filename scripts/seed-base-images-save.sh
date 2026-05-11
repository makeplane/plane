#!/usr/bin/env bash
# Run on a machine WITH internet access (linux/amd64) to produce
# jms-base-images.tar.gz — a single archive containing every base
# image required to BUILD the Plane SHB release on an airgapped host.
#
# Usage:
#   bash scripts/seed-base-images-save.sh [output_dir]
#
# Output: ${output_dir:-.}/jms-base-images.tar.gz

set -euo pipefail

OUT_DIR="${1:-.}"
OUT_FILE="${OUT_DIR}/jms-base-images.tar"
PLATFORM="linux/amd64"

# Build-time bases (referenced in apps/*/Dockerfile.*)
BUILD_IMAGES=(
  "docker/dockerfile:1.7"
  "node:22-alpine"
  "nginx:1.29-alpine"
  "nginx:1.27-alpine"
  "python:3.12.10-alpine"
  "caddy:2.10.0-builder-alpine"
  "caddy:2.10.0-alpine"
)

# Optional runtime bases — uncomment if jmsap1t hosts these too
RUNTIME_IMAGES=(
  # "postgres:15.7-alpine"
  # "valkey/valkey:7.2.11-alpine"
  # "rabbitmq:3.13.6-management-alpine"
  # "minio/minio:latest"
)

ALL_IMAGES=("${BUILD_IMAGES[@]}" ${RUNTIME_IMAGES[@]+"${RUNTIME_IMAGES[@]}"})

mkdir -p "${OUT_DIR}"

echo "=== Pulling ${#ALL_IMAGES[@]} images for ${PLATFORM} ==="
for img in "${ALL_IMAGES[@]}"; do
  echo "→ pull ${img}"
  docker pull --platform "${PLATFORM}" "${img}"
done

echo ""
echo "=== Saving to ${OUT_FILE} ==="
docker save -o "${OUT_FILE}" "${ALL_IMAGES[@]}"

echo "=== Compressing ==="
gzip -f "${OUT_FILE}"

SIZE=$(du -h "${OUT_FILE}.gz" | awk '{print $1}')
SHA=$(sha256sum "${OUT_FILE}.gz" | awk '{print $1}')

cat <<EOF

=========================================
 Done.
 File   : ${OUT_FILE}.gz
 Size   : ${SIZE}
 SHA256 : ${SHA}

 Transfer to jmsap1t and run:
   bash scripts/seed-base-images-load.sh /path/to/jms-base-images.tar.gz
=========================================
EOF
