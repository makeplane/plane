#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_API_BASE_URL with run-time NEXT_PUBLIC_API_BASE_URL
# NOTE: if these values are the same, this will be skipped.
/usr/local/bin/replace-env-vars.sh "$BUILT_NEXT_PUBLIC_API_BASE_URL" "$NEXT_PUBLIC_API_BASE_URL"
/usr/local/bin/replace-env-vars.sh "NEXT_PUBLIC_AUTO_OIDC_PLACEHOLDER" "$NEXT_PUBLIC_AUTO_OIDC"
/usr/local/bin/replace-env-vars.sh "NEXT_PUBLIC_ENABLE_OIDC_PLACEHOLDER" "$NEXT_PUBLIC_ENABLE_OIDC"
/usr/local/bin/replace-env-vars.sh "NEXT_PUBLIC_OIDC_CLIENT_ID_PLACEHOLDER" "$NEXT_PUBLIC_OIDC_CLIENT_ID"
/usr/local/bin/replace-env-vars.sh "NEXT_PUBLIC_OIDC_URL_AUTHORIZE_PLACEHOLDER" "$NEXT_PUBLIC_OIDC_URL_AUTHORIZE"

echo "Starting Plane Frontend.."
node apps/app/server.js