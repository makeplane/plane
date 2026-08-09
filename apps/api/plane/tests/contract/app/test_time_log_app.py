# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for the workspace-level time log endpoints:

* ``GET  /api/workspaces/{slug}/time-logs/``          (workspace-time-logs)
* ``GET  /api/workspaces/{slug}/time-logs/export/``   (workspace-time-logs-export)
* ``GET  /api/workspaces/{slug}/time-logs/analytics/``(workspace-time-logs-analytics)

Covers the permission matrix (workspace ADMIN / MEMBER vs GUEST / outsider),
project-scope isolation (including inactive and archived projects), the shared
query-param filters (``user_id``, ``project_id``, ``project_ids``, date range),
the analytics aggregations, and the CSV export shape.
"""

import datetime

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, TimeLog, User, WorkspaceMember


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


def _add_workspace_member(workspace, user, *, role: int) -> WorkspaceMember:
    return WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)


def _add_project_member(project, user, *, role: int, is_active: bool = True) -> ProjectMember:
    return ProjectMember.objects.create(
        workspace=project.workspace, project=project, member=user, role=role, is_active=is_active
    )


def _make_project(workspace, user, *, name: str, identifier: str) -> Project:
    return Project.objects.create(name=name, identifier=identifier, workspace=workspace, created_by=user)


def _make_issue(project, user, *, name: str) -> Issue:
    return Issue.objects.create(name=name, workspace=project.workspace, project=project, created_by=user)


def _make_time_log(project, issue, logged_by, created_by, *, duration: int, logged_date: datetime.date) -> TimeLog:
    return TimeLog.objects.create(
        workspace=project.workspace,
        project=project,
        issue=issue,
        logged_by=logged_by,
        created_by=created_by,
        duration_minutes=duration,
        logged_date=logged_date,
    )


@pytest.fixture
def project(db, workspace, create_user):
    """A project with an admin member (create_user) and one time log."""
    project = _make_project(workspace, create_user, name="Time Log Project", identifier="TLP")
    _add_project_member(project, create_user, role=20)
    issue = _make_issue(project, create_user, name="Tracked work item")
    log = _make_time_log(
        project,
        issue,
        logged_by=create_user,
        created_by=create_user,
        duration=90,
        logged_date=datetime.date(2026, 8, 1),
    )
    project._issue = issue
    project._log = log
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeLogPermissionMatrix:
    def test_workspace_admin_can_list_time_logs(self, workspace, project, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_200_OK
        assert [log["id"] for log in response.data] == [project._log.id]

    def test_workspace_member_can_list_time_logs(self, workspace, project, create_user):
        member = _make_user("ws-member@plane.so")
        _add_workspace_member(workspace, member, role=15)
        _add_project_member(project, member, role=15)

        client = APIClient()
        client.force_authenticate(user=member)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_200_OK
        assert [log["id"] for log in response.data] == [project._log.id]

    def test_workspace_guest_cannot_list_time_logs(self, workspace, project):
        guest = _make_user("ws-guest@plane.so")
        _add_workspace_member(workspace, guest, role=5)

        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_non_member_cannot_list_time_logs(self, workspace, project):
        outsider = _make_user("outsider@plane.so")

        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_cannot_export_or_analytics(self, workspace, project):
        guest = _make_user("ws-guest@plane.so")
        _add_workspace_member(workspace, guest, role=5)

        client = APIClient()
        client.force_authenticate(user=guest)

        export_response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/export/")
        analytics_response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/analytics/")

        assert export_response.status_code == status.HTTP_403_FORBIDDEN
        assert analytics_response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeLogScoping:
    def test_only_sees_logs_from_projects_the_user_is_member_of(self, workspace, create_user):
        own_project = _make_project(workspace, create_user, name="Owned Project", identifier="OWN")
        _add_project_member(own_project, create_user, role=20)
        own_issue = _make_issue(own_project, create_user, name="Owned work item")
        own_log = _make_time_log(
            own_project,
            own_issue,
            logged_by=create_user,
            created_by=create_user,
            duration=45,
            logged_date=datetime.date(2026, 8, 2),
        )

        foreign_project = _make_project(workspace, create_user, name="Foreign Project", identifier="FRG")
        foreign_issue = _make_issue(foreign_project, create_user, name="Foreign work item")
        _make_time_log(
            foreign_project,
            foreign_issue,
            logged_by=create_user,
            created_by=create_user,
            duration=120,
            logged_date=datetime.date(2026, 8, 2),
        )

        member = _make_user("scoped-member@plane.so")
        _add_workspace_member(workspace, member, role=15)
        _add_project_member(own_project, member, role=15)

        client = APIClient()
        client.force_authenticate(user=member)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_200_OK
        assert [log["id"] for log in response.data] == [own_log.id]

    def test_inactive_project_member_is_excluded(self, workspace, create_user):
        project = _make_project(workspace, create_user, name="Inactive Member Project", identifier="INP")
        _add_project_member(project, create_user, role=20)
        issue = _make_issue(project, create_user, name="Inactive member work item")
        _make_time_log(
            project,
            issue,
            logged_by=create_user,
            created_by=create_user,
            duration=30,
            logged_date=datetime.date(2026, 8, 3),
        )

        inactive = _make_user("inactive-member@plane.so")
        _add_workspace_member(workspace, inactive, role=15)
        _add_project_member(project, inactive, role=15, is_active=False)

        client = APIClient()
        client.force_authenticate(user=inactive)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_archived_project_logs_are_excluded(self, workspace, project, create_user):
        archived_project = _make_project(workspace, create_user, name="Archived Project", identifier="ARC")
        _add_project_member(archived_project, create_user, role=20)
        issue = _make_issue(archived_project, create_user, name="Archived work item")
        _make_time_log(
            archived_project,
            issue,
            logged_by=create_user,
            created_by=create_user,
            duration=60,
            logged_date=datetime.date(2026, 8, 4),
        )
        archived_project.archived_at = datetime.datetime(2026, 8, 5, tzinfo=datetime.UTC)
        archived_project.save()

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/")

        assert response.status_code == status.HTTP_200_OK
        assert [log["id"] for log in response.data] == [project._log.id]


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeLogFilters:
    def test_user_id_filter(self, workspace, project, create_user):
        other = _make_user("other-owner@plane.so")
        _add_workspace_member(workspace, other, role=15)
        _add_project_member(project, other, role=15)
        other_issue = _make_issue(project, other, name="Other's work item")
        other_log = _make_time_log(
            project,
            other_issue,
            logged_by=other,
            created_by=other,
            duration=25,
            logged_date=datetime.date(2026, 8, 6),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(
            f"/api/workspaces/{workspace.slug}/time-logs/",
            {"user_id": other.id},
        )

        assert response.status_code == status.HTTP_200_OK
        assert [log["id"] for log in response.data] == [other_log.id]

    def test_project_id_filter(self, workspace, create_user):
        project_a = _make_project(workspace, create_user, name="Project A", identifier="PRA")
        _add_project_member(project_a, create_user, role=20)
        issue_a = _make_issue(project_a, create_user, name="A work item")
        log_a = _make_time_log(
            project_a,
            issue_a,
            logged_by=create_user,
            created_by=create_user,
            duration=40,
            logged_date=datetime.date(2026, 8, 7),
        )

        project_b = _make_project(workspace, create_user, name="Project B", identifier="PRB")
        _add_project_member(project_b, create_user, role=20)
        issue_b = _make_issue(project_b, create_user, name="B work item")
        log_b = _make_time_log(
            project_b,
            issue_b,
            logged_by=create_user,
            created_by=create_user,
            duration=50,
            logged_date=datetime.date(2026, 8, 7),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)

        single = client.get(f"/api/workspaces/{workspace.slug}/time-logs/", {"project_id": project_b.id})
        assert single.status_code == status.HTTP_200_OK
        assert [log["id"] for log in single.data] == [log_b.id]

        multi = client.get(
            f"/api/workspaces/{workspace.slug}/time-logs/",
            {"project_ids": f"{project_a.id},{project_b.id}"},
        )
        assert multi.status_code == status.HTTP_200_OK
        assert {log["id"] for log in multi.data} == {log_a.id, log_b.id}

    def test_date_range_filter(self, workspace, project, create_user):
        issue = _make_issue(project, create_user, name="Dated work item")
        early_log = _make_time_log(
            project,
            issue,
            logged_by=create_user,
            created_by=create_user,
            duration=10,
            logged_date=datetime.date(2026, 7, 20),
        )
        late_log = _make_time_log(
            project,
            issue,
            logged_by=create_user,
            created_by=create_user,
            duration=20,
            logged_date=datetime.date(2026, 8, 10),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(
            f"/api/workspaces/{workspace.slug}/time-logs/",
            {"start_date": "2026-08-01", "end_date": "2026-08-31"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert {log["id"] for log in response.data} == {project._log.id, late_log.id}
        assert early_log.id not in {log["id"] for log in response.data}


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeLogAnalytics:
    def test_analytics_aggregations(self, workspace, create_user):
        project = _make_project(workspace, create_user, name="Analytics Project", identifier="ANA")
        _add_project_member(project, create_user, role=20)
        other = _make_user("analytics-other@plane.so")
        _add_workspace_member(workspace, other, role=15)
        _add_project_member(project, other, role=15)

        issue_a = _make_issue(project, create_user, name="Analytics A")
        issue_b = _make_issue(project, other, name="Analytics B")
        _make_time_log(
            project,
            issue_a,
            logged_by=create_user,
            created_by=create_user,
            duration=90,
            logged_date=datetime.date(2026, 8, 1),
        )
        _make_time_log(
            project,
            issue_b,
            logged_by=other,
            created_by=other,
            duration=30,
            logged_date=datetime.date(2026, 8, 1),
        )
        _make_time_log(
            project,
            issue_a,
            logged_by=create_user,
            created_by=create_user,
            duration=60,
            logged_date=datetime.date(2026, 8, 2),
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/analytics/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_minutes"] == 180

        by_date = {row["logged_date"]: row["total_minutes"] for row in response.data["by_date"]}
        assert by_date == {
            datetime.date(2026, 8, 1): 120,
            datetime.date(2026, 8, 2): 60,
        }

        by_project = {row["project_id"]: row["total_minutes"] for row in response.data["by_project"]}
        assert by_project == {project.id: 180}

        by_member = {row["logged_by_id"]: row["total_minutes"] for row in response.data["by_member"]}
        assert by_member == {create_user.id: 150, other.id: 30}


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceTimeLogExport:
    def test_csv_export_shape(self, workspace, project, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(f"/api/workspaces/{workspace.slug}/time-logs/export/")

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/csv")

        csv_body = response.content.decode("utf-8")
        lines = [line.strip() for line in csv_body.splitlines() if line.strip()]
        assert lines[0] == "Date,Member,Project,Work Item,Hours,Minutes,Description"
        # header + the single seeded log (90 minutes => 1h 30m)
        assert len(lines) == 2
        data_row = lines[1].split(",")
        assert data_row[0] == "2026-08-01"
        assert data_row[3] == "Tracked work item"
        assert data_row[4] == "1"
        assert data_row[5] == "30"
