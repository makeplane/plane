# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging

# Third party imports
import requests

# Django imports
from django.conf import settings

# Module imports
from plane.utils.url import normalize_url_path

logger = logging.getLogger("plane.worker")


def broadcast_issue_event(project_id, issue_id=None, type=None, actor_id=None):
    """
    Fire-and-forget broadcast of an issue change event to the live server,
    which relays it to all connected clients of the project over websocket.
    Disabled when LIVE_URL or LIVE_INTERNAL_API_KEY is not configured.
    """
    live_url = getattr(settings, "LIVE_URL", None)
    internal_api_key = getattr(settings, "LIVE_INTERNAL_API_KEY", "")
    if not live_url or not internal_api_key:
        return

    try:
        requests.post(
            normalize_url_path(f"{live_url}/broadcasts/issue-events"),
            json={
                "project_id": str(project_id),
                "issue_id": str(issue_id) if issue_id else None,
                "type": type,
                "actor_id": str(actor_id) if actor_id else None,
            },
            headers={"x-internal-api-key": internal_api_key},
            timeout=2,
        )
    except requests.RequestException as e:
        logger.warning(f"Failed to broadcast issue event for project {project_id}: {e}")
