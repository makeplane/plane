# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for the issue-level time log endpoints:

* ``POST   /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/time-logs/``
* ``PATCH  /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/time-logs/{pk}/``
* ``DELETE /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/time-logs/{pk}/``

These back the "Log time" button in the issue detail sidebar: a project member
logs time for themselves by default, admins may log on behalf of another member,
and only the entry's author (or an admin) may edit or delete it.
"""

import datetime

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, TimeLog, User


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


def _add_project_member(project, user, *, role: int, is_active: bool = True) -> ProjectMember:
    return ProjectMember.objects.create(
        workspace=project.workspace, project=project, member=user, role=role, is_active=is_active
    )


def _make_issue(project, user, *, name: str) -> Issue:
    return Issue.objects.create(name=name, workspace=project.workspace, project=project, created_by=user)


def _issue_time_log_url(workspace_slug, project_id, issue_id, pk=None):
    base = f"/api/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/time-logs/"
    return f"{base}{pk}/" if pk else base


@pytest.fixture
def project_with_issue(workspace, create_user):
    """A project with an admin member (create_user) and one work item."""
    project = Project.objects.create(
        name="Issue Time Log Project", identifier="ITLP", workspace=workspace, created_by=create_user
    )
    _add_project_member(project, create_user, role=20)
    project._issue = _make_issue(project, create_user, name="Tracked work item")
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestIssueTimeLogCreate:
    def test_member_can_log_time_for_themselves(self, workspace, project_with_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 45, "logged_date": "2026-08-01", "description": "Triaged the backlog"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["duration_minutes"] == 45
        assert response.data["logged_date"] == "2026-08-01"
        assert response.data["logged_by"] == create_user.id
        assert response.data["logged_by_detail"]["id"] == create_user.id
        assert TimeLog.objects.filter(id=response.data["id"]).exists()

    def test_zero_duration_is_rejected(self, workspace, project_with_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 0, "logged_date": "2026-08-01"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not TimeLog.objects.filter(issue=project_with_issue._issue).exists()

    def test_non_project_member_cannot_log_time(self, workspace, project_with_issue):
        outsider = _make_user("outsider@plane.so")

        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 30, "logged_date": "2026-08-01"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_log_time_on_behalf_of_a_member(self, workspace, project_with_issue, create_user):
        target = _make_user("target@plane.so")
        _add_project_member(project_with_issue, target, role=15)

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 90, "logged_date": "2026-08-02", "logged_by": str(target.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["logged_by"] == target.id
        assert response.data["created_by"] == create_user.id

    def test_member_cannot_log_time_on_behalf_of_someone_else(self, workspace, project_with_issue, create_user):
        member = _make_user("member@plane.so")
        _add_project_member(project_with_issue, member, role=15)
        target = _make_user("other@plane.so")
        _add_project_member(project_with_issue, target, role=15)

        client = APIClient()
        client.force_authenticate(user=member)
        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 60, "logged_date": "2026-08-02", "logged_by": str(target.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_cannot_log_time_for_non_member(self, workspace, project_with_issue, create_user):
        outsider = _make_user("not-in-project@plane.so")

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id),
            {"duration_minutes": 60, "logged_date": "2026-08-02", "logged_by": str(outsider.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
class TestIssueTimeLogUpdateDelete:
    def test_author_can_update_own_time_log(self, workspace, project_with_issue, create_user):
        time_log = TimeLog.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            logged_by=create_user,
            created_by=create_user,
            duration_minutes=45,
            logged_date=datetime.date(2026, 8, 1),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.patch(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id),
            {"duration_minutes": 120, "description": "Extended session"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["duration_minutes"] == 120
        time_log.refresh_from_db()
        assert time_log.duration_minutes == 120

    def test_author_can_delete_own_time_log(self, workspace, project_with_issue, create_user):
        time_log = TimeLog.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            logged_by=create_user,
            created_by=create_user,
            duration_minutes=45,
            logged_date=datetime.date(2026, 8, 1),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.delete(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id)
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not TimeLog.objects.filter(id=time_log.id).exists()

    def test_member_cannot_edit_or_delete_someone_elses_time_log(self, workspace, project_with_issue, create_user):
        author = _make_user("author@plane.so")
        _add_project_member(project_with_issue, author, role=15)
        time_log = TimeLog.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            logged_by=author,
            created_by=author,
            duration_minutes=45,
            logged_date=datetime.date(2026, 8, 1),
        )

        member = _make_user("member@plane.so")
        _add_project_member(project_with_issue, member, role=15)

        client = APIClient()
        client.force_authenticate(user=member)

        patch_response = client.patch(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id),
            {"duration_minutes": 999},
            format="json",
        )
        delete_response = client.delete(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id)
        )

        assert patch_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN
        assert TimeLog.objects.filter(id=time_log.id).exists()

    def test_admin_can_edit_or_delete_anyones_time_log(self, workspace, project_with_issue, create_user):
        author = _make_user("author@plane.so")
        _add_project_member(project_with_issue, author, role=15)
        time_log = TimeLog.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            logged_by=author,
            created_by=author,
            duration_minutes=45,
            logged_date=datetime.date(2026, 8, 1),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)

        patch_response = client.patch(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id),
            {"duration_minutes": 200},
            format="json",
        )
        assert patch_response.status_code == status.HTTP_200_OK

        delete_response = client.delete(
            _issue_time_log_url(workspace.slug, project_with_issue.id, project_with_issue._issue.id, time_log.id)
        )
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
