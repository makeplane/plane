#!/usr/bin/env bash
# plane/scripts/bench-builds.sh
#
# Benchmark cold vs warm Docker image builds (time and space) for:
#   - admin
#   - space
#   - web
#   - live
#
# What it measures:
#   - Cold build time (after pruning build cache and removing target image)
#   - Warm build time (immediately rebuilding with cache)
#   - Image size (bytes -> human readable)
#   - Build cache size before/after (best-effort using buildx or system df)
#
# Usage:
#   ./scripts/bench-builds.sh            # run all services
#   ./scripts/bench-builds.sh --services web,admin
#   ./scripts/bench-builds.sh --no-prune # do not prune build cache prior to cold build
#   ./scripts/bench-builds.sh --aggressive-prune # prune images/containers/volumes (heavy)
#   ./scripts/bench-builds.sh --help
#
# Environment vars:
#   DOCKER_BUILDKIT=1 is set automatically for builds in this script.

set -Eeuo pipefail

# Require Bash 4+ early (macOS default /bin/bash is 3.2)
if [[ -z "${BASH_VERSINFO:-}" || "${BASH_VERSINFO[0]:-0}" -lt 4 ]]; then
  {
    echo "ERROR: This script requires Bash 4+ but your shell appears to be Bash ${BASH_VERSION:-unknown}."
    echo
    echo "On macOS, the default /bin/bash is 3.2. Install a newer Bash (e.g., via Homebrew):"
    echo "  brew install bash"
    echo
    echo "Then run this script with the newer Bash explicitly, for example:"
    echo "  /usr/local/bin/bash $0 [args...]    # Intel mac"
    echo "  /opt/homebrew/bin/bash $0 [args...] # Apple Silicon"
  } >&2
  exit 1
fi

# ---------------------------
# Config and service catalog
# ---------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

declare -A DOCKERFILES=(
  [web]="apps/web/Dockerfile.web"
  [admin]="apps/admin/Dockerfile.admin"
  [space]="apps/space/Dockerfile.space"
  [live]="apps/live/Dockerfile.live"
)

declare -A TAGS=(
  [web]="plane-web:bench"
  [admin]="plane-admin:bench"
  [space]="plane-space:bench"
  [live]="plane-live:bench"
)

DEFAULT_SERVICES="web,admin,space,live"

# Options
SERVICES="${SERVICES:-$DEFAULT_SERVICES}"
NO_PRUNE="false"
AGGRESSIVE_PRUNE="false"
VERBOSE="0"

# ---------------------------
# Helpers
# ---------------------------
have() { command -v "$1" >/dev/null 2>&1; }

log() { printf '[%s] %s\n' "$(date +'%H:%M:%S')" "$*"; }

die() { echo "ERROR: $*" >&2; exit 1; }

now_ns() {
  # Robust nanosecond epoch getter with output validation.
  # Order: gdate -> date (validate numeric) -> EPOCHREALTIME -> perl Time::HiRes -> seconds*1e9
  local ts

  # 1) GNU date if available (gdate on macOS/Homebrew)
  if have gdate; then
    ts="$(gdate +%s%N 2>/dev/null || true)"
    if [[ "$ts" =~ ^[0-9]+$ ]]; then
      echo "$ts"
      return 0
    fi
  fi

  # 2) POSIX/BSD date with %N (BSD prints literal "%N" but exits 0). Validate numeric.
  ts="$(date +%s%N 2>/dev/null || true)"
  if [[ "$ts" =~ ^[0-9]+$ ]]; then
    echo "$ts"
    return 0
  fi

  # 3) Bash 5+ EPOCHREALTIME: "seconds.microseconds" -> ns
  if [[ -n "${EPOCHREALTIME:-}" ]]; then
    local sec frac micro
    sec="${EPOCHREALTIME%.*}"
    frac="${EPOCHREALTIME#*.}"
    if [[ "$sec" =~ ^[0-9]+$ ]]; then
      frac="${frac%%[^0-9]*}"       # keep only digits from fractional part
      micro="${frac}000000"          # pad to at least 6 digits (microseconds)
      micro="${micro:0:6}"
      echo $(( sec * 1000000000 + micro * 1000 ))
      return 0
    fi
  fi

  # 4) Perl Time::HiRes as a portable high-resolution fallback
  if have perl; then
    ts="$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time()*1e9' 2>/dev/null || true)"
    if [[ "$ts" =~ ^[0-9]+$ ]]; then
      echo "$ts"
      return 0
    fi
  fi

  # 5) Final fallback: seconds * 1e9 (integer)
  echo "$(( $(date +%s) * 1000000000 ))"
}

