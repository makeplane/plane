# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
A user's own activity feed, workspace dashboard and recent visits only carry
issue data from projects the user is still an active member of.

The rows themselves belong to the user, but each response embeds live issue
fields, so they follow the same visibility rule as the issue list.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, IssueActivity, IssueAssignee, Project, ProjectMember, UserRecentVisit

ACTIVITIES_URL = "/api/users/me/activities/"
DASHBOARD_URL = "/api/users/me/workspaces/{slug}/dashboard/"
RECENTS_URL = "/api/workspaces/{slug}/recent-visits/"


@pytest.fixture
def issue(db, workspace, create_user):
    """An overdue issue assigned to, acted on and recently visited by ``create_user``."""
    project = Project.objects.create(name="Scoped Project", identifier="SP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=15)
    issue = Issue.objects.create(
        name="Scoped issue",
        project=project,
        workspace=workspace,
        target_date=timezone.now().date() - timedelta(days=2),
    )
    IssueAssignee.objects.create(issue=issue, assignee=create_user, project=project, workspace=workspace)
    IssueActivity.objects.create(issue=issue, project=project, workspace=workspace, actor=create_user)
    UserRecentVisit.objects.create(
        workspace=workspace, project=project, user=create_user, entity_name="issue", entity_identifier=issue.id
    )
    return issue


def _deactivate_membership(issue, user):
    ProjectMember.objects.filter(project=issue.project, member=user).update(is_active=False)


@pytest.mark.contract
@pytest.mark.django_db
class TestUserActivityAndRecentsScope:
    def test_activity_feed_follows_project_membership(self, session_client, create_user, issue):
        response = session_client.get(ACTIVITIES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert [row["issue"] for row in response.data["results"]] == [issue.id]

        _deactivate_membership(issue, create_user)

        response = session_client.get(ACTIVITIES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    def test_recent_visit_entity_data_follows_project_membership(self, session_client, create_user, workspace, issue):
        response = session_client.get(RECENTS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert [row["entity_data"]["name"] for row in response.data] == [issue.name]

        _deactivate_membership(issue, create_user)

        response = session_client.get(RECENTS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert [row["entity_data"] for row in response.data] == [None]

    def test_dashboard_issue_lists_follow_project_membership(self, session_client, create_user, workspace, issue):
        response = session_client.get(DASHBOARD_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert [row["name"] for row in response.data["overdue_issues"]] == [issue.name]

        _deactivate_membership(issue, create_user)

        response = session_client.get(DASHBOARD_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert list(response.data["overdue_issues"]) == []
