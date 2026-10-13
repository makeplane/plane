#!/bin/sh
set -e

# The /<bucket> route forwards to AWS_S3_ENDPOINT_URL, the store the API signs upload and download URLs for.
# Caddy accepts scheme://host:port there but refuses a path, so a trailing slash or path is trimmed; an empty
# value is unset, so the Caddyfile default (plane-minio:9000) applies instead of an upstream-less route.
if [ -z "${AWS_S3_ENDPOINT_URL:-}" ]; then
    unset AWS_S3_ENDPOINT_URL
fi
case "${AWS_S3_ENDPOINT_URL:-}" in
    *://*/*)
        scheme="${AWS_S3_ENDPOINT_URL%%://*}"
        hostport="${AWS_S3_ENDPOINT_URL#*://}"
        export AWS_S3_ENDPOINT_URL="${scheme}://${hostport%%/*}"
        ;;
esac

exec "$@"
