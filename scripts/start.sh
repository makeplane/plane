#!/bin/sh
set -x

scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_GOOGLE_CLIENTID" "$NEXT_PUBLIC_GOOGLE_CLIENTID"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_GITHUB_APP_NAME" "$NEXT_PUBLIC_GITHUB_APP_NAME"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_GITHUB_ID" "$NEXT_PUBLIC_GITHUB_ID"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_SENTRY_DSN" "$NEXT_PUBLIC_SENTRY_DSN"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_ENABLE_OAUTH" "$NEXT_PUBLIC_ENABLE_OAUTH"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_ENABLE_SENTRY" "$NEXT_PUBLIC_ENABLE_SENTRY"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_ENABLE_SESSION_RECORDER" "$NEXT_PUBLIC_ENABLE_SESSION_RECORDER"
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_TRACK_EVENTS" "$NEXT_PUBLIC_TRACK_EVENTS"

yarn start