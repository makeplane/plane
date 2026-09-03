# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.membership_realtime import (
    EVENT_PROJECT_MEMBER_REMOVED,
    EVENT_WORKSPACE_MEMBER_REMOVED,
    build_membership_removed_event,
    membership_realtime_channel,
)


@pytest.mark.unit
def test_membership_realtime_channel():
    assert membership_realtime_channel("user-1") == "plane:membership:user-1"


@pytest.mark.unit
def test_build_workspace_member_removed_event():
    event = build_membership_removed_event(
        event_type=EVENT_WORKSPACE_MEMBER_REMOVED,
        actor_id="admin-1",
        user_id="user-1",
        workspace_id="ws-1",
        workspace_slug="acme",
    )
    assert event == {
        "type": "workspace.member.removed",
        "actor_id": "admin-1",
        "user_id": "user-1",
        "workspace_id": "ws-1",
        "workspace_slug": "acme",
        "project_id": None,
    }


@pytest.mark.unit
def test_build_project_member_removed_event_requires_project_id():
    assert (
        build_membership_removed_event(
            event_type=EVENT_PROJECT_MEMBER_REMOVED,
            actor_id="admin-1",
            user_id="user-1",
            workspace_slug="acme",
        )
        is None
    )

    event = build_membership_removed_event(
        event_type=EVENT_PROJECT_MEMBER_REMOVED,
        actor_id="admin-1",
        user_id="user-1",
        workspace_id="ws-1",
        workspace_slug="acme",
        project_id="proj-1",
    )
    assert event["type"] == "project.member.removed"
    assert event["project_id"] == "proj-1"
