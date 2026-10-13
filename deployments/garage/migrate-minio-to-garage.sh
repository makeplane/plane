#!/usr/bin/env bash
# Copy Plane's bundled MinIO data into a Garage data directory, for a Garage you run and manage yourself.
#
#   ./migrate-minio-to-garage.sh <minio-volume> <garage-volume>
#
# Each argument is a Docker named volume or a host directory:
#   <minio-volume>   what Plane's MinIO mounts at /export, e.g. the `plane-app_uploads` volume, or <install>/data/minio/uploads
#   <garage-volume>  your Garage's storage; meta/ and data/ are created in it. Mount it at /var/lib/garage.
#                    See README.md in this directory for running Garage and connecting Plane to it.
#
# MinIO's on-disk format is not Garage's, so files are not copied directly: the script starts both stores on the
# volumes, copies the bucket over S3, and verifies every object. The MinIO volume is only read. Stop Plane first.
# Re-running is safe: objects already copied are skipped.
#
# It leaves two files for your Garage deployment: garage.toml (the config it used) and an env file with Garage's
# secrets and the key Plane will use. Start your Garage with both, and it serves the copied bucket as-is.
#
# Optional environment (defaults match a stock Plane install):
#   BUCKET                                  bucket Plane uses               (uploads)
#   AWS_REGION                              region Plane signs for          (us-east-1)
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  Garage key for Plane; generated when unset
#   GARAGE_RPC_SECRET / GARAGE_ADMIN_TOKEN  generated when unset
#   GARAGE_ENV_FILE                         Garage env file to write/reuse  (./garage.env)
#   GARAGE_CONFIG_FILE_OUT                  Garage config to write          (./garage.toml)
#   GARAGE_ENDPOINT                         URL Plane will reach Garage at  (http://garage:3900)
#   VERIFY_CONTENT=1                        also compare sha256 of every object (slow on large buckets)
#   MINIO_IMAGE / GARAGE_IMAGE / MC_IMAGE   images to use (set to locally loaded tags when air-gapped)

set -euo pipefail

