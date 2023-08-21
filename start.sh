#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_API_BASE_URL with run-time NEXT_PUBLIC_API_BASE_URL
# NOTE: if these values are the same, this will be skipped.
/usr/local/bin/replace-env-vars.sh "$BUILT_NEXT_PUBLIC_API_BASE_URL" "$NEXT_PUBLIC_API_BASE_URL" $2

echo "Starting Plane Frontend.."
node $1