elapsed_ms() {
  local start_ns="$1" end_ns="$2"
  # integer division, keep ms precision
  echo $(( (end_ns - start_ns) / 1000000 ))
}

human_ms() {
  local ms="$1"
  if (( ms < 1000 )); then
    printf "%dms" "$ms"
  else
    # print seconds with 2 decimals
    awk "BEGIN { printf \"%.2fs\", $ms/1000 }"
  fi
}

human_bytes() {
  local bytes="${1:-0}"
  awk -v b="$bytes" 'BEGIN {
    if (b < 0) b = 0
    split("B KB MB GB TB PB", u, " ")
    i = 1
    while (b >= 1024 && i < 6) { b /= 1024; i++ }
    printf("%.2f %s", b, u[i])
  }' 2>/dev/null || printf "%s %s" "${bytes}" "B"
}

image_size_bytes() {
  local tag="$1"
  docker image inspect -f '{{.Size}}' "$tag" 2>/dev/null || echo "0"
}

# Best-effort build cache size (string), returns "N/A" if unavailable
build_cache_size_str() {
  if have docker && docker buildx version >/dev/null 2>&1; then
    # Try buildx du summary (not standardized across versions; best effort parsing)
    local du
    du="$(docker buildx du 2>/dev/null || true)"
    if [[ -n "$du" ]]; then
      # Look for a line with total size summary; fallback to whole output
      local line size
      line="$(echo "$du" | tail -n 1)"
      # Heuristic parse: e.g., "total: 1.23GB (123MB in use)"
      size="$(echo "$line" | awk '{for(i=1;i<=NF;i++){if($i ~ /[0-9.]+(GB|MB|KB|B)/){print $i; exit}}}')"
      if [[ -n "$size" ]]; then
        echo "$size (buildx du)"
        return 0
      fi
      # Fallback: return the last line
      echo "$line (buildx du)"
      return 0
    fi
  fi

  # Fallback to docker system df
  if have docker; then
    local df
    df="$(docker system df 2>/dev/null || true)"
    if [[ -n "$df" ]]; then
      # Try to extract "Build cache" row size column
      # Example line may look like:
      # "Build cache    3.14GB      1.23GB"
      local row
      row="$(echo "$df" | awk '/Build cache/ {print}')"
      if [[ -n "$row" ]]; then
        local size
        size="$(echo "$row" | awk '{for(i=1;i<=NF;i++){if($i ~ /[0-9.]+(GB|MB|KB|B)/){print $i; exit}}}')"
        if [[ -n "$size" ]]; then
          echo "$size (system df)"
          return 0
        fi
        echo "$row (system df)"
        return 0
      fi
    fi
  fi
  echo "N/A"
}

prune_build_cache() {
  if [[ "$AGGRESSIVE_PRUNE" == "true" ]]; then
    log "Aggressive prune: images/containers/volumes/build-cache"
    docker system prune -af --volumes >/dev/null 2>&1 || true
  else
    log "Pruning builder cache only"
    docker builder prune -af >/dev/null 2>&1 || true
  fi
}

remove_image_if_exists() {
  local tag="$1"
  if docker image inspect "$tag" >/dev/null 2>&1; then
    docker rmi -f "$tag" >/dev/null 2>&1 || true
  fi
}

build_service() {
  local svc="$1" tag="$2" dockerfile_rel="$3" cold="$4"
  local dockerfile="$ROOT_DIR/$dockerfile_rel"
  [[ -f "$dockerfile" ]] || die "Dockerfile not found for $svc at $dockerfile_rel"

  local start end elapsed
  start="$(now_ns)"
  if [[ "${VERBOSE:-0}" == "1" ]]; then
    if [[ "$cold" == "true" ]]; then
      DOCKER_BUILDKIT=1 docker build --no-cache --progress=plain -f "$dockerfile" -t "$tag" "$ROOT_DIR"
    else
      DOCKER_BUILDKIT=1 docker build --progress=plain -f "$dockerfile" -t "$tag" "$ROOT_DIR"
    fi
  else
    if [[ "$cold" == "true" ]]; then
      DOCKER_BUILDKIT=1 docker build --no-cache --progress=plain -f "$dockerfile" -t "$tag" "$ROOT_DIR" >/dev/null
    else
      DOCKER_BUILDKIT=1 docker build --progress=plain -f "$dockerfile" -t "$tag" "$ROOT_DIR" >/dev/null
    fi
  fi
  end="$(now_ns)"
  elapsed="$(elapsed_ms "$start" "$end")"
  echo "$elapsed"
}

