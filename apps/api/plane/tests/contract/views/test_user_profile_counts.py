# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for Phase 2: WorkspaceUserProfileEndpoint counts.
Validates that sub-tasks are properly excluded from all 4 count aggregations:
- created_issues, assigned_issues, completed_issues, pending_issues
"""

from __future__ import annotations

import pytest

from plane.db.models import Issue, State, StateGroup, Workspace, WorkspaceMember, Project, ProjectMember, IssueAssignee


@pytest.mark.contract
@pytest.mark.django_db
class TestUserProfileCountsExcludeSubtasks:
    """
    Regression test for Phase 2 fix: ensure parent__isnull=True filter is applied
    to all 4 count annotations in WorkspaceUserProfileEndpoint.
    """

    def test_user_profile_counts_exclude_subtasks(self, session_client, create_user):
        """
        Test that assigned_issues, created_issues, completed_issues, pending_issues
        counts exclude sub-tasks (parent != null).

        Setup:
        - 1 parent issue assigned to user
        - 1 sub-task of parent also assigned to user

        Expected: all counts should be 1, not 2
        """
        # Create workspace and project
        workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20, is_active=True)

        project = Project.objects.create(
            name="Test Project",
            identifier="TP",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        # Create states
        backlog = State.objects.create(
            workspace=workspace, project=project, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
        )
        completed = State.objects.create(
            workspace=workspace, project=project, name="Done", group=StateGroup.COMPLETED.value, color="#111111"
        )

        # Create parent issue assigned to user (this is what gets counted)
        parent_issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Parent Issue",
            state=backlog,
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=parent_issue, assignee=create_user, project=project, workspace=workspace)

        # Create sub-task also assigned to user (should NOT be counted)
        sub_task = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Sub Task",
            state=backlog,
            created_by=create_user,
            parent=parent_issue,  # CRITICAL: parent != null
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=create_user, project=project, workspace=workspace)

        # GET /api/workspaces/<slug>/user-profile/<user_id>/
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-profile/{create_user.id}/"
        )

        assert response.status_code == 200
        data = response.json()

        # Check project_data counts
        assert len(data["project_data"]) > 0, "Should have project data"
        project_stats = data["project_data"][0]

        # CRITICAL: assigned_issues should be 1 (parent only, not sub-task)
        assert project_stats["assigned_issues"] == 1, (
            f"assigned_issues should be 1 (parent only), got {project_stats['assigned_issues']}"
        )

        # CRITICAL: pending_issues should be 1 (parent is in backlog/unstarted, sub-task excluded)
        assert project_stats["pending_issues"] == 1, (
            f"pending_issues should be 1 (parent is pending), got {project_stats['pending_issues']}"
        )

    def test_user_profile_counts_with_completed_parent_and_subtask(self, session_client, create_user):
        """
        Test that when parent is completed and assigned to user,
        completed_issues count excludes the sub-task.
        """
        workspace = Workspace.objects.create(
            name="Test Workspace 2",
            slug="test-workspace-2",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20, is_active=True)

        project = Project.objects.create(
            name="Test Project 2",
            identifier="TP2",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        completed = State.objects.create(
            workspace=workspace, project=project, name="Done", group=StateGroup.COMPLETED.value, color="#111111"
        )

        # Create completed parent issue assigned to user
        parent_issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Completed Parent",
            state=completed,
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=parent_issue, assignee=create_user, project=project, workspace=workspace)

        # Create sub-task also in completed state and assigned to user
        sub_task = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Completed Sub Task",
            state=completed,
            created_by=create_user,
            parent=parent_issue,
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=create_user, project=project, workspace=workspace)

        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-profile/{create_user.id}/"
        )

        assert response.status_code == 200
        data = response.json()
        project_stats = data["project_data"][0]

        # CRITICAL: completed_issues should be 1 (parent only, not sub-task)
        assert project_stats["completed_issues"] == 1, (
            f"completed_issues should be 1 (parent only), got {project_stats['completed_issues']}"
        )

        # CRITICAL: pending_issues should be 0 (parent is completed, not pending)
        assert project_stats["pending_issues"] == 0, (
            f"pending_issues should be 0 (parent is completed), got {project_stats['pending_issues']}"
        )

    def test_user_profile_counts_parent_and_subtask_different_assignees(self, session_client, create_user):
        """
        Test edge case: parent assigned to user A, sub-task assigned to user B.
        Counts should only include issues where user A is the assignee.
        """
        other_user = create_user.__class__.objects.create(
            email="other@plane.so",
            username="otheruser3",
            first_name="Other",
            last_name="User",
        )
        other_user.set_password("password")
        other_user.save()

        workspace = Workspace.objects.create(
            name="Test Workspace 3",
            slug="test-workspace-3",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20, is_active=True)

        project = Project.objects.create(
            name="Test Project 3",
            identifier="TP3",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        backlog = State.objects.create(
            workspace=workspace, project=project, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
        )

        # Parent assigned to create_user
        parent_issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Parent Assigned To User",
            state=backlog,
            created_by=create_user,
        )
        IssueAssignee.objects.create(issue=parent_issue, assignee=create_user, project=project, workspace=workspace)

        # Sub-task assigned to other_user
        sub_task = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Sub Task Assigned To Other",
            state=backlog,
            created_by=create_user,
            parent=parent_issue,
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=other_user, project=project, workspace=workspace)

        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-profile/{create_user.id}/"
        )

        assert response.status_code == 200
        data = response.json()
        project_stats = data["project_data"][0]

        # assigned_issues should be 1 (only parent, sub-task is assigned to other_user)
        assert project_stats["assigned_issues"] == 1, (
            f"assigned_issues should be 1 (parent only), got {project_stats['assigned_issues']}"
        )

        # pending_issues should be 1 (only parent)
        assert project_stats["pending_issues"] == 1, (
            f"pending_issues should be 1 (parent only), got {project_stats['pending_issues']}"
        )
