# Copyright (c) 2026-present Zebaria.
# SPDX-License-Identifier: AGPL-3.0-only
"""Unit tests for plane.bgtasks.silo_notification_task.

Covers the dispatch task that fans Plane work-item events out to silo:
  - No mappings → fast no-op (no HTTP request)
  - work_item.created emits the right payload shape
  - issue.activity.updated narrows to state_changed/completed by inspecting diff
  - work_item.commented hydrates comment_text via _render_comment_for_slack
  - Mention rendering: <mention-component> → <@SLACK_UID> for mapped users,
    @display_name for unmapped
  - dm_targets: assignees + mentions, minus self when SILO_DM_SKIP_SELF=True
  - SILO_DM_SKIP_SELF=False → self DMs allowed (solo-dev mode)
"""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from django.test import override_settings

from plane.bgtasks.silo_notification_task import (
    SLACK_NOTIFICATION_TYPE,
    _render_comment_for_slack,
    dispatch_silo_work_item_event,
)
from plane.connections.models import (
    WorkspaceConnection,
    WorkspaceCredential,
    WorkspaceEntityConnection,
    WorkspaceUserConnection,
)
from plane.db.models import Issue, IssueComment, Project, ProjectMember, State


# ============================================================
# Fixtures specific to silo notification tests
# ============================================================


@pytest.fixture
def project(db, create_user, workspace):
    p = Project.objects.create(
        name="Test", identifier="TST", workspace=workspace
    )
    ProjectMember.objects.create(project=p, member=create_user)
    return p


@pytest.fixture
def slack_credential(db, project, create_user):
    return WorkspaceCredential.objects.create(
        workspace=project.workspace,
        user=create_user,
        source="slack",
        source_identifier="T07TEAM",
        source_access_token="xoxb-fake",
        is_pat=False,
        is_active=True,
    )


@pytest.fixture
def slack_workspace_connection(db, project, slack_credential):
    return WorkspaceConnection.objects.create(
        workspace=project.workspace,
        credential=slack_credential,
        connection_type="slack",
        connection_id="T07TEAM",
        connection_slug="Test Team",
    )


@pytest.fixture
def slack_channel_mapping(db, project, slack_workspace_connection):
    return WorkspaceEntityConnection.objects.create(
        workspace=project.workspace,
        workspace_connection=slack_workspace_connection,
        project=project,
        type=SLACK_NOTIFICATION_TYPE,
        entity_type="slack-channel",
        entity_id="C0CHAN",
        entity_slug="general",
        config={"events": ["work_item.created", "work_item.commented"]},
    )


@pytest.fixture
def issue_factory(db, project, create_user, workspace):
    """Build issues bound to the test project with a state."""

    def _build(name: str = "Test Issue", state_group: str = "backlog", priority: str = "none") -> Issue:
        state, _ = State.objects.get_or_create(
            name=state_group.title(),
            workspace=workspace,
            project=project,
            defaults={"group": state_group},
        )
        i = Issue.objects.create(
            name=name,
            workspace=workspace,
            project=project,
            state=state,
            priority=priority,
        )
        return i

    return _build


# ============================================================
# Tests
# ============================================================


@pytest.mark.unit
class TestDispatchSiloWorkItemEventNoOp:
    """When the project has no mappings, the task must not make HTTP calls."""

    def test_no_mappings_returns_immediately(self, db, project, create_user):
        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            dispatch_silo_work_item_event(
                activity_type="issue.activity.created",
                issue_id=None,
                project_id=str(project.id),
                actor_id=str(create_user.id),
            )
        mock_post.assert_not_called()

    def test_unhandled_activity_type_returns_immediately(self, db, project, slack_channel_mapping):
        """activity types not in ACTIVITY_EVENT_MAP should be ignored."""
        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            dispatch_silo_work_item_event(
                activity_type="cycle.activity.created",
                issue_id=None,
                project_id=str(slack_channel_mapping.project_id),
                actor_id=None,
            )
        mock_post.assert_not_called()


