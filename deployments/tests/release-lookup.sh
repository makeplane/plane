#!/bin/bash
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# Run from any directory with: bash deployments/tests/release-lookup.sh
# No network requests or Docker commands are made.

set -uo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT
passed=0
failed=0

# Load only the functions under test, without running installer initialization
# or the interactive menu. Top-level closing braces delimit these functions.
load_function() {
    local name=$1
    awk -v name="$name" '
        $0 ~ "^function " name "\\(\\)" { capture = 1 }
        capture { print }
        capture && /^}/ { exit }
    ' "$script"
}

check_result() {
    local name=$1
    local actual_status=$2
    local expected_status=$3
    local expected_output=$4
    if [ "$actual_status" -eq "$expected_status" ] && [ "$output" = "$expected_output" ]; then
        echo "PASS $label: $name"
        passed=$((passed + 1))
    else
        printf 'FAIL %s: %s (status=%s, output=%q)\n' "$label" "$name" "$actual_status" "$output"
        failed=$((failed + 1))
    fi
}

for label in cli swarm; do
    if [ "$label" = cli ]; then
        script="$ROOT/deployments/cli/community/install.sh"
        entry=install
    else
        script="$ROOT/deployments/swarm/community/swarm.sh"
        entry=deployStack
    fi
    eval "$(load_function checkLatestRelease)"
    eval "$(load_function "$entry")"
    eval "$(load_function upgrade)"
    GH_REPO=makeplane/plane
    BRANCH=preview

    curl() { printf '%s' "$response"; return "$curl_status"; }
    curl_status=0
    for response in \
        '{"tag_name": "v1.4.2"}' \
        '{"tag_name":"v1.4.2"}' \
        '{"tag_name"  :  "v1.4.2"}' \
        $'{"tag_name"\t:\t"v1.4.2"}' \
        $'{\n"tag_name":\n"v1.4.2"\n}'; do
        output=$(checkLatestRelease 2>"$TEMP_DIR/stderr")
        check_result "parse $response" "$?" 0 v1.4.2
    done

    for response in '' '{}' '{"message":"API rate limit exceeded"}' '{"tag_name":""}'; do
        output=$(checkLatestRelease 2>"$TEMP_DIR/stderr")
        check_result "reject $response" "$?" 1 ''
    done

    response='{"tag_name": "v1.4.2"}'
    curl_status=22
    output=$(checkLatestRelease 2>"$TEMP_DIR/stderr")
    check_result 'reject failed HTTP request even with a response body' "$?" 1 ''

    # A lookup failure must stop before manifest checks, downloads or shutdown.
    # These sentinels replace side effects and fail if execution reaches them.
    initialize() { echo 'UNEXPECTED SIDE EFFECT'; exit 99; }
    download() { echo 'UNEXPECTED SIDE EFFECT'; exit 99; }
    stopServices() { echo 'UNEXPECTED SIDE EFFECT'; exit 99; }
    checkLatestRelease() { return 1; }
    APP_RELEASE=stable
    stack_name=plane
    DOCKER_FILE_PATH="$TEMP_DIR/missing-compose.yml"
    DOCKER_ENV_PATH="$TEMP_DIR/missing.env"
    output=$("$entry" 2>"$TEMP_DIR/stderr")
    status=$?
    if [ "$label" = cli ]; then
        expected='Begin Installing Plane'
    else
        expected=$'Configuration files not found\nDownloading it now......'
    fi
    check_result 'initial install stops on lookup failure' "$status" 1 "$expected"

    output=$(upgrade <<< y 2>"$TEMP_DIR/stderr")
    status=$?
    expected=''
    if [ "$label" = swarm ]; then
        expected='Checking status of plane stack...'
    fi
    check_result 'upgrade stops on lookup failure' "$status" 1 "$expected"
done

printf '\n%s passed, %s failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ]
