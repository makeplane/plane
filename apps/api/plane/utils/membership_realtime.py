# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.core.serializers.json import DjangoJSONEncoder

from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception

MEMBERSHIP_REALTIME_CHANNEL_PREFIX = "plane:membership:"

EVENT_WORKSPACE_MEMBER_REMOVED = "workspace.member.removed"
EVENT_PROJECT_MEMBER_REMOVED = "project.member.removed"


def membership_realtime_channel(user_id) -> str:
    return f"{MEMBERSHIP_REALTIME_CHANNEL_PREFIX}{user_id}"


def build_membership_removed_event(
    *,
    event_type: str,
    actor_id,
    user_id,
    workspace_id=None,
    workspace_slug: str | None = None,
    project_id=None,
) -> dict | None:
    if event_type not in {EVENT_WORKSPACE_MEMBER_REMOVED, EVENT_PROJECT_MEMBER_REMOVED}:
        return None
    if not user_id or not workspace_slug:
        return None
    if event_type == EVENT_PROJECT_MEMBER_REMOVED and not project_id:
        return None

    return {
        "type": event_type,
        "actor_id": str(actor_id) if actor_id else "",
        "user_id": str(user_id),
        "workspace_id": str(workspace_id) if workspace_id else "",
        "workspace_slug": workspace_slug,
        "project_id": str(project_id) if project_id else None,
    }


def publish_membership_removed(
    *,
    event_type: str,
    actor_id,
    user_id,
    workspace_id=None,
    workspace_slug: str | None = None,
    project_id=None,
) -> bool:
    try:
        event = build_membership_removed_event(
            event_type=event_type,
            actor_id=actor_id,
            user_id=user_id,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            project_id=project_id,
        )
        if event is None:
            return False

        ri = redis_instance()
        ri.publish(
            membership_realtime_channel(user_id),
            json.dumps(event, cls=DjangoJSONEncoder),
        )
        return True
    except Exception as e:
        log_exception(e)
        return False