@pytest.mark.unit
class TestDispatchPayloadShape:
    """Verify the payload silo receives matches what notifications.ts expects."""

    def _captured_payload(self, mock_post) -> dict:
        """Pull the JSON body silo would receive from the mock."""
        assert mock_post.call_count == 1
        kwargs = mock_post.call_args.kwargs
        return json.loads(kwargs["data"])

    def test_created_payload(
        self, db, project, slack_channel_mapping, issue_factory, create_user
    ):
        issue = issue_factory(name="hello", priority="high")
        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            dispatch_silo_work_item_event(
                activity_type="issue.activity.created",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
            )
        payload = self._captured_payload(mock_post)
        assert payload["event_type"] == "work_item.created"
        assert payload["workspace_slug"] == project.workspace.slug
        assert payload["project_identifier"] == project.identifier
        assert payload["issue"]["id"] == str(issue.id)
        assert payload["issue"]["name"] == "hello"
        assert payload["issue"]["priority"] == "high"
        assert payload["actor"]["id"] == str(create_user.id)

    def test_no_state_change_no_op(
        self, db, project, slack_channel_mapping, issue_factory, create_user
    ):
        """issue.activity.updated without a state change → no fan-out
        (we only care about state changes for Slack v1)."""
        issue = issue_factory()
        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            dispatch_silo_work_item_event(
                activity_type="issue.activity.updated",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
                requested_data=json.dumps({"name": "renamed"}),
                current_instance=json.dumps({"name": "original"}),
            )
        mock_post.assert_not_called()

    def test_state_change_emits_state_changed(
        self, db, project, slack_channel_mapping, issue_factory, create_user, workspace
    ):
        issue = issue_factory()
        # issue_factory created the "Backlog" state already.
        from_state = State.objects.get(name="Backlog", project=project)
        to_state = State.objects.create(
            name="In Progress", workspace=workspace, project=project, group="started"
        )
        # Make the channel listen to state_changed
        m = slack_channel_mapping
        m.config = {"events": ["work_item.state_changed"]}
        m.save()

        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            dispatch_silo_work_item_event(
                activity_type="issue.activity.updated",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
                requested_data=json.dumps({"state_id": str(to_state.id)}),
                current_instance=json.dumps({"state_id": str(from_state.id)}),
            )
        payload = self._captured_payload(mock_post)
        assert payload["event_type"] == "work_item.state_changed"
        assert payload["state_change"]["from_name"] == "Backlog"
        assert payload["state_change"]["to_name"] == "In Progress"
        assert payload["state_change"]["from_group"] == "backlog"
        assert payload["state_change"]["to_group"] == "started"

    def test_completed_group_emits_completed(
        self, db, project, slack_channel_mapping, issue_factory, create_user, workspace
    ):
        issue = issue_factory()
        from_state = State.objects.create(
            name="In Progress", workspace=workspace, project=project, group="started"
        )
        done_state = State.objects.create(
            name="Done", workspace=workspace, project=project, group="completed"
        )
        slack_channel_mapping.config = {"events": ["work_item.completed"]}
        slack_channel_mapping.save()

        with patch("plane.bgtasks.silo_notification_task.requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            dispatch_silo_work_item_event(
                activity_type="issue.activity.updated",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
                requested_data=json.dumps({"state_id": str(done_state.id)}),
                current_instance=json.dumps({"state_id": str(from_state.id)}),
            )
        payload = self._captured_payload(mock_post)
        assert payload["event_type"] == "work_item.completed"
        assert payload["state_change"]["to_group"] == "completed"


