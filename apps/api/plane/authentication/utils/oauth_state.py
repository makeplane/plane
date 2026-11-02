# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import secrets


def validate_oauth_state(request, state):
    """Return True only if `state` matches the non-empty state stored in the session at initiation.

    A matching state is removed from the session, so it can only be used once. A missing or
    mismatched state leaves the stored one in place for the login it belongs to.
    """
    expected = request.session.get("state")
    if not (state and expected and secrets.compare_digest(state.encode(), expected.encode())):
        return False
    del request.session["state"]
    return True
