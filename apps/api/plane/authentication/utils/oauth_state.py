# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import secrets


def validate_oauth_state(request, state):
    """Return True only if `state` matches the non-empty state stored in the session at initiation.

    The stored state is removed on every check, so it can only be used once.
    """
    expected = request.session.pop("state", None)
    return bool(state and expected) and secrets.compare_digest(state.encode(), expected.encode())
