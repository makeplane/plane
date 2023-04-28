#!/bin/bash
set -Ex

function apply_path {

    echo "Check that we have NEXT_PUBLIC_API_BASE_URL vars"
    test -n "$NEXT_PUBLIC_API_BASE_URL"
    echo "$NEXT_PUBLIC_API_BASE_URL"
    find apps/app/.next/ \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_ENVIROMENT_VAR#$NEXT_PUBLIC_API_BASE_URL#g"

}

apply_path
echo "Starting Nextjs"
exec "$@"