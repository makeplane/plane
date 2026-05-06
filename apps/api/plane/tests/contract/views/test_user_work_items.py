# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for cross-workspace work item endpoints.
Tests cover: /api/users/me/work-items/today/ and /overdue/
Validates filtering, state exclusion, sub-task filtering, workspace/project access.
"""

from __future__ import annotations

import pytest
from datetime import date, timedelta
from django.utils import timezone

from plane.db.models import Issue, State, StateGroup, Workspace, WorkspaceMember, Project, ProjectMember, IssueAssignee


@pytest.fixture
def workspace_with_members(db, create_user):
    """Create 2 workspaces, each with the test user as member"""
    ws1 = Workspace.objects.create(
        name="Workspace 1",
        slug="ws-1",
        owner=create_user,
    )
    ws2 = Workspace.objects.create(
        name="Workspace 2",
        slug="ws-2",
        owner=create_user,
    )

    # Add test user to both workspaces as active member
    WorkspaceMember.objects.create(workspace=ws1, member=create_user, role=20, is_active=True)
    WorkspaceMember.objects.create(workspace=ws2, member=create_user, role=20, is_active=True)

    return {"ws1": ws1, "ws2": ws2}


@pytest.fixture
def projects_and_states(db, workspace_with_members, create_user):
    """Create projects in both workspaces with standard state groups"""
    ws1 = workspace_with_members["ws1"]
    ws2 = workspace_with_members["ws2"]

    # Create projects with identifiers
    proj1_ws1 = Project.objects.create(
        name="Project 1 WS1",
        identifier="P1WS1",
        workspace=ws1,
        created_by=create_user,
        updated_by=create_user,
    )
    proj2_ws1 = Project.objects.create(
        name="Project 2 WS1 (user not member)",
        identifier="P2WS1",
        workspace=ws1,
        created_by=create_user,
        updated_by=create_user,
    )
    proj1_ws2 = Project.objects.create(
        name="Project 1 WS2",
        identifier="P1WS2",
        workspace=ws2,
        created_by=create_user,
        updated_by=create_user,
    )

    # Add user to proj1_ws1 and proj1_ws2 (NOT proj2_ws1)
    ProjectMember.objects.create(project=proj1_ws1, member=create_user, role=20, is_active=True)
    ProjectMember.objects.create(project=proj1_ws2, member=create_user, role=20, is_active=True)

    # Create standard states (backlog, unstarted, started, completed, cancelled)
    backlog = State.objects.create(
        workspace=ws1, project=proj1_ws1, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
    )
    unstarted = State.objects.create(
        workspace=ws1, project=proj1_ws1, name="Unstarted", group=StateGroup.UNSTARTED.value, color="#111111"
    )
    started = State.objects.create(
        workspace=ws1, project=proj1_ws1, name="In Progress", group=StateGroup.STARTED.value, color="#222222"
    )
    completed = State.objects.create(
        workspace=ws1, project=proj1_ws1, name="Done", group=StateGroup.COMPLETED.value, color="#333333"
    )
    cancelled = State.objects.create(
        workspace=ws1, project=proj1_ws1, name="Cancelled", group=StateGroup.CANCELLED.value, color="#444444"
    )

    # Create same states for ws2
    backlog_ws2 = State.objects.create(
        workspace=ws2, project=proj1_ws2, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
    )
    unstarted_ws2 = State.objects.create(
        workspace=ws2, project=proj1_ws2, name="Unstarted", group=StateGroup.UNSTARTED.value, color="#111111"
    )
    started_ws2 = State.objects.create(
        workspace=ws2, project=proj1_ws2, name="In Progress", group=StateGroup.STARTED.value, color="#222222"
    )

    return {
        "ws1": ws1,
        "ws2": ws2,
        "proj1_ws1": proj1_ws1,
        "proj2_ws1": proj2_ws1,
        "proj1_ws2": proj1_ws2,
        "states": {
            "backlog": backlog,
            "unstarted": unstarted,
            "started": started,
            "completed": completed,
            "cancelled": cancelled,
        },
        "states_ws2": {
            "backlog": backlog_ws2,
            "unstarted": unstarted_ws2,
            "started": started_ws2,
        },
    }


@pytest.mark.contract
@pytest.mark.django_db
class TestUserWorkItemsToday:
    """Tests for /api/users/me/work-items/today/ endpoint"""

    def test_today_returns_only_user_assigned_active_issues(self, session_client, create_user, projects_and_states):
        """
        Test that today endpoint returns only issues assigned to the authenticated user
        in active state groups (backlog, unstarted, started).
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        # Create 2 issues: 1 assigned to user, 1 assigned to someone else
        other_user = create_user.__class__.objects.create(
            email="other@plane.so",
            username="otheruser",
            first_name="Other",
            last_name="User",
        )
        other_user.set_password("password")
        other_user.save()

        issue_assigned = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="My Issue",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_assigned, assignee=create_user, project=proj1_ws1, workspace=ws1)

        issue_other = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Other User Issue",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_other, assignee=other_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/today/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(issue_assigned.id)
        assert data[0]["name"] == "My Issue"

    def test_today_excludes_subtasks(self, session_client, create_user, projects_and_states):
        """
        Test that sub-tasks (parent != null) are excluded from today list.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        # Create parent issue
        parent_issue = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Parent Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=parent_issue, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create sub-task (parent=parent_issue)
        sub_task = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Sub Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            parent=parent_issue,
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/today/")

        assert response.status_code == 200
        data = response.json()
        # Should only get parent, not sub-task
        assert len(data) == 1
        assert data[0]["id"] == str(parent_issue.id)

    def test_today_excludes_completed_state(self, session_client, create_user, projects_and_states):
        """
        Test that issues in 'completed' state group are excluded.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        # Create completed issue
        issue_completed = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Completed Task",
            state=fixtures["states"]["completed"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_completed, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create active issue
        issue_active = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Active Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_active, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/today/")

        assert response.status_code == 200
        data = response.json()
        # Should only get active task
        assert len(data) == 1
        assert data[0]["id"] == str(issue_active.id)

    def test_today_filters_by_workspace_slug_param(self, session_client, create_user, projects_and_states):
        """
        Test that ?workspace=<slug> filter works correctly.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        ws2 = fixtures["ws2"]
        proj1_ws1 = fixtures["proj1_ws1"]
        proj1_ws2 = fixtures["proj1_ws2"]

        # Create issue in ws1
        issue_ws1 = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="WS1 Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_ws1, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create issue in ws2
        issue_ws2 = Issue.objects.create(
            workspace=ws2,
            project=proj1_ws2,
            name="WS2 Task",
            state=fixtures["states_ws2"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue_ws2, assignee=create_user, project=proj1_ws2, workspace=ws2)

        # Without filter, get both
        response = session_client.get("/api/users/me/work-items/today/")
        assert len(response.json()) == 2

        # Filter by ws1
        response = session_client.get(f"/api/users/me/work-items/today/?workspace={ws1.slug}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(issue_ws1.id)

        # Filter by ws2
        response = session_client.get(f"/api/users/me/work-items/today/?workspace={ws2.slug}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(issue_ws2.id)

    def test_today_excludes_inactive_workspace_membership(self, session_client, create_user, workspace_with_members, projects_and_states):
        """
        Test that issues in workspaces where user's membership is inactive are excluded.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        # Create issue
        issue = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Test Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Issue visible while membership is active
        response = session_client.get("/api/users/me/work-items/today/")
        assert len(response.json()) == 1

        # Deactivate workspace membership
        ws_member = WorkspaceMember.objects.get(workspace=ws1, member=create_user)
        ws_member.is_active = False
        ws_member.save()

        # Issue should now be excluded
        response = session_client.get("/api/users/me/work-items/today/")
        assert len(response.json()) == 0

    def test_today_excludes_unauthorized_project_issue(self, session_client, create_user, projects_and_states):
        """
        Test that issues in projects where user is not a member are excluded.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj2_ws1 = fixtures["proj2_ws1"]  # User is NOT a member of this project

        # Create issue in project user doesn't have access to
        issue = Issue.objects.create(
            workspace=ws1,
            project=proj2_ws1,
            name="Unauthorized Project Issue",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue, assignee=create_user, project=proj2_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/today/")

        assert response.status_code == 200
        data = response.json()
        # Should be excluded because user is not a project member
        assert len(data) == 0

    def test_today_response_shape_keys(self, session_client, create_user, projects_and_states):
        """
        Test that response contains all required keys: _workspace, _project, _state,
        assignee_ids, label_ids, and other basic fields.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        issue = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Test Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=issue, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/today/")
        data = response.json()

        assert len(data) == 1
        item = data[0]

        # Check required keys
        required_keys = [
            "id",
            "name",
            "sequence_id",
            "project_id",
            "state_id",
            "start_date",
            "target_date",
            "assignee_ids",
            "label_ids",
            "_workspace",
            "_project",
            "_state",
        ]
        for key in required_keys:
            assert key in item, f"Missing key: {key}"

        # Validate nested objects
        assert isinstance(item["_workspace"], dict)
        assert "slug" in item["_workspace"]
        assert "name" in item["_workspace"]

        assert isinstance(item["_project"], dict)
        assert "name" in item["_project"]
        assert "identifier" in item["_project"]

        assert isinstance(item["_state"], dict)
        assert "name" in item["_state"]
        assert "color" in item["_state"]
        assert "group" in item["_state"]

        assert isinstance(item["assignee_ids"], list)
        assert str(create_user.id) in item["assignee_ids"]

        assert isinstance(item["label_ids"], list)


@pytest.mark.contract
@pytest.mark.django_db
class TestUserWorkItemsOverdue:
    """Tests for /api/users/me/work-items/overdue/ endpoint"""

    def test_overdue_only_target_date_lt_today(self, session_client, create_user, projects_and_states):
        """
        Test that overdue endpoint only returns issues with target_date < today.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]
        today = timezone.now().date()

        # Create overdue issue (target_date < today)
        issue_overdue = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Overdue Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            target_date=today - timedelta(days=1),
        )
        IssueAssignee.objects.create(issue=issue_overdue, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create due today (should NOT be in overdue)
        issue_due_today = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Due Today",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            target_date=today,
        )
        IssueAssignee.objects.create(issue=issue_due_today, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create future due (should NOT be in overdue)
        issue_future = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Future Task",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            target_date=today + timedelta(days=1),
        )
        IssueAssignee.objects.create(issue=issue_future, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/overdue/")

        assert response.status_code == 200
        data = response.json()
        # Only overdue should be returned
        assert len(data) == 1
        assert data[0]["id"] == str(issue_overdue.id)

    def test_overdue_excludes_null_target_date(self, session_client, create_user, projects_and_states):
        """
        Test that issues with target_date IS NULL are excluded from overdue.
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]

        # Create issue with NULL target_date
        issue_no_date = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="No Target Date",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            target_date=None,
        )
        IssueAssignee.objects.create(issue=issue_no_date, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/overdue/")

        assert response.status_code == 200
        data = response.json()
        # Should not include issue with NULL target_date
        assert len(data) == 0

    def test_overdue_respects_state_filter(self, session_client, create_user, projects_and_states):
        """
        Test that overdue endpoint still respects state group filters (excludes completed/cancelled).
        """
        fixtures = projects_and_states
        ws1 = fixtures["ws1"]
        proj1_ws1 = fixtures["proj1_ws1"]
        today = timezone.now().date()

        # Create overdue completed issue
        issue_completed = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Overdue Completed",
            state=fixtures["states"]["completed"],
            created_by=create_user,
            target_date=today - timedelta(days=1),
        )
        IssueAssignee.objects.create(issue=issue_completed, assignee=create_user, project=proj1_ws1, workspace=ws1)

        # Create overdue active issue
        issue_active = Issue.objects.create(
            workspace=ws1,
            project=proj1_ws1,
            name="Overdue Active",
            state=fixtures["states"]["unstarted"],
            created_by=create_user,
            target_date=today - timedelta(days=1),
        )
        IssueAssignee.objects.create(issue=issue_active, assignee=create_user, project=proj1_ws1, workspace=ws1)

        response = session_client.get("/api/users/me/work-items/overdue/")
        data = response.json()

        # Should only get active overdue, not completed
        assert len(data) == 1
        assert data[0]["id"] == str(issue_active.id)
