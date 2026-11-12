# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project-scoping of the workspace analytics endpoints.

``AnalyticsEndpoint``, ``DefaultAnalyticsEndpoint``, ``SavedAnalyticEndpoint`` and
``analytic_export_task`` must only aggregate work items from projects the
requesting user is an active member of (and, for saved views, only within the
URL's workspace), matching ``get_analytics_filters`` used by advance analytics.
"""

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.bgtasks.analytic_plot_export import analytic_export_task
from plane.db.models import (
    AnalyticView,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ANALYTICS_URL = "/api/workspaces/{slug}/analytics/?x_axis=state_id&y_axis=issue_count"
DEFAULT_ANALYTICS_URL = "/api/workspaces/{slug}/default-analytics/"
SAVED_ANALYTICS_URL = "/api/workspaces/{slug}/saved-analytic-view/{analytic_id}/"
EXPORT_URL = "/api/workspaces/{slug}/export-analytics/"


def _make_issue(workspace, user, name):
    project = Project.objects.create(
        name=f"{name} Project", identifier=uuid4().hex[:5].upper(), workspace=workspace, created_by=user
    )
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=20)
    state = State.objects.create(name=f"{name} State", group="unstarted", project=project, workspace=workspace)
    return Issue.objects.create(name=f"{name} Issue", project=project, workspace=workspace, state=state)


@pytest.fixture
def issue(db, workspace, create_user):
    """A work item in a project where only ``create_user`` is a member."""
    return _make_issue(workspace, create_user, "Secret")


@pytest.fixture
def outsider(db, workspace):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"outsider-{unique_id}@plane.so", username=f"outsider_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    return user


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def analytic_view(db, workspace):
    return AnalyticView.objects.create(
        name="All", workspace=workspace, query={}, query_dict={"x_axis": "priority", "y_axis": "issue_count"}
    )


@pytest.mark.contract
class TestWorkspaceAnalyticsProjectScope:
    @pytest.mark.django_db
    def test_analytics_excludes_non_member_projects(self, outsider, workspace, issue):
        response = _client(outsider).get(ANALYTICS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 0
        assert list(response.data["extras"]["state_details"]) == []

    @pytest.mark.django_db
    def test_analytics_includes_member_projects(self, session_client, workspace, issue):
        response = session_client.get(ANALYTICS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 1
        assert [s["state__name"] for s in response.data["extras"]["state_details"]] == ["Secret State"]

    @pytest.mark.django_db
    def test_default_analytics_excludes_non_member_projects_for_guest(self, outsider, workspace, issue):
        WorkspaceMember.objects.filter(workspace=workspace, member=outsider).update(role=5)
        response = _client(outsider).get(DEFAULT_ANALYTICS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_issues"] == 0

    @pytest.mark.django_db
    def test_default_analytics_includes_member_projects(self, session_client, workspace, issue):
        response = session_client.get(DEFAULT_ANALYTICS_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_issues"] == 1

    @pytest.mark.django_db
    def test_saved_analytics_excludes_non_member_projects(self, outsider, workspace, issue, analytic_view):
        url = SAVED_ANALYTICS_URL.format(slug=workspace.slug, analytic_id=analytic_view.id)
        response = _client(outsider).get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 0

    @pytest.mark.django_db
    def test_saved_analytics_scoped_to_workspace(self, session_client, create_user, workspace, issue, analytic_view):
        other_workspace = Workspace.objects.create(name="Other", owner=create_user, slug=f"other-{uuid4().hex[:8]}")
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        _make_issue(other_workspace, create_user, "Other")

        url = SAVED_ANALYTICS_URL.format(slug=workspace.slug, analytic_id=analytic_view.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 1

    @pytest.mark.django_db
    def test_export_passes_requesting_user(self, outsider, workspace):
        with patch("plane.bgtasks.analytic_plot_export.analytic_export_task.delay") as delay:
            response = _client(outsider).post(
                EXPORT_URL.format(slug=workspace.slug), {"x_axis": "state_id", "y_axis": "issue_count"}, format="json"
            )
        assert response.status_code == status.HTTP_200_OK
        assert delay.call_args.kwargs["user_id"] == str(outsider.id)

    @pytest.mark.django_db
    @pytest.mark.parametrize("is_member, expected_rows", [(False, []), (True, [("Secret State", 1)])])
    def test_export_task_scoped_to_member_projects(
        self, outsider, create_user, workspace, issue, is_member, expected_rows
    ):
        user = create_user if is_member else outsider
        data = {"x_axis": "state_id", "y_axis": "issue_count"}
        with patch("plane.bgtasks.analytic_plot_export.send_export_email") as send:
            analytic_export_task(email=user.email, data=data, slug=workspace.slug, user_id=str(user.id))
        rows = send.call_args.args[3]
        assert rows[1:] == expected_rows

    @pytest.mark.django_db
    def test_soft_deleted_membership_excludes_project(
        self, session_client, create_user, workspace, issue, analytic_view
    ):
        # Soft-deleted membership row that is still is_active=True
        ProjectMember.objects.filter(project=issue.project, member=create_user).update(deleted_at=timezone.now())

        assert session_client.get(ANALYTICS_URL.format(slug=workspace.slug)).data["total"] == 0
        assert session_client.get(DEFAULT_ANALYTICS_URL.format(slug=workspace.slug)).data["total_issues"] == 0
        saved_url = SAVED_ANALYTICS_URL.format(slug=workspace.slug, analytic_id=analytic_view.id)
        assert session_client.get(saved_url).data["total"] == 0
        data = {"x_axis": "state_id", "y_axis": "issue_count"}
        with patch("plane.bgtasks.analytic_plot_export.send_export_email") as send:
            analytic_export_task(email=create_user.email, data=data, slug=workspace.slug, user_id=str(create_user.id))
        assert send.call_args.args[3][1:] == []