MINIO_IMAGE=${MINIO_IMAGE:-docker.io/pgsty/silo:RELEASE.2026-09-16T00-00-00Z}
GARAGE_IMAGE=${GARAGE_IMAGE:-docker.io/dxflrs/garage:v2.4.1}
MC_IMAGE=${MC_IMAGE:-docker.io/pgsty/mc:RELEASE.2026-09-16T00-00-00Z}
BUCKET=${BUCKET:-uploads}
AWS_REGION=${AWS_REGION:-us-east-1}
VERIFY_CONTENT=${VERIFY_CONTENT:-0}
GARAGE_ENV_FILE=${GARAGE_ENV_FILE:-./garage.env}
GARAGE_CONFIG_FILE_OUT=${GARAGE_CONFIG_FILE_OUT:-./garage.toml}
GARAGE_ENDPOINT=${GARAGE_ENDPOINT:-http://garage:3900}

RUN_ID="plane-m2g-$$"
NET="$RUN_ID-net"
MINIO_C="$RUN_ID-minio"
GARAGE_C="$RUN_ID-garage"
WORK_DIR=$(mktemp -d)

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWARNING:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

cleanup() {
    docker rm -f "$MINIO_C" "$GARAGE_C" >/dev/null 2>&1 || true
    docker network rm "$NET" >/dev/null 2>&1 || true
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

hex() { od -An -N"$1" -tx1 /dev/urandom | tr -d ' \n'; }

# The temporary MinIO gets throwaway credentials. MinIO reads its root credentials from the environment at
# startup, not from the volume, so the old install's credentials are never needed.
MINIO_ROOT_USER="m2g$(hex 6)"
MINIO_ROOT_PASSWORD=$(hex 16)

# Docker volume names cannot contain "/", so anything with a slash, or an existing directory, is a host path.
is_path() { [[ "$1" == */* || -d "$1" ]]; }

# A host directory is bind-mounted; anything else is treated as a Docker named volume.
mount_spec() {
    local src=$1 target=$2 opts=${3:-}
    if is_path "$src"; then
        printf -- '--mount type=bind,src=%s,dst=%s%s' "$(cd "$src" && pwd)" "$target" "$opts"
    else
        printf -- '--mount type=volume,src=%s,dst=%s%s' "$src" "$target" "$opts"
    fi
}

# Run mc on the private network with aliases for both stores. Credentials go in as variables, not a URL,
# so a password containing @ or : still works.
mc() {
    docker run --rm --network "$NET" -e MC_CONFIG_DIR=/tmp/mc \
        -e "SRC_USER=$MINIO_ROOT_USER" -e "SRC_PASS=$MINIO_ROOT_PASSWORD" \
        -e "DST_USER=$AWS_ACCESS_KEY_ID" -e "DST_PASS=$AWS_SECRET_ACCESS_KEY" \
        --entrypoint sh "$MC_IMAGE" -c \
        "mc alias set minio http://$MINIO_C:9000 \"\$SRC_USER\" \"\$SRC_PASS\" >/dev/null &&
         mc alias set garage http://$GARAGE_C:3900 \"\$DST_USER\" \"\$DST_PASS\" >/dev/null && $1"
}

# ---------------------------------------------------------------- arguments and preflight

[[ $# -eq 2 ]] || die "usage: $0 <minio-volume> <garage-volume>"
MINIO_SRC=$1
GARAGE_DST=$2
command -v docker >/dev/null || die "docker is not installed or not on PATH"
docker info >/dev/null 2>&1 || die "cannot reach the Docker daemon"

if is_path "$MINIO_SRC"; then
    [[ -d "$MINIO_SRC" ]] || die "MinIO directory $MINIO_SRC does not exist"
    [[ -d "$MINIO_SRC/.minio.sys" ]] || die "$MINIO_SRC has no .minio.sys: point at the directory MinIO mounts at /export (e.g. <install>/data/minio/uploads)"
else
    docker volume inspect "$MINIO_SRC" >/dev/null 2>&1 || die "Docker volume $MINIO_SRC does not exist"
fi
if is_path "$GARAGE_DST"; then
    mkdir -p "$GARAGE_DST/meta" "$GARAGE_DST/data"
elif ! docker volume inspect "$GARAGE_DST" >/dev/null 2>&1; then
    log "creating Docker volume $GARAGE_DST"
    docker volume create "$GARAGE_DST" >/dev/null
fi

# A previous run's settings win over generating new ones: the key it created already lives in the Garage
# volume, and Garage refuses to start if that key comes back with a different secret.
if [[ -f "$GARAGE_ENV_FILE" ]]; then
    log "reusing settings from $GARAGE_ENV_FILE"
    # shellcheck disable=SC1090
    source "$GARAGE_ENV_FILE"
    AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-${GARAGE_DEFAULT_ACCESS_KEY:-}}
    AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-${GARAGE_DEFAULT_SECRET_KEY:-}}
fi

# Garage refuses a secret shorter than 16 characters, and Plane's old default (secret-key) is 10.
if [[ -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
    AWS_ACCESS_KEY_ID="GK$(hex 12)"
    AWS_SECRET_ACCESS_KEY=$(hex 32)
fi
[[ ${#AWS_SECRET_ACCESS_KEY} -ge 16 ]] || die "AWS_SECRET_ACCESS_KEY must be at least 16 characters (Garage rejects shorter ones)"
[[ ${#AWS_ACCESS_KEY_ID} -ge 8 ]] || die "AWS_ACCESS_KEY_ID must be at least 8 characters"
GARAGE_RPC_SECRET=${GARAGE_RPC_SECRET:-$(hex 32)}
GARAGE_ADMIN_TOKEN=${GARAGE_ADMIN_TOKEN:-$(hex 32)}
[[ "$GARAGE_RPC_SECRET" =~ ^[0-9a-f]{64}$ ]] || die "GARAGE_RPC_SECRET must be 64 lowercase hex characters (openssl rand -hex 32)"

# Garage's own env file, written before Garage first starts so a run that fails halfway never strands a key
# nobody has the secret for. Your Garage deployment reads it as-is (env_file / --env-file).
( umask 077; cat > "$GARAGE_ENV_FILE" <<EOF
GARAGE_RPC_SECRET=${GARAGE_RPC_SECRET}
GARAGE_ADMIN_TOKEN=${GARAGE_ADMIN_TOKEN}
GARAGE_DEFAULT_ACCESS_KEY=${AWS_ACCESS_KEY_ID}
GARAGE_DEFAULT_SECRET_KEY=${AWS_SECRET_ACCESS_KEY}
GARAGE_DEFAULT_BUCKET=${BUCKET}
EOF
)

for c in $(docker ps -q); do
    if docker inspect -f '{{range .Mounts}}{{.Name}} {{.Source}} {{end}}' "$c" | tr ' ' '\n' | grep -qxF -e "$MINIO_SRC" -e "$(cd "$MINIO_SRC" 2>/dev/null && pwd || echo "$MINIO_SRC")"; then
        die "container $(docker inspect -f '{{.Name}}' "$c") is using $MINIO_SRC. Stop Plane before migrating."
    fi
done

# ---------------------------------------------------------------- start both stores

# Single node: SQLite metadata (LMDB can corrupt on an unclean shutdown with no peer to recover from), fsync on,
# path-style S3. Your Garage must run with this same file, mounting the Garage volume at /var/lib/garage.
cat > "$WORK_DIR/garage.toml" <<EOF
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"
metadata_fsync = true
data_fsync = true
metadata_auto_snapshot_interval = "6h"
compression_level = 1
replication_factor = 1
rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"

[s3_api]
api_bind_addr = "[::]:3900"
s3_region = "${AWS_REGION}"

[admin]
api_bind_addr = "[::]:3903"
EOF

# An existing garage.toml (the one shipped next to this script, or your own) is used as-is, so the copy runs on
# exactly the config your Garage will run with. Otherwise the default above is written out for it.
if [[ -f "$GARAGE_CONFIG_FILE_OUT" ]]; then
    grep -q '^metadata_dir *= *"/var/lib/garage/meta"' "$GARAGE_CONFIG_FILE_OUT" \
        && grep -q '^data_dir *= *"/var/lib/garage/data"' "$GARAGE_CONFIG_FILE_OUT" \
        || die "$GARAGE_CONFIG_FILE_OUT must use metadata_dir=/var/lib/garage/meta and data_dir=/var/lib/garage/data"
    grep -q "^s3_region *= *\"$AWS_REGION\"" "$GARAGE_CONFIG_FILE_OUT" \
        || die "s3_region in $GARAGE_CONFIG_FILE_OUT must equal AWS_REGION ($AWS_REGION), or Garage rejects Plane's requests"
    cp "$GARAGE_CONFIG_FILE_OUT" "$WORK_DIR/garage.toml"
    log "using $GARAGE_CONFIG_FILE_OUT"
else
    cp "$WORK_DIR/garage.toml" "$GARAGE_CONFIG_FILE_OUT"
fi

docker network create "$NET" >/dev/null

# Read-only, so the source stays an untouched rollback copy: on startup MinIO otherwise rewrites .minio.sys
# (it renames its tmp directory, and may heal or upgrade metadata). It serves every read from a read-only drive.
log "starting MinIO on $MINIO_SRC (read-only)"
# shellcheck disable=SC2046
docker run -d --name "$MINIO_C" --network "$NET" \
    -e "MINIO_ROOT_USER=$MINIO_ROOT_USER" -e "MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD" \
    $(mount_spec "$MINIO_SRC" /export ,readonly) "$MINIO_IMAGE" server /export >/dev/null

log "starting Garage on $GARAGE_DST"
# One mount holds both meta/ and data/, whether it is a host directory or a named volume.
if is_path "$GARAGE_DST"; then
    GARAGE_MOUNTS=(--mount "type=bind,src=$(cd "$GARAGE_DST" && pwd),dst=/var/lib/garage")
else
    GARAGE_MOUNTS=(--mount "type=volume,src=$GARAGE_DST,dst=/var/lib/garage")
fi
docker run -d --name "$GARAGE_C" --network "$NET" \
    -e GARAGE_CONFIG_FILE=/etc/garage.toml \
    -e "GARAGE_RPC_SECRET=$GARAGE_RPC_SECRET" -e "GARAGE_ADMIN_TOKEN=$GARAGE_ADMIN_TOKEN" \
    -e "GARAGE_DEFAULT_ACCESS_KEY=$AWS_ACCESS_KEY_ID" -e "GARAGE_DEFAULT_SECRET_KEY=$AWS_SECRET_ACCESS_KEY" \
    -e "GARAGE_DEFAULT_BUCKET=$BUCKET" \
    --mount "type=bind,src=$WORK_DIR/garage.toml,dst=/etc/garage.toml,readonly" \
    "${GARAGE_MOUNTS[@]}" "$GARAGE_IMAGE" \
    /garage server --single-node --default-access-key --default-bucket >/dev/null

log "waiting for both stores"
for _ in $(seq 1 60); do
    if docker exec "$GARAGE_C" /garage status >/dev/null 2>&1 && mc "mc ls minio >/dev/null 2>&1"; then
        READY=1
        break
    fi
    if [[ "$(docker inspect -f '{{.State.Running}}' "$GARAGE_C")" != "true" ]]; then
        docker logs --tail 5 "$GARAGE_C" >&2
        die "Garage exited. If the key already exists in $GARAGE_DST, rerun with the same AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY as before."
    fi
    sleep 2
done
[[ "${READY:-0}" == 1 ]] || { docker logs --tail 5 "$MINIO_C" >&2; die "stores did not become ready in 120s"; }
mc "mc ls garage/$BUCKET >/dev/null" || die "Garage is up but bucket $BUCKET is not reachable with the generated key"

# ---------------------------------------------------------------- copy and verify

if ! mc "mc ls minio/$BUCKET >/dev/null 2>&1"; then
    warn "MinIO has no bucket '$BUCKET': nothing to copy. Garage is provisioned and empty."
    SRC_COUNT=0
else
    OTHER=$(mc "mc ls minio" | awk '{print $NF}' | tr -d / | grep -vxF "$BUCKET" || true)
    [[ -z "$OTHER" ]] || warn "MinIO also has bucket(s) Plane does not use, not copied: $(echo $OTHER)"
    if mc "mc anonymous get minio/$BUCKET" | grep -qiE "download|public"; then
        warn "bucket '$BUCKET' is anonymously readable on MinIO. Garage has no anonymous reads, so links saved by old Plane releases as /$BUCKET/<key> stop loading."
    fi

    SRC_BYTES=$(mc "mc du --json minio/$BUCKET" | sed -n 's/.*"size":\([0-9]*\).*/\1/p' | tail -1)
    # The mc image has df but no awk or sed, so df's output is parsed here on the host.
    FREE_BYTES=$(docker run --rm "${GARAGE_MOUNTS[@]}" --entrypoint df "$MC_IMAGE" -Pk /var/lib/garage | awk 'NR==2{print $4*1024}')
    if [[ -n "$SRC_BYTES" && -n "$FREE_BYTES" && "$FREE_BYTES" -lt $((SRC_BYTES * 12 / 10)) ]]; then
        die "not enough space: need about $((SRC_BYTES * 12 / 10 / 1048576)) MiB free for Garage, have $((FREE_BYTES / 1048576)) MiB"
    fi

    log "copying bucket '$BUCKET' ($(( ${SRC_BYTES:-0} / 1048576 )) MiB) from MinIO to Garage"
    # No --preserve: it would also copy the bucket policy, which Garage does not implement (501).
    mc "mc mirror --retry minio/$BUCKET garage/$BUCKET" | tail -3

    log "verifying"
    DIFF=$(mc "mc diff minio/$BUCKET garage/$BUCKET" || true)
    SRC_COUNT=$(mc "mc ls -r minio/$BUCKET | wc -l" | tr -d ' ')
    DST_COUNT=$(mc "mc ls -r garage/$BUCKET | wc -l" | tr -d ' ')
    if [[ -n "$DIFF" || "$SRC_COUNT" != "$DST_COUNT" ]]; then
        echo "$DIFF" | head -20 >&2
        die "verification failed: MinIO has $SRC_COUNT objects, Garage has $DST_COUNT. Rerun to copy what is missing."
    fi
    if [[ "$VERIFY_CONTENT" == 1 ]]; then
        log "comparing sha256 of every object"
        HASHES='mc find "$1" | while IFS= read -r p; do printf "%s  %s\n" "$(mc cat "$p" | sha256sum | cut -d" " -f1)" "${p#"$1"/}"; done | sort'
        if [[ "$(mc "f() { $HASHES; }; f minio/$BUCKET")" != "$(mc "f() { $HASHES; }; f garage/$BUCKET")" ]]; then
            die "content verification failed: some objects differ. Rerun the script."
        fi
    fi
    log "verified: $SRC_COUNT objects, names and sizes identical$([[ "$VERIFY_CONTENT" == 1 ]] && echo ", sha256 identical")"
fi

# ---------------------------------------------------------------- next steps

cat <<EOF

Done. MinIO's data was not modified.

1. Run your Garage with:
     config   $GARAGE_CONFIG_FILE_OUT                (mount at /etc/garage.toml, GARAGE_CONFIG_FILE=/etc/garage.toml)
     env      $GARAGE_ENV_FILE  (mode 600)           (secrets and Plane's key; keep it, Garage cannot show the secret again)
     storage  $GARAGE_DST                  (mount at /var/lib/garage)
     command  /garage server --single-node --default-access-key --default-bucket

2. Point Plane at it in plane.env (keep the key and secret together):

USE_MINIO=1
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_S3_BUCKET_NAME=${BUCKET}
AWS_S3_ENDPOINT_URL=${GARAGE_ENDPOINT}
EOF
exit 0