@pytest.mark.unit
class TestDmTargets:
    """Per-user DM target resolution."""

    def _get_payload(self, mock_post) -> dict:
        assert mock_post.call_count == 1
        return json.loads(mock_post.call_args.kwargs["data"])

    def test_self_assignment_skipped_by_default(
        self, db, project, slack_channel_mapping, issue_factory, create_user
    ):
        """Default SILO_DM_SKIP_SELF=True drops the actor from dm_targets."""
        WorkspaceUserConnection.objects.create(
            workspace=project.workspace,
            user=create_user,
            credential=slack_channel_mapping.workspace_connection.credential,
            connection_type="slack",
            connection_id="U07SELF",
        )
        issue = issue_factory()
        with patch.dict("os.environ", {"SILO_DM_SKIP_SELF": "True"}, clear=False), patch(
            "plane.bgtasks.silo_notification_task.requests.post"
        ) as mock_post:
            mock_post.return_value.status_code = 200
            dispatch_silo_work_item_event(
                activity_type="issue.activity.created",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
                requested_data=json.dumps({"assignee_ids": [str(create_user.id)]}),
            )
        payload = self._get_payload(mock_post)
        assert payload["dm_targets"] == []

    def test_self_assignment_kept_when_skip_self_disabled(
        self, db, project, slack_channel_mapping, issue_factory, create_user
    ):
        """SILO_DM_SKIP_SELF=False (solo-dev mode) keeps the actor as a target."""
        WorkspaceUserConnection.objects.create(
            workspace=project.workspace,
            user=create_user,
            credential=slack_channel_mapping.workspace_connection.credential,
            connection_type="slack",
            connection_id="U07SELF",
        )
        issue = issue_factory()
        with patch.dict("os.environ", {"SILO_DM_SKIP_SELF": "False"}, clear=False), patch(
            "plane.bgtasks.silo_notification_task.requests.post"
        ) as mock_post:
            mock_post.return_value.status_code = 200
            dispatch_silo_work_item_event(
                activity_type="issue.activity.created",
                issue_id=str(issue.id),
                project_id=str(project.id),
                actor_id=str(create_user.id),
                requested_data=json.dumps({"assignee_ids": [str(create_user.id)]}),
            )
        payload = self._get_payload(mock_post)
        assert len(payload["dm_targets"]) == 1
        assert payload["dm_targets"][0]["slack_user_id"] == "U07SELF"


# ============================================================
# Mention rendering
# ============================================================


@pytest.mark.unit
class TestRenderCommentForSlack:
    """The HTML→Slack-mrkdwn conversion that re-renders Plane mentions."""

    def test_no_mentions_returns_stripped_text(self, db, project, create_user, workspace):
        from plane.db.models import Issue

        issue = Issue.objects.create(name="i", workspace=workspace, project=project)
        comment = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            actor=create_user,
            comment_html="<p>just a plain comment</p>",
            comment_stripped="just a plain comment",
        )
        out = _render_comment_for_slack(comment, str(workspace.id))
        assert out == "just a plain comment"

    def test_mapped_user_rendered_as_slack_mention(
        self, db, project, slack_credential, create_user, workspace
    ):
        WorkspaceUserConnection.objects.create(
            workspace=workspace,
            user=create_user,
            credential=slack_credential,
            connection_type="slack",
            connection_id="U07USER",
        )
        from plane.db.models import Issue

        issue = Issue.objects.create(name="i", workspace=workspace, project=project)
        comment_html = (
            f'<p>hey <mention-component entity_identifier="{create_user.id}" '
            f'entity_name="user_mention"></mention-component> ready</p>'
        )
        comment = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            actor=create_user,
            comment_html=comment_html,
            comment_stripped="hey  ready",
        )
        out = _render_comment_for_slack(comment, str(workspace.id))
        assert "<@U07USER>" in out
        # Original tag must be gone
        assert "mention-component" not in out

    def test_unmapped_user_falls_back_to_display_name(
        self, db, project, create_user, workspace
    ):
        """Mentioned user with NO Slack mapping → @DisplayName fallback."""
        from plane.db.models import Issue

        issue = Issue.objects.create(name="i", workspace=workspace, project=project)
        comment_html = (
            f'<p>hi <mention-component entity_identifier="{create_user.id}" '
            f'entity_name="user_mention"></mention-component></p>'
        )
        comment = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            actor=create_user,
            comment_html=comment_html,
            comment_stripped="hi ",
        )
        out = _render_comment_for_slack(comment, str(workspace.id))
        # Should contain @<something> referring to the user, not the slack uid
        assert "@" in out
        assert "<@U" not in out

    def test_no_html_returns_empty(self, db, project, create_user, workspace):
        from plane.db.models import Issue

        issue = Issue.objects.create(name="i", workspace=workspace, project=project)
        comment = IssueComment.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            actor=create_user,
            comment_html="",
            comment_stripped="",
        )
        out = _render_comment_for_slack(comment, str(workspace.id))
        assert out == ""