print_usage() {
  cat <<EOF
Benchmark cold vs warm Docker builds for admin, space, web, live.

Usage:
  $(basename "$0") [--services svc1,svc2,...] [--no-prune] [--aggressive-prune] [--help]

Options:
  --services          Comma-separated list of services to bench (default: $DEFAULT_SERVICES)
                      Valid services: ${!DOCKERFILES[@]}
  --no-prune          Do not prune build cache before cold builds (faster but not a true cold build)
  --aggressive-prune  Prune images/containers/volumes in addition to build cache (slow, but most isolated)
  --verbose           Show build output (default: silent)
  --help              Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --services web,admin
  $(basename "$0") --no-prune
  $(basename "$0") --aggressive-prune
EOF
}

# ---------------------------
# Parse args
# ---------------------------
while (( "$#" )); do
  case "$1" in
    --services)
      shift
      [[ $# -gt 0 ]] || die "--services requires a value"
      SERVICES="$1"
      ;;
    --no-prune)
      NO_PRUNE="true"
      ;;
    --aggressive-prune)
      AGGRESSIVE_PRUNE="true"
      ;;
    --verbose)
      VERBOSE="1"
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
  shift
done

# Resolve conflicting options
if [[ "$AGGRESSIVE_PRUNE" == "true" && "$NO_PRUNE" == "true" ]]; then
  log "Both --no-prune and --aggressive-prune specified; ignoring --no-prune."
  NO_PRUNE="false"
fi

# ---------------------------
# Preconditions
# ---------------------------
have docker || die "Docker is required. Please install Docker and ensure the daemon is running."
# Verify Docker daemon is reachable
if ! docker info >/dev/null 2>&1; then
  die "Docker daemon is not running or is not reachable. Please start Docker (e.g., Docker Desktop) and try again."
fi

# Normalize service list
IFS=',' read -r -a SELECTED <<< "$SERVICES"

# Validate services
for s in "${SELECTED[@]}"; do
  [[ -n "${DOCKERFILES[$s]:-}" ]] || die "Unknown service: $s"
done

# ---------------------------
# Bench
# ---------------------------
declare -A COLD_TIME_MS
declare -A WARM_TIME_MS
declare -A COLD_IMG_SIZE
declare -A WARM_IMG_SIZE

log "Benchmarking services: ${SELECTED[*]}"
log "Build cache size (before): $(build_cache_size_str)"

for svc in "${SELECTED[@]}"; do
  tag="${TAGS[$svc]}"
  df_rel="${DOCKERFILES[$svc]}"

  log "=== $svc: preparing cold build ==="
  remove_image_if_exists "$tag"
  if [[ "$NO_PRUNE" != "true" ]]; then
    prune_build_cache
  else
    log "Skipping build cache prune (--no-prune)"
  fi

  log "$svc: cold build start"
  ct="$(build_service "$svc" "$tag" "$df_rel" "true")"
  COLD_TIME_MS["$svc"]="$ct"
  COLD_IMG_SIZE["$svc"]="$(image_size_bytes "$tag")"
  log "$svc: cold build done in $(human_ms "$ct"), image size=$(human_bytes "${COLD_IMG_SIZE[$svc]}")"

  log "$svc: warm build start"
  wt="$(build_service "$svc" "$tag" "$df_rel" "false")"
  WARM_TIME_MS["$svc"]="$wt"
  WARM_IMG_SIZE["$svc"]="$(image_size_bytes "$tag")"
  log "$svc: warm build done in $(human_ms "$wt"), image size=$(human_bytes "${WARM_IMG_SIZE[$svc]}")"
done

log "Build cache size (after): $(build_cache_size_str)"

# ---------------------------
# Summary
# ---------------------------
echo
echo "================ Build Bench Summary ================"
printf "%-8s | %-12s | %-12s | %-12s | %-12s\n" "Service" "Cold Time" "Warm Time" "Cold Image" "Warm Image"
printf -- "---------+--------------+--------------+--------------+--------------\n"
for svc in "${SELECTED[@]}"; do
  printf "%-8s | %-12s | %-12s | %-12s | %-12s\n" \
    "$svc" \
    "$(human_ms "${COLD_TIME_MS[$svc]}")" \
    "$(human_ms "${WARM_TIME_MS[$svc]}")" \
    "$(human_bytes "${COLD_IMG_SIZE[$svc]}")" \
    "$(human_bytes "${WARM_IMG_SIZE[$svc]}")"
done
echo "====================================================="
echo
echo "Notes:"
echo "- Cold builds prune build cache (unless --no-prune) and remove target images."
echo "- Warm builds immediately rebuild with cache populated from the cold build."
echo "- Build cache size uses docker buildx du if available; otherwise a docker system df heuristic."
echo
echo "Done."
