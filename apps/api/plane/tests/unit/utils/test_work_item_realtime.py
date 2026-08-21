# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch

import pytest

from plane.db.models import Issue, Project, State, Workspace
from plane.utils.work_item_realtime import (
    ACTIVITY_TYPE_TO_EVENT,
    build_work_item_realtime_event,
    publish_work_item_activity,
    serialize_work_item,
    work_item_realtime_channel,
)


@pytest.mark.unit
class TestWorkItemRealtime:
    def test_channel_name_includes_project_id(self):
        project_id = "11111111-1111-1111-1111-111111111111"
        assert work_item_realtime_channel(project_id) == f"plane:work-items:{project_id}"

    def test_unknown_activity_types_are_ignored(self):
        assert "comment.activity.created" not in ACTIVITY_TYPE_TO_EVENT
        assert build_work_item_realtime_event(
            "comment.activity.created",
            project_id="11111111-1111-1111-1111-111111111111",
            actor_id="22222222-2222-2222-2222-222222222222",
            issue_id="33333333-3333-3333-3333-333333333333",
        ) is None

    @pytest.mark.django_db
    def test_serialize_work_item_includes_board_fields(self, create_user):
        workspace = Workspace.objects.create(
            name="Realtime Workspace",
            slug="realtime-workspace",
            owner=create_user,
        )
        project = Project.objects.create(
            name="Realtime Project",
            identifier="RT",
            workspace=workspace,
            created_by=create_user,
        )
        state = State.objects.create(
            name="Todo",
            project=project,
            workspace=workspace,
            group="unstarted",
            color="#3f76ff",
            default=True,
            created_by=create_user,
        )
        issue = Issue.objects.create(
            name="Realtime issue",
            workspace=workspace,
            project=project,
            state=state,
            created_by=create_user,
        )

        payload = serialize_work_item(issue)

        assert payload["id"] == str(issue.id)
        assert payload["name"] == "Realtime issue"
        assert payload["state_id"] == str(state.id)
        assert payload["project_id"] == str(project.id)
        assert payload["module_ids"] == []
        assert payload["assignee_ids"] == []
        assert payload["label_ids"] == []
        assert payload["cycle_id"] is None

    @pytest.mark.django_db
    def test_build_created_event_includes_issue(self, create_user):
        workspace = Workspace.objects.create(
            name="Realtime Workspace 2",
            slug="realtime-workspace-2",
            owner=create_user,
        )
        project = Project.objects.create(
            name="Realtime Project 2",
            identifier="RT2",
            workspace=workspace,
            created_by=create_user,
        )
        state = State.objects.create(
            name="Todo",
            project=project,
            workspace=workspace,
            group="unstarted",
            color="#3f76ff",
            default=True,
            created_by=create_user,
        )
        issue = Issue.objects.create(
            name="Created issue",
            workspace=workspace,
            project=project,
            state=state,
            created_by=create_user,
        )

        event = build_work_item_realtime_event(
            "issue.activity.created",
            project_id=project.id,
            actor_id=create_user.id,
            issue_id=issue.id,
        )

        assert event["type"] == "issue.created"
        assert event["issue_id"] == str(issue.id)
        assert event["issue"]["name"] == "Created issue"
        assert event["actor_id"] == str(create_user.id)

    @pytest.mark.django_db
    def test_deleted_event_has_no_issue_body(self, create_user):
        workspace = Workspace.objects.create(
            name="Realtime Workspace 3",
            slug="realtime-workspace-3",
            owner=create_user,
        )
        project = Project.objects.create(
            name="Realtime Project 3",
            identifier="RT3",
            workspace=workspace,
            created_by=create_user,
        )
        issue_id = "44444444-4444-4444-4444-444444444444"

        event = build_work_item_realtime_event(
            "issue.activity.deleted",
            project_id=project.id,
            actor_id=create_user.id,
            issue_id=issue_id,
        )

        assert event["type"] == "issue.deleted"
        assert event["issue_id"] == issue_id
        assert event["issue"] is None

    @patch("plane.utils.work_item_realtime.redis_instance")
    def test_publish_sends_json_to_project_channel(self, mock_redis_instance):
        redis = MagicMock()
        mock_redis_instance.return_value = redis

        project_id = "11111111-1111-1111-1111-111111111111"
        issue_id = "33333333-3333-3333-3333-333333333333"
        actor_id = "22222222-2222-2222-2222-222222222222"

        with patch(
            "plane.utils.work_item_realtime.build_work_item_realtime_event",
            return_value={
                "type": "issue.updated",
                "actor_id": actor_id,
                "project_id": project_id,
                "issue_id": issue_id,
                "issue": {"id": issue_id, "name": "Updated"},
            },
        ):
            published = publish_work_item_activity(
                "issue.activity.updated",
                project_id=project_id,
                actor_id=actor_id,
                issue_id=issue_id,
            )

        assert published is True
        redis.publish.assert_called_once()
        channel, payload = redis.publish.call_args[0]
        assert channel == f"plane:work-items:{project_id}"
        assert "issue.updated" in payload
