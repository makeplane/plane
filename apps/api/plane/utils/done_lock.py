# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import Issue


def check_issue_done_lock(issue_id, request_data=None, allow_state_change=True):
    """
    Check if an issue is in a "completed" (Done) state group and block modifications.

    Returns a 403 Response if the issue is locked, or None if the operation is allowed.

    Args:
        issue_id: The UUID of the issue to check.
        request_data: The request data dict (used to check if only state_id is being changed).
        allow_state_change: If True, allows changing only the state_id field on a locked issue.
    """
    try:
        issue = Issue.objects.select_related("state").get(pk=issue_id)
    except Issue.DoesNotExist:
        return None  # Let the view handle 404

    if issue.state and issue.state.group == "completed":
        # If the request is only changing state_id, allow it
        if allow_state_change and request_data is not None:
            data_keys = set(request_data.keys()) - {"skip_activity"}
            if data_keys == {"state_id"} or data_keys == {"state"}:
                return None

        return Response(
            {"error": "This issue is in Done state. Change the state to make edits."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return None
