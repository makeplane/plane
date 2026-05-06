# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for Phase 3: WorkspaceUserProfileStatsEndpoint aggregation.
Validates that the collapsed single-aggregate query returns counts matching
what separate sequential COUNT queries would return.
"""

from __future__ import annotations

import pytest
from django.db.models import Q

from plane.db.models import Issue, State, StateGroup, Workspace, WorkspaceMember, Project, ProjectMember, IssueAssignee


@pytest.mark.contract
@pytest.mark.django_db
class TestUserProfileStatsAggregation:
    """
    Test that WorkspaceUserProfileStatsEndpoint's single aggregate query
    returns the same counts as separate COUNT queries would.
    """

    def test_aggregated_counts_match_separate_queries(self, session_client, create_user):
        """
        Create N issues in mixed states (backlog, unstarted, started, completed, cancelled).
        Verify that GET /api/workspaces/<slug>/user-stats/<user_id>/ counts match
        what direct .filter().count() would return.
        """
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
        started = State.objects.create(
            workspace=workspace, project=project, name="Started", group=StateGroup.STARTED.value, color="#222222"
        )
        completed = State.objects.create(
            workspace=workspace, project=project, name="Completed", group=StateGroup.COMPLETED.value, color="#333333"
        )
        cancelled = State.objects.create(
            workspace=workspace, project=project, name="Cancelled", group=StateGroup.CANCELLED.value, color="#444444"
        )

        # Create issues with different creators and assignees
        # Created by create_user, assigned to create_user
        created_and_assigned = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Created and Assigned",
            state=backlog,
            created_by=create_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=created_and_assigned, assignee=create_user, project=project, workspace=workspace)

        # Created by other user, assigned to create_user
        other_user = create_user.__class__.objects.create(
            email="other@plane.so",
            username="otheruser1",
            first_name="Other",
            last_name="User",
        )
        other_user.set_password("password")
        other_user.save()

        assigned_not_created = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Assigned Not Created",
            state=started,
            created_by=other_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=assigned_not_created, assignee=create_user, project=project, workspace=workspace)

        # Assigned to create_user, in completed state
        completed_issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Completed Issue",
            state=completed,
            created_by=other_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=completed_issue, assignee=create_user, project=project, workspace=workspace)

        # Assigned to create_user, in cancelled state
        cancelled_issue = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Cancelled Issue",
            state=cancelled,
            created_by=other_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=cancelled_issue, assignee=create_user, project=project, workspace=workspace)

        # Sub-task (should not count in aggregation due to parent__isnull=True)
        parent = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Parent Issue",
            state=backlog,
            created_by=create_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=parent, assignee=create_user, project=project, workspace=workspace)

        sub_task = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Sub Task",
            state=backlog,
            created_by=create_user,
            parent=parent,
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=create_user, project=project, workspace=workspace)

        # Calculate expected counts manually (matching the query logic in stats endpoint)
        active_assignee = Q(assignees=create_user) & Q(issue_assignee__deleted_at__isnull=True)

        expected_created = Issue.issue_objects.filter(
            workspace__slug=workspace.slug,
            project__project_projectmember__member=create_user,
            project__project_projectmember__is_active=True,
            parent__isnull=True,
            created_by_id=create_user.id,
        ).count()

        expected_assigned = Issue.issue_objects.filter(
            workspace__slug=workspace.slug,
            project__project_projectmember__member=create_user,
            project__project_projectmember__is_active=True,
            parent__isnull=True,
        ).filter(active_assignee).count()

        expected_pending = Issue.issue_objects.filter(
            workspace__slug=workspace.slug,
            project__project_projectmember__member=create_user,
            project__project_projectmember__is_active=True,
            parent__isnull=True,
        ).filter(active_assignee & ~Q(state__group__in=["completed", "cancelled"])).count()

        expected_completed = Issue.issue_objects.filter(
            workspace__slug=workspace.slug,
            project__project_projectmember__member=create_user,
            project__project_projectmember__is_active=True,
            parent__isnull=True,
        ).filter(active_assignee & Q(state__group="completed")).count()

        # GET /api/workspaces/<slug>/user-stats/<user_id>/
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-stats/{create_user.id}/"
        )

        assert response.status_code == 200
        data = response.json()

        # Verify counts match expectations
        assert data["created_issues"] == expected_created, (
            f"created_issues mismatch: expected {expected_created}, got {data['created_issues']}"
        )
        assert data["assigned_issues"] == expected_assigned, (
            f"assigned_issues mismatch: expected {expected_assigned}, got {data['assigned_issues']}"
        )
        assert data["pending_issues"] == expected_pending, (
            f"pending_issues mismatch: expected {expected_pending}, got {data['pending_issues']}"
        )
        assert data["completed_issues"] == expected_completed, (
            f"completed_issues mismatch: expected {expected_completed}, got {data['completed_issues']}"
        )

    def test_stats_excludes_subtasks(self, session_client, create_user):
        """
        Verify that sub-tasks are properly excluded from all stats counts.
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

        backlog = State.objects.create(
            workspace=workspace, project=project, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
        )

        # Create parent assigned and created by user
        parent = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Parent",
            state=backlog,
            created_by=create_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=parent, assignee=create_user, project=project, workspace=workspace)

        # Create sub-task also assigned and created by user
        sub_task = Issue.objects.create(
            workspace=workspace,
            project=project,
            name="Sub Task",
            state=backlog,
            created_by=create_user,
            parent=parent,
        )
        IssueAssignee.objects.create(issue=sub_task, assignee=create_user, project=project, workspace=workspace)

        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-stats/{create_user.id}/"
        )

        assert response.status_code == 200
        data = response.json()

        # Should count only parent, not sub-task
        assert data["assigned_issues"] == 1
        assert data["pending_issues"] == 1

    def test_stats_with_multiple_projects(self, session_client, create_user):
        """
        Test stats aggregation across multiple projects.
        """
        workspace = Workspace.objects.create(
            name="Test Workspace 3",
            slug="test-workspace-3",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20, is_active=True)

        # Create first project
        project1 = Project.objects.create(
            name="Test Project 3A",
            identifier="TP3A",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project1, member=create_user, role=20, is_active=True)

        # Create second project
        project2 = Project.objects.create(
            name="Test Project 3B",
            identifier="TP3B",
            workspace=workspace,
            created_by=create_user,
            updated_by=create_user,
        )
        ProjectMember.objects.create(project=project2, member=create_user, role=20, is_active=True)

        backlog = State.objects.create(
            workspace=workspace, project=project1, name="Backlog", group=StateGroup.BACKLOG.value, color="#000000"
        )

        # Create issue in project1
        issue1 = Issue.objects.create(
            workspace=workspace,
            project=project1,
            name="Issue in Project 1",
            state=backlog,
            created_by=create_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=issue1, assignee=create_user, project=project1, workspace=workspace)

        # Create issue in project2
        issue2 = Issue.objects.create(
            workspace=workspace,
            project=project2,
            name="Issue in Project 2",
            state=backlog,
            created_by=create_user,
            parent=None,
        )
        IssueAssignee.objects.create(issue=issue2, assignee=create_user, project=project2, workspace=workspace)

        # Test stats returns aggregated counts across both projects
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/user-stats/{create_user.id}/"
        )
        assert response.status_code == 200
        data = response.json()
        # Assigned issues should be 2 (one from each project)
        assert data["assigned_issues"] == 2
