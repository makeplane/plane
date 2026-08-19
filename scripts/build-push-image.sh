#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'USAGE'
Usage:
  scripts/build-push-image.sh <web|api|admin|space|live>

Examples:
  scripts/build-push-image.sh web
  IMAGE_TAG=sha-abc123 scripts/build-push-image.sh api
  PUSH=0 scripts/build-push-image.sh web

Environment:
  REGISTRY                         Docker repository namespace. Default: drakesoftware
  IMAGE_TAG                        Docker tag. Default: manual-<utc timestamp>-<git sha>
  IMAGE                            Full image reference override.
  PLATFORM                         Docker platform. Default: linux/amd64
  PUSH=0                           Load locally instead of pushing.
  NEXT_PUBLIC_*                    Build-time frontend URL overrides.
USAGE
}

service="${1:-}"
if [[ -z "${service}" || "${service}" == "-h" || "${service}" == "--help" ]]; then
  usage
  [[ -z "${service}" ]] && exit 2 || exit 0
fi

short_sha="$(git -C "${ROOT_DIR}" rev-parse --short=12 HEAD)"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

REGISTRY="${REGISTRY:-drakesoftware}"
IMAGE_TAG="${IMAGE_TAG:-manual-${timestamp}-${short_sha}}"
PLATFORM="${PLATFORM:-linux/amd64}"
PUSH="${PUSH:-1}"

NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://sports.kanavio.com}"
NEXT_PUBLIC_WEB_BASE_URL="${NEXT_PUBLIC_WEB_BASE_URL:-https://sports.kanavio.com}"
NEXT_PUBLIC_ADMIN_BASE_URL="${NEXT_PUBLIC_ADMIN_BASE_URL:-https://sports.kanavio.com}"
NEXT_PUBLIC_ADMIN_BASE_PATH="${NEXT_PUBLIC_ADMIN_BASE_PATH:-/god-mode}"
NEXT_PUBLIC_SPACE_BASE_URL="${NEXT_PUBLIC_SPACE_BASE_URL:-https://sports.kanavio.com}"
NEXT_PUBLIC_SPACE_BASE_PATH="${NEXT_PUBLIC_SPACE_BASE_PATH:-/spaces}"
NEXT_PUBLIC_LIVE_BASE_URL="${NEXT_PUBLIC_LIVE_BASE_URL:-https://sports.kanavio.com}"
NEXT_PUBLIC_LIVE_BASE_PATH="${NEXT_PUBLIC_LIVE_BASE_PATH:-/live}"
NEXT_PUBLIC_CP_SERVER_URL="${NEXT_PUBLIC_CP_SERVER_URL:-https://sports.kanavio.com/sports/api}"
NEXT_PUBLIC_RTMP_URL="${NEXT_PUBLIC_RTMP_URL:-rtmp://sports.kanavio.com:1935}"

dockerfile=""
build_context="${ROOT_DIR}"
default_image=""
build_args=()

case "${service}" in
  web|plane-web)
    dockerfile="apps/web/Dockerfile.web"
    default_image="${REGISTRY}/plane-web-amd64:${IMAGE_TAG}"
    build_args=(
      --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
      --build-arg "NEXT_PUBLIC_WEB_BASE_URL=${NEXT_PUBLIC_WEB_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_URL=${NEXT_PUBLIC_ADMIN_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_PATH=${NEXT_PUBLIC_ADMIN_BASE_PATH}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_URL=${NEXT_PUBLIC_SPACE_BASE_URL}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_PATH=${NEXT_PUBLIC_SPACE_BASE_PATH}"
      --build-arg "NEXT_PUBLIC_LIVE_BASE_URL=${NEXT_PUBLIC_LIVE_BASE_URL}"
      --build-arg "NEXT_PUBLIC_LIVE_BASE_PATH=${NEXT_PUBLIC_LIVE_BASE_PATH}"
      --build-arg "NEXT_PUBLIC_CP_SERVER_URL=${NEXT_PUBLIC_CP_SERVER_URL}"
      --build-arg "NEXT_PUBLIC_RTMP_URL=${NEXT_PUBLIC_RTMP_URL}"
    )
    ;;
  api|plane-api)
    dockerfile="apps/api/Dockerfile.api"
    build_context="${ROOT_DIR}/apps/api"
    default_image="${REGISTRY}/plane-api-amd64:${IMAGE_TAG}"
    ;;
  admin|plane-admin)
    dockerfile="apps/admin/Dockerfile.admin"
    default_image="${REGISTRY}/plane-admin-amd64:${IMAGE_TAG}"
    build_args=(
      --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
      --build-arg "NEXT_PUBLIC_WEB_BASE_URL=${NEXT_PUBLIC_WEB_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_URL=${NEXT_PUBLIC_ADMIN_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_PATH=${NEXT_PUBLIC_ADMIN_BASE_PATH}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_URL=${NEXT_PUBLIC_SPACE_BASE_URL}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_PATH=${NEXT_PUBLIC_SPACE_BASE_PATH}"
    )
    ;;
  space|plane-space)
    dockerfile="apps/space/Dockerfile.space"
    default_image="${REGISTRY}/plane-space-amd64:${IMAGE_TAG}"
    build_args=(
      --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
      --build-arg "NEXT_PUBLIC_WEB_BASE_URL=${NEXT_PUBLIC_WEB_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_URL=${NEXT_PUBLIC_ADMIN_BASE_URL}"
      --build-arg "NEXT_PUBLIC_ADMIN_BASE_PATH=${NEXT_PUBLIC_ADMIN_BASE_PATH}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_URL=${NEXT_PUBLIC_SPACE_BASE_URL}"
      --build-arg "NEXT_PUBLIC_SPACE_BASE_PATH=${NEXT_PUBLIC_SPACE_BASE_PATH}"
    )
    ;;
  live|plane-live)
    dockerfile="apps/live/Dockerfile.live"
    default_image="${REGISTRY}/plane-live-amd64:${IMAGE_TAG}"
    ;;
  *)
    echo "ERROR: unsupported Plane image target: ${service}" >&2
    usage >&2
    exit 2
    ;;
esac

IMAGE="${IMAGE:-${default_image}}"

output_args=(--push)
if [[ "${PUSH}" == "0" ]]; then
  output_args=(--load)
fi

echo "Building Plane image:"
echo "  target=${service}"
echo "  image=${IMAGE}"
echo "  platform=${PLATFORM}"
echo "  push=${PUSH}"

docker buildx build \
  "${output_args[@]}" \
  --platform "${PLATFORM}" \
  -f "${ROOT_DIR}/${dockerfile}" \
  -t "${IMAGE}" \
  "${build_args[@]}" \
  "${build_context}"

echo "IMAGE=${IMAGE}"
