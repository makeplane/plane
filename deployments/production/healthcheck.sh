#!/usr/bin/env bash
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

MANIFEST_PATH="${1:-}"
[[ -n "$MANIFEST_PATH" ]] || fail "usage: healthcheck.sh MANIFEST.json"

verify_release "$MANIFEST_PATH"
log "health verification succeeded"
