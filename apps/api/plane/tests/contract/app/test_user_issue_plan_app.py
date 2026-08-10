# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for personal issue planning endpoints.
"""

import datetime

import pytest
import zoneinfo
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, User, UserIssuePlan


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part, user_timezone="UTC")
    user.set_password("test-password")
    user.save()
    return user


def _add_project_member(project, user, *, role: int, is_active: bool = True) -> ProjectMember:
    return ProjectMember.objects.create(
        workspace=project.workspace, project=project, member=user, role=role, is_active=is_active
    )


def _make_issue(project, user, *, name: str) -> Issue:
    return Issue.objects.create(name=name, workspace=project.workspace, project=project, created_by=user)


def _user_issue_plan_url(workspace_slug, issue_id):
    return f"/api/workspaces/{workspace_slug}/user-issue-plans/{issue_id}/"


def _user_profile_issues_url(workspace_slug, user_id):
    return f"/api/workspaces/{workspace_slug}/user-issues/{user_id}/"


@pytest.fixture
def project_with_assigned_issue(workspace, create_user):
    project = Project.objects.create(
        name="Planning Project", identifier="PLAN", workspace=workspace, created_by=create_user
    )
    _add_project_member(project, create_user, role=20)
    project._issue = _make_issue(project, create_user, name="Planned work item")
    project._issue.assignees.add(create_user)
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceUserIssuePlanEndpoint:
    def test_member_can_upsert_personal_plan(self, workspace, project_with_assigned_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        issue = project_with_assigned_issue._issue
        planned_at = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)

        response = client.patch(
            _user_issue_plan_url(workspace.slug, issue.id),
            {"planned_at": planned_at.isoformat(), "planned_duration_minutes": 90},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["planned_duration_minutes"] == 90
        assert UserIssuePlan.objects.filter(issue=issue, user=create_user).exists()

    def test_delete_clears_personal_plan(self, workspace, project_with_assigned_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        issue = project_with_assigned_issue._issue
        UserIssuePlan.objects.create(
            issue=issue,
            user=create_user,
            project=issue.project,
            workspace=issue.workspace,
            planned_at=timezone.now(),
            created_by=create_user,
        )

        response = client.delete(_user_issue_plan_url(workspace.slug, issue.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserIssuePlan.objects.filter(issue=issue, user=create_user, deleted_at__isnull=True).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceUserProfileIssuesPlannedGrouping:
    def test_group_by_planned_at_returns_day_buckets(self, workspace, project_with_assigned_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        issue = project_with_assigned_issue._issue
        planned_at = datetime.datetime(2026, 8, 12, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        UserIssuePlan.objects.create(
            issue=issue,
            user=create_user,
            project=issue.project,
            workspace=issue.workspace,
            planned_at=planned_at,
            created_by=create_user,
        )

        response = client.get(
            _user_profile_issues_url(workspace.slug, create_user.id),
            {
                "group_by": "planned_at",
                "assignees": str(create_user.id),
                "planned_at": "2026-08-01;after,2026-08-31;before",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        grouped_results = response.data["grouped_results"]
        assert "2026-08-12" in grouped_results
        issue_payload = grouped_results["2026-08-12"]["results"][0]
        assert issue_payload["planned_at"] is not None
